# Test Manager

Test Manager is a desktop app (Electron + React + TypeScript) for automatically launching an application under test and running its test suite from a simple, visual UI — no need to drive everything from the command line.

Each **project** points at a test executable. Test Manager launches it, discovers the tests it exposes, runs them, and keeps a history of pass/fail results so you can see test status and trends over time.

## Features

- **Project management** — create and switch between multiple projects, each pointing at its own test executable.
- **Test discovery** — automatically asks the target executable which tests it exposes.
- **One-click test runs** — launches the executable, runs a single test, and captures its result.
- **Run history** — keeps a per-test history of pass/fail status, duration, and failure details (expected vs. actual).
- **Local persistence** — projects and results are saved locally (see [projectStorage.ts](src/services/projectStorage.ts)) so your setup survives app restarts.

## How it works

Test Manager doesn't require a specific test framework — it talks to the target executable through a small CLI protocol, implemented today for C++ via [cppAdapter.ts](src/services/cppAdapter.ts) and the Electron main process in [main.ts](electron/main.ts):

| Command | Purpose | Expected output |
| --- | --- | --- |
| `<exe> --list-tests` | Discover tests | One test name per line on stdout |
| `<exe> --run-test <TestName>` | Run a single test | Exit code `0` = passed, non-zero = failed. Optional stdout lines: `EXPECTED:`, `ACTUAL:`, `MESSAGE:` |

The renderer (React UI) never talks to the file system or spawns processes directly — it calls into the Electron main process over IPC through a safe, contextually-isolated bridge in [preload.ts](electron/preload.ts).

## Roadmap

This project currently supports plain C++ executables, but is designed to grow into a general-purpose, language-agnostic test runner:

- [ ] C# / .NET test executables
- [ ] Additional language adapters as needed
- [ ] Unreal Engine 5 project support (launching a UE5 build/editor and running its automation tests)
- [ ] Richer reporting (trends, flaky test detection, exporting results)

Adding a new language/engine means adding a new adapter (mirroring [cppAdapter.ts](src/services/cppAdapter.ts)) plus a matching IPC handler in [main.ts](electron/main.ts) — the CLI protocol (`--list-tests` / `--run-test`) can be adapted per-target without changing the UI.

## Tech stack

- [Electron](https://www.electronjs.org/) for the desktop shell and process management
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) for the UI
- [Vite](https://vitejs.dev/) (via [vite-plugin-electron](https://github.com/electron-vite/vite-plugin-electron)) for build tooling and dev server
- [electron-builder](https://www.electron.build/) for packaging installers

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

This starts the Vite dev server and launches the Electron window with hot-reload enabled.

### Build a distributable

```bash
npm run build
```

This type-checks the project, builds the renderer and main process bundles, and packages an installer with electron-builder into [release/](release).

## Project structure

```
electron/           Electron main process and preload script (window + IPC + process spawning)
src/
  components/        React UI components (project modal, test runner view)
  services/          Adapters that talk to test executables, plus local project persistence
  types/             Shared TypeScript types (Project, ManagedTest, TestRun)
  utils/             Small formatting helpers
```

## Adding a project

1. Launch the app and click **New project**.
2. Give it a name and point it at the compiled test executable that implements the CLI protocol above.
3. Click **Discover tests** to list the tests the executable exposes.
4. Select a test and click **Run** to execute it and record the result.
