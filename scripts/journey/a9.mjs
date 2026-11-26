import { open, stack, shot, text } from './lib.mjs';
for (const mobile of [false, true]) {
  const { browser, page, errors } = await open('teacher', { mobile });
  const dev = mobile ? 'mobile' : 'desktop';
  await page.goto(`${stack.admin}/my-lessons/${stack.authoringLessonId}`); await page.waitForLoadState('networkidle');
  await page.click('#btnToggleStudioMode'); await page.waitForTimeout(1500);
  console.log(dev, 'overflow-x:', await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth));
  await shot(page, 'A9-studio-preview', dev);
  if (!mobile) {
    console.log((await text(page)).slice(0, 3500));
    console.log('buttons:', await page.$$eval('button', (e) => e.map((x) => x.id + ':' + (x.innerText || x.getAttribute('aria-label') || '').trim().slice(0, 30)).filter(Boolean).slice(0, 40)));
  }
  console.log('errors', errors); await browser.close();
}
