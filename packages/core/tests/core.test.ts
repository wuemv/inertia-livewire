import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dispatch, fetchComponent, isLazy, mount, on, start, unmount } from '../src';

const alpine = { initTree: vi.fn(), destroyTree: vi.fn() };
const livewire = { on: vi.fn(() => () => {}), dispatch: vi.fn() };

beforeEach(() => {
    window.Alpine = alpine;
    window.Livewire = livewire;
    document.dispatchEvent(new Event('livewire:initialized'));
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    delete window.Alpine;
    delete window.Livewire;
});

describe('mount and unmount', () => {
    it('puts the HTML in place, then lets Alpine start the components in it', () => {
        const el = document.createElement('div');
        alpine.initTree.mockImplementation((tree: Element) => expect(tree.innerHTML).toBe('<div wire:id="a">1</div>'));

        mount(el, '<div wire:id="a">1</div>');

        expect(alpine.initTree).toHaveBeenCalledWith(el);
    });

    it('starts HTML that is already in place without writing it again', () => {
        const el = document.createElement('div');
        el.innerHTML = '<div wire:id="a">1</div>';
        const child = el.firstElementChild;

        start(el);

        expect(alpine.initTree).toHaveBeenCalledWith(el);
        expect(el.firstElementChild).toBe(child);
    });

    it('stops every component in the element, then empties it', () => {
        const el = document.createElement('div');
        el.innerHTML = '<div wire:id="a"></div><div wire:id="b"></div>';
        const [a, b] = Array.from(el.children);

        unmount(el);

        expect(alpine.destroyTree).toHaveBeenNthCalledWith(1, a);
        expect(alpine.destroyTree).toHaveBeenNthCalledWith(2, b);
        expect(el.innerHTML).toBe('');
    });
});

describe('before Livewire has started', () => {
    it('leaves the components to the start of Livewire, which goes through the whole document', async () => {
        vi.resetModules();
        const fresh = await import('../src');
        const el = document.createElement('div');

        fresh.mount(el, '<div wire:id="a"></div>');
        expect(el.innerHTML).toBe('<div wire:id="a"></div>');
        expect(alpine.initTree).not.toHaveBeenCalled();

        document.dispatchEvent(new Event('livewire:initialized'));
        fresh.start(el);
        expect(alpine.initTree).toHaveBeenCalledWith(el);
    });

    it('knows Livewire has started from its flag when the event came before this module', async () => {
        vi.resetModules();
        const fresh = await import('../src');
        expect(fresh.livewireStarted()).toBe(false);

        window.Livewire = { ...livewire, initialRenderIsFinished: true };
        expect(fresh.livewireStarted()).toBe(true);
    });
});

describe('fetchComponent', () => {
    it('fetches the HTML with the session cookie', async () => {
        const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<div>x</div>'));

        await expect(fetchComponent('/inertia-livewire/render?c=1')).resolves.toBe('<div>x</div>');
        expect(fetch).toHaveBeenCalledWith(
            '/inertia-livewire/render?c=1',
            expect.objectContaining({ credentials: 'same-origin' }),
        );
    });

    it('fails on an error status, such as an expired URL', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }));

        await expect(fetchComponent('/x')).rejects.toThrow('answered 403');
    });
});

describe('events', () => {
    it('goes through Livewire when it is loaded', () => {
        const stop = vi.fn();
        livewire.on.mockReturnValue(stop);
        const callback = vi.fn();

        expect(on('saved', callback)).toBe(stop);
        dispatch('refresh', { id: 1 });

        expect(livewire.on).toHaveBeenCalledWith('saved', callback);
        expect(livewire.dispatch).toHaveBeenCalledWith('refresh', { id: 1 });
    });

    it('still listens on window when Livewire is not loaded yet', () => {
        delete window.Livewire;
        const callback = vi.fn();
        const stop = on('saved', callback);

        window.dispatchEvent(new CustomEvent('saved', { detail: { id: 2 } }));
        stop();
        window.dispatchEvent(new CustomEvent('saved', { detail: { id: 3 } }));

        expect(callback).toHaveBeenCalledTimes(1);
        expect(callback).toHaveBeenCalledWith({ id: 2 });
    });
});

it('tells rendered and lazy components apart', () => {
    expect(isLazy({ key: 'a', url: '/x' })).toBe(true);
    expect(isLazy({ key: 'a', html: '<div></div>' })).toBe(false);
});
