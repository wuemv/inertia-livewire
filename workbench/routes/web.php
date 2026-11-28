<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Wuemv\InertiaLivewire\Facades\InertiaLivewire;

// The pages the end-to-end tests drive: Livewire's runtime from @livewireScripts and
// the built packages, no Inertia client needed. The Vue page loads Vue through an
// import map; the React page is a bundle that e2e/global-setup.ts builds.
$props = fn () => [
    'first' => InertiaLivewire::render('counter', ['label' => 'first', 'start' => 1]),
    'second' => InertiaLivewire::render('counter', ['label' => 'second', 'start' => 10]),
    'lazy' => InertiaLivewire::lazy('counter', ['label' => 'lazy', 'start' => 100]),
];

Route::get('/e2e', fn () => view('e2e', ['props' => $props()]))->middleware('web');
Route::get('/e2e-react', fn () => view('e2e-react', ['props' => $props()]))->middleware('web');

// The built packages, Vue and the React page.
Route::get('/e2e-js/{file}', function (string $file) {
    $files = [
        'vue.js' => 'node_modules/vue/dist/vue.esm-browser.js',
        'core.js' => 'packages/core/dist/index.js',
        'vue-adapter.js' => 'packages/vue/dist/index.js',
        'react-page.js' => 'e2e/.build/react-page.js',
    ];
    abort_unless(isset($files[$file]), 404);

    return response()->file(dirname(__DIR__, 2).'/'.$files[$file], ['Content-Type' => 'text/javascript']);
});
