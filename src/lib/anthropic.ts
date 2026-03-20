import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/** Model used for all agent calls. Set ANTHROPIC_MODEL in .env.local to override. */
export const AGENT_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
