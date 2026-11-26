<?php

declare(strict_types=1);

use Illuminate\Routing\RouteCollection;
use Illuminate\Support\Facades\Route;
use Wuemv\InertiaLivewire\InertiaLivewireServiceProvider;

use function Orchestra\Testbench\refresh_router_lookups;

// The provider reads the setting when it boots, so each case boots it again
// on an empty route table.
test('the endpoint can be turned off', function (bool $enabled) {
    config(['inertia-livewire.route.enabled' => $enabled]);
    Route::setRoutes(new RouteCollection);

    $this->app->register(InertiaLivewireServiceProvider::class, force: true);
    refresh_router_lookups($this->app['router']);

    expect(Route::has('inertia-livewire.render'))->toBe($enabled);
})->with(['enabled' => true, 'disabled' => false]);
