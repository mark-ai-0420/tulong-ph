import http from 'node:http';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import assert from 'node:assert';

async function probePort(p) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${p}`, { timeout: 1000 }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve(data.includes('TulongPH') || data.includes('tulong-ph'));
      });
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

async function waitForPageConditionWithNodePolling(page, predicate, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await page.evaluate(predicate)) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out after ${timeoutMs}ms waiting for a page condition`);
}

async function assertPrivacyControls(page) {
  const invalid = await page.locator('form, input, select, textarea').evaluateAll(elements =>
    elements.filter(el => el.getAttribute('autocomplete') !== 'off').map(el => el.id || el.tagName));
  assert.deepEqual(invalid, [], `Every workflow control explicitly disables autocomplete: ${JSON.stringify(invalid)}`);
}

async function assertNoOverflow(page) {
  const sizes = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
  assert.ok(sizes.content <= sizes.width, `Content ${sizes.content}px exceeds viewport ${sizes.width}px`);
}

async function assertStepCardLayout(page, route, step) {
  const layout = await page.evaluate(({ expectedRoute, expectedStep }) => {
    const form = document.querySelector('form');
    const headings = [...(form?.querySelectorAll('h2') ?? [])];
    const heading = headings.find(item => item.tabIndex === -1 && !item.textContent?.includes('sample profile'))
      ?? headings.find(item => !item.textContent?.includes('sample profile'));
    const banners = [...(form?.querySelectorAll('section') ?? [])].filter(section =>
      [...section.querySelectorAll('h2')].some(title => title.closest('section') === section && /Subukan ang sample profile|Try a sample profile/.test(title.textContent ?? '')));
    if (expectedRoute === '/' && expectedStep === 3) {
      const search = document.querySelector('#roadmap-search');
      const roadmapContainer = search?.closest('div.space-y-6');
      const heading = roadmapContainer?.querySelector('h2');
      const subtitle = heading?.nextElementSibling;
      const reductionSummary = [...(roadmapContainer?.querySelectorAll('*') ?? [])]
        .find(node => node.children.length === 0 && node.textContent?.trim() === 'Estimated Bill Reduction');
      const searchCard = search && heading && subtitle && reductionSummary && [...(function* () {
        for (let node = search.parentElement; node; node = node.parentElement) yield node;
      })()].find(node => {
        const style = getComputedStyle(node);
        return node.contains(heading) && subtitle.tagName === 'P' && node.contains(subtitle)
          && node.contains(reductionSummary)
          && style.backgroundColor === 'rgb(255, 255, 255)'
          && parseFloat(style.borderTopWidth) >= 1
          && parseFloat(style.borderTopLeftRadius) >= 12
          && parseFloat(style.paddingTop) >= 24;
      });
      return {
        error: !search || !roadmapContainer || !heading || !subtitle || subtitle.tagName !== 'P' || !reductionSummary || !searchCard
          ? 'Medical Step 3 heading, subtitle, reduction summary and search must share a white roadmap card' : '',
        bannerCount: banners.length,
        card: searchCard ? {
          background: getComputedStyle(searchCard).backgroundColor,
          border: getComputedStyle(searchCard).borderTopWidth,
          radius: getComputedStyle(searchCard).borderTopLeftRadius,
          padding: getComputedStyle(searchCard).paddingTop,
        } : null,
      };
    }
    if (!form || !heading) return { error: 'No active wizard heading found', bannerCount: banners.length };
    const subtitle = heading.nextElementSibling;
    const banner = banners[0];
    if (!subtitle || subtitle.tagName !== 'P') return { error: 'Expected one subtitle after the active heading', bannerCount: banners.length };
    if (expectedRoute === '/' && expectedStep === 2) {
      const followingBody = subtitle.nextElementSibling ?? heading.parentElement?.nextElementSibling;
      const style = getComputedStyle(form);
      const nodes = [...form.querySelectorAll('*')];
      return {
        error: '',
        bannerCount: banners.length,
        order: [heading, subtitle, followingBody].map(node => node ? nodes.indexOf(node) : -1),
        card: { background: style.backgroundColor, border: style.borderTopWidth, radius: style.borderTopLeftRadius, padding: style.paddingTop },
        hasControls: Boolean(form.querySelector('input, select, textarea')),
        hasLiveBreakdown: Boolean(form.querySelector('[aria-live="polite"]')),
        hasBack: [...form.querySelectorAll('button')].some(button => /Bumalik|Back/.test(button.textContent ?? '')),
        hasSubmit: Boolean(form.querySelector('button[type="submit"]')),
      };
    }
    if (banners.length !== 1) return { error: 'Expected one sample banner', bannerCount: banners.length };
    const ancestors = [];
    for (let node = heading.parentElement; node && node !== form.parentElement; node = node.parentElement) ancestors.push(node);
    const card = ancestors.find(node => {
      const style = getComputedStyle(node);
      return node.contains(subtitle) && node.contains(banner)
        && style.backgroundColor === 'rgb(255, 255, 255)'
        && parseFloat(style.borderTopWidth) >= 1
        && parseFloat(style.borderTopLeftRadius) >= 12
        && parseFloat(style.paddingTop) >= 24;
    });
    if (!card || !card.contains(banner)) return { error: 'Heading, subtitle and sample banner do not share a white card', bannerCount: banners.length };
    const followingBody = [...card.children].find(child => child !== banner && banner.compareDocumentPosition(child) & Node.DOCUMENT_POSITION_FOLLOWING);
    const order = [heading, subtitle, banner, followingBody].map(node => node ? [...form.querySelectorAll('*')].indexOf(node) : -1);
    const backButtons = [...card.querySelectorAll('button')].filter(button => /Bumalik|Back/.test(button.textContent ?? ''));
    return {
      order,
      bannerCount: banners.length,
      noFloatingBanner: banners.every(item => card.contains(item)),
      card: {
        background: getComputedStyle(card).backgroundColor,
        border: getComputedStyle(card).borderTopWidth,
        radius: getComputedStyle(card).borderTopLeftRadius,
        padding: getComputedStyle(card).paddingTop,
      },
      hasControls: Boolean(card.querySelector('input, select, textarea')),
      hasSubmit: Boolean(card.querySelector('button[type="submit"]')),
      hasBack: backButtons.length > 0,
      hasLiveRegion: Boolean(card.querySelector('[aria-live="polite"]')),
      hasSummary: Boolean(card.querySelector('[role="status"], [data-testid="worker-maternity-total"], [data-testid="worker-sickness-total"], [data-testid="education-primary"]'))
        || /programs to ask about|programang maaaring itanong/.test(card.textContent ?? ''),
    };
  }, { expectedRoute: route, expectedStep: step });
  assert.ok(!layout.error, `${route} step ${step}: ${layout.error ?? ''}`);
  if (route === '/' && step === 3) {
    assert.equal(layout.bannerCount, 0, `${route} step ${step}: medical roadmap has no sample banner`);
    assert.equal(layout.card.background, 'rgb(255, 255, 255)', `${route} step ${step}: medical roadmap card has a white surface`);
    assert.ok(parseFloat(layout.card.border) >= 1 && parseFloat(layout.card.radius) >= 12 && parseFloat(layout.card.padding) >= 24,
      `${route} step ${step}: roadmap card has a visible border, rounded corners and padding`);
    return;
  }
  if (route === '/' && step === 2) {
    assert.equal(layout.bannerCount, 0, `${route} step ${step}: medical intake has no sample banner`);
    assert.ok(layout.order[0] < layout.order[1] && layout.order[1] < layout.order[2], `${route} step ${step}: heading, subtitle and body are in DOM order`);
    assert.equal(layout.card.background, 'rgb(255, 255, 255)');
    assert.ok(parseFloat(layout.card.border) >= 1 && parseFloat(layout.card.radius) >= 12 && parseFloat(layout.card.padding) >= 24, `${route} step ${step}: card has a visible white surface, border, radius and padding`);
    assert.ok(layout.hasControls && layout.hasLiveBreakdown && layout.hasBack && layout.hasSubmit, `${route} step ${step}: card contains controls, live breakdown, Back and submit`);
    return;
  }
  assert.ok(layout.order[0] < layout.order[1] && layout.order[1] < layout.order[2] && layout.order[2] < layout.order[3], `${route} step ${step}: title, subtitle, banner and body must be in DOM order`);
  assert.equal(layout.bannerCount, 1, `${route} step ${step}: one sample banner is rendered`);
  assert.ok(layout.noFloatingBanner, `${route} step ${step}: no sample banner floats above its card`);
  assert.equal(layout.card.background, 'rgb(255, 255, 255)');
  assert.ok(parseFloat(layout.card.border) >= 1 && parseFloat(layout.card.radius) >= 12 && parseFloat(layout.card.padding) >= 24, `${route} step ${step}: card has a visible white surface, border, radius and padding`);
  if (step < 3) {
    assert.ok(layout.hasControls && layout.hasSubmit, `${route} step ${step}: card contains active controls and submit`);
    if (step === 2 || route === '/manggagawa') assert.ok(layout.hasBack, `${route} step ${step}: card contains Back`);
    if (route === '/edukasyon' || step === 2) assert.ok(layout.hasLiveRegion, `${route} step ${step}: card contains the live preview`);
  } else if (route === '/edukasyon') assert.ok(layout.hasLiveRegion, `${route} step ${step}: summary contains a live region`);
  else assert.ok(layout.hasSummary, `${route} step ${step}: summary contains a status badge or program count`);
}

async function assertLocationHierarchy(page, prefix) {
  await page.fill(`#${prefix}-province`, 'Cavite');
  const cities = await page.locator(`#${prefix}-city-options option`).evaluateAll(options => options.map(option => option.value));
  assert.equal(cities.length, 23);
  assert.ok(cities.includes('Indang'));
  await page.fill(`#${prefix}-city`, 'Indang');
  const barangays = await page.locator(`#${prefix}-barangay-options option`).evaluateAll(options => options.map(option => option.value));
  assert.equal(barangays.length, 36);
  assert.ok(barangays.includes('Daine I'));
  await page.fill(`#${prefix}-barangay`, 'Daine 1');
  assert.equal(await page.inputValue(`#${prefix}-barangay`), 'Daine I');
  const order = await page.locator(`#${prefix}-province, #${prefix}-city, #${prefix}-barangay`).evaluateAll(elements => elements.map(element => element.id));
  assert.deepEqual(order, [`${prefix}-province`, `${prefix}-city`, `${prefix}-barangay`]);
  await page.fill(`#${prefix}-province`, 'Laguna');
  assert.equal(await page.inputValue(`#${prefix}-city`), '');
  assert.equal(await page.inputValue(`#${prefix}-barangay`), '');
  assert.equal(await page.locator(`#${prefix}-barangay-options option`).count(), 0);
  await page.getByRole('button', { name: 'Cavite → Indang → Daine I', exact: true }).click();
  assert.equal(await page.inputValue(`#${prefix}-province`), 'Cavite');
  assert.equal(await page.inputValue(`#${prefix}-city`), 'Indang');
  assert.equal(await page.inputValue(`#${prefix}-barangay`), 'Daine I');
}

async function assertSchoolQuestionFilter(page) {
  for (const id of ['edu-incoming', 'edu-priority-course', 'edu-stem-rank', 'edu-dost-school', 'edu-return-service', 'edu-licensure', 'edu-no-suc', 'edu-top10', 'edu-daily-wage', 'edu-training-days', 'edu-nc3', 'edu-coconut-course']) {
    assert.equal(await page.locator(`#${id}`).count(), 0, `${id} is excluded from JHS/SHS`);
  }
  for (const id of ['edu-income', 'edu-age', 'edu-other-award', 'edu-4ps', 'edu-pwd', 'edu-solo-parent', 'edu-owwa', 'edu-coconut', 'edu-gsis', 'edu-crisis']) assert.ok(await page.locator(`#${id}`).isVisible());
}

async function checkPacket(page, kind) {
  await assertPrivacyControls(page);
  await assertNoOverflow(page);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: kind === 'education' ? 'I-download ang PDF (English)' : 'Download PDF', exact: true }).click();
  const download = await downloadPromise;
  assert.equal(await download.failure(), null, 'Local jsPDF export succeeds');
  assert.ok(download.suggestedFilename().endsWith('.pdf'));
  await download.saveAs(`/private/tmp/tulongph-${kind}-export.pdf`);
  await page.emulateMedia({ media: 'print' });
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `/private/tmp/tulongph-${kind}-print.png` });
  assert.equal(await page.locator('header').isVisible(), false, 'Navigation is absent from low-ink print');
  assert.equal(await page.locator('footer').isVisible(), false, 'Shared footer is absent from low-ink print');
  const pdf = await page.pdf({ format: 'A4', path: `/private/tmp/tulongph-${kind}-native.pdf` });
  assert.ok(pdf.length > 1000, 'Native printable packet renders into PDF');
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 375, height: 812 });
}

async function runCivicPillarTests(browser, baseUrl) {
  console.log('\n[Civic expansion] Education, worker, print, mobile privacy and inactivity...');
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, acceptDownloads: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${baseUrl}/edukasyon`);
  await page.waitForSelector('#edu-level');
  await assertPrivacyControls(page); await assertNoOverflow(page);
  await page.getByRole('button', { name: 'Sample: TESDA Tech-Voc', exact: true }).click();
  assert.equal(await page.inputValue('#edu-level'), 'tvet');
  await page.getByRole('button', { name: 'Sample: DOST / CHED Honor (96%)', exact: true }).click();
  assert.equal(await page.inputValue('#edu-gwa'), '96');
  await page.getByRole('button', { name: 'Sample: State Univ (SUC) 4Ps', exact: true }).click();
  assert.equal(await page.inputValue('#edu-school-type'), 'suc_luc');
  await page.getByRole('button', { name: 'Sample: Private SHS NCR', exact: true }).click();
  assert.equal(await page.inputValue('#edu-level'), 'shs');
  assert.equal(await page.inputValue('#edu-tuition'), '30000');
  await page.getByRole('button', { name: 'JHS', exact: true }).click();
  assert.equal(await page.inputValue('#edu-year'), '7');
  await page.getByRole('button', { name: 'SHS', exact: true }).click();
  assert.equal(await page.inputValue('#edu-year'), '11');
  await page.getByRole('button', { name: 'Private', exact: true }).click();
  assert.equal(await page.inputValue('#edu-school-type'), 'private');
  await assertLocationHierarchy(page, 'edu');
  assert.equal(await page.inputValue('#edu-location'), 'other');
  await page.getByRole('button', { name: 'Cebu City (Region VII)', exact: true }).click();
  assert.equal(await page.inputValue('#edu-location'), 'HUC');
  await page.getByRole('button', { name: 'Quezon City (NCR)', exact: true }).click();
  await page.getByRole('button', { name: '₱50,000', exact: true }).click();
  assert.equal(await page.inputValue('#edu-tuition'), '50000');
  await assertNoOverflow(page);
  await page.selectOption('#edu-level', 'shs');
  await page.selectOption('#edu-school-type', 'private');
  await page.selectOption('#edu-location', 'NCR');
  await page.fill('#edu-tuition', '30000');
  await page.check('#edu-school-participates');
  await page.selectOption('#edu-voucher-category', 'public_jhs');
  assert.ok((await page.getByTestId('education-relief').innerText()).includes('22,500'));
  assert.ok((await page.getByTestId('education-balance').innerText()).includes('7,500'));
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  await assertPrivacyControls(page); await assertNoOverflow(page);
  await assertSchoolQuestionFilter(page);
  await page.getByRole('button', { name: 'Sample: State Univ (SUC) 4Ps', exact: true }).click();
  assert.ok(await page.locator('#edu-daily-wage').isVisible(), 'Sample on Step 2 stays on Step 2');
  await page.getByRole('button', { name: 'Sample: TESDA Tech-Voc', exact: true }).click();
  assert.ok(await page.locator('#edu-training-days').isVisible());
  assert.ok(await page.locator('#edu-nc3').isVisible());
  assert.equal(await page.locator('#edu-incoming').count(), 0);
  await page.getByRole('button', { name: 'Sample: Private SHS NCR', exact: true }).click();
  await assertSchoolQuestionFilter(page);
  await page.getByRole('button', { name: '1. Paaralan at Tuition', exact: true }).click();
  await page.selectOption('#edu-level', 'college');
  await page.selectOption('#edu-location', 'HUC');
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  await page.fill('#edu-daily-wage', '777');
  await page.getByRole('button', { name: '1. Paaralan at Tuition', exact: true }).click();
  await page.fill('#edu-barangay', 'Daine II');
  assert.equal(await page.inputValue('#edu-location'), 'HUC', 'Barangay-only edit preserves manual location tier');
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  assert.equal(await page.inputValue('#edu-daily-wage'), '777', 'Barangay-only edit preserves manual regional wage');
  await page.getByRole('button', { name: '1. Paaralan at Tuition', exact: true }).click();
  await page.selectOption('#edu-level', 'jhs');
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  await assertSchoolQuestionFilter(page);
  await page.getByRole('button', { name: 'Sample: Private SHS NCR', exact: true }).click();
  await page.getByRole('button', { name: '₱240,000 Low-Income', exact: true }).click();
  assert.equal(await page.inputValue('#edu-income'), '240000');
  await page.getByRole('button', { name: 'Tingnan ang mga programa', exact: true }).click();
  await assertPrivacyControls(page); await assertNoOverflow(page);
  assert.ok((await page.getByTestId('education-relief').innerText()).includes('22,500'));
  assert.ok((await page.getByTestId('education-balance').innerText()).includes('7,500'));
  const roadmap = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Unang Hakbang' }) }).first();
  assert.ok(await roadmap.getAttribute('open') !== null, 'Tuition roadmap opens by default');
  for (const title of ['Libreng Tuition / Voucher sa Paaralan', 'Cash Allowance at Scholarship', 'Dagdag na Tulong at Printable Packet']) assert.ok(await page.locator('summary').filter({ hasText: title }).isVisible());
  await page.getByRole('button', { name: 'Sample: State Univ (SUC) 4Ps', exact: true }).click();
  assert.ok(await page.getByText('Tatlong Hakbang: Action Roadmap', { exact: true }).isVisible(), 'Sample on Step 3 stays on roadmap');
  const cash = page.locator('details').filter({ has: page.locator('summary').filter({ hasText: 'Cash Allowance at Scholarship' }) }).first();
  assert.ok(await cash.locator('details').first().getAttribute('open') !== null, 'Top scholarship match is expanded');
  await page.getByRole('button', { name: 'Sample: DOST / CHED Honor (96%)', exact: true }).click();
  await page.fill('#education-roadmap-search', 'no-such-scholarship');
  assert.ok(await page.getByText('May eligible na primary scholarship, pero walang tumugma sa kasalukuyang filter.', { exact: false }).isVisible(), 'Eligible primary scholarships explain when the active filter hides them');
  assert.equal(await page.getByText(/Wala pang primary match sa iyong inputs|No primary match for these inputs/).count(), 0, 'Search filtering does not claim the profile is ineligible');
  await page.getByRole('button', { name: 'I-clear ang roadmap filter', exact: true }).click();
  await page.getByRole('button', { name: 'Sample: Private SHS NCR', exact: true }).click();
  await page.getByRole('button', { name: '1. Paaralan at Tuition', exact: true }).click();
  await page.selectOption('#edu-level', 'college');
  await page.selectOption('#edu-location', 'HUC');
  assert.equal(await page.inputValue('#edu-location'), 'HUC', 'Manual location override is set before opening the print tab');
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  await page.fill('#edu-daily-wage', '777');
  await page.getByRole('button', { name: 'Tingnan ang mga programa', exact: true }).click();
  await page.waitForFunction(() => {
    const profile = JSON.parse(localStorage.getItem('tulongph_education_session') ?? '{}');
    return profile.location === 'HUC' && profile.regionalDailyWage === 777;
  });
  await page.locator('header button:visible').filter({ hasText: /Forms/ }).first().click();
  await page.getByRole('button', { name: 'UP / PUP / TUP / State Univ', exact: true }).click();
  await page.getByRole('button', { name: 'DSWD Crisis Intervention Unit', exact: true }).click();
  assert.equal(await page.inputValue('#edu-print-school'), 'UP / PUP / TUP / State Univ');
  assert.equal(await page.inputValue('#edu-print-city'), 'Quezon City');
  assert.equal(await page.inputValue('#edu-print-recipient'), 'DSWD Crisis Intervention Unit');
  await page.fill('#edu-print-barangay', 'Printable Barangay Edit');
  await page.waitForFunction(() => {
    const profile = JSON.parse(localStorage.getItem('tulongph_education_session') ?? '{}');
    return profile.barangay === 'Printable Barangay Edit';
  });
  const printedProfile = await page.evaluate(() => JSON.parse(localStorage.getItem('tulongph_education_session')));
  assert.equal(printedProfile.location, 'HUC', 'Printable barangay edit preserves manual location tier');
  assert.equal(printedProfile.regionalDailyWage, 777, 'Printable barangay edit preserves manual regional wage');
  await page.getByRole('button', { name: 'Cavite → Indang → Daine I', exact: true }).click();
  assert.ok((await page.locator('.education-print-packet').innerText()).includes('Daine I, Indang, Cavite'));
  await checkPacket(page, 'education');
  await page.locator('header button:visible').filter({ hasText: /Direktoryo/ }).first().click();
  await page.waitForSelector('#edu-directory-search');
  await assertPrivacyControls(page); await assertNoOverflow(page);
  await page.getByRole('button', { name: 'SHS Voucher', exact: true }).click();
  assert.equal(await page.inputValue('#edu-directory-agency'), 'DepEd / PEAC');
  assert.ok(await page.getByRole('heading', { name: 'PEAC national and regional secretariats', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Lahat', exact: true }).click();
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: baseUrl });
  const educationContact = page.locator('article').filter({ has: page.getByRole('button', { name: 'Copy Email', exact: true }) }).first();
  const educationEmail = await educationContact.locator('a[href^="mailto:"]').innerText();
  await educationContact.getByRole('button', { name: 'Copy Email', exact: true }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), educationEmail);
  assert.ok(await educationContact.getByRole('status').isVisible());
  await page.fill('#edu-directory-search', 'not-a-real-desk');
  assert.ok(await page.getByText('Walang tumugma.', { exact: false }).isVisible());
  await page.reload();
  await page.waitForSelector('#edu-tuition');
  assert.equal(await page.inputValue('#edu-tuition'), '30000', 'Education session survives reload');
  assert.equal(await page.inputValue('#edu-province'), 'Cavite');
  assert.equal(await page.inputValue('#edu-city'), 'Indang');
  assert.equal(await page.inputValue('#edu-barangay'), 'Daine I');

  await page.getByRole('link', { name: 'Manggagawa at Benepisyo', exact: true }).click();
  await page.waitForSelector('#worker-sector');
  await assertPrivacyControls(page); await assertNoOverflow(page);
  await assertLocationHierarchy(page, 'worker');
  await page.getByRole('button', { name: 'Sample: Maternity + Differential', exact: true }).click();
  assert.equal(await page.inputValue('#worker-monthlySalary'), '25000');
  await page.getByRole('button', { name: '₱15,000', exact: true }).click();
  assert.equal(await page.inputValue('#worker-averageMonthlySalaryCredit'), '15000');
  assert.equal(await page.inputValue('#worker-highestSixMonthlySalaryCredit'), '15000');
  await page.getByRole('button', { name: '₱50,000', exact: true }).first().click();
  assert.equal(await page.inputValue('#worker-averageMonthlySalaryCredit'), '20000');
  await page.getByRole('button', { name: '72 buwan (6 yrs - 2-Mo Loan)', exact: true }).click();
  assert.equal(await page.inputValue('#worker-pagibigContributionMonths'), '72');
  assert.equal(await page.inputValue('#worker-pagibigTAV'), '28800');
  await assertNoOverflow(page);
  await page.getByRole('button', { name: '1. Sektor at Kontribusyon', exact: true }).click();
  await page.fill('#worker-barangay', 'Daine II');
  assert.equal(await page.inputValue('#worker-barangay'), 'Daine II');
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  await page.getByLabel('Puhunan at livelihood grant', { exact: true }).check();
  await page.fill('#worker-regionalDailyWage', '777');
  await page.getByRole('button', { name: '1. Sektor at Kontribusyon', exact: true }).click();
  await page.fill('#worker-barangay', 'Daine I');
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  await page.getByLabel('Puhunan at livelihood grant', { exact: true }).check();
  assert.equal(await page.inputValue('#worker-regionalDailyWage'), '777', 'Barangay-only edit preserves manual regional wage');
  await page.getByRole('button', { name: '1. Sektor at Kontribusyon', exact: true }).click();
  await page.fill('#worker-monthlySalary', '30000');
  await page.fill('#worker-averageMonthlySalaryCredit', '20000');
  await page.fill('#worker-highestSixMonthlySalaryCredit', '20000');
  await page.fill('#worker-contributionMonths', '72');
  await assertLocationHierarchy(page, 'worker');
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  await page.getByLabel('Puhunan at livelihood grant', { exact: true }).check();
  assert.equal(await page.inputValue('#worker-regionalDailyWage'), '520');
  assert.ok(await page.getByText('Live na benefit / loan preview', { exact: true }).isVisible());
  await page.getByLabel('Maternity at salary differential', { exact: true }).check();
  await page.fill('#worker-qualifyingBenefitContributions', '3');
  await assertPrivacyControls(page); await assertNoOverflow(page);
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  assert.ok((await page.getByTestId('worker-maternity-total').innerText()).includes('70,000'));
  assert.ok((await page.getByText('Employer salary differential:', { exact: false }).innerText()).includes('35,000'));
  await page.fill('#worker-roadmap-search', 'Pag-IBIG');
  assert.ok(await page.getByText('Walang tugma sa roadmap filter.', { exact: false }).isVisible(), 'Maternity search shows no-match guidance when only hidden loan results match');
  assert.ok(await page.getByRole('button', { name: 'I-clear ang roadmap filter', exact: true }).isVisible(), 'Maternity no-match guidance offers a clear-filter action');
  await page.getByRole('button', { name: 'I-clear ang roadmap filter', exact: true }).click();
  await assertPrivacyControls(page); await assertNoOverflow(page);
  await page.getByRole('button', { name: '2. Pangangailangan', exact: true }).click();
  await page.getByLabel('Sakit / aksidente at EC claim', { exact: true }).check();
  await page.fill('#worker-sicknessDays', '10');
  await page.check('#worker-sickLeaveExhausted');
  await page.check('#worker-isWorkRelated');
  await page.fill('#worker-approvedECMedicalReimbursement', '8000');
  const sicknessPreview = page.locator('section[aria-live="polite"]').filter({ hasText: 'Approved EC medical reimbursement' }).first();
  const previewAmounts = await sicknessPreview.locator('dl > div dd').evaluateAll(elements => elements.map(element => Number(element.textContent?.replace(/[^\d.]/g, ''))));
  assert.equal(previewAmounts[2], 8000, 'Sickness preview includes approved EC medical reimbursement');
  assert.equal(previewAmounts.slice(0, -1).reduce((sum, amount) => sum + amount, 0), previewAmounts.at(-1), 'Sickness preview rows sum to the combined benefit');
  await page.getByRole('button', { name: 'Susunod', exact: true }).click();
  assert.ok((await page.getByTestId('worker-sickness-total').innerText()).includes('18,800'));
  await page.getByRole('button', { name: 'Palitan ang wika sa English', exact: true }).click();
  assert.ok(await page.getByRole('button', { name: 'Open Printable Worker Packet', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Palitan ang wika sa Taglish', exact: true }).click();
  await page.getByRole('button', { name: 'Buksan ang Printable Worker Packet', exact: true }).click();
  await page.getByRole('button', { name: 'Hindi nabayarang sahod', exact: true }).click();
  assert.ok((await page.inputValue('#worker-print-unpaid')).includes('Hindi nabayarang sahod'));
  await page.getByRole('button', { name: 'Hindi nabayarang 13th Month Pay', exact: true }).click();
  assert.ok((await page.inputValue('#worker-print-unpaid')).includes('Hindi nabayarang sahod'));
  assert.ok((await page.inputValue('#worker-print-unpaid')).includes('13th Month Pay'));
  await page.getByRole('button', { name: 'Sari-Sari Store at Bigasan (PHP 25,000)', exact: true }).click();
  assert.ok((await page.inputValue('#worker-print-project')).includes('Sari-Sari'));
  assert.ok((await page.inputValue('#worker-print-budget')).includes('25,000'));
  await page.fill('#worker-print-name', 'Synthetic Worker');
  await page.fill('#worker-print-employer', 'Synthetic Employer');
  await checkPacket(page, 'worker');
  await page.locator('header button:visible').filter({ hasText: /Direktoryo/ }).first().click();
  await page.waitForSelector('#worker-directory-search');
  await assertPrivacyControls(page); await assertNoOverflow(page);
  await page.getByRole('button', { name: 'Unpaid Sahod 1349', exact: true }).click();
  assert.ok(await page.getByRole('heading', { name: 'DOLE SEnA', exact: false }).isVisible());
  const workerContact = page.locator('article').filter({ has: page.getByRole('button', { name: 'Copy Hotline: DOLE / e-SEnA / PESO', exact: true }) });
  await workerContact.getByRole('button', { name: 'Copy Hotline: DOLE / e-SEnA / PESO', exact: true }).click();
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), '1349');
  await assertNoOverflow(page);
  await page.getByRole('button', { name: 'Lahat ng pangangailangan', exact: true }).click();
  await page.fill('#worker-directory-search', 'not-a-real-desk');
  assert.ok(await page.getByText('Walang tugma.', { exact: false }).isVisible());
  await page.reload();
  await page.waitForSelector('#worker-monthlySalary');
  assert.equal(await page.inputValue('#worker-monthlySalary'), '30000', 'Worker session survives reload');
  assert.ok(await page.evaluate(() => localStorage.getItem('tulongph_education_session')));
  assert.ok(await page.evaluate(() => localStorage.getItem('tulongph_worker_session')));
  await page.evaluate(async () => {
    sessionStorage.setItem('synthetic-private-record', 'wipe-me');
    const database = await new Promise((resolve, reject) => {
      const request = indexedDB.open('keyval-store', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('keyval');
      request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
    });
    await new Promise((resolve, reject) => {
      const tx = database.transaction('keyval', 'readwrite');
      tx.objectStore('keyval').put({ firstName: 'Synthetic' }, 'tulong_patient_profile');
      tx.objectStore('keyval').put([{ name: 'synthetic-document' }], 'tulong_documents');
      tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
    });
    database.close();
  });
  const secondTab = await context.newPage();
  await secondTab.goto(`${baseUrl}/edukasyon`); await secondTab.waitForSelector('#edu-tuition');
  assert.equal(await secondTab.inputValue('#edu-tuition'), '30000');
  await secondTab.evaluate(() => sessionStorage.setItem('synthetic-other-tab', 'private'));
  await page.getByRole('button', { name: 'Burahin ang Aking Datos (Pisonet / Shop Mode)', exact: true }).click();
  await page.getByRole('button', { name: 'Oo, Burahin Lahat', exact: true }).click();
  await page.waitForSelector('#worker-monthlySalary');
  await page.waitForFunction(() => document.querySelector('#worker-monthlySalary')?.value === '0');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key !== 'tulongph-last-activity')), [], 'Both civic sessions and every private local key wiped; mount records fresh nonpersonal activity');
  assert.equal(await page.evaluate(() => sessionStorage.length), 0, 'Session records wiped');
  const idbCount = await page.evaluate(async () => {
    const db = await new Promise(resolve => { const req = indexedDB.open('keyval-store'); req.onsuccess = () => resolve(req.result); });
    const count = await new Promise(resolve => { const req = db.transaction('keyval').objectStore('keyval').count(); req.onsuccess = () => resolve(req.result); });
    db.close(); return count;
  });
  assert.equal(idbCount, 0, 'Medical profiles and document records wiped from IndexedDB');
  await secondTab.waitForFunction(() => document.querySelector('#edu-tuition')?.value === '0');
  assert.equal(await secondTab.evaluate(() => sessionStorage.length), 0, 'Other pillar tab session and React state wiped');
  await secondTab.close();
  await page.goto(`${baseUrl}/edukasyon`); await page.waitForSelector('#edu-tuition');
  assert.equal(await page.inputValue('#edu-tuition'), '0', 'Education state cannot recover erased record');
  await page.clock.install();
  await page.fill('#edu-tuition', '4321');
  await page.clock.fastForward(15 * 60 * 1000 + 1000);
  await page.waitForFunction(() => document.querySelector('#edu-tuition')?.value === '0');
  assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key !== 'tulongph-last-activity')), [], '15-minute inactivity wipes all user data; reload may record fresh nonpersonal activity');
  assert.deepEqual(errors, [], 'Civic pages have no browser runtime errors');
  await context.close();
  await runCrossTabIdleTests(browser, baseUrl);
  await runPrivacyRecoveryTest(browser, baseUrl);
  console.log('  PASS: civic math, recovery, PDF/native print, 375px layout, autocomplete, global wipe and inactivity');
}

async function runCrossTabIdleTests(browser, baseUrl) {
  for (const broadcast of [true, false]) {
    const context = await browser.newContext();
    try {
      if (!broadcast) await context.addInitScript(() => { delete window.BroadcastChannel; });
      const idle = await context.newPage();
      const active = await context.newPage();
      const now = new Date('2026-10-11T23:59:00Z');
      // Playwright's clock controls every page in this browser context.
      await idle.clock.install({ time: now });
      await idle.goto(`${baseUrl}/edukasyon`);
      await idle.waitForSelector('#edu-tuition');
      await idle.clock.pauseAt(new Date('2026-10-12T00:00:00Z'));
      await idle.fill('#edu-tuition', '1234');
      await idle.clock.fastForward(14 * 60 * 1000);
      await active.goto(`${baseUrl}/manggagawa`);
      await active.waitForSelector('#worker-monthlySalary');
      await waitForPageConditionWithNodePolling(idle, () => localStorage.getItem('tulongph-last-activity') === String(Date.parse('2026-10-12T00:14:00Z')));
      await idle.clock.fastForward(61 * 1000);
      assert.equal(await idle.inputValue('#edu-tuition'), '1234', 'Opening a second tab at minute 14 extends the first tab deadline without further interaction');
      await active.fill('#worker-monthlySalary', '5678');
      await waitForPageConditionWithNodePolling(idle, () => localStorage.getItem('tulongph-last-activity') === String(Date.parse('2026-10-12T00:15:01Z')));
      await idle.clock.fastForward(14 * 60 * 1000);
      assert.equal(await active.inputValue('#worker-monthlySalary'), '5678', 'Idle tab cannot erase another tab actively editing');
      assert.equal(await idle.evaluate(() => JSON.parse(localStorage.getItem('tulongph_worker_session')).monthlySalary), 5678);
      await active.close();
      await idle.clock.fastForward(61 * 1000);
      await waitForPageConditionWithNodePolling(idle, () => localStorage.getItem('tulongph_worker_session') === null);
      await waitForPageConditionWithNodePolling(idle, () => document.querySelector('#edu-tuition')?.value === '0');
      assert.equal(await idle.inputValue('#edu-tuition'), '0', 'Global wipe resumes once every tab is inactive');
    } finally { await context.close(); }
  }
  console.log('  PASS: new-tab mount and active tab prevent idle-tab wipe, with BroadcastChannel and storage-only fallback');
}

async function runPrivacyRecoveryTest(browser, baseUrl) {
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(`${baseUrl}/manggagawa`);
    await page.waitForSelector('#worker-monthlySalary');
    await page.fill('#worker-monthlySalary', '4321');
    await page.getByRole('button', { name: 'Susunod', exact: true }).click();
    await page.fill('#worker-sssOutstandingLoan', '1000');
    await page.fill('#worker-sssCalamityOutstandingLoan', '2500');
    await assertPrivacyControls(page);
    await page.getByRole('button', { name: '1. Sektor at Kontribusyon', exact: true }).click();
    await page.selectOption('#worker-sector', 'government');
    await page.getByRole('button', { name: 'Susunod', exact: true }).click();
    await page.selectOption('#worker-gsisAdvanceInsuranceMonths', '2');
    await assertPrivacyControls(page);
    await page.getByRole('button', { name: '1. Sektor at Kontribusyon', exact: true }).click();
    await page.selectOption('#worker-sector', 'ofw');
    await page.getByRole('button', { name: 'Susunod', exact: true }).click();
    await page.getByLabel('Sakit / aksidente at EC claim', { exact: true }).check();
    await page.check('#worker-ofwSeaBased');
    await assertPrivacyControls(page);
    await page.reload();
    await page.waitForSelector('#worker-monthlySalary');
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('tulongph_worker_session')));
    assert.equal(saved.sssOutstandingLoan, 1000);
    assert.equal(saved.sssCalamityOutstandingLoan, 2500);
    assert.equal(saved.gsisAdvanceInsuranceMonths, 2);
    assert.equal(saved.ofwSeaBased, true);
    await page.goto(`${baseUrl}/privacy`);
    await page.getByRole('button', { name: 'Subukan ang 1-Click Data Wipe', exact: true }).click();
    await page.getByRole('button', { name: 'Oo, Burahin ang Lahat', exact: true }).click();
    await page.waitForURL(`${baseUrl}/`);
    await page.waitForSelector('#patient-first-name');
    await page.fill('#patient-first-name', 'Fresh synthetic');
    // IndexedDB saves and session restoration are asynchronous; verify the write before reload.
    await waitForPageConditionWithNodePolling(page, async () => {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('keyval-store');
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
      });
      try {
        const saved = await new Promise((resolve, reject) => {
          const request = db.transaction('keyval').objectStore('keyval').get('tulong_patient_profile');
          request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        });
        return saved?.firstName === 'Fresh synthetic';
      } finally { db.close(); }
    });
    await page.reload();
    await waitForPageConditionWithNodePolling(page, () => document.querySelector('#patient-first-name')?.value === 'Fresh synthetic');
    assert.equal(await page.inputValue('#patient-first-name'), 'Fresh synthetic', 'Patient saves work after privacy-page wipe');
    await page.getByRole('link', { name: 'Manggagawa at Benepisyo', exact: true }).click();
    await page.waitForSelector('#worker-monthlySalary');
    assert.equal(await page.inputValue('#worker-monthlySalary'), '0');
    await page.fill('#worker-monthlySalary', '6789');
    await page.reload();
    await page.waitForSelector('#worker-monthlySalary');
    assert.equal(await page.inputValue('#worker-monthlySalary'), '6789', 'Fresh worker session persists after privacy wipe');
  } finally { await context.close(); }
  console.log('  PASS: privacy-page wipe permits fresh patient and worker saves');
}

async function runUniformDesignTests(browser, baseUrl) {
  console.log('\n[Uniform design] Shared shell, footer, stepper, roadmap and privacy...');
  const shellMetrics = [];
  const routes = [
    { path: '/', key: 'medical', ready: '#patient-first-name', start: 'triage-wizard-root', step1: 'Hakbang 1: 1. Pasyente', step2: 'Hakbang 2: 2. Ospital at Bill', step3: 'Hakbang 3: 3. Gabay sa Tulong', search: '#roadmap-search', confirm: 'Oo, Burahin ang Lahat' },
    { path: '/edukasyon', key: 'education', ready: '#edu-tuition', start: 'education-wizard', step1: '1. Paaralan at Tuition', step2: '2. Pamilya at Kwalipikasyon', step3: '3. Gabay sa Scholarship', search: '#education-roadmap-search', confirm: 'Oo, Burahin ang Lahat' },
    { path: '/manggagawa', key: 'worker', ready: '#worker-monthlySalary', start: 'worker-wizard', step1: '1. Sektor at Kontribusyon', step2: '2. Pangangailangan', step3: '3. Resulta at Hakbang', search: '#worker-roadmap-search', confirm: 'Oo, Burahin Lahat' },
  ];
  for (const route of routes) {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
    try {
      const page = await context.newPage();
      await page.goto(baseUrl + route.path); await page.waitForSelector(route.ready);
      const footer = page.locator('footer');
      assert.ok(await footer.getByText('· Open-Source Philippine Assistance Navigator', { exact: true }).isVisible());
      await footer.getByRole('button', { name: 'Direktoryo at Desks', exact: true }).click();
      await assertPrivacyControls(page); await assertNoOverflow(page);
      assert.ok(await footer.isVisible(), 'Footer remains on directory');
      if (route.path === '/') {
        const hotlineTab = page.getByRole('button', { name: /Hotlines|Hotline/ }).first();
        await hotlineTab.click();
        await assertNoOverflow(page);
        await page.evaluate(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
        await page.screenshot({ path: '/private/tmp/tulongph-uniform-medical-hotlines-375.png', fullPage: true });
        await page.setViewportSize({ width: 1280, height: 812 });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        await assertNoOverflow(page);
        await page.screenshot({ path: '/private/tmp/tulongph-uniform-medical-hotlines-1280.png', fullPage: true });
        await page.setViewportSize({ width: 375, height: 812 });
      }
      await page.evaluate(() => {
        const original = navigator.clipboard.writeText.bind(navigator.clipboard);
        window.restoreClipboardForTest = () => { navigator.clipboard.writeText = original; };
        navigator.clipboard.writeText = () => Promise.reject(new Error('Synthetic clipboard denial'));
      });
      const copy = route.path === '/' ? page.getByRole('button', { name: 'Kopyahin ang Telepono', exact: true }).first() : route.path === '/edukasyon' ? page.getByRole('button', { name: 'Copy Email', exact: true }).first() : page.getByRole('button', { name: /^Copy Hotline:/ }).first();
      await copy.click();
      await page.getByRole('status').filter({ hasText: /Hindi (?:nakopya|makopya)/ }).waitFor();
      await page.evaluate(() => window.restoreClipboardForTest());
      await footer.getByRole('button', { name: 'I-print ang Forms', exact: true }).click();
      await assertPrivacyControls(page); await assertNoOverflow(page);
      if (route.path === '/') {
        const downloadReady = page.waitForEvent('download');
        await page.getByRole('button', { name: 'I-download ang PDF', exact: true }).first().click();
        const packet = await downloadReady;
        assert.equal(await packet.failure(), null);
        await packet.saveAs('/private/tmp/tulongph-medical-export.pdf');
      }
      await page.emulateMedia({ media: 'print' });
      assert.equal(await footer.isVisible(), false, 'Shared footer never prints');
      await page.emulateMedia({ media: 'screen' });
      await footer.getByRole('button', { name: 'Gabay sa Tulong', exact: true }).click();
      await page.getByRole(route.path === '/' ? 'link' : 'button', { name: 'Simulan ang Pagtutuos', exact: true }).click();
      assert.equal(await page.evaluate(() => document.activeElement?.id), route.start, 'Hero start focuses the wizard');
      const steps = page.getByRole('navigation', { name: 'Mga hakbang', exact: true });
      assert.equal(await steps.locator('[aria-current="step"]').count(), 1);
      for (const width of [320, 375, 390, 414, 768, 1024, 1280]) {
        await page.setViewportSize({ width, height: 812 }); await assertNoOverflow(page);
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        if (width === 375 || width === 1280) shellMetrics.push({ route: route.path, width, metrics: await page.evaluate(() => {
          const main = document.querySelector('main');
          const heading = main.querySelector('h1');
          const hero = heading.closest('section');
          const m = getComputedStyle(main), h = getComputedStyle(heading), c = getComputedStyle(hero);
          return { mainWidth: main.getBoundingClientRect().width, left: m.paddingLeft, right: m.paddingRight, font: h.fontFamily, size: h.fontSize, weight: h.fontWeight, lineHeight: h.lineHeight, border: c.borderColor, radius: c.borderRadius, cardPadding: c.paddingLeft };
        }) });
      }
      for (const [step, label] of [[1, route.step1], [2, route.step2], [3, route.step3]]) {
        const control = steps.getByRole('button', { name: label, exact: true });
        await control.focus(); await page.keyboard.press(step === 2 ? 'Space' : 'Enter');
        assert.equal(await control.getAttribute('aria-current'), 'step', 'Keyboard activates the requested step');
        assert.equal(await steps.locator('[aria-current="step"]').count(), 1);
        await assertStepCardLayout(page, route.path, step);
        await assertPrivacyControls(page);
        for (const width of [375, 1280]) {
          await page.setViewportSize({ width, height: 812 }); await assertNoOverflow(page);
          await page.evaluate(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
          await page.screenshot({ path: `/private/tmp/tulongph-uniform-${route.key}-step${step}-${width}.png`, fullPage: true });
        }
      }
      if (route.path !== '/') {
        const step2 = steps.getByRole('button', { name: route.step2, exact: true });
        await step2.click();
        if (route.path === '/edukasyon') {
          const educationSamples = ['Sample: Private SHS NCR', 'Sample: State Univ (SUC) 4Ps', 'Sample: DOST / CHED Honor (96%)', 'Sample: TESDA Tech-Voc'];
          for (const name of educationSamples) assert.equal(await page.getByRole('button', { name, exact: true }).count(), 1, `${name} is unique on Education Step 2`);
          await page.getByRole('button', { name: 'Sample: Private SHS NCR', exact: true }).click();
          const initialRelief = await page.getByTestId('education-relief').innerText();
          await page.getByRole('button', { name: 'Sample: TESDA Tech-Voc', exact: true }).click();
          assert.equal(await step2.getAttribute('aria-current'), 'step', 'Education Step 2 samples update without changing steps');
          assert.ok(await page.locator('#edu-training-days').isVisible(), 'Education Step 2 sample updates conditional fields in place');
          assert.notEqual(await page.getByTestId('education-relief').innerText(), initialRelief, 'Education Step 2 sample updates the live relief amount');
        } else {
          const workerSamples = ['Sample: Maternity + Differential', 'Sample: Sakit + ECC Work Claim', 'Sample: SSS at Pag-IBIG Loan', 'Sample: Unpaid Sahod / SEnA'];
          for (const name of workerSamples) assert.equal(await page.getByRole('button', { name, exact: true }).count(), 1, `${name} is unique on Worker Step 2`);
          await page.getByRole('button', { name: 'Sample: Maternity + Differential', exact: true }).click();
          assert.ok(await page.locator('#worker-maternityType').isVisible());
          assert.ok(await page.locator('[aria-live="polite"]').filter({ hasText: 'SSS maternity' }).isVisible());
          await page.getByRole('button', { name: 'Sample: Sakit + ECC Work Claim', exact: true }).click();
          assert.equal(await step2.getAttribute('aria-current'), 'step', 'Worker Step 2 samples update without changing steps');
          assert.ok(await page.locator('#worker-sicknessDays').isVisible(), 'Worker Step 2 sample updates conditional fields in place');
          assert.ok(await page.locator('[aria-live="polite"]').filter({ hasText: 'Total separate claims' }).isVisible());
        }
        await assertStepCardLayout(page, route.path, 2);
        const step3 = steps.getByRole('button', { name: route.step3, exact: true });
        await step3.click();
        if (route.path === '/edukasyon') {
          const educationSamples = ['Sample: Private SHS NCR', 'Sample: State Univ (SUC) 4Ps', 'Sample: DOST / CHED Honor (96%)', 'Sample: TESDA Tech-Voc'];
          for (const name of educationSamples) assert.equal(await page.getByRole('button', { name, exact: true }).count(), 1, `${name} is unique on Education Step 3`);
          const initialPrimary = await page.getByTestId('education-primary').innerText();
          await page.getByRole('button', { name: 'Sample: DOST / CHED Honor (96%)', exact: true }).click();
          assert.equal(await step3.getAttribute('aria-current'), 'step', 'Education Step 3 samples update without changing steps');
          assert.ok(await page.getByTestId('education-primary').isVisible(), 'Education Step 3 sample updates the summary in place');
          assert.notEqual(await page.getByTestId('education-primary').innerText(), initialPrimary, 'Education Step 3 sample updates the primary amount');
        } else {
          const workerSamples = ['Sample: Maternity + Differential', 'Sample: Sakit + ECC Work Claim', 'Sample: SSS at Pag-IBIG Loan', 'Sample: Unpaid Sahod / SEnA'];
          for (const name of workerSamples) assert.equal(await page.getByRole('button', { name, exact: true }).count(), 1, `${name} is unique on Worker Step 3`);
          await page.getByRole('button', { name: 'Sample: Maternity + Differential', exact: true }).click();
          assert.ok(await page.getByTestId('worker-maternity-total').isVisible());
          await page.getByRole('button', { name: 'Sample: Sakit + ECC Work Claim', exact: true }).click();
          assert.ok(await page.getByTestId('worker-sickness-total').isVisible());
          await page.getByRole('button', { name: 'Sample: SSS at Pag-IBIG Loan', exact: true }).click();
          assert.equal(await step3.getAttribute('aria-current'), 'step', 'Worker Step 3 samples update without changing steps');
          assert.ok(await page.getByText(/candidate loan illustrations/i).isVisible(), 'Worker Step 3 sample updates the roadmap in place');
        }
        await assertStepCardLayout(page, route.path, 3);
      }
      assert.ok(await page.locator(route.search).isVisible());
      await page.fill(route.search, 'zzzz-no-program-match-987');
      await assertNoOverflow(page);
      if (route.path !== '/') assert.ok(await page.getByText('Walang tugma sa roadmap filter.', { exact: false }).isVisible(), 'Roadmap search shows a truthful no-match state');
      if (route.path !== '/') {
        await page.getByRole('button', { name: 'I-clear ang roadmap filter', exact: true }).click();
        assert.equal(await page.inputValue(route.search), '');
      } else await page.fill(route.search, '');
      for (const [tab, label] of [['print', 'I-print ang Forms'], ['directory', 'Direktoryo at Desks']]) {
        await footer.getByRole('button', { name: label, exact: true }).click();
        for (const width of [320, 375, 390, 414, 768, 1024, 1280]) {
          await page.setViewportSize({ width, height: 812 });
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
          await assertNoOverflow(page);
        }
        for (const width of [375, 1280]) {
          await page.setViewportSize({ width, height: 812 }); await assertNoOverflow(page);
          await page.evaluate(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); });
          await page.screenshot({ path: `/private/tmp/tulongph-uniform-${route.key}-${tab}-${width}.png`, fullPage: true });
        }
      }
    } finally { await context.close(); }
    for (const origin of ['navbar', 'footer']) {
      const context = await browser.newContext({ viewport: { width: 375, height: 600 } });
      try {
        const page = await context.newPage();
        await page.goto(baseUrl + route.path); await page.waitForSelector(route.ready);
        await page.fill(route.ready, route.path === '/' ? 'Synthetic wipe' : '1234');
        const opener = origin === 'navbar'
          ? page.getByRole('button', { name: 'Burahin ang Aking Datos (Pisonet / Shop Mode)', exact: true })
          : page.locator('footer').getByRole('button', { name: 'Burahin ang Datos (Pisonet)', exact: true });
        await opener.click();
        const dialog = page.getByRole('dialog');
        assert.ok(await dialog.isVisible());
        assert.equal(await page.evaluate(() => document.activeElement?.textContent), 'Kanselahin', 'Safe initial focus');
        await page.keyboard.press('Shift+Tab');
        assert.ok(await page.evaluate(() => document.activeElement?.closest('dialog') !== null), 'Native modal traps keyboard focus');
        await page.keyboard.press('Escape');
        assert.equal(await dialog.isVisible(), false);
        assert.ok(await opener.evaluate(node => node === document.activeElement), 'Escape restores focus to actual opener');
        await opener.click();
        await assertNoOverflow(page);
        await page.screenshot({ path: `/private/tmp/tulongph-uniform-${route.key}-dialog-${origin}.png` });
        if (origin === 'footer') {
          // Failure injection belongs only to this harness, never production code.
          await page.evaluate(() => {
            const original = Storage.prototype.clear;
            window.restoreStorageClearForTest = () => { Storage.prototype.clear = original; };
            Storage.prototype.clear = function () { throw new Error('Synthetic storage failure'); };
          });
          await dialog.getByRole('button', { name: route.confirm, exact: true }).click();
          await dialog.getByRole('alert').waitFor();
          assert.equal(await page.evaluate(() => location.hash), '', 'Failed wipe creates no success fragment');
          assert.equal(await page.locator('[role="status"]').filter({ hasText: 'Nabura na ang lahat' }).count(), 0, 'Failed wipe creates no success toast');
          await page.evaluate(() => window.restoreStorageClearForTest());
        }
        // Pause the existing cache purge to verify repeat-click and Escape guards.
        await page.evaluate(() => {
          const original = caches.keys.bind(caches);
          caches.keys = () => new Promise(resolve => { window.releaseWipeForTest = async () => resolve(await original()); });
        });
        await dialog.getByRole('button', { name: route.confirm, exact: true }).click();
        await page.waitForFunction(() => typeof window.releaseWipeForTest === 'function');
        assert.ok(await dialog.getByRole('button', { name: 'Binubura...', exact: true }).isDisabled());
        await page.keyboard.press('Escape'); assert.ok(await dialog.isVisible(), 'Busy wipe cannot be hidden');
        await page.evaluate(() => window.releaseWipeForTest());
        await page.waitForSelector(route.ready);
        await page.waitForFunction(({ selector, empty }) => document.querySelector(selector)?.value === empty, { selector: route.ready, empty: route.path === '/' ? '' : '0' });
        const toast = page.getByRole('status').filter({ hasText: 'Nabura na ang lahat ng datos' });
        await toast.waitFor();
        assert.equal(await page.evaluate(() => location.hash), '', 'One-shot fragment consumed after full reload');
        assert.deepEqual(await page.evaluate(() => Object.keys(localStorage).filter(key => key !== 'tulongph-last-activity')), [], 'Success notice leaves no stored marker or private data');
        assert.equal(await page.evaluate(() => sessionStorage.length), 0);
        await page.screenshot({ path: `/private/tmp/tulongph-uniform-${route.key}-toast-${origin}.png` });
        await page.getByRole('button', { name: 'Isara ang abiso', exact: true }).click();
        assert.equal(await toast.count(), 0);
        await page.reload(); await page.waitForSelector(route.ready);
        assert.equal(await toast.count(), 0, 'Normal reload does not repeat the wipe notice');
        await page.fill(route.ready, route.path === '/' ? 'Fresh synthetic save' : '5678');
      } finally { await context.close(); }
    }
  }
  await writeFile('/private/tmp/tulongph-uniform-execution/ui-metrics.json', JSON.stringify(shellMetrics, null, 2));
  for (const width of [375, 1280]) {
    const measurements = shellMetrics.filter(item => item.width === width);
    for (const item of measurements.slice(1)) assert.deepEqual(item.metrics, measurements[0].metrics, 'Equivalent shells, hero type, borders, radius and gutters match across pillars');
  }
  console.log('  PASS: shared footer, focused hero, keyboard stepper, roadmap clear, 7 widths, 6 wipe origins, failure retry and busy guards');
}

async function runE2ETests() {
  let port = process.env.PORT;
  if (!port) {
    if (await probePort(3003)) port = '3003';
    else if (await probePort(3000)) port = '3000';
    else port = '3000';
  }
  const baseUrl = `http://localhost:${port}`;
  console.log(`🚀 Starting Automated E2E Browser & DOM Test Suite on ${baseUrl}...`);

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  try {
    if (process.env.CIVIC_ONLY === '1') { await runCivicPillarTests(browser, baseUrl); return; }
    if (process.env.UNIFORM_ONLY === '1') { await runUniformDesignTests(browser, baseUrl); return; }
    // -------------------------------------------------------------
    // Test 1: Desktop Viewport (1280x800) - Full Auto-Compute Flow
    // -------------------------------------------------------------
    console.log('\n🖥️ [Test 1] Testing Desktop Viewport (1280px)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await desktopContext.newPage();
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    await assertPrivacyControls(page);
    // Verify Triage tab is active
    const triageHeading = await page.$('text=Impormasyon ng Pasyente');
    assert.ok(triageHeading, 'Patient Profile step 1 should be visible');

    // Fill Step 1 demographics
    await page.fill('#patient-first-name', 'Juan');
    await page.fill('#patient-last-name', 'Dela Cruz');
    await page.fill('#patient-dob', '1955-08-15'); // 71 years old -> Senior Citizen

    // Check Senior Citizen checkbox
    const seniorCheckbox = await page.$('#patient-is-senior');
    if (seniorCheckbox) {
      await seniorCheckbox.check();
    }

    await page.getByRole('button', { name: 'Quezon City (NCR)', exact: true }).click();
    assert.equal(await page.inputValue('#patient-city'), 'Quezon City');
    assert.equal(await page.inputValue('#patient-province'), 'Metro Manila');
    assert.equal(await page.inputValue('#patient-barangay'), '', 'Preset leaves unknown barangay empty');
    await assertLocationHierarchy(page, 'patient');
    await page.fill('#patient-province', 'Metro Manila');
    await page.fill('#patient-city', 'Quezon City');
    await page.fill('#patient-barangay', 'Barangay 1');
    await page.fill('#patient-contact', '09171234567');

    // Advance to Step 2
    const nextBtn = await page.$('button[type="submit"]:has-text("Susunod")');
    assert.ok(nextBtn, 'Next button should be found on Step 1');
    await nextBtn.click();
    await page.waitForTimeout(800);

    // Verify Step 2 is rendered by waiting for #case-diagnosis
    const diagInput = await page.waitForSelector('#case-diagnosis', { timeout: 5000 });
    assert.ok(diagInput, 'Step 2 Medical Case diagnosis input should be visible');

    await assertPrivacyControls(page);
    // Public presets use canonical directory names and cities, with an active desk.
    await page.getByRole('button', { name: /Public - DOH Retained \/ Specialty/ }).click();
    const heartCenterPreset = page.getByRole('button', { name: 'Philippine Heart Center', exact: true });
    await heartCenterPreset.click();
    assert.equal(await page.inputValue('#hospital-name'), 'Philippine Heart Center (PHC)');
    assert.equal(await heartCenterPreset.getAttribute('aria-pressed'), 'true');
    await page.getByText('Aktibo ang Malasakit Center sa pasilidad na ito (Quezon City).', { exact: true }).waitFor({ state: 'visible' });
    await page.getByRole('button', { name: /Public LGU Provincial/ }).click();
    await page.getByRole('button', { name: 'Ospital ng Maynila Medical Center', exact: true }).click();
    assert.equal(await page.inputValue('#hospital-name'), 'Ospital ng Maynila Medical Center (OMMC)');
    await page.getByText('Aktibo ang Malasakit Center sa pasilidad na ito (City of Manila).', { exact: true }).waitFor({ state: 'visible' });
    // Select Private Hospital
    const privateHospitalCard = await page.$('button:has-text("Private Hospital")');
    assert.ok(privateHospitalCard, 'Private Hospital card button should exist');
    await privateHospitalCard.click();
    await page.waitForTimeout(400);

    await page.getByRole('button', { name: "St. Luke's Medical Center", exact: true }).click();
    assert.equal(await page.inputValue('#hospital-name'), "St. Luke's Medical Center");
    await page.getByRole('button', { name: '₱100,000', exact: true }).click();
    assert.equal(await page.inputValue('#total-bill'), '100000');

    // Fill Hospital Name
    await page.fill('#hospital-name', "St. Luke's Medical Center");

    // Enter Total Hospital Bill: 100,000
    await page.fill('#total-bill', '100000');
    await page.waitForTimeout(300);

    // Click Diagnosis Quick Chip: 🩺 Pneumonia (Pulmonya)
    const pneumoniaChip = await page.$('button:has-text("Pneumonia")');
    assert.ok(pneumoniaChip, 'Pneumonia quick preset chip should exist');
    await pneumoniaChip.click();
    await page.waitForTimeout(500);

    // Assert diagnosis input updated
    const diagnosisVal = await page.inputValue('#case-diagnosis');
    assert.ok(diagnosisVal.includes('Pneumonia'), 'Diagnosis field should be filled with Pneumonia');
    console.log(`  ✓ Diagnosis quick preset successfully selected: "${diagnosisVal}"`);

    // Click ⚡ Auto-Kalkulahin (PhilHealth & Senior/PWD)
    const autoComputeBtn = await page.$('#btn-auto-compute');
    assert.ok(autoComputeBtn, '#btn-auto-compute button must exist');

    // Assert button height >= 44px
    const btnBox = await autoComputeBtn.boundingBox();
    assert.ok(btnBox && btnBox.height >= 44, `#btn-auto-compute height (${btnBox?.height}px) must be >= 44px`);
    console.log(`  ✓ Auto-Compute button touch target height: ${btnBox.height}px (>= 44px)`);

    await autoComputeBtn.click();
    await page.waitForTimeout(500);

    // Assert auto-computed values
    const philHealthVal = await page.inputValue('#philhealth-deduction');
    const seniorPwdVal = await page.inputValue('#senior-pwd-discount');
    const netRemainingEl = await page.$('#net-remaining-amount');
    const netRemainingText = await netRemainingEl?.innerText();

    console.log(`  ✓ Auto-calculated PhilHealth deduction: ₱${philHealthVal}`);
    console.log(`  ✓ Auto-calculated Senior/PWD relief: ₱${seniorPwdVal}`);
    console.log(`  ✓ Net remaining balance display: ${netRemainingText?.trim()}`);

    assert.strictEqual(Number(philHealthVal), 32000, 'PhilHealth deduction for Moderate Pneumonia should be 32,000');
    assert.strictEqual(Number(seniorPwdVal), 28571, 'Senior PWD relief for 100k private bill should be 28,571');
    assert.ok(netRemainingText?.includes('39,429'), 'Net remaining balance text should show ₱ 39,429');

    // Assert Statutory Breakdown Card is rendered
    const ra9994Card = await page.$('text=RA 9994 / RA 10754 Mandated Relief');
    assert.ok(ra9994Card, 'Statutory breakdown card should display RA 9994 / RA 10754 Mandated Relief');

    const philHealthBreakdown = await page.$('text=PhilHealth Case Rate');
    assert.ok(philHealthBreakdown, 'Statutory breakdown card should display PhilHealth Case Rate');

    const reassuranceNote = await page.$('text=Maaari ring baguhin nang manu-mano');
    assert.ok(reassuranceNote, 'Statutory breakdown card should display SOA manual override reassurance note');
    console.log('  ✓ Statutory breakdown card rendered with official legal citations');

    // Test Manual Override
    console.log('\n✏️ Testing Manual Override Freedom...');
    await page.fill('#philhealth-deduction', '25000');
    await page.waitForTimeout(300);

    const updatedNetText = await (await page.$('#net-remaining-amount'))?.innerText();
    console.log(`  ✓ After typing 25,000 in PhilHealth input, updated net: ${updatedNetText?.trim()}`);
    assert.ok(updatedNetText?.includes('46,429'), 'Net remaining balance should dynamically recalculate to ₱ 46,429');

    await desktopContext.close();

    // -------------------------------------------------------------
    // Test 2: Mobile Viewport (375px) - Zero Overflow & Tap Targets
    // -------------------------------------------------------------
    console.log('\n📱 [Test 2] Testing Mobile Viewport (375px)...');
    const mobileContext = await browser.newContext({
      viewport: { width: 375, height: 667 },
      isMobile: true,
      hasTouch: true,
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await mobilePage.waitForTimeout(1000);

    // Check Step 1 mobile scrollWidth
    const mobileScrollWidth1 = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    assert.ok(mobileScrollWidth1 <= 375, `Step 1 mobile scrollWidth (${mobileScrollWidth1}px) must not exceed 375px`);

    // Fill Step 1 to reach Step 2
    await mobilePage.fill('#patient-first-name', 'Maria');
    await mobilePage.fill('#patient-last-name', 'Santos');
    await mobilePage.fill('#patient-dob', '1960-01-01');
    const seniorCb = await mobilePage.$('#patient-is-senior');
    if (seniorCb) await seniorCb.check();
    await mobilePage.fill('#patient-province', 'Metro Manila');
    await mobilePage.fill('#patient-city', 'Manila');
    await mobilePage.fill('#patient-barangay', 'Barangay 2');
    await mobilePage.fill('#patient-contact', '09189876543');

    const mobileNext = await mobilePage.$('button[type="submit"]:has-text("Susunod")');
    await mobileNext?.click();
    await mobilePage.waitForTimeout(800);

    // Check Step 2 mobile scrollWidth
    const mobileScrollWidth2 = await mobilePage.evaluate(() => document.documentElement.scrollWidth);
    console.log(`  ✓ Step 2 mobile viewport scrollWidth: ${mobileScrollWidth2}px (<= 375px)`);
    assert.ok(mobileScrollWidth2 <= 375, `Step 2 mobile scrollWidth (${mobileScrollWidth2}px) must not exceed 375px`);

    // Check Auto-Compute button on mobile
    const mobileAutoBtn = await mobilePage.$('#btn-auto-compute');
    const mobileBtnBox = await mobileAutoBtn?.boundingBox();
    assert.ok(mobileBtnBox && mobileBtnBox.height >= 44, `Mobile Auto-Compute button height (${mobileBtnBox?.height}px) must be >= 44px`);
    console.log(`  ✓ Mobile Auto-Compute button height: ${mobileBtnBox.height}px (>= 44px)`);

    // Check diagnostic quick preset chips on mobile
    const dengueChip = await mobilePage.$('button:has-text("Dengue")');
    assert.ok(dengueChip, 'Dengue quick preset chip should exist on mobile');
    await dengueChip.click();
    await mobilePage.waitForTimeout(300);

    const mobileDiagVal = await mobilePage.inputValue('#case-diagnosis');
    assert.ok(mobileDiagVal.includes('Dengue'), 'Mobile diagnosis input should update to Dengue');
    console.log(`  ✓ Mobile quick preset selection works: "${mobileDiagVal}"`);

    await mobileContext.close();

    // -------------------------------------------------------------
    // Test 3: QoL Features - 1-Click Sample Data, Form Validation, Admission Status & Search
    // -------------------------------------------------------------
    console.log('\n🔍 [Test 3] Testing 1-Click Sample Data, Form Validation & Roadmap Search...');
    const qolContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const qolPage = await qolContext.newPage();
    await qolPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await qolPage.waitForTimeout(1000);

    // 1. Test Form Validation Blocking: try submitting empty form on Step 1
    const initialNext = await qolPage.$('button[type="submit"]:has-text("Susunod")');
    await initialNext?.click();
    await qolPage.waitForTimeout(500);

    const bannerErrorEl = await qolPage.$('role=alert');
    assert.ok(bannerErrorEl, 'Error banner should appear when submitting incomplete form');
    console.log('  ✓ Form validation blocked submission and displayed error alert');

    // 2. Test 1-Click Sample Data loader
    const sampleBtn = await qolPage.$('button:has-text("Subukan gamit ang Sample Data")');
    assert.ok(sampleBtn, '1-Click Sample Data button must exist');
    await sampleBtn.click();
    await qolPage.waitForTimeout(500);

    const sampleName = await qolPage.inputValue('#patient-first-name');
    const sampleContact = await qolPage.inputValue('#patient-contact');
    assert.strictEqual(sampleName, 'Juan', 'Sample loader should populate first name as Juan');
    assert.strictEqual(sampleContact, '09171234567', 'Sample loader should populate contact as 09171234567');
    console.log('  ✓ 1-Click Sample Data successfully populated form');

    // Test Digit Limit and Clamping (11 digits for cellphone, 12 digits for PhilHealth)
    await qolPage.fill('#patient-contact', '0917123456789999');
    const clampedContact = await qolPage.inputValue('#patient-contact');
    assert.strictEqual(clampedContact, '09171234567', 'Cellphone number must be strictly clamped to 11 digits');
    console.log('  ✓ Cellphone number strictly clamped to 11 digits max');

    await qolPage.fill('#patient-philhealth', '1234567890129999');
    const clampedPhilHealth = await qolPage.inputValue('#patient-philhealth');
    assert.strictEqual(clampedPhilHealth, '123456789012', 'PhilHealth PIN must be strictly clamped to 12 digits');
    console.log('  ✓ PhilHealth PIN strictly clamped to 12 digits max');

    // Check age badge
    const ageBadge = await qolPage.$('text=Senior (RA 9994)');
    assert.ok(ageBadge, 'Age badge should identify Senior Citizen status');
    console.log('  ✓ Real-time calculated age badge rendered with Senior qualification');

    // 3. Advance to Step 2
    const nextStep2 = await qolPage.$('button[type="submit"]:has-text("Susunod")');
    await nextStep2?.click();
    await qolPage.waitForTimeout(800);

    // Check Admission Status toggle exists
    const runningBillBtn = await qolPage.$('button:has-text("Naka-confine pa")');
    assert.ok(runningBillBtn, 'Naka-confine pa (Running Bill) toggle button must exist');
    console.log('  ✓ Admission Status 3-pill toggle is visible and active');

    // 4. Calculate Aid Stacking Roadmap to reach Step 3
    const calcRoadmapBtn = await qolPage.$('form button[type="submit"]');
    assert.ok(calcRoadmapBtn, 'Calculate roadmap button must exist');
    await calcRoadmapBtn.click();
    await qolPage.waitForTimeout(1000);

    await assertPrivacyControls(qolPage);
    // Verify Step 3 Aid Roadmap is visible
    const roadmapSearchInput = await qolPage.$('#roadmap-search');
    assert.ok(roadmapSearchInput, 'Roadmap instant search input must exist on Step 3');
    console.log('  ✓ Roadmap search & filter bar rendered on Step 3');

    // Test Search Filtering: search for "PCSO"
    await qolPage.fill('#roadmap-search', 'PCSO');
    await qolPage.waitForTimeout(400);

    const pcsoCards = await qolPage.$$('text=PCSO Medical Access Program');
    assert.ok(pcsoCards.length > 0, 'PCSO card should remain visible when searching for PCSO');

    // Test Search Filtering: search for something non-existent
    await qolPage.fill('#roadmap-search', 'nonexistent_test_term_12345');
    await qolPage.waitForTimeout(400);

    const noResults = await qolPage.$('text=Walang nakitang tulong para sa');
    // 5. Test 1-Tap Quick Filter Pills (PhilHealth, PCSO, Malasakit, Lahat) for seniors
    const philhealthPill = await qolPage.$('button:has-text("PhilHealth")');
    assert.ok(philhealthPill, '1-Tap PhilHealth quick filter pill must exist');
    await philhealthPill.click();
    await qolPage.waitForTimeout(300);
    const searchValAfterPill = await qolPage.inputValue('#roadmap-search');
    assert.strictEqual(searchValAfterPill, 'PhilHealth', 'Clicking pill should set search input to PhilHealth');
    console.log('  ✓ 1-Tap quick filter pill updates search filter without typing');

    const allPill = await qolPage.$('button:has-text("Lahat")');
    await allPill?.click();
    await qolPage.waitForTimeout(300);
    const searchValAfterAll = await qolPage.inputValue('#roadmap-search');
    assert.strictEqual(searchValAfterAll, '', 'Clicking "Lahat" pill should clear search filter');
    console.log('  ✓ 1-Tap "Lahat" pill clears filter');

    // 6. Test Stepper Jump Navigation back to Step 1 & Step 2
    const step1Jump = await qolPage.$('div[aria-label="Hakbang 1: 1. Pasyente"]');
    assert.ok(step1Jump, 'Step 1 stepper button should be jumpable');
    await step1Jump.click();
    await qolPage.waitForTimeout(400);
    const isStep1Back = await qolPage.$('#patient-first-name');
    assert.ok(isStep1Back, 'Should successfully navigate back to Step 1 on 1 tap');
    console.log('  ✓ 1-Tap jump navigation back to Step 1 verified');

    const step2Jump = await qolPage.$('div[aria-label="Hakbang 2: 2. Ospital at Bill"]');
    assert.ok(step2Jump, 'Step 2 stepper button should be jumpable');
    await step2Jump.click();
    const diagnosisOnStep2 = await qolPage.waitForSelector('#case-diagnosis', { timeout: 5000 });
    assert.ok(diagnosisOnStep2, 'Should successfully navigate forward to Step 2');
    console.log('  ✓ 1-Tap jump navigation forward to Step 2 verified');

    const step3Jump = await qolPage.$('div[aria-label="Hakbang 3: 3. Gabay sa Tulong"]');
    assert.ok(step3Jump, 'Step 3 stepper button should be jumpable');
    await step3Jump.click();
    const roadmapSearchOnStep3 = await qolPage.waitForSelector('#roadmap-search', { timeout: 5000 });
    assert.ok(roadmapSearchOnStep3, 'Should compute and navigate forward to Step 3');
    console.log('  ✓ 1-Tap jump navigation forward to Step 3 verified');

    await qolContext.close();
    await runCivicPillarTests(browser, baseUrl);

    await runUniformDesignTests(browser, baseUrl);

    console.log('\n🎉 ALL AUTOMATED E2E & STATUTORY TESTS PASSED WITH 0 ERRORS!\n');
  } finally {
    await browser.close();
  }
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E Test Failure:', err);
  process.exit(1);
});
