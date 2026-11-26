# inertia-livewire

Mount Livewire components inside Inertia pages. One repository, published as a Composer package (`wuemv/inertia-livewire`, the root) and npm packages (`packages/*`). Extracted from the `Inertia::livewire()` macro and `LivewireMount.vue` in wuemv/cms, where plugin admin screens are Livewire inside a Vue + Inertia admin.

## Layout

- `src/`, `config/`, `routes/`: the Laravel side. `InertiaLivewire` (facade too) has `render()` → `LivewireComponent` (`{ key, html }`), `lazy()` → `LazyLivewireComponent` (`{ key, url }`), `page()`, which the `Inertia::livewire()` macro calls. `Http\RenderController` serves lazy components.
- `packages/core` (`@wuemv/inertia-livewire`): framework-independent `mount`, `start`, `unmount`, `fetchComponent`, `on`, `dispatch`, `livewireStarted`.
- `packages/vue` (`@wuemv/inertia-livewire-vue`): `<LivewireMount>`, `useLivewireEvent`. `packages/react` comes next, against the same core, from the React app's `livewire-mount.tsx`.
- `workbench/` + `testbench.yaml`: a real Laravel + Livewire app (`vendor/bin/testbench serve`) for `e2e/` (Playwright).

## Design decisions

- **The key is a hash of the HTML** (`xxh128`). Livewire gives every mount its own id, so every server render has a new key, and the adapters replace the component exactly when the server rendered it anew. While the key stays, the adapter never writes the element again: Livewire owns its DOM. Lazy keys hash name + params, so they stay stable.
- **Props render lazily**: `LivewireComponent` implements `Arrayable` and renders in `toArray()`, so Inertia partial reloads that leave it out don't render it.
- **Page props and mount parameters are separate** (`page($component, $params, $props, $page)`): parameters never reach the browser. The cms macro sent one array to both.
- **Lazy URLs**: `URL::temporarySignedRoute` with the payload (component, params, `Auth::id()`) encrypted in `c`. The controller refuses a payload that doesn't decrypt or belongs to another user. Params must be JSON-encodable.
- **Starting components**: Livewire's runtime comes from `@livewireScripts`, once. The adapter calls `Alpine.initTree(el)` on mount and `Alpine.destroyTree(child)` on unmount; Livewire starts a component in its `interceptInit` hook (skipping elements it already started) and destroys it when Alpine removes `wire:id`. Never call `Livewire.start()` again.
- **The start race** (found by the e2e test): Livewire registers its init hooks in `start()`, on `DOMContentLoaded`, but a page's module scripts run before that. `initTree()` before then starts nothing, so `start()` only calls it once `livewire:initialized` has fired (or `Livewire.initialRenderIsFinished` is set); before that, Livewire's own start walks the document and starts what is already mounted.

## Development

- `vendor/bin/pest` (Testbench), `composer lint` (`pun format --test`, `pun lint`), `composer format`; `pnpm test` (Vitest, jsdom; tests import the core from source through an alias), `pnpm typecheck`, `pnpm build` (tsup); `pnpm e2e` after `pnpm build`.
- The PHP tests are Pest (`tests/Pest.php` extends `TestCase` in `tests/Feature`). `^4.0 || ^5.0`: Composer picks Pest 4 (PHPUnit 12) on PHP 8.3, Pest 5 (PHPUnit 13) on 8.4+. A test that needs different config before the providers boot can't override `defineEnvironment()` in a Pest file: set the config, then `$this->app->register(Provider::class, force: true)`, as `RouteTest` does (Orchestra's Pest plugin would be a new dependency).
- Where Playwright cannot download its browser, set `CHROMIUM_PATH` (e.g. `/opt/pw-browsers/chromium` in Claude's cloud sandbox). The workbench uses `CACHE_STORE=array`: Livewire 4 reads a rate limit from the cache on every update.
- Tested locally: Laravel 13 + Livewire 4.4 + Inertia 3.8; Laravel 12 + Livewire 4.4 + Inertia 2.0. On 26 Nov 2026, the release files (the `git archive` zip, the `pnpm pack` tarballs) installed into a new `laravel new --vue` app (Laravel 13.44, Livewire 4.4.10, Inertia 3, Vue 3.5) and worked in the browser. CI covers PHP 8.3–8.5 × Laravel 12–13 on Livewire 4, plus Inertia 2.
- Livewire 4 only, from 4.4.8: earlier 4.x releases have advisories (DOM XSS CVE-2026-81887 up to 4.3.3, an `#[Authorize]` bypass in 4.3.0 to 4.4.7). Livewire 3 was dropped before 0.1.0: 4.0 came out in January 2026, and the package brings Livewire with it. Raise the floor when Livewire publishes a new advisory (`https://packagist.org/api/security-advisories/?packages[]=livewire/livewire`).
- No Laravel 11: every 11.x release has unfixed advisories, and Composer 2.9+ refuses to install them (CI uses it). The minimum releases, 12.61.1 and 13.12, carry the fix for temporary signed URL path confusion, which lazy URLs rely on.
- The root `build` and `typecheck` scripts use `pnpm -r run`: a `--filter ./packages/*` in a package.json script is expanded by the shell first and matched nothing, so CI once built no packages.
- PHP minimums are each minor's newest security release: `~8.3.37 || ~8.4.28 || ^8.5.13` (php.net, 19 Nov 2026; `^` on the newest minor lets later minors in). One `~` per older minor, since `^8.3.37` would let 8.4.0 to 8.4.27 in. Raise them when PHP ships security releases: the newest release tagged `security` at `https://www.php.net/releases/index.php?json&version=8.4&max=6` (not every patch is one). Distro PHP builds that backport fixes under old patch numbers (Debian, Ubuntu) don't satisfy them.
- Pun (`shipfastlabs/pun`, `pun.toml`) formats and lints. Its Composer package is a shim that downloads the native binary into `vendor/bin` on first run (Linux and macOS only). Pun refuses any project whose `require.php` allows PHP below 8.3, which is why the floor is 8.3. Its format is Pint's `laravel` preset, byte for byte. `pun analyse` is not in CI yet: it reports two casts of `Livewire::mount()` as useless, `view()` in the workbench, and Testbench's `welcome.blade.php` from `vendor/`.
- Conventions: Laravel style (Pun's `laravel` preset), strict types, small final classes. No dependencies beyond Laravel, Livewire and Inertia without asking.
