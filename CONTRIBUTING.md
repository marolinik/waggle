# Contributing to Waggle

## Prerequisites

- **Node.js 20+** (required)
- **Rust** (only needed for the desktop app)

## Setup

```bash
git clone https://github.com/user/waggle.git
cd waggle
npm install
npm test
```

## Running Tests

```bash
npx vitest run
```

To run tests in watch mode during development:

```bash
npx vitest
```

## Pull Request Process

1. Fork the repository and create a feature branch
2. Make your changes
3. Ensure all tests pass (`npx vitest run`)
4. Submit a pull request against `master`

## Code Style

- TypeScript with ESM modules
- Vitest for all tests
- Keep imports explicit (no barrel re-exports)
