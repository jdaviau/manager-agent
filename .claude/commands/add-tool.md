Scaffold a new Claude agent tool for the manager-agent project.

## Usage
/add-tool <tool-name> <domain>

Examples:
  /add-tool send_notification communications
  /add-tool get_standings analysis

## What to do

**Step 1 — Determine the tool file**
- If `src/agent/tools/<domain>Tools.ts` exists, add the new tool there.
- If not, create `src/agent/tools/<domain>Tools.ts` using this template:

```typescript
import type { Tool } from "@anthropic-ai/sdk/resources/messages";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const <domain>ToolDefinitions: Tool[] = [
  {
    name: "<tool-name>",
    description: "TODO: describe what this tool does",
    input_schema: {
      type: "object" as const,
      properties: {
        team_id: { type: "string", description: "The team UUID" },
        // TODO: add tool-specific properties
      },
      required: ["team_id"],
    },
  },
];

type Input = Record<string, unknown>;
type Executor = (input: Input, supabase: SupabaseClient<Database>) => Promise<unknown>;

export const <domain>Executors: Record<string, Executor> = {
  "<tool-name>": async (input, supabase) => {
    // TODO: implement tool logic
    throw new Error("Not implemented");
  },
};
```

**Step 2 — Update `src/agent/index.ts`**
Add the import and spread the new definitions/executors into `allTools` and `allExecutors`.

**Step 3 — Update `src/components/chat/ToolCallIndicator.tsx`**
Add a human-readable label to the `TOOL_LABELS` record:
```typescript
<tool-name>: "Doing something...",
```

**Step 4 — Remind the developer**
- Add any new return types to `src/types/database.ts`
- If this tool mutates dashboard data, ensure `useDashboard.ts` re-fetches the right data on `dashboard:refresh`
