import { resolve } from 'node:path';
import { build } from 'tsup';

// React has no build that a browser imports as it is (the Vue page uses an import map),
// so the React page is bundled, from the built packages like the Vue page. React's
// development build: StrictMode only runs effects twice there, as in an app's `vite dev`.
export default async function globalSetup(): Promise<void> {
    await build({
        config: false,
        entry: { 'react-page': 'e2e/pages/react.ts' },
        outDir: 'e2e/.build',
        format: 'esm',
        platform: 'browser',
        target: 'es2020',
        noExternal: [/.*/],
        dts: false,
        silent: true,
        env: { NODE_ENV: 'development' },
        esbuildOptions(options) {
            options.alias = {
                '@wuemv/inertia-livewire': resolve('packages/core/dist/index.js'),
                '@wuemv/inertia-livewire-react': resolve('packages/react/dist/index.js'),
            };
        },
    });
}
