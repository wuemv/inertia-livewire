// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { LivewireMount } from '../src';

describe('server-side rendering', () => {
    it('renders the component into the page, with the attributes', async () => {
        const app = createSSRApp({
            render: () => h(LivewireMount, { component: { key: 'a', html: '<div wire:id="a">5</div>' }, class: 'p-6' }),
        });

        const html = await renderToString(app);

        expect(html).toContain('class="p-6"');
        expect(html).toContain('<div wire:id="a">5</div>');
    });

    it('renders the placeholder of a lazy component', async () => {
        const app = createSSRApp({
            render: () => h(LivewireMount, { component: { key: 'l', url: '/x' } }, { placeholder: () => h('p', 'Loading') }),
        });

        expect(await renderToString(app)).toContain('<p>Loading</p>');
    });
});
