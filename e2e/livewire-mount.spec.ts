import { expect, test, type Page } from '@playwright/test';

const host = (page: Page, name: string) => page.locator(`[data-host="${name}"]`);

test.beforeEach(async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    test.info().annotations.push({ type: 'errors', description: 'collected' });
    (page as Page & { errors: string[] }).errors = errors;
    await page.goto('/e2e');
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

test('Livewire events reach Vue', async ({ page }) => {
    await host(page, 'switchable').getByRole('button', { name: 'first +' }).click();

    await expect(page.locator('#events li')).toHaveText(['first:2']);
});

test('a new key replaces the component, and the old one stops', async ({ page }) => {
    await page.evaluate(() => (window as any).e2e.which.value = 'second');

    const counter = host(page, 'switchable');
    await expect(counter.locator('.counter')).toHaveAttribute('data-label', 'second');
    await expect(counter.locator('output')).toHaveText('10');
    await counter.getByRole('button', { name: 'second +' }).click();
    await expect(counter.locator('output')).toHaveText('11');

    // Only the second counter and the lazy one are left in Livewire.
    const names = await page.evaluate(() => (window as any).Livewire.all().map((c: any) => c.$wire.label).sort());
    expect(names).toEqual(['lazy', 'second']);
});

test('unmounting stops the component', async ({ page }) => {
    await expect(host(page, 'lazy').locator('output')).toHaveText('100');
    await page.evaluate(() => (window as any).e2e.shown.value = false);

    await expect(host(page, 'switchable')).toHaveCount(0);
    const names = await page.evaluate(() => (window as any).Livewire.all().map((c: any) => c.$wire.label));
    expect(names).toEqual(['lazy']);
});

test('a lazy component loads through its signed URL and runs', async ({ page }) => {
    const lazy = host(page, 'lazy');
    await expect(lazy.locator('output')).toHaveText('100');
    await expect(page.locator('.placeholder')).toHaveCount(0);

    await lazy.getByRole('button', { name: 'lazy +' }).click();
    await expect(lazy.locator('output')).toHaveText('101');
});
