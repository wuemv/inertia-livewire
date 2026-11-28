// The React page of the end-to-end tests, bundled by global-setup.ts: the same page as
// the Vue one (workbench/resources/views/e2e.blade.php), in StrictMode, as Laravel's
// React starter kit renders its app.
import { createElement as h, StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LivewireMount, useLivewireEvent, type LivewireComponent } from '@wuemv/inertia-livewire-react';

type Name = 'first' | 'second';
const props = JSON.parse(document.getElementById('props')!.textContent!) as Record<Name | 'lazy', LivewireComponent>;

function Page() {
    const [which, setWhich] = useState<Name>('first');
    const [shown, setShown] = useState(true);
    const [events, setEvents] = useState<string[]>([]);
    useLivewireEvent<{ label: string; count: number }>('counted', ({ label, count }) =>
        setEvents((all) => [...all, `${label}:${count}`]),
    );
    useEffect(() => {
        (window as any).e2e = { switchTo: setWhich, hide: () => setShown(false) };
    }, []);

    return h(
        'main',
        null,
        shown ? h(LivewireMount, { component: props[which], className: 'host', ...{ 'data-host': 'switchable' } }) : null,
        h(LivewireMount, {
            component: props.lazy,
            className: 'host',
            ...{ 'data-host': 'lazy' },
            placeholder: h('p', { className: 'placeholder' }, 'Loading'),
        }),
        h('ul', { id: 'events' }, events.map((event, index) => h('li', { key: index }, event))),
    );
}

createRoot(document.getElementById('app')!).render(h(StrictMode, null, h(Page)));
