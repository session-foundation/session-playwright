# Automation testing for Session Desktop

This repository holds the code to run regression test for Session Desktop with Playwright.

## Prerequisites 

- Node.js 24.12.0
- pnpm 10.28.1
- [Session Desktop](https://github.com/session-foundation/session-desktop/) built from source

Note: The tests currently are only compatible with Linux and macOS.

## Quick setup 
```bash
pnpm install --frozen-lockfile
git submodule update --init --recursive
```

## Environment configuration

- `cp .env.sample .env`
- Edit the `.env` file to match your desired configuration
- The usage of each environment variable is documented in the sample file.

## Running tests

```bash
pnpm test                           # Run the entire suite
pnpm test -g "grep pattern"         # Run specific tests 
```
