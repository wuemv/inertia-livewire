<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Wuemv\InertiaLivewire\Facades\InertiaLivewire;

// The page the end-to-end tests drive: Livewire's runtime from @livewireScripts,
// Vue and the built packages through an import map, no Inertia client needed.
Route::get('/e2e', fn () => view('e2e', [
    'props' => [
        'first' => InertiaLivewire::render('counter', ['label' => 'first', 'start' => 1]),
        'second' => InertiaLivewire::render('counter', ['label' => 'second', 'start' => 10]),
        'lazy' => InertiaLivewire::lazy('counter', ['label' => 'lazy', 'start' => 100]),
    ],
]))->middleware('web');

// The built packages and Vue, for the import map.
Route::get('/e2e-js/{file}', function (string $file) {
    $files = [
        'vue.js' => 'node_modules/vue/dist/vue.esm-browser.js',
        'core.js' => 'packages/core/dist/index.js',
        'vue-adapter.js' => 'packages/vue/dist/index.js',
    ];
    abort_unless(isset($files[$file]), 404);

    return response()->file(dirname(__DIR__, 2).'/'.$files[$file], ['Content-Type' => 'text/javascript']);
});
