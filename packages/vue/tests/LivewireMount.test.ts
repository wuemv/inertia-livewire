import { flushPromises, mount as mountVue } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';
import { LivewireMount, useLivewireEvent } from '../src';

const alpine = { initTree: vi.fn(), destroyTree: vi.fn() };
const livewire = { on: vi.fn(() => vi.fn()), dispatch: vi.fn() };

beforeEach(() => {
    window.Alpine = alpine;
    window.Livewire = livewire;
    document.dispatchEvent(new Event('livewire:initialized'));
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
});

const rendered = (key: string, text: string) => ({ key, html: `<div wire:id="${key}">${text}</div>` });

describe('a rendered component', () => {
    it('renders the HTML with the attributes and starts it', () => {
        const wrapper = mountVue(LivewireMount, { props: { component: rendered('a', 'one') }, attrs: { class: 'p-6' } });

        const host = wrapper.get('.p-6');
        expect(host.html()).toContain('<div wire:id="a">one</div>');
        expect(alpine.initTree).toHaveBeenCalledWith(host.element);
    });

    it('accepts plain HTML too', () => {
        const wrapper = mountVue(LivewireMount, { props: { html: '<div wire:id="b">two</div>' } });

        expect(wrapper.html()).toContain('<div wire:id="b">two</div>');
        expect(alpine.initTree).toHaveBeenCalledTimes(1);
    });

    it('leaves what Livewire changed alone while the key stays', async () => {
        const component = ref(rendered('a', 'one'));
        const title = ref('first');
        const wrapper = mountVue(defineComponent({
            setup: () => () => h('section', [h('h1', title.value), h(LivewireMount, { component: component.value })]),
        }));
        // Livewire updates its DOM in place.
        wrapper.get('[wire\\:id="a"]').element.textContent = 'changed by Livewire';

        // A re-render of the page passes other HTML under the same key: Vue must not write it.
        title.value = 'second';
        component.value = rendered('a', 'two');
        await nextTick();

        expect(wrapper.get('[wire\\:id="a"]').text()).toBe('changed by Livewire');
        expect(alpine.initTree).toHaveBeenCalledTimes(1);
    });

    it('replaces the component when the key changes', async () => {
        const wrapper = mountVue(LivewireMount, { props: { component: rendered('a', 'one') } });
        const old = wrapper.get('[wire\\:id="a"]').element;

        await wrapper.setProps({ component: rendered('b', 'two') });
        await nextTick();

        expect(alpine.destroyTree).toHaveBeenCalledWith(old);
        expect(wrapper.find('[wire\\:id="a"]').exists()).toBe(false);
        expect(wrapper.get('[wire\\:id="b"]').text()).toBe('two');
        expect(alpine.initTree).toHaveBeenCalledTimes(2);
    });

    it('stops the component when it goes away', () => {
        const wrapper = mountVue(LivewireMount, { props: { component: rendered('a', 'one') } });
        const child = wrapper.get('[wire\\:id="a"]').element;

        wrapper.unmount();

        expect(alpine.destroyTree).toHaveBeenCalledWith(child);
    });
});

describe('a lazy component', () => {
    it('shows the placeholder, then mounts what the URL returns', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<div wire:id="l">loaded</div>'));
        const wrapper = mountVue(LivewireMount, {
            props: { component: { key: 'l', url: '/inertia-livewire/render?c=1' } },
            slots: { placeholder: () => h('p', { class: 'loading' }, 'Loading') },
        });
        expect(wrapper.find('.loading').exists()).toBe(true);

        await flushPromises();

        expect(wrapper.find('.loading').exists()).toBe(false);
        expect(wrapper.get('[wire\\:id="l"]').text()).toBe('loaded');
        expect(alpine.initTree).toHaveBeenCalledTimes(1);
        expect(wrapper.emitted('loaded')).toHaveLength(1);
    });

    it('reports a failed request', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 403 }));
        const wrapper = mountVue(LivewireMount, { props: { component: { key: 'l', url: '/x' } } });

        await flushPromises();

        expect(wrapper.emitted('error')?.[0]?.[0]).toBeInstanceOf(Error);
        expect(alpine.initTree).not.toHaveBeenCalled();
    });

    it('drops a response that arrives after the component went away', async () => {
        let answer!: (response: Response) => void;
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise((resolve) => (answer = resolve)));
        const wrapper = mountVue(LivewireMount, { props: { component: { key: 'l', url: '/x' } } });

        wrapper.unmount();
        answer(new Response('<div wire:id="l">late</div>'));
        await flushPromises();

        expect(alpine.initTree).not.toHaveBeenCalled();
        expect(wrapper.emitted('error')).toBeUndefined();
    });
});

it('useLivewireEvent listens while the component is mounted', () => {
    const stop = vi.fn();
    livewire.on.mockReturnValue(stop);
    const callback = vi.fn();
    const wrapper = mountVue(defineComponent({
        setup() {
            useLivewireEvent('saved', callback);

            return () => h('div');
        },
    }));

    expect(livewire.on).toHaveBeenCalledWith('saved', callback);
    wrapper.unmount();
    expect(stop).toHaveBeenCalled();
});
