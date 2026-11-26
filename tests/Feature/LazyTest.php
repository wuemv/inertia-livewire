<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire\Tests\Feature;

use Illuminate\Support\Facades\URL;
use Wuemv\InertiaLivewire\Facades\InertiaLivewire;
use Wuemv\InertiaLivewire\Tests\Fixtures\Counter;
use Wuemv\InertiaLivewire\Tests\TestCase;

final class LazyTest extends TestCase
{
    public function test_the_signed_url_renders_the_component_for_the_user_it_was_made_for(): void
    {
        $this->actingAs($this->user(7));
        $prop = InertiaLivewire::lazy(Counter::class, ['start' => 4])->toArray();

        $response = $this->get($prop['url']);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');
        $this->assertStringContainsString('no-store', (string) $response->headers->get('Cache-Control'));
        $this->assertStringContainsString('<span class="count">4</span>', $response->getContent());
        $this->assertStringContainsString('wire:snapshot', $response->getContent());
    }

    public function test_the_key_is_stable_for_the_same_component_and_parameters(): void
    {
        $a = InertiaLivewire::lazy('counter', ['start' => 1])->toArray();
        $b = InertiaLivewire::lazy('counter', ['start' => 1])->toArray();
        $c = InertiaLivewire::lazy('counter', ['start' => 2])->toArray();

        $this->assertSame($a['key'], $b['key']);
        $this->assertNotSame($a['key'], $c['key']);
    }

    public function test_the_url_does_not_reveal_the_component_or_its_parameters(): void
    {
        $url = InertiaLivewire::lazy(Counter::class, ['start' => 4, 'secret' => 'shh'])->url();

        $this->assertStringNotContainsString('Counter', urldecode($url));
        $this->assertStringNotContainsString('shh', urldecode($url));
    }

    public function test_another_user_or_a_guest_cannot_use_the_url(): void
    {
        $this->actingAs($this->user(7));
        $url = InertiaLivewire::lazy('counter')->url();

        $this->actingAs($this->user(8))->get($url)->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->get($url)->assertForbidden();
    }

    public function test_a_tampered_or_expired_url_is_refused(): void
    {
        $url = InertiaLivewire::lazy('counter', ttl: 60)->url();

        $this->get(str_replace('signature=', 'signature=0', $url))->assertForbidden();
        $this->get(preg_replace('/([?&]c=)[^&]+/', '$1'.rawurlencode(encrypt('x')), $url))->assertForbidden();

        $this->travel(61)->seconds();
        $this->get($url)->assertForbidden();
    }

    public function test_a_payload_that_is_not_ours_is_refused_even_with_a_valid_signature(): void
    {
        $url = URL::temporarySignedRoute(
            'inertia-livewire.render',
            now()->addMinute(),
            ['c' => 'not-encrypted'],
        );

        $this->get($url)->assertForbidden();
    }

    public function test_parameters_must_be_json_encodable(): void
    {
        $this->expectException(\JsonException::class);
        InertiaLivewire::lazy('counter', ['start' => NAN])->url();
    }
}
