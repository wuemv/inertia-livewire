<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire\Facades;

use Illuminate\Support\Facades\Facade;

/**
 * @method static \Wuemv\InertiaLivewire\LivewireComponent render(string|\Illuminate\Contracts\View\View $component, array $params = [])
 * @method static \Wuemv\InertiaLivewire\LazyLivewireComponent lazy(string|\Illuminate\Contracts\View\View $component, array $params = [], ?int $ttl = null)
 * @method static \Inertia\Response page(string|\Illuminate\Contracts\View\View $component, array $params = [], array $props = [], ?string $page = null)
 *
 * @see \Wuemv\InertiaLivewire\InertiaLivewire
 */
final class InertiaLivewire extends Facade
{
    protected static function getFacadeAccessor(): string
    {
        return \Wuemv\InertiaLivewire\InertiaLivewire::class;
    }
}
