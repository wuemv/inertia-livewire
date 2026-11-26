import {
    defineComponent,
    h,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    watch,
    type PropType,
} from 'vue';
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
    html?: string;
    url?: string;
}

/**
 * Mounts a Livewire component in a Vue + Inertia page.
 *
 *   <LivewireMount :component="livewire" class="p-6" />      // { key, html } or { key, url }
 *   <LivewireMount :html="livewireHtml" />                   // plain HTML
 *
 * Livewire owns the element's content once it is in place: Vue never writes it
 * again while the key stays the same. A new key (a new render on the server)
 * stops the old component and mounts the new one. A lazy component shows the
 * `placeholder` slot until it has loaded.
 */
export const LivewireMount = defineComponent({
    name: 'LivewireMount',
    inheritAttrs: false,
    props: {
        component: { type: Object as PropType<LivewireComponent>, default: undefined },
        html: { type: String, default: undefined },
        as: { type: String, default: 'div' },
    },
    emits: {
        loaded: (_el: HTMLElement) => true,
        error: (_error: unknown) => true,
    },
    setup(props, { attrs, slots, emit }) {
        const host = ref<HTMLElement | null>(null);

        const read = (): Current => {
            if (props.component) {
                return isLazy(props.component)
                    ? { key: props.component.key, url: props.component.url }
                    : { key: props.component.key, html: props.component.html };
            }

            return { key: props.html ?? '', html: props.html ?? '' };
        };

        // Only replaced when the key changes, so Vue never rewrites what Livewire owns.
        const current = shallowRef<Current>(read());
        const loading = ref(current.value.url !== undefined);
        let request: AbortController | null = null;

        const activate = async (): Promise<void> => {
            const el = host.value;
            const shown = current.value;
            if (!el) {
                return;
            }
            if (shown.url === undefined) {
                start(el);
                emit('loaded', el);

                return;
            }
            loading.value = true;
            request = new AbortController();
            try {
                const html = await fetchComponent(shown.url, request.signal);
                if (current.value !== shown || !host.value) {
                    return;
                }
                mount(host.value, html);
                emit('loaded', host.value);
            } catch (error) {
                if (!request?.signal.aborted) {
                    emit('error', error);
                }
            } finally {
                if (current.value === shown) {
                    loading.value = false;
                }
            }
        };

        const deactivate = (): void => {
            request?.abort();
            request = null;
            if (host.value) {
                unmount(host.value);
            }
        };

        onMounted(activate);
        onBeforeUnmount(deactivate);

        watch(
            () => read().key,
            (key) => {
                if (key === current.value.key) {
                    return;
                }
                deactivate();
                current.value = read();
                loading.value = current.value.url !== undefined;
                void nextTick(activate);
            },
        );

        return () => [
            loading.value ? slots.placeholder?.() : null,
            h(props.as, {
                ...attrs,
                ref: host,
                key: current.value.key,
                // Rendered components only: lazy ones are filled in by mount().
                innerHTML: current.value.html,
            }),
        ];
    },
});
