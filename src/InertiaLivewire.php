<?php

declare(strict_types=1);

namespace Wuemv\InertiaLivewire;

use Illuminate\Contracts\Config\Repository as Config;
use Illuminate\Contracts\View\View;
use Inertia\Inertia;
use Inertia\Response;
use InvalidArgumentException;

final class InertiaLivewire
{
    public function __construct(private readonly Config $config) {}

    /**
     * A component rendered on the server, to pass as a prop of any Inertia page.
     *
     * @param  string|View  $component  a class name, an alias ("counter"), a namespaced
     *                                  name ("billing::invoices") or a view() of a single-file component
     * @param  array<string, mixed>  $params  passed to the component's mount()
     */
    public function render(string|View $component, array $params = []): LivewireComponent
    {
        return new LivewireComponent($this->name($component), $params);
    }

    /**
     * A component the browser loads after the page shows, through a signed URL.
     *
     * @param  array<string, mixed>  $params  passed to the component's mount(); must be JSON-encodable
     */
    public function lazy(string|View $component, array $params = [], ?int $ttl = null): LazyLivewireComponent
    {
        $ttl ??= (int) $this->config->get('inertia-livewire.lazy_ttl', 3600);

        return new LazyLivewireComponent($this->name($component), $params, now()->addSeconds($ttl));
    }

    /**
     * An Inertia page around one component: the page gets $props, and the component,
     * rendered with $params, under the configured prop ("livewire" by default).
     *
     * @param  array<string, mixed>  $params  passed to the component's mount(), never sent to the page
     * @param  array<string, mixed>  $props  the page's other props
     */
    public function page(string|View $component, array $params = [], array $props = [], ?string $page = null): Response
    {
        $page ??= $this->config->get('inertia-livewire.page');
        if (! is_string($page) || $page === '') {
            throw new InvalidArgumentException('No Inertia page given, and inertia-livewire.page is not set.');
        }
        $prop = (string) $this->config->get('inertia-livewire.prop', 'livewire');

        return Inertia::render($page, [...$props, $prop => $this->render($component, $params)]);
    }

    private function name(string|View $component): string
    {
        return $component instanceof View ? $component->name() : $component;
    }
}
