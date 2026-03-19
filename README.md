# Waggle -- AI Agent Platform for Every Knowledge Worker

Waggle is a workspace-native AI agent platform with persistent memory, 29 native connectors, and a marketplace of skills. Think of it as your personal AI team that remembers everything and gets better over time.

The name comes from the waggle dance -- how bees communicate resource locations to the hive.

## Quick Start

### Desktop (Windows/macOS)

Download from [Releases](https://github.com/marolinik/waggle/releases) and run the installer.

### Web (any platform)

```bash
npx waggle
```

Opens at http://localhost:3333

### Teams (Docker)

```bash
docker compose up
```

### Development

```bash
git clone https://github.com/marolinik/waggle.git
cd waggle
npm install

# Start the local server
cd packages/server && npx tsx src/local/start.ts

# Or start the desktop app (requires Rust)
cd app && npm run tauri dev
```

## First Steps

1. **Add your API key** -- Settings > Models > paste your Anthropic key
2. **Create a workspace** -- Ctrl+N or click "New Workspace" in the sidebar
3. **Start chatting** -- the agent has 97+ tools including file ops, web search, and memory
4. **Install capability packs** -- Capabilities > Browse Packs for pre-built skill bundles
5. **Return tomorrow** -- your context is preserved in the `.mind` file

## Features

### Persistent Memory

Every workspace has its own `.mind` file (SQLite with FTS5 full-text search and vector embeddings). Decisions, research findings, and project context survive across sessions. When you return, the agent knows where you left off.

### 29 Native Connectors

GitHub, Slack, Notion, Jira, Google (Calendar, Docs, Drive, Sheets, Gmail), Microsoft (Teams, Outlook, OneDrive), Linear, Asana, Trello, Monday, Confluence, Obsidian, HubSpot, Salesforce, Pipedrive, Airtable, GitLab, Bitbucket, Dropbox, PostgreSQL, Discord, SendGrid email. Plus Composio bridge for 250+ additional services.

### 8 Agent Personas

Switch between specialized agents: Researcher, Writer, Coder, Analyst, Project Manager, Executive Assistant, Sales Rep, and Marketer. Each has tuned system prompts, tool presets, and workflow defaults.

### Marketplace

120+ packages across skills, plugins, and MCP servers. Five built-in capability packs: Research Workflow, Writing Suite, Planning Master, Team Collaboration, and Decision Framework. SecurityGate scans every install for safety.

### Team Mode

Shared workspaces with real-time WebSocket presence, task boards, admin dashboard, capability governance, and Waggle Dance swarm coordination. Deploy on Docker or Render.

### Self-Improving

GEPA prompt optimization learns from your corrections. The agent tracks feedback, records improvement signals, and gets more accurate over time. Correction learning happens automatically.

### Proactive Scheduling

Built-in cron service for morning briefings, stale-workspace alerts, memory consolidation, and custom routines. Background watchdog keeps the service running.

### 14 Slash Commands

Type `/help` in any workspace. Commands include `/catchup`, `/research`, `/draft`, `/decide`, `/plan`, `/spawn`, `/marketplace`, and more. See the [Commands Reference](docs/reference/commands.md).

## Architecture

15 packages in a monorepo:

| Package | Description |
|---------|-------------|
| `@waggle/core` | .mind files, memory frames, embeddings, vault (AES-256-GCM), cron store, knowledge graph |
| `@waggle/agent` | Agent loop, 97+ tools, sub-agents, capability router, workflow composer, trust model, hooks |
| `@waggle/server` | Fastify local server (localhost:3333), 29 route modules, KVARK client, daemons, scheduler |
| `@waggle/ui` | React component library (chat, memory, settings, workspace, onboarding, cockpit) |
| `@waggle/cli` | Command-line REPL interface |
| `@waggle/sdk` | Plugin/skill SDK, capability packs (5 packs), starter skills |
| `@waggle/marketplace` | Marketplace catalog (120+ packages, 17 packs, SecurityGate scanner) |
| `@waggle/optimizer` | Prompt optimization (GEPA engine) |
| `@waggle/weaver` | Memory consolidation daemon |
| `@waggle/worker` | Background task processing (BullMQ), parallel/sequential/coordinator strategies |
| `@waggle/shared` | Shared types and utilities |
| `@waggle/admin-web` | Admin dashboard for team deployments |
| `@waggle/waggle-dance` | Swarm orchestration protocol (dispatcher, hive-query) |
| `sidecar` | Node.js agent sidecar for Tauri desktop app |
| `app` | Tauri 2.0 desktop application (Rust + WebView2) |

All agent state lives in `.mind` SQLite files -- portable, inspectable, and yours.

## Documentation

- [Getting Started](docs/guides/getting-started.md) -- Install, configure, first workspace
- [Workspaces](docs/guides/workspaces.md) -- Types, switching, home screen, personas
- [Capabilities](docs/guides/capabilities.md) -- Packs, marketplace, skills, trust model
- [Connectors](docs/guides/connectors.md) -- Vault setup, 29 connectors, approval gates
- [Team Mode](docs/guides/team-mode.md) -- Docker setup, shared workspaces, admin
- [Troubleshooting](docs/guides/troubleshooting.md) -- Common issues and FAQ
- [Commands Reference](docs/reference/commands.md) -- All 14 slash commands
- [API Reference](docs/reference/api.md) -- All REST endpoints
- [Architecture](docs/ARCHITECTURE.md) -- Package overview, data flow, extension points
- [Contributing](docs/CONTRIBUTING.md) -- PR process, test requirements, code style

## Tech Stack

- **Desktop**: Tauri 2.0 (Rust + WebView2)
- **Frontend**: React + TypeScript
- **Server**: Fastify on localhost:3333, SSE streaming
- **Memory**: SQLite + FTS5 + sqlite-vec (single `.mind` file per workspace)
- **Agent**: Claude Agent SDK (Node.js), 97+ tools across 12 categories
- **Model Router**: Built-in Anthropic proxy, optional LiteLLM for 100+ providers
- **Prompt Optimization**: Ax (@ax-llm/ax) with GEPA
- **Team Server**: Fastify + PostgreSQL + Redis + BullMQ + Clerk auth
- **Tests**: Vitest, 3000+ tests across 190+ files

## License

The core packages (`core`, `agent`, `cli`, `sdk`, `shared`, `ui`) are [MIT licensed](LICENSE). The `optimizer` and `weaver` packages are proprietary -- see their respective LICENSE files.
