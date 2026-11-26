<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire;

use DateTimeInterface;
use Illuminate\Contracts\Support\Arrayable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\URL;
use JsonSerializable;

/**
 * A Livewire component the browser fetches after the page shows, as an Inertia
 * prop: { key, url }. The URL is signed and expires, and carries the component,
 * its parameters and the current user encrypted, so only the user it was made
 * for can load it, and only with these parameters.
 *
 * @implements Arrayable<string, string>
 */
final class LazyLivewireComponent implements Arrayable, JsonSerializable
{
    public const ROUTE = 'inertia-livewire.render';

    /**
     * @param  array<string, mixed>  $params  passed to the component's mount(); must be JSON-encodable
     */
    public function __construct(
        public readonly string $name,
        public readonly array $params,
        public readonly DateTimeInterface $expires,
    ) {}

    public function url(): string
    {
        $payload = json_encode(
            ['component' => $this->name, 'params' => $this->params, 'user' => Auth::id()],
            JSON_THROW_ON_ERROR,
        );

        return URL::temporarySignedRoute(self::ROUTE, $this->expires, ['c' => Crypt::encryptString($payload)]);
    }

    /**
     * @return array{key: string, url: string}
     */
    public function toArray(): array
    {
        $params = json_encode($this->params, JSON_THROW_ON_ERROR);

        return ['key' => hash('xxh128', $this->name."\0".$params), 'url' => $this->url()];
    }

    /**
     * @return array{key: string, url: string}
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
