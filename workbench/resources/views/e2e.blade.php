<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>inertia-livewire e2e</title>
    <link rel="icon" href="data:,">
    @livewireStyles
    <script type="importmap">
        { "imports": {
            "vue": "/e2e-js/vue.js",
            "@wuemv/inertia-livewire": "/e2e-js/core.js",
            "@wuemv/inertia-livewire-vue": "/e2e-js/vue-adapter.js"
        } }
    </script>
</head>
<body>
    <div id="app"></div>
    <script type="application/json" id="props">@json($props)</script>
    @livewireScripts
    <script type="module">
        import { createApp, h, ref } from 'vue';
        import { LivewireMount, useLivewireEvent } from '@wuemv/inertia-livewire-vue';

        const props = JSON.parse(document.getElementById('props').textContent);

        createApp({
            setup() {
                const which = ref('first');
                const shown = ref(true);
                const events = ref([]);
                useLivewireEvent('counted', (detail) => events.value.push(`${detail.label}:${detail.count}`));
                window.e2e = { which, shown };

                return () => h('main', [
                    shown.value ? h(LivewireMount, { component: props[which.value], class: 'host', 'data-host': 'switchable' }) : null,
                    h(LivewireMount, { component: props.lazy, class: 'host', 'data-host': 'lazy' }, {
                        placeholder: () => h('p', { class: 'placeholder' }, 'Loading'),
                    }),
                    h('ul', { id: 'events' }, events.value.map((e) => h('li', e))),
                ]);
            },
        }).mount('#app');
    </script>
</body>
</html>
