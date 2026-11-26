<?php

declare(strict_types=1);

use Illuminate\Routing\Middleware\ValidateSignature;
use Illuminate\Support\Facades\Route;
use Wuemv\InertiaLivewire\Http\RenderController;
use Wuemv\InertiaLivewire\LazyLivewireComponent;

Route::middleware([...(array) config('inertia-livewire.route.middleware', ['web']), ValidateSignature::class])
    ->prefix((string) config('inertia-livewire.route.prefix', 'inertia-livewire'))
    ->get('render', RenderController::class)
    ->name(LazyLivewireComponent::ROUTE);
