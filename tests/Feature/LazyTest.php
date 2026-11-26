<?php

declare(strict_types=1);

use Illuminate\Support\Facades\URL;
use Wuemv\InertiaLivewire\Facades\InertiaLivewire;
use Wuemv\InertiaLivewire\Tests\Fixtures\Counter;

test('the signed URL renders the component for the user it was made for', function () {
    $this->actingAs($this->user(7));
    $prop = InertiaLivewire::lazy(Counter::class, ['start' => 4])->toArray();

    $response = $this->get($prop['url']);

    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');
    expect((string) $response->headers->get('Cache-Control'))->toContain('no-store')
        ->and($response->getContent())->toContain('<span class="count">4</span>')
        ->toContain('wire:snapshot');
});

test('the key is stable for the same component and parameters', function () {
    $a = InertiaLivewire::lazy('counter', ['start' => 1])->toArray();
    $b = InertiaLivewire::lazy('counter', ['start' => 1])->toArray();
    $c = InertiaLivewire::lazy('counter', ['start' => 2])->toArray();

    expect($a['key'])->toBe($b['key'])->not->toBe($c['key']);
});

test('the URL does not reveal the component or its parameters', function () {
    // Hyphens never occur in the encrypted payload's base64, so this can't match by chance.
    $url = InertiaLivewire::lazy(Counter::class, ['start' => 4, 'note' => 'not-for-the-browser'])->url();

    expect(urldecode($url))
        ->not->toContain('Counter')
        ->not->toContain('not-for-the-browser');
});

test('another user or a guest cannot use the URL', function () {
    $this->actingAs($this->user(7));
    $url = InertiaLivewire::lazy('counter')->url();

    $this->actingAs($this->user(8))->get($url)->assertForbidden();

    $this->app['auth']->forgetGuards();
    $this->get($url)->assertForbidden();
});

test('a tampered or expired URL is refused', function () {
    $url = InertiaLivewire::lazy('counter', ttl: 60)->url();

    $this->get(str_replace('signature=', 'signature=0', $url))->assertForbidden();
    $this->get(preg_replace('/([?&]c=)[^&]+/', '$1'.rawurlencode(encrypt('x')), $url))->assertForbidden();

    $this->travel(61)->seconds();
    $this->get($url)->assertForbidden();
});

test('a payload that is not ours is refused even with a valid signature', function () {
    $url = URL::temporarySignedRoute(
        'inertia-livewire.render',
        now()->addMinute(),
        ['c' => 'not-encrypted'],
    );

    $this->get($url)->assertForbidden();
});

test('parameters must be JSON-encodable', function () {
    InertiaLivewire::lazy('counter', ['start' => NAN])->url();
})->throws(JsonException::class);
