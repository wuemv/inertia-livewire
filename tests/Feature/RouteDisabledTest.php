<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire\Tests\Feature;

use Illuminate\Support\Facades\Route;
use Wuemv\InertiaLivewire\Tests\TestCase;

final class RouteDisabledTest extends TestCase
{
    protected function defineEnvironment($app): void
    {
        parent::defineEnvironment($app);
        $app['config']->set('inertia-livewire.route.enabled', false);
    }

    public function test_the_endpoint_can_be_turned_off(): void
    {
        $this->assertFalse(Route::has('inertia-livewire.render'));
    }
}
