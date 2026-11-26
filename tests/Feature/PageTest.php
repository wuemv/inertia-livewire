<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia;
use Wuemv\InertiaLivewire\Tests\Fixtures\Counter;

test('the macro renders the page with its props and the component', function () {
    Route::get('/counter', fn () => Inertia::livewire(Counter::class, ['start' => 5], ['title' => 'Counter'], 'Counters/Show'));

    $this->get('/counter')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Counters/Show')
        ->where('title', 'Counter')
        ->where('livewire.html', fn (string $html) => str_contains($html, '<span class="count">5</span>'))
        ->has('livewire.key')
        // The component's parameters stay on the server.
        ->missing('start'));
});

test('uses the configured page and prop when none is given', function () {
    config(['inertia-livewire.page' => 'Livewire/Host', 'inertia-livewire.prop' => 'island']);
    Route::get('/counter', fn () => Inertia::livewire('counter'));

    $this->get('/counter')->assertInertia(fn (AssertableInertia $page) => $page
        ->component('Livewire/Host')
        ->has('island.html')
        ->missing('livewire'));
});

test('defaults to the LivewirePage page', function () {
    Route::get('/counter', fn () => Inertia::livewire('counter'));

    $this->get('/counter')->assertInertia(fn (AssertableInertia $page) => $page->component('LivewirePage'));
});

test('refuses to render without a page', function () {
    config(['inertia-livewire.page' => null]);

    Inertia::livewire('counter');
})->throws(InvalidArgumentException::class);
