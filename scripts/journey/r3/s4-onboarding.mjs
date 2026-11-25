// R3 / S4 — New learner onboarding for the given language (mobile 375x812 + desktop check
// of the language step), through step 6 preview and "Bắt đầu học".
// Usage: node scripts/journey/r3/s4-onboarding.mjs fr|ja
import { open, stack, shot, lines, overflow, saveIds } from './lib3.mjs';

const lang = process.argv[2];
const l = await open('learner', { mobile: true });
const p = l.page;
const say = async (label, n = 40) => console.log(label, await lines(p, n));

await p.goto(`${stack.web}/onboarding`);
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1500);
await say('STEP1:');
console.log('language options:', await p.$$eval('label[id^=langOption-]', (els) => els.map((e) => e.innerText.replace(/\n+/g, ' / '))));
await shot(p, 'C1-onboarding-lang', 'mobile', lang);
console.log('overflow step1:', await overflow(p));

await p.check(`#langRadio-${lang}`, { force: true });
await p.click('#btnStep1Next');
await p.waitForTimeout(1000);
await say('STEP2:', 30);
await p.locator('label[id^=purposeOption-], label').filter({ hasText: 'Giao tiếp hàng ngày' }).first().click().catch(async () => {
  await p.locator('input[type=radio]').first().check({ force: true });
});
await p.click('#btnStep2Next');
await p.waitForTimeout(1000);
await p.locator('#goalOption-15, #goalOption-10').first().click().catch(() => {});
await p.click('#btnStep3Next');
await p.waitForTimeout(1000);
await say('STEP4:', 30);
await p.locator('label').filter({ hasText: 'Đời sống & Thường nhật' }).first().click().catch(async () => {
  await p.locator('input[type=checkbox]').first().check({ force: true });
});
await p.click('#btnStep4Next');
await p.waitForTimeout(1000);
await say('STEP5:', 30);
await p.locator('#optStartDefault input').check({ force: true });
await shot(p, 'C1-onboarding-level', 'mobile', lang);
// also look at the self-report level list for this language
await p.locator('#optStartSelfReport input').check({ force: true });
await p.waitForTimeout(600);
console.log('level select options:', await p.$$eval('#levelSelect option', (o) => o.map((x) => x.textContent.trim())).catch(() => '(none)'));
console.log('course select options:', await p.$$eval('#courseSelect option', (o) => o.map((x) => x.textContent.trim())).catch(() => '(single course)'));
await shot(p, 'C1-onboarding-selfreport', 'mobile', lang);
await p.locator('#optStartDefault input').check({ force: true });
await p.click('#btnStep5Preview');
await p.waitForTimeout(3000);
await say('STEP6 PREVIEW:', 50);
console.log('overflow preview:', await overflow(p));
await shot(p, 'C1-onboarding-preview', 'mobile', lang);
await p.click('#btnCompleteOnboarding');
await p.waitForTimeout(3500);
await say('RESULT:', 40);
await shot(p, 'C1-onboarding-done', 'mobile', lang);

// learner home
await p.goto(`${stack.web}/home`);
await p.waitForLoadState('networkidle');
await p.waitForTimeout(1500);
await say('HOME:', 60);
const hrefs = await p.$$eval('a', (e) => e.map((x) => x.getAttribute('href')).filter((h) => h && h !== '#'));
console.log('hrefs:', hrefs);
console.log('overflow home:', await overflow(p));
await shot(p, 'C2-home', 'mobile', lang);
const ctx = hrefs.find((h) => /^\/learn\/[0-9a-f-]{36}$/.test(h));
if (ctx) saveIds({ [`${lang}ContextId`]: ctx.split('/')[2] });
console.log('context saved:', ctx);
console.log('console errors:', l.errors);
await l.browser.close();

// desktop view of home + language step
const d = await open('learner');
await d.page.goto(`${stack.web}/home`);
await d.page.waitForLoadState('networkidle');
await d.page.waitForTimeout(1500);
console.log('HOME desktop:', await lines(d.page, 60));
await shot(d.page, 'C2-home', 'desktop', lang);
console.log('console errors desktop:', d.errors);
await d.browser.close();
