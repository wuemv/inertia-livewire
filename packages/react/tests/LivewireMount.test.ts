import { act, Activity, createElement, StrictMode, type ReactNode } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LivewireMount, useLivewireEvent, type LivewireComponent } from '../src';

declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const alpine = { initTree: vi.fn(), destroyTree: vi.fn() };
const livewire = { on: vi.fn(() => vi.fn()), dispatch: vi.fn() };

let container: HTMLElement;
let root: Root;

beforeEach(() => {
    window.Alpine = alpine;
    window.Livewire = livewire;
    document.dispatchEvent(new Event('livewire:initialized'));
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
});

afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

const render = (node: ReactNode) => act(() => root.render(node));
// Lets the fetch and the response's body resolve, then React commit what they changed.
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));
const mountOf = (props: Parameters<typeof LivewireMount>[0]) => createElement(LivewireMount, props);
const rendered = (key: string, text: string) => ({ key, html: `<div wire:id="${key}">${text}</div>` });
const wire = (id: string) => container.querySelector(`[wire\\:id="${id}"]`);
const serve = (html: string) =>
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.resolve(new Response(html)));

describe('a rendered component', () => {
    it('renders the HTML with the attributes and starts it', () => {
        render(mountOf({ component: rendered('a', 'one'), className: 'p-6', id: 'billing' }));

        const host = container.querySelector('.p-6');
        expect(host?.id).toBe('billing');
        expect(host?.innerHTML).toBe('<div wire:id="a">one</div>');
        expect(alpine.initTree).toHaveBeenCalledWith(host);
    });

    it('accepts plain HTML too', () => {
        render(mountOf({ html: '<div wire:id="b">two</div>' }));

        expect(wire('b')?.textContent).toBe('two');
        expect(alpine.initTree).toHaveBeenCalledTimes(1);
    });

    it('renders the element given in as', () => {
        render(mountOf({ component: rendered('a', 'one'), as: 'section' }));

        expect(container.firstElementChild?.tagName).toBe('SECTION');
    });

    it('leaves what Livewire changed alone while the key stays', () => {
        const page = (title: string, component: LivewireComponent) =>
            createElement('section', null, createElement('h1', null, title), mountOf({ component }));
        render(page('first', rendered('a', 'one')));
        // Livewire updates its DOM in place.
        wire('a')!.textContent = 'changed by Livewire';

        // A re-render of the page passes other HTML under the same key: React must not write it.
        render(page('second', rendered('a', 'two')));

        expect(container.querySelector('h1')?.textContent).toBe('second');
        expect(wire('a')?.textContent).toBe('changed by Livewire');
        expect(alpine.initTree).toHaveBeenCalledTimes(1);
    });

    it('replaces the component when the key changes', () => {
        render(mountOf({ component: rendered('a', 'one') }));
        const old = wire('a');

        render(mountOf({ component: rendered('b', 'two') }));

        expect(alpine.destroyTree).toHaveBeenCalledWith(old);
        expect(wire('a')).toBeNull();
        expect(wire('b')?.textContent).toBe('two');
        expect(alpine.initTree).toHaveBeenCalledTimes(2);
        expect(alpine.initTree).toHaveBeenLastCalledWith(wire('b')?.parentElement);
    });

    it('stops the component when it goes away', () => {
        render(mountOf({ component: rendered('a', 'one') }));
        const child = wire('a');

        render(null);

        expect(alpine.destroyTree).toHaveBeenCalledWith(child);
    });

    it('reports the element once the component is in place', () => {
        const onLoaded = vi.fn();
        render(mountOf({ component: rendered('a', 'one'), onLoaded }));

        expect(onLoaded).toHaveBeenCalledExactlyOnceWith(wire('a')?.parentElement);
    });
});

describe('a lazy component', () => {
    it('shows the placeholder, then mounts what the URL returns', async () => {
        serve('<div wire:id="l">loaded</div>');
        const onLoaded = vi.fn();
        render(mountOf({
            component: { key: 'l', url: '/inertia-livewire/render?c=1' },
            placeholder: createElement('p', { className: 'loading' }, 'Loading'),
            onLoaded,
        }));
        expect(container.querySelector('.loading')).not.toBeNull();

        await settle();

        expect(container.querySelector('.loading')).toBeNull();
        expect(wire('l')?.textContent).toBe('loaded');
        expect(alpine.initTree).toHaveBeenCalledTimes(1);
        expect(onLoaded).toHaveBeenCalledExactlyOnceWith(wire('l')?.parentElement);
    });

    it('reports a failed request', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }));
        const onError = vi.fn();
        render(mountOf({ component: { key: 'l', url: '/x' }, placeholder: 'Loading', onError }));

        await settle();

        expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
        expect(container.textContent).toBe('');
        expect(alpine.initTree).not.toHaveBeenCalled();
    });

    it('drops a response that arrives after the component went away', async () => {
        let answer!: (response: Response) => void;
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise((resolve) => (answer = resolve)));
        const onError = vi.fn();
        render(mountOf({ component: { key: 'l', url: '/x' }, onError }));

        render(null);
        answer(new Response('<div wire:id="l">late</div>'));
        await settle();

        expect(alpine.initTree).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });
});

describe('in StrictMode', () => {
    const strict = (node: ReactNode) => createElement(StrictMode, null, node);

    it('keeps the component running through the extra cleanup in development', () => {
        render(strict(mountOf({ component: rendered('a', 'one') })));

        expect(wire('a')?.textContent).toBe('one');
        expect(alpine.destroyTree).not.toHaveBeenCalled();
        expect(alpine.initTree).toHaveBeenCalledTimes(1);
    });

    it('still replaces the component, and stops it when it goes away', () => {
        render(strict(mountOf({ component: rendered('a', 'one') })));
        const first = wire('a');
        render(strict(mountOf({ component: rendered('b', 'two') })));
        const second = wire('b');

        render(null);

        expect(alpine.destroyTree.mock.calls).toEqual([[first], [second]]);
    });

    it('mounts a lazy component once', async () => {
        const fetch = serve('<div wire:id="l">loaded</div>');
        const onLoaded = vi.fn();
        const onError = vi.fn();
        render(strict(mountOf({ component: { key: 'l', url: '/x' }, onLoaded, onError })));

        await settle();

        // The first request belongs to the effect that StrictMode cleaned up.
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(wire('l')?.textContent).toBe('loaded');
        expect(alpine.initTree).toHaveBeenCalledTimes(1);
        expect(onLoaded).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();
    });
});

// <Activity> came in React 19.2.
it.skipIf(!Activity)('keeps a component that <Activity> hides, and does not load it again', async () => {
    const fetch = serve('<div wire:id="l">loaded</div>');
    const page = (mode: 'visible' | 'hidden') =>
        createElement(Activity, { mode }, mountOf({ component: { key: 'l', url: '/x' } }));
    render(page('visible'));
    await settle();

    render(page('hidden'));
    render(page('visible'));
    await settle();

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(alpine.destroyTree).not.toHaveBeenCalled();
    expect(wire('l')?.textContent).toBe('loaded');
});

it('hydrates a server-rendered page without writing the component again', () => {
    const page = mountOf({ component: rendered('a', 'one'), className: 'p-6' });
    const server = document.createElement('div');
    server.innerHTML = renderToString(page);
    document.body.append(server);
    // Livewire can start before React hydrates.
    server.querySelector('[wire\\:id="a"]')!.textContent = 'changed by Livewire';
    const error = vi.spyOn(console, 'error');

    let hydrated!: Root;
    act(() => {
        hydrated = hydrateRoot(server, page);
    });

    expect(server.querySelector('[wire\\:id="a"]')?.textContent).toBe('changed by Livewire');
    expect(error).not.toHaveBeenCalled();
    expect(alpine.initTree).toHaveBeenCalledWith(server.firstElementChild);
    act(() => hydrated.unmount());
    server.remove();
});

it('useLivewireEvent listens while the component is mounted, with the latest callback', () => {
    const stop = vi.fn();
    livewire.on.mockReturnValue(stop);
    const Listener = ({ callback }: { callback: (detail: unknown) => void }) => {
        useLivewireEvent('saved', callback);

        return null;
    };
    const first = vi.fn();
    const second = vi.fn();

    render(createElement(Listener, { callback: first }));
    render(createElement(Listener, { callback: second }));
    const [[name, listener]] = livewire.on.mock.calls as unknown as [[string, (detail: unknown) => void]];
    listener({ id: 1 });

    expect(name).toBe('saved');
    expect(livewire.on).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledWith({ id: 1 });
    expect(first).not.toHaveBeenCalled();
    render(null);
    expect(stop).toHaveBeenCalled();
});
