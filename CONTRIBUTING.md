# Contributing to inertia-livewire

Thank you for helping. Bug reports, fixes, docs and tests are all welcome. For a larger change, such as a new adapter, a new option for the macro or a change to how components start, please open an issue first so we can agree on the approach before you write it.

## Reporting a bug

The [bug report form](https://github.com/wuemv/inertia-livewire/issues/new?template=bug_report.yml) asks for:

- The versions of PHP, Laravel, Livewire, Inertia (`inertiajs/inertia-laravel` and the client adapter), Vue and this package. `composer show` and `npm ls` list them.
- The route or controller that calls `Inertia::livewire()` or `InertiaLivewire::render()`/`lazy()`, and the page that mounts `<LivewireMount>`.
- What the browser console says, and the request in the network tab if a lazy component fails to load.
- Whether the Inertia root template loads `@livewireStyles` and `@livewireScripts` (see the README's Install section). Most "the component doesn't react" reports come down to that.

Please report security problems privately, not in an issue: see [SECURITY.md](SECURITY.md).

## Setting up

You need PHP 8.3 or later, at the newest security release `composer.json` allows, Composer 2, Node 22 and pnpm (`corepack enable` gives you the version `package.json` names).

```sh
git clone https://github.com/wuemv/inertia-livewire.git
cd inertia-livewire
composer install
pnpm install
```

The repository is one Composer package (the root: `src/`, `config/`, `routes/`) and the npm packages in `packages/`: `core` (framework-independent) and `vue`. `workbench/` is a small Laravel + Livewire app, served by Testbench, that the browser tests run against.

## Running the checks

| Command | What it runs |
|---|---|
| `composer test` | The PHP tests (Pest, Testbench): rendering, the page macro, the signed endpoint |
| `composer lint` | [Pun](https://punphp.com): the format check (Pint's `laravel` style) and lint. `composer format` fixes the style. Pun runs on Linux and macOS. |
| `pnpm test` | The JavaScript tests (Vitest, jsdom): the core and the Vue adapter |
| `pnpm typecheck` | TypeScript, for every package |
| `pnpm build` | Builds the packages into `packages/*/dist` |
| `pnpm e2e` | The browser tests (Playwright, Chromium) against `workbench/`, after `pnpm build`. Run `pnpm exec playwright install chromium` once first. |

CI runs all of them. The PHP tests run on PHP 8.3 to 8.5 with Laravel 12 and 13, Livewire 3 and 4, and Inertia 2 and 3.

## Ground rules

These keep the package's promises to the apps that use it. [CLAUDE.md](CLAUDE.md) explains the design behind them.

- **Mount parameters stay on the server.** `$params` go to the component's `mount()` and never become page props. Page props are `$props`.
- **Livewire owns the component's DOM.** The adapters write the HTML once per key, and replace the component only when the key changes. The key is a hash of the HTML, so every server render gets a new one.
- **Start components through Alpine, never `Livewire.start()` again.** `Alpine.initTree()` starts a component and `Alpine.destroyTree()` stops it. `initTree()` waits until Livewire has started: before that, Livewire's own start finds the component (the start race in CLAUDE.md).
- **Lazy URLs are signed, encrypted and tied to the user** they were made for. A change to the render endpoint needs a test that an altered, expired or borrowed URL is refused.
- **No new dependencies** beyond Laravel, Livewire and Inertia (and Vue for the Vue adapter) without an issue first.

## Code and tests

- PHP: `declare(strict_types=1)`, small final classes, the `Wuemv\InertiaLivewire\` namespace, and `composer lint` passing.
- TypeScript: strict mode, no framework code in `packages/core`.
- Every change comes with tests. A change to how components mount, start or stop needs a browser test in `e2e/`: jsdom has no real Livewire.

## Commits and pull requests

- Write commit messages as [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`, `build:`, `ci:`, `chore:` and so on, in the imperative (`fix: start components mounted before Livewire`).
- Keep a pull request to one change, and say what it changes and why. Include the output that shows it working when you can.
- CI must pass. Pushes that only change Markdown skip it.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
