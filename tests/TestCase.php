<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire\Tests;

use Illuminate\Foundation\Auth\User;
use Inertia\ServiceProvider as InertiaServiceProvider;
use Livewire\Livewire;
use Livewire\LivewireServiceProvider;
use Orchestra\Testbench\TestCase as Testbench;
use Wuemv\InertiaLivewire\InertiaLivewireServiceProvider;
use Wuemv\InertiaLivewire\Tests\Fixtures\Counter;

abstract class TestCase extends Testbench
{
    protected function getPackageProviders($app): array
    {
        return [LivewireServiceProvider::class, InertiaServiceProvider::class, InertiaLivewireServiceProvider::class];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('app.key', 'base64:'.base64_encode(str_repeat('k', 32)));
        $app['config']->set('inertia.testing.ensure_pages_exist', false);
        $app['config']->set('view.paths', [__DIR__.'/Fixtures/views']);
    }

    protected function setUp(): void
    {
        parent::setUp();
        Livewire::component('counter', Counter::class);
    }

    protected function user(int $id): User
    {
        $user = new User;
        $user->forceFill(['id' => $id]);

        return $user;
    }
}
