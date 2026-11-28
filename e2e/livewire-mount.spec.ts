import { expect, test, type Page } from '@playwright/test';

const host = (page: Page, name: string) => page.locator(`[data-host="${name}"]`);
const running = (page: Page) =>
    page.evaluate(() => (window as any).Livewire.all().map((c: any) => c.$wire.label).sort());

// The same page in each adapter. The React one runs in StrictMode, with React's
// development build: every effect is cleaned up and run again once on mount.
for (const [adapter, path] of [['Vue', '/e2e'], ['React', '/e2e-react']] as const) {
    test.describe(adapter, () => {
        test.beforeEach(async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', (error) => errors.push(error.message));
            page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
            (page as Page & { errors: string[] }).errors = errors;
            await page.goto(path);
        });

        test.afterEach(async ({ page }) => {
            expect((page as Page & { errors: string[] }).errors).toEqual([]);
        });

        test('a rendered component runs: clicks reach the server and update it in place', async ({ page }) => {
            const counter = host(page, 'switchable');
            await expect(counter.locator('output')).toHaveText('1');

            await counter.getByRole('button', { name: 'first +' }).click();
            await expect(counter.locator('output')).toHaveText('2');
            await counter.getByRole('button', { name: 'first +' }).click();
            await expect(counter.locator('output')).toHaveText('3');
        });

        test('each component starts once', async ({ page }) => {
            await expect(host(page, 'lazy').locator('output')).toHaveText('100');

            expect(await running(page)).toEqual(['first', 'lazy']);
        });

        test(`Livewire events reach ${adapter}`, async ({ page }) => {
            await host(page, 'switchable').getByRole('button', { name: 'first +' }).click();

            await expect(page.locator('#events li')).toHaveText(['first:2']);
        });

        test('a new key replaces the component, and the old one stops', async ({ page }) => {
            await expect(host(page, 'switchable').locator('output')).toHaveText('1');
            await page.evaluate(() => (window as any).e2e.switchTo('second'));

            const counter = host(page, 'switchable');
            await expect(counter.locator('.counter')).toHaveAttribute('data-label', 'second');
            await expect(counter.locator('output')).toHaveText('10');
            await counter.getByRole('button', { name: 'second +' }).click();
            await expect(counter.locator('output')).toHaveText('11');

            // Only the second counter and the lazy one are left in Livewire.
            expect(await running(page)).toEqual(['lazy', 'second']);
        });

        test('unmounting stops the component', async ({ page }) => {
            await expect(host(page, 'lazy').locator('output')).toHaveText('100');
            await page.evaluate(() => (window as any).e2e.hide());

            await expect(host(page, 'switchable')).toHaveCount(0);
            expect(await running(page)).toEqual(['lazy']);
        });

        test('a lazy component loads through its signed URL and runs', async ({ page }) => {
            const lazy = host(page, 'lazy');
            await expect(lazy.locator('output')).toHaveText('100');
            await expect(page.locator('.placeholder')).toHaveCount(0);

            await lazy.getByRole('button', { name: 'lazy +' }).click();
            await expect(lazy.locator('output')).toHaveText('101');
        });
    });
}
