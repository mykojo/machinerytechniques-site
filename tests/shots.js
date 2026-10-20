// Playwright sweep. No node_modules in this repo, so set NODE_PATH to a folder that has playwright.
//   NODE_PATH="<path>/node_modules" node tests/shots.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

const PAGES = ['index', 'about', 'offerings', 'contact', 'privacy'];
const root = path.join(__dirname, '..');
const outDir = path.join(__dirname, 'shots');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const fails = [];
  const check = (c, m) => { if (!c) fails.push(m); };

  for (const [w, h, name] of [[1440, 900, 'desk'], [375, 812, 'mob']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, locale: 'zh-CN' });
    for (const p of PAGES) {
      const page = await ctx.newPage();
      page.on('console', m => { if (m.type() === 'error') errs.push(`${name} ${p}: ${m.text()}`); });
      page.on('pageerror', e => errs.push(`${name} ${p}: ${e.message}`));
      await page.goto(pathToFileURL(path.join(root, p + '.html')).href, { waitUntil: 'load' });
      await page.waitForTimeout(300);
      const sw = await page.evaluate(() => document.documentElement.scrollWidth);
      check(sw === w, `${name} ${p}: scrollWidth ${sw} vs ${w}`);
      const h1 = await page.locator('h1').count();
      check(h1 === 1, `${name} ${p}: ${h1} h1`);
      await page.screenshot({ path: path.join(outDir, `${p}-${name}.png`), fullPage: true });
      console.log(name, p, 'scrollWidth', sw);

      if (name === 'mob' && p === 'index') {
        check(!(await page.locator('#menu a', { hasText: '服务' }).isVisible()), 'mob: menu closed at load');
        await page.locator('#menuBtn').click();
        check(await page.locator('#menu.open').count() === 1, 'mob: menu opens');
        check(await page.locator('#menu a', { hasText: '服务' }).isVisible(), 'mob: open menu shows 服务');
        await page.keyboard.press('Escape');
        check(await page.locator('#menu.open').count() === 0, 'mob: Escape closes menu');
      }
      if (p === 'contact') {
        const sent = [];
        page.on('request', r => { if (/^https?:/.test(r.url())) sent.push(r.url()); });
        await page.click('button[type=submit]');
        check((await page.locator('#formMsg').innerText()) === '请填写姓名、邮箱和留言。', `${name}: empty submit message`);
        await page.fill('#f-name', '测试');
        await page.fill('#f-email', 'a@b.com');
        await page.fill('#f-msg', '测试留言');
        await page.click('button[type=submit]');
        check((await page.locator('#formMsg').innerText()) === '联系表单正在接入中，请稍后再试。', `${name}: unconnected message`);
        check(sent.length === 0, `${name}: form sent ${sent.length} requests`);
      }
      await page.close();
    }

    // Learn more anchors land on the offerings row
    for (const id of ['procurement', 'iot', 'project']) {
      const page = await ctx.newPage();
      await page.goto(pathToFileURL(path.join(root, 'index.html')).href, { waitUntil: 'load' });
      await page.locator(`a.more[href="offerings.html#${id}"]`).click();
      await page.waitForLoadState('load');
      await page.waitForTimeout(700);
      check(page.url().endsWith(`offerings.html#${id}`), `${name}: Learn more ${id} url`);
      const top = await page.evaluate(i => document.getElementById(i).getBoundingClientRect().top, id);
      check(top >= 0 && top < 400, `${name}: ${id} row top ${top}`);
      await page.close();
    }
    await ctx.close();
  }

  console.log('console errors', errs.length, errs.slice(0, 8));
  console.log('failures', fails.length, fails.slice(0, 20));
  await b.close();
  process.exit(errs.length || fails.length ? 1 : 0);
})();
