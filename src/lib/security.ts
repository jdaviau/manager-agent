import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MESSAGES = 100;
const MAX_USER_MESSAGE_CHARS = 4000;

/**
 * Validates that a string is a well-formed UUID.
 * Prevents non-UUID team IDs from reaching the database.
 */
export function isValidUUID(value: unknown): value is string {
  return typeof value === "string" && UUID_REGEX.test(value);
}

/**
 * Validates and sanitizes the incoming message array before it is
 * sent to Claude. Enforces:
 *  - Array type check
 *  - Maximum conversation length (prevents context flooding)
 *  - Roles are only "user" or "assistant" (blocks client-injected "system" messages)
 *  - User message content is a plain string and within length limits
 *  - Assistant messages may contain arrays (tool use blocks) but their
 *    text content is length-checked too
 *
 * Returns the cleaned array, or throws with a descriptive error.
 */
export function validateMessages(messages: unknown): MessageParam[] {
  if (!Array.isArray(messages)) {
    throw new Error("messages must be an array");
  }
  if (messages.length > MAX_MESSAGES) {
    throw new Error(`Conversation exceeds maximum length of ${MAX_MESSAGES} messages`);
  }

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i] as Record<string, unknown>;

    if (msg.role !== "user" && msg.role !== "assistant") {
      throw new Error(`Invalid role "${msg.role}" at message ${i} — only user/assistant allowed`);
    }

    if (msg.role === "user") {
      if (typeof msg.content !== "string") {
        throw new Error(`User message ${i} content must be a plain string`);
      }
      if (msg.content.length > MAX_USER_MESSAGE_CHARS) {
        throw new Error(`User message ${i} exceeds ${MAX_USER_MESSAGE_CHARS} character limit`);
      }
    }

    // Assistant messages may be string or content block arrays (tool use).
    // We don't block arrays, but we do cap any embedded text blocks.
    if (msg.role === "assistant" && Array.isArray(msg.content)) {
      for (const block of msg.content as Record<string, unknown>[]) {
        if (block.type === "text" && typeof block.text === "string") {
          if (block.text.length > MAX_USER_MESSAGE_CHARS * 4) {
            throw new Error("Assistant message text block is too large");
          }
        }
      }
    }
  }

  return messages as MessageParam[];
}

/**
 * Wraps tool result content with an explicit delimiter so Claude
 * can clearly distinguish tool output from user-authored instructions.
 * This reduces the risk of indirect prompt injection via database content
 * (e.g. a player named "Ignore previous instructions...").
 */
export function wrapToolResult(content: string): string {
  return `<tool_result>\n${content}\n</tool_result>`;
}
