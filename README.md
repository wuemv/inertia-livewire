# inertia-livewire

Mount Livewire components inside Inertia pages.

Laravel renders the component on the server, the Inertia page receives its HTML as a prop, and a small Vue (or React) component puts it on the page and lets Livewire start it. Inertia keeps the page, the layout and the navigation; Livewire runs the component, with its own requests and its own DOM updates.

It suits apps whose core is Inertia but where some screens are easier to write as Livewire: settings and forms, admin screens, or plugins that third parties write in PHP and Blade, with no JavaScript build of their own.

```php
return Inertia::livewire(BillingSettings::class, ['team' => $team->id], ['title' => 'Billing']);
```

```vue
<LivewireMount :component="livewire" class="rounded-lg border p-6" />
```

## Requirements

- PHP 8.2 or later, Laravel 12.61.1 or 13.12 and later (earlier releases have a signed-URL flaw that lazy components rely on; Laravel 11 no longer gets security fixes)
- Livewire 3 or 4
- Inertia 2 or 3 (`inertiajs/inertia-laravel`)
- Vue 3.3 or later. React: coming next, in `packages/react`.

## Install

```sh
composer require wuemv/inertia-livewire
npm install @wuemv/inertia-livewire-vue
```

Load Livewire in the Inertia root template, `resources/views/app.blade.php`. Livewire only adds its assets by itself to pages that render a component, and an Inertia page never does:

```blade
<head>
    ...
    @livewireStyles
    @inertiaHead
</head>
<body>
    @inertia
    @livewireScripts
</body>
```

Livewire brings Alpine: don't load another Alpine.

## Usage

### A page around one component

```php
use Inertia\Inertia;

Route::get('/settings/billing', fn () => Inertia::livewire(
    BillingSettings::class,       // class, alias ('billing'), namespaced ('billing::settings') or view()
    ['team' => 7],                // the component's mount() parameters: they stay on the server
    ['title' => 'Billing'],       // the page's own props
    'Settings/LivewirePage',      // the page: default from config, 'LivewirePage'
));
```

The page receives its props and the component as `livewire` (`{ key, html }`):

```vue
<!-- resources/js/pages/Settings/LivewirePage.vue -->
<script setup lang="ts">
import { LivewireMount, type LivewireComponent } from '@wuemv/inertia-livewire-vue';
import AppLayout from '@/layouts/AppLayout.vue';

defineProps<{ title: string; livewire: LivewireComponent }>();
</script>

<template>
    <AppLayout>
        <h1>{{ title }}</h1>
        <LivewireMount :component="livewire" class="p-6" />
    </AppLayout>
</template>
```

### A component inside any page

```php
use Wuemv\InertiaLivewire\Facades\InertiaLivewire;

return Inertia::render('Dashboard', [
    'stats' => $stats,
    'activity' => InertiaLivewire::render(ActivityFeed::class, ['limit' => 20]),
]);
```

```vue
<LivewireMount :component="activity" />
```

The component renders when Inertia resolves the prop, so a partial reload that leaves it out (`router.reload({ only: ['stats'] })`) does not render it, and one that asks for it renders it anew.

### A component that loads after the page

```php
'chat' => InertiaLivewire::lazy(SupportChat::class, ['room' => $room->id]),
```

```vue
<LivewireMount :component="chat">
    <template #placeholder><Spinner /></template>
</LivewireMount>
```

The prop is `{ key, url }`. The browser fetches the HTML from a signed URL, which carries the component, its parameters and the user, encrypted:

- a browser cannot load another component or change the parameters;
- only the user it was made for can load it (or a guest, for a guest's page);
- it expires after `lazy_ttl` seconds (one hour by default). Inertia keeps props in the browser history, so the back button can bring back an old URL: `@error` tells you when one has expired.

Parameters must be JSON-encodable: pass IDs, not models.

### Events

From Livewire to Vue:

```php
$this->dispatch('invoice-paid', id: $invoice->id);
```

```ts
import { useLivewireEvent } from '@wuemv/inertia-livewire-vue';
import { router } from '@inertiajs/vue3';

useLivewireEvent('invoice-paid', ({ id }) => router.reload({ only: ['invoices'] }));
```

From Vue to Livewire:

```ts
import { dispatch } from '@wuemv/inertia-livewire-vue';

dispatch('refresh-invoices', { team: 7 });   // #[On('refresh-invoices')] in the component
```

### `<LivewireMount>`

| Prop | | |
|---|---|---|
| `component` | `{ key, html }` or `{ key, url }` | from `render()`, `Inertia::livewire()` or `lazy()` |
| `html` | string | plain HTML instead, for HTML from elsewhere |
| `as` | string | the element, `div` by default |

Other attributes (`class`, `id`, `data-*`) go on that element. Slot: `placeholder`, shown while a lazy component loads. Events: `loaded` (the element), `error` (a lazy request that failed).

Livewire owns the element's content once it is there: while the key stays the same, Vue never writes it again, so Livewire's own updates stay. Every render on the server gives a new key, and a new key stops the old component and mounts the new one: there is no need for `:key`.

## How it works

- **Server:** `Livewire::mount()` renders the component, with the snapshot Livewire needs to run it, and the HTML travels in the Inertia prop. The key is a hash of that HTML.
- **Browser:** Livewire's runtime is loaded once, by `@livewireScripts`. The adapter puts the HTML into its element and calls `Alpine.initTree()` on it, which starts the components inside; when the element goes, `Alpine.destroyTree()` stops them. It never starts Livewire itself: starting it twice breaks it.
- **Before Livewire has started:** a page's module scripts can mount components before Livewire starts on `DOMContentLoaded`, and `initTree()` does nothing useful then. The adapter leaves them in place, and Livewire's own start goes through the whole document and starts them with everything else.

## Limits

- Use Inertia's links. `wire:navigate` in an embedded component would fight Inertia's router.
- With Inertia's SSR, the component's HTML is part of the server render; it starts once the page's JavaScript and Livewire have loaded.
- Components are separate from the page's Vue state: talk through events, or reload Inertia props.

## Configuration

```sh
php artisan vendor:publish --tag=inertia-livewire-config
```

| Key | Default | |
|---|---|---|
| `page` | `LivewirePage` | the page `Inertia::livewire()` renders when none is given |
| `prop` | `livewire` | the prop it passes the component in |
| `route.enabled` | `true` | the endpoint for lazy components |
| `route.prefix` | `inertia-livewire` | its path: `/inertia-livewire/render` |
| `route.middleware` | `['web']` | its middleware; keep the session in it |
| `lazy_ttl` | `3600` | how long a lazy URL is valid, in seconds |

## Development

```sh
composer install && pnpm install
vendor/bin/phpunit          # PHP: rendering, the page macro, the signed endpoint
pnpm test                   # JavaScript: the core and the Vue adapter, in jsdom
pnpm build && pnpm e2e      # Chromium against a real Laravel + Livewire app (workbench/)
```

The end-to-end tests serve `workbench/` with `vendor/bin/testbench serve`. Where Playwright cannot download its browser, point `CHROMIUM_PATH` at a Chromium.

## License

MIT. See [LICENSE](LICENSE).
