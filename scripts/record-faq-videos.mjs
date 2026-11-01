import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import ffmpeg from 'ffmpeg-static';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'videos/social-campaign');
const base = 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let browser;
let scratch;
let sceneStarted;

async function until(seconds) {
  const elapsed = (Date.now() - sceneStarted) / 1000;
  if (elapsed < seconds) {
    await sleep(Math.round((seconds - elapsed) * 1000));
  }
}

async function type(page, selector, value) {
  const field = page.locator(selector);
  await field.scrollIntoViewIfNeeded();
  await field.fill('');
  await field.pressSequentially(String(value), { delay: 45 });
  await sleep(150);
}

async function show(locator, ms = 1500) {
  await locator.scrollIntoViewIfNeeded();
  await sleep(ms);
}

async function next(page) {
  await page.locator('button[type="submit"]').click();
  await sleep(500);
}

// SCENARIO 1: Public Hospitals Support FAQ
async function scenarioPublicHospitals(page) {
  // Step 1: Patient Details
  await type(page, '#patient-first-name', 'Elena');
  await type(page, '#patient-last-name', 'Reyes');
  await page.locator('#patient-dob').fill('1960-05-12');
  await page.locator('#patient-is-senior').check();
  await type(page, '#patient-contact', '09171234567');
  await type(page, '#patient-province', 'Metro Manila');
  await type(page, '#patient-city', 'Quezon City');
  await until(9);
  await next(page);

  // Step 2: Medical Case & Hospital Selection
  // Highlight Hospital Type: Public DOH vs LGU
  const dohButton = page.getByRole('button', { name: /Public - DOH Retained/ });
  await show(dohButton, 1200);
  await dohButton.click();
  await sleep(400);

  await type(page, '#hospital-name', 'Philippine General Hospital');
  await sleep(600);
  const suggestion = page.locator('#hospital-suggestions-list button').first();
  await suggestion.waitFor({ state: 'visible', timeout: 5000 });
  await show(suggestion, 1500);
  await suggestion.click();
  await sleep(500);

  await type(page, '#case-diagnosis', 'Severe Community-Acquired Pneumonia');
  await type(page, '#total-bill', '85000');
  await page.locator('#btn-auto-compute').click();
  await sleep(500);
  await show(page.locator('#net-remaining-balance'), 2500);
  await until(24);
  await next(page);

  // Step 3: Triage Roadmap for Public Hospitals
  await show(page.locator('#roadmap-search'), 1800);
  
  // Highlight NBB and Malasakit In-situ desk
  const nbbStep = page.getByText('Ibawas ang PhilHealth Case Rates at Ipatupad ang No Balance Billing', { exact: false }).first();
  await show(nbbStep, 2500);

  const malasakitStep = page.getByText('In-Situ Malasakit Center Desk', { exact: false }).first();
  await show(malasakitStep, 2500);

  // Filter terms
  for (const term of ['Malasakit', 'PCSO', 'DSWD (Gamot)']) {
    const btn = page.getByRole('button', { name: term, exact: true });
    if (await btn.isVisible()) {
      await btn.click();
      await page.mouse.wheel(0, 400);
      await sleep(1800);
    }
  }

  // Switch to Directory to show 160+ public hospital Malasakit centers
  const dirTab = page.getByRole('button', { name: 'Direktoryo', exact: true });
  if (await dirTab.isVisible()) {
    await dirTab.click();
    await sleep(1500);
    await page.mouse.wheel(0, 500);
    await sleep(2000);
  }

  await until(48);
}

// SCENARIO 2: Outpatient Lab Tests / Diagnostic Subsidy Without Hospital Admission FAQ
async function scenarioOutpatientLabTests(page) {
  // Step 1: Patient Profile
  await type(page, '#patient-first-name', 'Roberto');
  await type(page, '#patient-last-name', 'Santos');
  await page.locator('#patient-dob').fill('1985-04-10');
  await type(page, '#patient-contact', '09189876543');
  await type(page, '#patient-province', 'Metro Manila');
  await type(page, '#patient-city', 'Quezon City');
  await until(9);
  await next(page);

  // Step 2: Medical Case & Outpatient selection
  // Select Category: Laboratory Diagnostics
  await page.locator('#case-category').selectOption('laboratory_diagnostics');
  await sleep(500);

  // Select Admission Status: Outpatient
  const outpatientRadio = page.getByRole('radio', { name: /Pabalik-balik na gamutan/i });
  await show(outpatientRadio, 1500);
  await outpatientRadio.click();
  await sleep(500);

  // Enter Outpatient Hospital / Facility
  await page.getByRole('button', { name: /Public - DOH Retained/ }).click();
  await type(page, '#hospital-name', 'East Avenue Medical Center');
  await sleep(600);
  const suggestion = page.locator('#hospital-suggestions-list button').first();
  if (await suggestion.isVisible()) {
    await suggestion.click();
  }

  await type(page, '#case-diagnosis', 'Whole Abdomen CT Scan with Contrast & Blood Chemistry');
  await type(page, '#total-bill', '18500');
  await page.locator('#btn-auto-compute').click();
  await sleep(500);
  await show(page.locator('#net-remaining-balance'), 2200);
  await until(24);
  await next(page);

  // Step 3: Outpatient Roadmap & Three-Quotation Guidance
  await show(page.locator('#roadmap-search'), 1800);

  // Highlight Outpatient Test Quotation banner/card
  const quotationCard = page.getByText('Outpatient test quotation', { exact: false }).first();
  if (await quotationCard.isVisible()) {
    await show(quotationCard, 2500);
  }

  const quotationStep = page.getByText('Itanong kung kailangan ang tatlong nakasulat na quotation', { exact: false }).first();
  if (await quotationStep.isVisible()) {
    await show(quotationStep, 3000);
  }

  // Filter agencies for outpatient (PCSO, DSWD)
  for (const term of ['PCSO', 'DSWD (Gamot)', 'Malasakit']) {
    const btn = page.getByRole('button', { name: term, exact: true });
    if (await btn.isVisible()) {
      await btn.click();
      await page.mouse.wheel(0, 350);
      await sleep(1800);
    }
  }

  await until(48);
}

const scenariosToRun = [
  {
    name: 'faq-public-hospitals',
    route: '/',
    runner: scenarioPublicHospitals,
  },
  {
    name: 'faq-outpatient-lab-tests',
    route: '/',
    runner: scenarioOutpatientLabTests,
  },
];

async function run() {
  await mkdir(output, { recursive: true });
  scratch = await mkdtemp(join(tmpdir(), 'tulong-faq-'));

  console.log('Launching browser for FAQ scenarios recording...');
  browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  for (const item of scenariosToRun) {
    console.log(`Starting recording for: ${item.name}`);
    const context = await browser.newContext({
      viewport: { width: 540, height: 960 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      recordVideo: {
        dir: scratch,
        size: { width: 540, height: 960 },
      },
    });

    const recordingStarted = Date.now();
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    await page.goto(base + item.route);
    await page.locator('form').first().waitFor();
    await sleep(1000);

    const started = Date.now();
    sceneStarted = started;

    try {
      await item.runner(page);
    } catch (error) {
      console.error(`Error in scenario ${item.name}:`, error);
      await page.screenshot({ path: join(tmpdir(), `${item.name}-failure.png`) });
      throw error;
    }

    const elapsed = (Date.now() - started) / 1000;
    console.log(`Walkthrough for ${item.name} completed in ${elapsed.toFixed(1)}s`);
    assert.ok(elapsed <= 53, `${item.name} walkthrough took ${elapsed.toFixed(1)}s; must be <= 53s`);

    await sleep(Math.max(0, 50000 - (Date.now() - started)));
    const video = page.video();
    await context.close();

    const raw = await video.path();
    const target = join(output, `${item.name}.mp4`);
    const offset = (started - recordingStarted) / 1000;

    console.log(`Encoding 1080x1920 30fps H.264 video for ${item.name}...`);
    execFileSync(ffmpeg, [
      '-y',
      '-ss', String(offset),
      '-i', raw,
      '-t', '50',
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
      '-r', '30',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',
      '-an',
      target,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });

    console.log(`Successfully generated: ${target}`);
  }

  await browser.close();
  if (scratch) await rm(scratch, { recursive: true, force: true });
}

run().catch(err => {
  console.error('Recording failed:', err);
  process.exit(1);
});
