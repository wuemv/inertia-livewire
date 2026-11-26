<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire\Tests\Feature;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Testing\AssertableInertia;
use InvalidArgumentException;
use Wuemv\InertiaLivewire\Tests\Fixtures\Counter;
use Wuemv\InertiaLivewire\Tests\TestCase;

final class PageTest extends TestCase
{
    public function test_the_macro_renders_the_page_with_its_props_and_the_component(): void
    {
        Route::get('/counter', fn () => Inertia::livewire(Counter::class, ['start' => 5], ['title' => 'Counter'], 'Counters/Show'));

        $this->get('/counter')->assertOk()->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Counters/Show')
            ->where('title', 'Counter')
            ->where('livewire.html', fn (string $html) => str_contains($html, '<span class="count">5</span>'))
            ->has('livewire.key')
            // The component's parameters stay on the server.
            ->missing('start'));
    }

    public function test_uses_the_configured_page_and_prop_when_none_is_given(): void
    {
        config(['inertia-livewire.page' => 'Livewire/Host', 'inertia-livewire.prop' => 'island']);
        Route::get('/counter', fn () => Inertia::livewire('counter'));

        $this->get('/counter')->assertInertia(fn (AssertableInertia $page) => $page
            ->component('Livewire/Host')
            ->has('island.html')
            ->missing('livewire'));
    }

    public function test_defaults_to_the_livewire_page_page(): void
    {
        Route::get('/counter', fn () => Inertia::livewire('counter'));

        $this->get('/counter')->assertInertia(fn (AssertableInertia $page) => $page->component('LivewirePage'));
    }

    public function test_refuses_to_render_without_a_page(): void
    {
        config(['inertia-livewire.page' => null]);

        $this->expectException(InvalidArgumentException::class);
        Inertia::livewire('counter');
    }
}
