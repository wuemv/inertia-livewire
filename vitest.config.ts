import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        // Test the adapters against the core's source, not its build.
        alias: { '@wuemv/inertia-livewire': fileURLToPath(new URL('./packages/core/src/index.ts', import.meta.url)) },
    },
    test: {
        environment: 'jsdom',
        include: ['packages/*/tests/**/*.test.ts'],
    },
});
