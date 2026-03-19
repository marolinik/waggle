# Contributing to Waggle

## Quick Setup

```bash
git clone https://github.com/marolinik/waggle.git
cd waggle
npm install
npx vitest run   # Run all 3000+ tests
```

## Development

```bash
# Local server
cd packages/server && npx tsx src/local/start.ts

# Desktop app (requires Rust)
cd app && npm run tauri dev
```

## PR Requirements

1. Fork and create a feature branch from `master`
2. Write tests for new functionality
3. All existing tests must pass: `npx vitest run`
4. Build must pass: `npx tsc --noEmit`
5. Submit a PR with a descriptive title and summary

## Detailed Guide

See **[docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)** for the full contributing guide including code style, package structure, and product rules.
