<?php

declare(strict_types=1);

namespace Workbench\App\Livewire;

use Livewire\Component;

final class Counter extends Component
{
    public string $label = '';

    public int $count = 0;

    public function mount(string $label, int $start = 0): void
    {
        $this->label = $label;
        $this->count = $start;
    }

    public function increment(): void
    {
        $this->count++;
        $this->dispatch('counted', label: $this->label, count: $this->count);
    }

    public function render(): string
    {
        return <<<'BLADE'
            <div class="counter" data-label="{{ $label }}">
                <button type="button" wire:click="increment">{{ $label }} +</button>
                <output>{{ $count }}</output>
            </div>
            BLADE;
    }
}
