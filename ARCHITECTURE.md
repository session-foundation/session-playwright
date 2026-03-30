# Architecture

## Directory overview

```
tests/automation/
├── setup/        # App launch and typed test fixtures
├── utilities/    # Reusable action helpers (send message, create contact, etc.)
├── locators/     # Page Object Model — all UI selectors
├── constants/    # Shared test data and configuration values
└── types/        # TypeScript type definitions
```

## Typed test builders

Tests are defined using typed builder functions that handle window launch, user creation, and teardown. The function name encodes the scenario:

```ts
test_Alice_1W_Bob_1W(
  'some test name',
  async ({ alice, aliceWindow1, bob, bobWindow1 }) => {
    // windows are open, users are created
  },
);
```

Naming convention:

- User names: `Alice`, `Bob`, `Charlie`, `Dracula`
- `1W` / `2W` = number of windows for that user; `2W` is a linked device (second window using the same recovery phrase)

Teardown (force-close all windows) runs in a `finally` block. `test_Alice_1W_no_network` skips waiting for the network to be ready.

All builders are in [tests/automation/setup/sessionTest.ts](tests/automation/setup/sessionTest.ts).

### Test context

Builders accept an optional `TestContext` object that injects conditions into the Electron process at launch:

| Field                   | Effect                                                                                                                                   |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `dbCreationTimestampMs` | Sets `DB_CREATION_TIMESTAMP_MS` — mocks the account's database creation time (used to simulate account age, e.g. for donation CTA tests) |
| `networkPageNodeCount`  | Sets `SESSION_MOCK_NETWORK_PAGE_NODE_COUNT` — mocks the node count shown on the network page (1–10)                                      |

## Locators

Selectors are centralised in [tests/automation/locators/index.ts](tests/automation/locators/index.ts), organised into classes by page or feature area. `testId()` targets `data-testid` attributes; `className()` and `hasText()` are also available.

## Utilities

Multi-step actions (send message, create contact, set disappearing messages, etc.) are in [tests/automation/utilities/](tests/automation/utilities/).

## Playwright project split

`playwright.config.ts` defines two projects:

| Project         | Match pattern                 | Parallelism                         |
| --------------- | ----------------------------- | ----------------------------------- |
| Community tests | `**/*community*tests.spec.ts` | Sequential (`workers: 1`)           |
| All other tests | everything else               | Parallel (`workersCount()` workers) |

Community tests run sequentially because they share the same community server. Parallel execution causes incoming messages to trigger UI jumps that close open context menus, making tests unreliable.

## Localization

`tests/localization/` is a git submodule pointing to Session Desktop's localization strings. `pnpm sync` runs `sync-localization.sh`, which anchors the submodule pointer to the strings version matching the current Session Desktop build.

## Maintenance notes

**Locators** break when the app UI changes. Update the relevant class in [tests/automation/locators/index.ts](tests/automation/locators/index.ts).

**Baseline screenshots** need updating when intentional UI changes ship. Delete the affected files in `screenshots/` and rerun the affected tests — Playwright auto-saves a new baseline when none exists. Baselines are platform-specific (`-darwin` / `-linux`); update on both platforms before committing.

**Dependabot** is configured in [.github/dependabot.yml](.github/dependabot.yml)
