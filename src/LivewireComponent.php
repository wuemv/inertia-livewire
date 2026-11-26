<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire;

use Illuminate\Contracts\Support\Arrayable;
use JsonSerializable;
use Livewire\Livewire;

/**
 * A Livewire component rendered on the server, as an Inertia prop: { key, html }.
 *
 * It renders when Inertia resolves the prop, so a partial reload that leaves the
 * prop out does not render it. The key changes whenever the HTML does, which
 * tells the Vue and React adapters to replace the component rather than keep
 * the one Livewire is already running.
 *
 * @implements Arrayable<string, string>
 */
final class LivewireComponent implements Arrayable, JsonSerializable
{
    private ?string $html = null;

    /**
     * @param  array<string, mixed>  $params  passed to the component's mount()
     */
    public function __construct(
        public readonly string $name,
        public readonly array $params = [],
    ) {}

    public function html(): string
    {
        return $this->html ??= (string) Livewire::mount($this->name, $this->params);
    }

    /**
     * @return array{key: string, html: string}
     */
    public function toArray(): array
    {
        $html = $this->html();

        return ['key' => hash('xxh128', $html), 'html' => $html];
    }

    /**
     * @return array{key: string, html: string}
     */
    public function jsonSerialize(): array
    {
        return $this->toArray();
    }
}
