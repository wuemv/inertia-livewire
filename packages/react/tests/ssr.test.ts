// @vitest-environment node
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LivewireMount } from '../src';

describe('server-side rendering', () => {
    it('renders the component into the page, with the attributes', () => {
        const html = renderToString(
            createElement(LivewireMount, { component: { key: 'a', html: '<div wire:id="a">5</div>' }, className: 'p-6' }),
        );

        expect(html).toBe('<div class="p-6"><div wire:id="a">5</div></div>');
    });

    it('renders the placeholder of a lazy component', () => {
        const html = renderToString(
            createElement(LivewireMount, {
                component: { key: 'l', url: '/x' },
                placeholder: createElement('p', null, 'Loading'),
            }),
        );

        expect(html).toBe('<p>Loading</p><div></div>');
    });
});
