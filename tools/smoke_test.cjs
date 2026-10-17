// Run with Playwright installed and the website served on port 8000.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = ['index.html', ...['services', 'products'].flatMap(dir => fs.readdirSync(path.join(root, dir)).filter(f => f.endsWith('.html')).map(f => `${dir}/${f}`))];
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:8000/';
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox']});
  try {
    const page = await browser.newPage({reducedMotion: 'reduce'});
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => {if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);});
    let layouts = 0;
    for (const file of pages) {
      await page.goto(base + file);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('h1').count(), 1, file);
      const badLinks = await page.locator('a[href]').evaluateAll(links => links.filter(a => a.origin === location.origin && a.pathname === location.pathname && a.hash && !document.getElementById(decodeURIComponent(a.hash.slice(1)))).map(a => a.href));
      assert.deepEqual(badLinks, [], `Missing anchor: ${file}`);
      for (const width of [320,360,390,540,650,768,900,901,1024,1280,1440,1920]) {
        await page.setViewportSize({width,height:900});
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Overflow: ${file} at ${width}`);
        layouts++;
      }
      if (file.startsWith('products/')) {
        const tabs = page.getByRole('tab');
        await tabs.first().focus();
        await page.keyboard.press('End');
        assert.equal(await tabs.last().getAttribute('aria-selected'), 'true');
        assert.equal(await page.getByRole('tabpanel').count(), 1);
        await page.keyboard.press('Home');
        assert.equal(await tabs.first().getAttribute('aria-selected'), 'true');
      }
      if (file !== 'index.html') assert.notEqual(await page.locator('#service').inputValue(), '');
    }
    await page.goto(base);
    await page.setViewportSize({width:390,height:844});
    await page.locator('.menu-toggle').click();
    await page.locator('[aria-controls="service-submenu"]').click();
    await page.locator('#service-submenu a').first().click();
    await page.waitForURL('**/services/tax-accounting.html');
    assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'), 'false');
    await page.evaluate(() => {window.open = url => {window.testOpenedUrl = url; return null;};});
    await page.locator('#name').fill('समीर & Team');
    await page.locator('#phone').fill('123');
    assert.equal(await page.locator('#phone').evaluate(el => el.checkValidity()), false);
    await page.locator('#phone').fill('+91 98765 43210');
    await page.locator('#message').fill('GST और website के बारे में बताइए');
    await page.locator('.form-submit').click();
    const url = new URL(await page.evaluate(() => window.testOpenedUrl));
    assert.equal(url.hostname, 'wa.me');
    assert.equal(url.pathname, '/917048544134');
    assert.match(url.searchParams.get('text'), /समीर & Team/);
    assert.match(url.searchParams.get('text'), /GST और website/);
    assert.equal(await page.locator('#form-status a').getAttribute('href'), url.href);
    assert.deepEqual(errors, []);
    console.log(`PASS: ${pages.length} pages, ${layouts} responsive layouts, anchors, mobile navigation, keyboard tabs, form validation and WhatsApp message preparation. No message sent.`);
    if (process.env.SCREENSHOT_DIR) {
      fs.mkdirSync(process.env.SCREENSHOT_DIR,{recursive:true});
      await page.goto(base);
      await page.setViewportSize({width:1440,height:1050});
      await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'desktop.png')});
      await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'homepage-full.png'),fullPage:true});
      await page.setViewportSize({width:390,height:844});
      await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'mobile.png'),fullPage:true});
      await page.goto(base+'products/tuition-manager.html');
      await page.setViewportSize({width:1440,height:1000});
      await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,'product.png'),fullPage:true});
    }
  } finally {await browser.close();}
})().catch(error => {console.error(error);process.exitCode=1;});
