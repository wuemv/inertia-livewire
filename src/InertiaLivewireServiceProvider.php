<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire;

use Illuminate\Contracts\View\View;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

final class InertiaLivewireServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/inertia-livewire.php', 'inertia-livewire');
        $this->app->singleton(InertiaLivewire::class);
    }

    public function boot(): void
    {
        $this->publishes([
            __DIR__.'/../config/inertia-livewire.php' => $this->app->configPath('inertia-livewire.php'),
        ], 'inertia-livewire-config');

        if ($this->app['config']->get('inertia-livewire.route.enabled', true)) {
            $this->loadRoutesFrom(__DIR__.'/../routes/inertia-livewire.php');
        }

        // Inertia::livewire(Counter::class, ['start' => 5], ['title' => 'Counter'], 'Counters/Show')
        Inertia::macro('livewire', function (
            string|View $component,
            array $params = [],
            array $props = [],
            ?string $page = null,
        ) {
            return app(InertiaLivewire::class)->page($component, $params, $props, $page);
        });
    }
}
