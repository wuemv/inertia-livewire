<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire\Tests\Feature;

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Wuemv\InertiaLivewire\Facades\InertiaLivewire;
use Wuemv\InertiaLivewire\Tests\Fixtures\Counter;
use Wuemv\InertiaLivewire\Tests\TestCase;

final class RenderTest extends TestCase
{
    public function test_renders_the_component_with_its_parameters_into_a_key_and_html(): void
    {
        $prop = InertiaLivewire::render(Counter::class, ['start' => 5])->toArray();

        $this->assertStringContainsString('<span class="count">5</span>', $prop['html']);
        $this->assertStringContainsString('wire:snapshot', $prop['html'], 'Livewire needs the snapshot to start the component');
        $this->assertStringContainsString('wire:click="increment"', $prop['html']);
        $this->assertSame(hash('xxh128', $prop['html']), $prop['key']);
    }

    public function test_accepts_an_alias_as_well_as_a_class_name(): void
    {
        $prop = InertiaLivewire::render('counter', ['start' => 2])->toArray();

        $this->assertStringContainsString('<span class="count">2</span>', $prop['html']);
    }

    public function test_each_render_gets_its_own_key_so_the_adapters_replace_the_component(): void
    {
        $first = InertiaLivewire::render(Counter::class, ['start' => 1])->toArray();
        $second = InertiaLivewire::render(Counter::class, ['start' => 1])->toArray();

        // Livewire gives every mount its own id, so the same component renders anew.
        $this->assertNotSame($first['key'], $second['key']);
    }

    public function test_renders_only_when_inertia_resolves_the_prop(): void
    {
        Route::get('/page', fn () => Inertia::render('Page', [
            'title' => 'Counter',
            'livewire' => InertiaLivewire::render(Counter::class, ['start' => 3]),
        ]));

        $full = $this->getJson('/page', ['X-Inertia' => 'true']);
        $this->assertStringContainsString('<span class="count">3</span>', $full->json('props.livewire.html'));

        // A partial reload that leaves the component out does not render it.
        $partial = $this->getJson('/page', [
            'X-Inertia' => 'true',
            'X-Inertia-Partial-Component' => 'Page',
            'X-Inertia-Partial-Data' => 'title',
        ]);
        $this->assertSame('Counter', $partial->json('props.title'));
        $this->assertNull($partial->json('props.livewire'));
    }
}
