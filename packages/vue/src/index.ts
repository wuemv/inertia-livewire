import { onBeforeUnmount, onMounted } from 'vue';
import { on } from '@wuemv/inertia-livewire';

export { LivewireMount } from './LivewireMount';
export { dispatch, on } from '@wuemv/inertia-livewire';
export type { LazyComponent, LivewireComponent, RenderedComponent } from '@wuemv/inertia-livewire';

/**
 * Listens to a Livewire event while the calling component is mounted.
 *
 *   useLivewireEvent('saved', ({ id }) => router.reload({ only: ['items'] }))
 */
export function useLivewireEvent<T = any>(name: string, callback: (detail: T) => void): void {
    let stop: (() => void) | undefined;
    onMounted(() => {
        stop = on<T>(name, callback);
    });
    onBeforeUnmount(() => stop?.());
}
