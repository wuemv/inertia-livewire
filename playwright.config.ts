import { defineConfig } from '@playwright/test';

// The workbench app (testbench.yaml) runs Livewire for real; the page loads the
// built packages, so run `pnpm build` first.
export default defineConfig({
    testDir: 'e2e',
    use: {
        baseURL: 'http://127.0.0.1:8123',
        // A Chromium other than Playwright's own, where browsers cannot be downloaded.
        launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    },
    webServer: {
        command: 'php vendor/bin/testbench serve --port=8123',
        url: 'http://127.0.0.1:8123/e2e',
        reuseExistingServer: !process.env.CI,
    },
});
