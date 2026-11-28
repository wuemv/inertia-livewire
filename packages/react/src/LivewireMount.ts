import {
    createElement,
    Fragment,
    useEffect,
    useRef,
    useState,
    type HTMLAttributes,
    type JSX,
    type ReactElement,
    type ReactNode,
} from 'react';
import {
    fetchComponent,
    isLazy,
    mount,
    start,
    unmount,
    type LivewireComponent,
} from '@wuemv/inertia-livewire';

interface Current {
    key: string;
    url?: string;
    // Made once per key: React sees the same object on every render, so it never writes the HTML again.
    inner?: { __html: string };
}

type HostAttributes = Omit<
    HTMLAttributes<HTMLElement>,
    'children' | 'dangerouslySetInnerHTML' | 'onError' | 'placeholder'
>;

export interface LivewireMountProps extends HostAttributes {
    /** `{ key, html }` from `render()` or `Inertia::livewire()`, or `{ key, url }` from `lazy()`. */
    component?: LivewireComponent;
    /** Plain HTML instead, for HTML from elsewhere. */
    html?: string;
    /** The element, `div` by default. */
    as?: keyof JSX.IntrinsicElements;
    /** Shown while a lazy component loads. */
    placeholder?: ReactNode;
    /** Called with the element once the component is in place. */
    onLoaded?: (el: HTMLElement) => void;
    /** Called when a lazy component's request fails. */
    onError?: (error: unknown) => void;
}

function read(component: LivewireComponent | undefined, html: string | undefined): Current {
    if (component) {
        return isLazy(component)
            ? { key: component.key, url: component.url }
            : { key: component.key, inner: { __html: component.html } };
    }

    return { key: html ?? '', inner: { __html: html ?? '' } };
}

/**
 * Mounts a Livewire component in a React + Inertia page.
 *
 *   <LivewireMount component={livewire} className="p-6" />    // { key, html } or { key, url }
 *   <LivewireMount html={livewireHtml} />                      // plain HTML
 *
 * Livewire owns the element's content once it is in place: React never writes it
 * again while the key stays the same. A new key (a new render on the server)
 * stops the old component and mounts the new one. A lazy component shows
 * `placeholder` until it has loaded.
 *
 * The component stops when its element leaves the page. React's StrictMode runs
 * every effect's cleanup once more in development, and `<Activity>` runs it while
 * it hides a subtree, both with the element still in place: the component keeps
 * running through them. Restarting it would bring it back from the server's
 * snapshot, without what changed since.
 */
export function LivewireMount({
    component,
    html,
    as = 'div',
    placeholder,
    onLoaded,
    onError,
    ...attributes
}: LivewireMountProps): ReactElement {
    const host = useRef<HTMLElement | null>(null);
    // The element that holds a running component, so that running the effect again on it starts nothing.
    const filled = useRef<HTMLElement | null>(null);
    const callbacks = useRef({ onLoaded, onError });

    // Only replaced when the key changes, so React never rewrites what Livewire owns.
    const [current, setCurrent] = useState(() => read(component, html));
    // The key whose request has finished, either way.
    const [settled, setSettled] = useState<string | null>(null);
    const key = component ? component.key : (html ?? '');
    if (key !== current.key) {
        setCurrent(read(component, html));
    }

    useEffect(() => {
        callbacks.current = { onLoaded, onError };
    });

    useEffect(() => {
        const el = host.current;
        if (!el) {
            return;
        }
        const request = new AbortController();
        if (filled.current !== el) {
            if (current.url === undefined) {
                start(el);
                filled.current = el;
                callbacks.current.onLoaded?.(el);
            } else {
                const shown = current.key;
                fetchComponent(current.url, request.signal).then(
                    (loaded) => {
                        if (request.signal.aborted) {
                            return;
                        }
                        mount(el, loaded);
                        filled.current = el;
                        setSettled(shown);
                        callbacks.current.onLoaded?.(el);
                    },
                    (error: unknown) => {
                        if (request.signal.aborted) {
                            return;
                        }
                        setSettled(shown);
                        callbacks.current.onError?.(error);
                    },
                );
            }
        }

        return () => {
            request.abort();
            // React removes the element before it runs this cleanup. If it is still in the
            // document, the element stays (StrictMode, <Activity>): keep the component.
            if (!el.isConnected) {
                unmount(el);
                if (filled.current === el) {
                    filled.current = null;
                }
            }
        };
    }, [current, as]);

    const loading = current.url !== undefined && settled !== current.key;

    return createElement(
        Fragment,
        null,
        loading ? placeholder : null,
        createElement(as as string, {
            ...attributes,
            // A new key is a new element, so the old component's element leaves the page.
            key: current.key,
            ref: host,
            // Livewire can start, and change the HTML, before React hydrates a server-rendered page.
            suppressHydrationWarning: true,
            // Rendered components only: lazy ones are filled in by mount().
            dangerouslySetInnerHTML: current.inner,
        }),
    );
}
