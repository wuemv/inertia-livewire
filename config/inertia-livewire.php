<?php

declare(strict_types=1);

return [

    /*
    | The Inertia page that Inertia::livewire() renders when no page is given.
    | Create it in your app (resources/js/pages/LivewirePage.vue or .tsx): it
    | receives the component under the prop name below, plus any page props.
    */
    'page' => 'LivewirePage',

    /*
    | The prop that carries the component: { key, html } for a rendered
    | component, { key, url } for a lazy one.
    */
    'prop' => 'livewire',

    /*
    | The endpoint that renders lazy components. Its URLs are signed and carry
    | the component and its parameters encrypted, so a browser can neither pick
    | another component nor change the parameters. Keep the session middleware
    | in the group: Livewire and your components need it.
    */
    'route' => [
        'enabled' => true,
        'prefix' => 'inertia-livewire',
        'middleware' => ['web'],
    ],

    /*
    | How long a lazy component's URL stays valid, in seconds. Inertia keeps
    | props in the browser history, so the back button may load a URL this old.
    */
    'lazy_ttl' => 3600,

];
