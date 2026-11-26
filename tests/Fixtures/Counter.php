<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire\Tests\Fixtures;

use Livewire\Component;

final class Counter extends Component
{
    public int $count = 0;

    public function mount(int $start = 0): void
    {
        $this->count = $start;
    }

    public function increment(): void
    {
        $this->count++;
    }

    public function render(): string
    {
        return <<<'BLADE'
            <div>
                <button wire:click="increment">+</button>
                <span class="count">{{ $count }}</span>
            </div>
            BLADE;
    }
}
