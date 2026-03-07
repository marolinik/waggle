# Waggle

**Your personal AI agent swarm.**

Waggle is a desktop platform that gives every knowledge worker a personal swarm of AI agents. Each agent persists its memory in a single `.mind` file (SQLite with FTS5 + vector search), routes to any LLM provider via LiteLLM, and extends its capabilities through a skill/plugin system. Think of it as Office 365 for AI agents.

The name comes from the waggle dance -- how bees communicate resource locations to the hive.

## Quick Start

### CLI

```bash
npm install -g @waggle/cli
waggle
```

### Desktop App

```bash
cd app
npx tauri dev
```

## Packages

| Package | Path | License | Description |
|---------|------|---------|-------------|
| `@waggle/core` | `packages/core` | MIT | .mind file, memory, context graph |
| `@waggle/agent` | `packages/agent` | MIT | Agent loop, tool execution, skills |
| `@waggle/cli` | `packages/cli` | MIT | Command-line interface |
| `@waggle/sdk` | `packages/sdk` | MIT | Plugin/skill development SDK |
| `@waggle/optimizer` | `packages/optimizer` | Proprietary | GEPA prompt optimization engine |
| `@waggle/weaver` | `packages/weaver` | Proprietary | Memory Weaver background daemon |

## Architecture

Waggle is a monorepo with a Tauri 2.0 desktop shell (Rust + WebView2) that launches a Node.js sidecar for agent execution. The sidecar uses shared TypeScript packages for memory (`core`), agent orchestration (`agent`), prompt optimization (`optimizer`), and background memory consolidation (`weaver`). The CLI and SDK packages provide developer-facing interfaces for the same underlying engine.

All agent state lives in a single `.mind` SQLite file per agent, portable and inspectable.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and PR guidelines.

## License

The core packages (`core`, `agent`, `cli`, `sdk`) are [MIT licensed](LICENSE). The `optimizer` and `weaver` packages are proprietary -- see their respective LICENSE files.
