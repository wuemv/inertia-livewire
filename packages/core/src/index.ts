/**
 * The shared core of the Inertia adapters: put a server-rendered Livewire
 * component into an element, start it, and tear it down again.
 *
 * Livewire's runtime (and the Alpine that comes with it) is loaded once, by
 * @livewireScripts in the Inertia root template. Nothing here starts Livewire
 * itself: starting it twice breaks it. Instead, `Alpine.initTree()` starts the
 * components in a subtree, and `Alpine.destroyTree()` stops them.
 */

/** A component rendered on the server, from `InertiaLivewire::render()` or `Inertia::livewire()`. */
export interface RenderedComponent {
    key: string;
    html: string;
}

/** A component the browser fetches, from `InertiaLivewire::lazy()`. */
export interface LazyComponent {
    key: string;
    url: string;
}

export type LivewireComponent = RenderedComponent | LazyComponent;

interface Alpine {
    initTree(el: Element): void;
    destroyTree(el: Element): void;
}

interface Livewire {
    on(name: string, callback: (detail: any) => void): () => void;
    dispatch(name: string, params?: Record<string, unknown>): void;
    initialRenderIsFinished?: boolean;
}

declare global {
    interface Window {
        Alpine?: Alpine;
        Livewire?: Livewire;
    }
}

let warned = false;

// Livewire starts on DOMContentLoaded (or when the app calls Livewire.start()), and
// only from then does Alpine.initTree() start its components. A page's module
// scripts run before that, so a component mounted then must wait: Livewire's own
// start goes through the whole document, and starts it with the rest.
let started = false;
if (typeof document !== 'undefined') {
    document.addEventListener('livewire:initialized', () => (started = true), { once: true });
}

/** Whether Livewire has started, so that components added now have to be started by us. */
export function livewireStarted(): boolean {
    return started || (typeof window !== 'undefined' && window.Livewire?.initialRenderIsFinished === true);
}

function runtime(): { alpine?: Alpine; livewire?: Livewire } {
    if (typeof window === 'undefined') {
        return {};
    }
    if (!window.Alpine && !warned) {
        warned = true;
        console.warn(
            '[inertia-livewire] Livewire is not loaded: add @livewireStyles and @livewireScripts to the Inertia root template.',
        );
    }

    return { alpine: window.Alpine, livewire: window.Livewire };
}

export function isLazy(component: LivewireComponent): component is LazyComponent {
    return typeof (component as LazyComponent).url === 'string';
}

/**
 * Starts the components in an element whose HTML is already in place (rendered by a
 * template, or on the server). Before Livewire has started, it leaves them to it.
 */
export function start(el: Element): void {
    const { alpine } = runtime();
    if (alpine && livewireStarted()) {
        alpine.initTree(el);
    }
}

/** Puts a component's HTML into an element and starts it. */
export function mount(el: Element, html: string): void {
    el.innerHTML = html;
    start(el);
}

/** Stops the components in an element and empties it. */
export function unmount(el: Element): void {
    const { alpine } = runtime();
    for (const child of Array.from(el.children)) {
        alpine?.destroyTree(child);
    }
    el.replaceChildren();
}

/** Fetches a lazy component's HTML from its signed URL. */
export async function fetchComponent(url: string, signal?: AbortSignal): Promise<string> {
    const response = await fetch(url, {
        credentials: 'same-origin',
        headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest' },
        signal,
    });
    if (!response.ok) {
        throw new Error(`[inertia-livewire] ${url} answered ${response.status}`);
    }

    return response.text();
}

/**
 * Listens to an event that a Livewire component dispatches (`$this->dispatch('saved')`).
 * Returns the function that stops listening.
 */
export function on<T = any>(name: string, callback: (detail: T) => void): () => void {
    const { livewire } = runtime();
    if (livewire) {
        return livewire.on(name, callback);
    }
    if (typeof window === 'undefined') {
        return () => {};
    }
    const listener = (event: Event) => callback((event as CustomEvent<T>).detail);
    window.addEventListener(name, listener);

    return () => window.removeEventListener(name, listener);
}

/** Dispatches an event to Livewire components (`#[On('refresh')]`). */
export function dispatch(name: string, params: Record<string, unknown> = {}): void {
    runtime().livewire?.dispatch(name, params);
}
