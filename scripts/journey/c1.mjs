import { open, stack, shot, text } from './lib.mjs';
for (const mobile of [false, true]) {
  const l = await open('learner', { mobile });
  await l.page.goto(`${stack.web}/home`); await l.page.waitForLoadState('networkidle'); await l.page.waitForTimeout(1500);
  const dev = mobile ? 'mobile' : 'desktop';
  console.log('==', dev, l.page.url());
  console.log((await text(l.page)).slice(0, 1600));
  console.log(await l.page.$$eval('a', (e) => e.map((x) => x.getAttribute('href')).filter((h) => h && h !== '#')));
  console.log('overflow', await l.page.evaluate(() => document.documentElement.scrollWidth > innerWidth));
  await shot(l.page, 'C2-home', dev); console.log('errors', l.errors); await l.browser.close();
}
