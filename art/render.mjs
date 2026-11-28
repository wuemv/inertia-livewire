// Renders art/banner.html into the README banners (dark, light) and GitHub's social
// preview: `node art/render.mjs`, after `pnpm install`. The fonts come from Google Fonts.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const images = [
    { file: 'banner-dark.png', theme: 'dark', width: 1280, height: 512, scale: 2 },
    { file: 'banner-light.png', theme: 'light', width: 1280, height: 512, scale: 2 },
    // GitHub's social preview: 1280 × 640, under 1 MB. Settings → General → Social preview.
    { file: 'social-preview.png', theme: 'dark', width: 1280, height: 640, scale: 1 },
];

const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
for (const { file, theme, width, height, scale } of images) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale });
    await page.goto(new URL('banner.html', import.meta.url).href);
    await page.evaluate((name) => (document.body.className = name), theme);
    await page.evaluate(() => document.fonts.ready);
    const missing = await page.evaluate(() =>
        ['Instrument Sans', 'JetBrains Mono'].filter((font) => !document.fonts.check(`16px "${font}"`)),
    );
    if (missing.length > 0) {
        throw new Error(`Fonts did not load: ${missing.join(', ')}`);
    }
    await page.screenshot({ path: fileURLToPath(new URL(file, import.meta.url)) });
    await page.close();
    console.log(`art/${file}`);
}
await browser.close();
