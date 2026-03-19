import { NextRequest } from "next/server";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { anthropic } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";
import { allTools, executeTool } from "@/agent/index";
import { buildSystemPrompt } from "@/agent/systemPrompt";
import { isValidUUID, validateMessages, wrapToolResult } from "@/lib/security";
import type { TeamContext } from "@/agent/types";
import type { Team, Budget, Expense } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  console.log("[agent] POST /api/agent");
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.log("[agent] ❌ Unauthorized — no session");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  console.log("[agent] ✅ Auth OK — user:", user.id);

  const body = await req.json();
  const { teamId } = body as { teamId: unknown; messages: unknown };

  // Validate teamId is a proper UUID before touching the DB
  if (!isValidUUID(teamId)) {
    console.log("[agent] ❌ Invalid teamId format");
    return new Response(JSON.stringify({ error: "Invalid request" }), { status: 400 });
  }

  // Validate and sanitize the message array
  let messages: MessageParam[];
  try {
    messages = validateMessages(body.messages);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid messages";
    console.log("[agent] ❌ Message validation failed:", msg);
    return new Response(JSON.stringify({ error: msg }), { status: 400 });
  }

  console.log("[agent] teamId:", teamId, "| messages:", messages.length);

  // Verify team ownership
  const { data: teamRaw, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .eq("owner_id", user.id)
    .single();

  const team = teamRaw as Team | null;

  if (teamError || !team) {
    console.log("[agent] ❌ Team not found — error:", teamError?.message);
    return new Response(JSON.stringify({ error: "Team not found" }), { status: 404 });
  }
  console.log("[agent] ✅ Team OK —", team.name);

  // Build context for the system prompt
  const { data: playersRaw } = await supabase
    .from("players")
    .select("id")
    .eq("team_id", teamId)
    .eq("status", "active");

  const { data: budgetRaw } = await supabase
    .from("budgets")
    .select("*")
    .eq("team_id", teamId)
    .eq("season", team.season ?? "")
    .maybeSingle();

  const budget = budgetRaw as Budget | null;

  let totalSpent = 0;
  if (budget) {
    const { data: expensesRaw } = await supabase
      .from("expenses")
      .select("amount")
      .eq("budget_id", budget.id);
    const expenses = (expensesRaw ?? []) as Pick<Expense, "amount">[];
    totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }

  const teamContext: TeamContext = {
    team,
    activePlayers: (playersRaw ?? []).length,
    budget,
    totalSpent,
  };

  const systemPrompt = buildSystemPrompt(teamContext);

  // Set up SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function emit(data: object) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      try {
        console.log("[agent] Starting agent loop...");
        await runAgentLoop(messages, systemPrompt, teamId, supabase, emit);
        console.log("[agent] ✅ Agent loop complete");
        emit({ type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[agent] ❌ Agent loop error:", message);
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

async function runAgentLoop(
  messages: MessageParam[],
  systemPrompt: string,
  teamId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  emit: (data: object) => void,
  depth = 0
): Promise<void> {
  if (depth > 10) {
    emit({ type: "error", message: "Too many tool call iterations" });
    return;
  }

  console.log(`[agent] 🤖 Calling Claude (depth=${depth})...`);
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: systemPrompt,
    messages,
    tools: allTools,
    stream: true,
  });

  const toolUseBlocks: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];
  let currentToolId = "";
  let currentToolName = "";
  let currentToolInputJson = "";
  let fullText = "";

  for await (const event of response) {
    if (event.type === "content_block_start") {
      if (event.content_block.type === "tool_use") {
        currentToolId = event.content_block.id;
        currentToolName = event.content_block.name;
        currentToolInputJson = "";
        emit({ type: "tool_start", name: currentToolName });
      }
    } else if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        fullText += event.delta.text;
        emit({ type: "text", delta: event.delta.text });
      } else if (event.delta.type === "input_json_delta") {
        currentToolInputJson += event.delta.partial_json;
      }
    } else if (event.type === "content_block_stop") {
      if (currentToolId) {
        try {
          const parsedInput = JSON.parse(currentToolInputJson || "{}");
          // Always enforce the server-verified teamId — never trust Claude's value
          parsedInput.team_id = teamId;
          console.log(`[agent] 🔧 Tool call: ${currentToolName}`, parsedInput);
          toolUseBlocks.push({
            id: currentToolId,
            name: currentToolName,
            input: parsedInput,
          });
        } catch {
          console.warn("[agent] ⚠️ Failed to parse tool input JSON:", currentToolInputJson);
        }
        currentToolId = "";
        currentToolName = "";
        currentToolInputJson = "";
      }
    }
  }

  // If there were tool calls, execute them and recurse
  if (toolUseBlocks.length > 0) {
    const toolResultContents = await Promise.all(
      toolUseBlocks.map(async (block) => {
        const outcome = await executeTool(block.name, block.input, supabase);
        if (outcome.success) {
          console.log(`[agent] ✅ Tool ${block.name} OK:`, JSON.stringify(outcome.result).slice(0, 200));
        } else {
          console.error(`[agent] ❌ Tool ${block.name} failed:`, outcome.error);
        }
        emit({ type: "tool_result", name: block.name, success: outcome.success });
        return {
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: wrapToolResult(JSON.stringify(outcome.success ? outcome.result : { error: outcome.error })),
        };
      })
    );

    const assistantMessage: MessageParam = {
      role: "assistant",
      content: [
        ...(fullText ? [{ type: "text" as const, text: fullText }] : []),
        ...toolUseBlocks.map((b) => ({
          type: "tool_use" as const,
          id: b.id,
          name: b.name,
          input: b.input,
        })),
      ],
    };

    const toolResults: MessageParam = {
      role: "user",
      content: toolResultContents,
    };

    await runAgentLoop(
      [...messages, assistantMessage, toolResults],
      systemPrompt,
      teamId,
      supabase,
      emit,
      depth + 1
    );
  }
}
