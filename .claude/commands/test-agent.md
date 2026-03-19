Test Claude agent tools for the manager-agent project.

## Usage
/test-agent [tool-name]

Examples:
  /test-agent                   # show test scenarios and instructions
  /test-agent add_player        # show the add_player tool schema

## What to do

**Step 1 — Check prerequisites**
- Verify `.env.local` exists and has `ANTHROPIC_API_KEY` and both Supabase keys set
- Remind the developer that a running Supabase project (or local instance) is required

**Step 2 — If a specific tool name was given**
Find the tool in `src/agent/tools/` and:
- Print its `input_schema` so the developer knows what fields to pass
- Show a sample input JSON for that tool
- Remind them to test via the chat UI or use the API directly:
  ```
  POST /api/agent
  { "messages": [{ "role": "user", "content": "..." }], "teamId": "<id>" }
  ```

**Step 3 — Suggest end-to-end test scenarios**
Walk through these in order to validate the full stack:

1. **Player management**
   - "Add a player named Alex Johnson, jersey #7, position midfielder"
   - "List all active players"
   - "Mark Alex Johnson as injured"
   - "Remove Alex Johnson from the roster"

2. **Budget**
   - "Set our budget to $5000 for the 2025-2026 season"
   - "What is our current budget situation?"

3. **Expenses**
   - "Log a $150 equipment expense for new shin guards"
   - "Log a $200 travel expense for away game transport"
   - "Show me all equipment expenses"

4. **Games**
   - "Add a home game against Riverside FC on 2026-04-15"
   - "Record the result as W 3-1 for our last game"
   - "Show upcoming games"

5. **Analysis**
   - "What is our cost per player this season?"
   - "What is our cost per game?"
   - "Give me a full financial summary"

**Step 4 — What to verify**
- Correct tool selected by Claude for each prompt
- DB row created/updated in Supabase (check Table Editor)
- Dashboard panel refreshes after mutations
- Budget remaining updates correctly after expense additions
- RLS works: a second user cannot see the first user's data
