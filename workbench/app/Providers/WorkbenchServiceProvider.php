<?php

declare(strict_types=1);

namespace Workbench\App\Providers;

use Illuminate\Support\ServiceProvider;
use Livewire\Livewire;
use Workbench\App\Livewire\Counter;

final class WorkbenchServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Livewire::component('counter', Counter::class);
    }
}
