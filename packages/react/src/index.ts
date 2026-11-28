import { useEffect, useRef } from 'react';
import { on } from '@wuemv/inertia-livewire';

export { LivewireMount, type LivewireMountProps } from './LivewireMount';
export { dispatch, on } from '@wuemv/inertia-livewire';
export type { LazyComponent, LivewireComponent, RenderedComponent } from '@wuemv/inertia-livewire';

/**
 * Listens to a Livewire event while the calling component is mounted.
 *
 *   useLivewireEvent('saved', ({ id }) => router.reload({ only: ['items'] }))
 *
 * The callback can change from one render to the next: the latest one is called.
 */
export function useLivewireEvent<T = any>(name: string, callback: (detail: T) => void): void {
    const latest = useRef(callback);
    useEffect(() => {
        latest.current = callback;
    });
    useEffect(() => on<T>(name, (detail) => latest.current(detail)), [name]);
}
