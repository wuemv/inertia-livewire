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

- `vendor/bin/phpunit` (Testbench), `vendor/bin/pint --test`; `pnpm test` (Vitest, jsdom; tests import the core from source through an alias), `pnpm typecheck`, `pnpm build` (tsup); `pnpm e2e` after `pnpm build`.
- Where Playwright cannot download its browser, set `CHROMIUM_PATH` (e.g. `/opt/pw-browsers/chromium` in Claude's cloud sandbox). The workbench uses `CACHE_STORE=array`: Livewire 4 reads a rate limit from the cache on every update.
- Tested locally: Laravel 13 + Livewire 4.4 + Inertia 3.8; Laravel 12 + Livewire 3.8 + Inertia 3.8; Laravel 12 + Livewire 4.4 + Inertia 2.0. CI covers PHP 8.2–8.5 × Laravel 11–13 × Livewire 3–4, plus Inertia 2.
- Conventions: Laravel Pint style, strict types, small final classes. No dependencies beyond Laravel, Livewire and Inertia without asking.
