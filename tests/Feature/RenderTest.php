<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Wuemv\InertiaLivewire\Facades\InertiaLivewire;
use Wuemv\InertiaLivewire\Tests\Fixtures\Counter;

test('renders the component with its parameters into a key and html', function () {
    $prop = InertiaLivewire::render(Counter::class, ['start' => 5])->toArray();

    expect($prop['html'])
        ->toContain('<span class="count">5</span>')
        // Livewire needs the snapshot to start the component.
        ->toContain('wire:snapshot')
        ->toContain('wire:click="increment"')
        ->and($prop['key'])->toBe(hash('xxh128', $prop['html']));
});

test('accepts an alias as well as a class name', function () {
    $prop = InertiaLivewire::render('counter', ['start' => 2])->toArray();

    expect($prop['html'])->toContain('<span class="count">2</span>');
});

test('each render gets its own key, so the adapters replace the component', function () {
    $first = InertiaLivewire::render(Counter::class, ['start' => 1])->toArray();
    $second = InertiaLivewire::render(Counter::class, ['start' => 1])->toArray();

    // Livewire gives every mount its own id, so the same component renders anew.
    expect($first['key'])->not->toBe($second['key']);
});

test('renders only when Inertia resolves the prop', function () {
    Route::get('/page', fn () => Inertia::render('Page', [
        'title' => 'Counter',
        'livewire' => InertiaLivewire::render(Counter::class, ['start' => 3]),
    ]));

    $full = $this->getJson('/page', ['X-Inertia' => 'true']);
    expect($full->json('props.livewire.html'))->toContain('<span class="count">3</span>');

    // A partial reload that leaves the component out does not render it.
    $partial = $this->getJson('/page', [
        'X-Inertia' => 'true',
        'X-Inertia-Partial-Component' => 'Page',
        'X-Inertia-Partial-Data' => 'title',
    ]);
    expect($partial->json('props.title'))->toBe('Counter')
        ->and($partial->json('props.livewire'))->toBeNull();
});
