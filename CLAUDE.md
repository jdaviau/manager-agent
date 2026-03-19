# Manager-Agent

A sports team management web app powered by a Claude AI agent. Coaches chat naturally to manage players, budget, and expenses.

## Tech Stack
- **Next.js 16** (App Router, TypeScript, React 19)
- **Supabase** (PostgreSQL + Auth + RLS — multi-tenant by default)
- **Anthropic SDK** (`claude-sonnet-4-6`, tool use + SSE streaming)
- **Tailwind CSS v4** + **shadcn/ui v4**

## Key Patterns

### Authentication
All server components and API routes use `src/lib/supabase/server.ts`.
Never import the browser client in server code. The middleware at `middleware.ts` refreshes sessions on every request.

### Multi-tenancy
Every DB query is scoped by `team_id`. RLS policies at the DB level enforce that users only see their own team's data. Always use the session-scoped Supabase client (never service role key in app code) so RLS fires correctly.

### Agent Tools
Tools live in `src/agent/tools/`. Each file exports:
1. A `ToolDefinition[]` (the JSON schema Claude sees)
2. An `executors` record: `{ [toolName]: async (input, supabase) => result }`

`src/agent/index.ts` merges all definitions and executors. The API route imports only from `index.ts`.

Use `/add-tool` to scaffold a new tool correctly.

### API Route & Streaming
`src/app/api/agent/route.ts` runs the full agentic loop server-side and returns Server-Sent Events. Events:
- `{ type: "text", delta }` — streamed text chunk
- `{ type: "tool_start", name }` — tool call beginning
- `{ type: "tool_result", name, success }` — tool finished
- `{ type: "done" }` — conversation turn complete
- `{ type: "error", message }` — something failed

### Dashboard Refresh
After a tool call mutates data, the API emits a `tool_result` event. `useChat.ts` dispatches a native DOM `CustomEvent("dashboard:refresh")`. `useDashboard.ts` listens and re-fetches. No global state store needed.

### System Prompt
`src/agent/systemPrompt.ts` exports `buildSystemPrompt(context: TeamContext)`. It is called on every API request with live budget/player counts injected, so Claude always has current team context.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```
Copy `.env.local.example` to `.env.local` and fill in values.

## Running Locally
```bash
npm run dev         # Next.js on http://localhost:3000
```

To apply the DB schema to your Supabase project:
1. Go to your Supabase project → SQL Editor
2. Paste and run `supabase/migrations/0001_initial_schema.sql`

## File Naming
- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` prefixed with `use`
- Agent tools: `camelCase` grouped by domain (`playerTools.ts`)
- DB types: `snake_case` matching Supabase column names

## Adding a New Feature
1. Add a DB migration: `/db-migrate <description>`
2. Add an agent tool: `/add-tool <tool-name> <domain>`
3. Update `src/types/database.ts` with new types
4. Add a dashboard component if needed
5. Update `ToolCallIndicator.tsx` with a label for the new tool
