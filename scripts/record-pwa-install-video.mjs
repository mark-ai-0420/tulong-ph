import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import ffmpeg from 'ffmpeg-static';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDir = join(root, 'videos/social-campaign');
const base = process.env.BASE_URL || 'http://localhost:3000';
const sleep = ms => new Promise(r => setTimeout(r, ms));

let sceneStarted = 0;
async function until(seconds) {
  const elapsed = (Date.now() - sceneStarted) / 1000;
  if (elapsed < seconds) {
    await sleep(Math.round((seconds - elapsed) * 1000));
  }
}

async function injectTouchCursor(page) {
  await page.evaluate(() => {
    if (document.getElementById('demo-touch-pointer')) return;
    const cursor = document.createElement('div');
    cursor.id = 'demo-touch-pointer';
    cursor.style.position = 'fixed';
    cursor.style.width = '32px';
    cursor.style.height = '32px';
    cursor.style.borderRadius = '50%';
    cursor.style.backgroundColor = 'rgba(30, 58, 138, 0.4)';
    cursor.style.border = '2.5px solid rgba(255, 255, 255, 0.95)';
    cursor.style.boxShadow = '0 0 12px rgba(0,0,0,0.35)';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '999999';
    cursor.style.transform = 'translate(-50%, -50%) scale(0)';
    cursor.style.transition = 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease';
    cursor.style.opacity = '0';
    document.body.appendChild(cursor);

    window.__touchElement = (x, y) => {
      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
      cursor.style.opacity = '1';
      cursor.style.transform = 'translate(-50%, -50%) scale(1.4)';
      setTimeout(() => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1.0)';
        setTimeout(() => {
          cursor.style.opacity = '0';
          cursor.style.transform = 'translate(-50%, -50%) scale(0)';
        }, 350);
      }, 180);
    };
  });
}

async function touchTap(page, locator) {
  await locator.scrollIntoViewIfNeeded();
  await sleep(250);
  const box = await locator.boundingBox();
  if (box) {
    await page.evaluate(({ x, y }) => {
      if (typeof window.__touchElement === 'function') {
        window.__touchElement(x, y);
      }
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    await sleep(150);
  }
  await locator.click();
  await sleep(400);
}

async function smoothScroll(page, targetY, durationMs = 600) {
  await page.evaluate(async ({ targetY, durationMs }) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();
    return new Promise(resolve => {
      function step(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        // easeInOutQuad
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        window.scrollTo(0, startY + diff * ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, { targetY, durationMs });
  await sleep(200);
}

async function scenarioPwaInstallation(page) {
  console.log('--- Beat 1 (0:00 - 0:07): Starting at Home, navigating to /install ---');
  await page.goto(base + '/');
  await page.locator('header').first().waitFor();
  await injectTouchCursor(page);
  await sleep(1200);

  // Look for the "I-install ang App" nav button / link
  const installNavLink = page.locator('a[href="/install"]').first();
  await installNavLink.waitFor({ state: 'visible', timeout: 5000 });
  await touchTap(page, installNavLink);

  // Arrive at /install
  await page.waitForURL('**/install', { timeout: 6000 });
  await injectTouchCursor(page);
  await sleep(800);

  // Highlight Hero and Title
  const heroHeading = page.getByRole('heading', { level: 1, name: /I-install ang TulongPH sa telepono/i });
  await heroHeading.scrollIntoViewIfNeeded();
  await sleep(1200);
  await until(7);

  console.log('--- Beat 2 (0:07 - 0:16): Core Civic Benefits & Offline Readiness ---');
  const benefitsTitle = page.locator('#install-benefits-title');
  const benefitsBox = await benefitsTitle.boundingBox();
  if (benefitsBox) {
    await smoothScroll(page, benefitsBox.y - 80, 500);
  } else {
    await benefitsTitle.scrollIntoViewIfNeeded();
  }
  await sleep(1500);

  // Pause on the 3 benefit cards
  const cards = page.locator('section[aria-labelledby="install-benefits-title"] article');
  const cardCount = await cards.count();
  for (let i = 0; i < cardCount; i++) {
    const card = cards.nth(i);
    const box = await card.boundingBox();
    if (box) {
      await page.evaluate(({ x, y }) => {
        if (window.__touchElement) window.__touchElement(x, y);
      }, { x: box.x + 24, y: box.y + 24 });
    }
    await sleep(1100);
  }
  await until(16);

  console.log('--- Beat 3 (0:16 - 0:28): Android Walkthrough (Google Chrome) ---');
  const platformHeader = page.locator('#install-guides-title');
  const platformBox = await platformHeader.boundingBox();
  if (platformBox) {
    await smoothScroll(page, platformBox.y - 70, 500);
  }
  await sleep(500);

  // Tap Android tab
  const androidTab = page.locator('#install-tab-android');
  await touchTap(page, androidTab);
  await sleep(600);

  // Highlight Android panel steps
  const androidPanel = page.locator('#install-panel-android');
  await androidPanel.scrollIntoViewIfNeeded();
  await sleep(1200);

  const androidSteps = androidPanel.locator('ol li');
  const stepCount = await androidSteps.count();
  for (let i = 0; i < stepCount; i++) {
    const step = androidSteps.nth(i);
    const box = await step.boundingBox();
    if (box) {
      await page.evaluate(({ x, y }) => {
        if (window.__touchElement) window.__touchElement(x, y);
      }, { x: box.x + 18, y: box.y + 16 });
    }
    await sleep(1200);
  }
  await until(28);

  console.log('--- Beat 4 (0:28 - 0:40): iOS Walkthrough (Apple Safari) ---');
  // Scroll back slightly to tabs
  const tabsGroup = page.locator('[aria-label="Piliin ang gabay para sa iyong device"]');
  await tabsGroup.scrollIntoViewIfNeeded();
  await sleep(400);

  // Tap iOS tab
  const iosTab = page.locator('#install-tab-ios');
  await touchTap(page, iosTab);
  await sleep(600);

  // Highlight iOS panel & Safari notice
  const iosPanel = page.locator('#install-panel-ios');
  await iosPanel.scrollIntoViewIfNeeded();
  await sleep(1200);

  const iosSteps = iosPanel.locator('ol li');
  const iosStepCount = await iosSteps.count();
  for (let i = 0; i < iosStepCount; i++) {
    const step = iosSteps.nth(i);
    const box = await step.boundingBox();
    if (box) {
      await page.evaluate(({ x, y }) => {
        if (window.__touchElement) window.__touchElement(x, y);
      }, { x: box.x + 18, y: box.y + 16 });
    }
    await sleep(1200);
  }
  await until(40);

  console.log('--- Beat 5 (0:40 - 0:46): In-App Browser & Pisonet Privacy Alerts ---');
  // Switch to All tabs to show both or scroll down to public computer note
  const allTab = page.locator('#install-tab-all');
  if (await allTab.isVisible()) {
    await touchTap(page, allTab);
    await sleep(500);
  }

  // Scroll down to the in-app browser and public computer notice
  const inAppNotice = page.getByRole('heading', { name: /Nasa Facebook, Messenger, o Instagram/i });
  if (await inAppNotice.isVisible()) {
    await inAppNotice.scrollIntoViewIfNeeded();
    await sleep(1400);
  }

  const pisonetNotice = page.getByRole('heading', { name: /Gumagamit ng pisonet o public computer/i });
  if (await pisonetNotice.isVisible()) {
    await pisonetNotice.scrollIntoViewIfNeeded();
    await sleep(1400);
  }
  await until(46);

  console.log('--- Beat 6 (0:46 - 0:50): Outro, Canonical URL & Home Screen summary ---');
  await smoothScroll(page, 0, 600);
  await sleep(800);
  await heroHeading.scrollIntoViewIfNeeded();
  await sleep(1500);
  await until(49.5);
}

async function run() {
  await mkdir(outputDir, { recursive: true });
  const scratch = await mkdtemp(join(tmpdir(), 'tulong-pwa-video-'));

  console.log('Launching browser to record PWA Installation Guide (9:16 mobile format)...');
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

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
  page.setDefaultTimeout(20000);

  const started = Date.now();
  sceneStarted = started;

  try {
    await scenarioPwaInstallation(page);
  } catch (error) {
    console.error('Error in scenario:', error);
    await page.screenshot({ path: join(tmpdir(), 'pwa-install-failure.png') });
    await browser.close();
    await rm(scratch, { recursive: true, force: true });
    throw error;
  }

  const elapsed = (Date.now() - started) / 1000;
  console.log(`PWA Installation walkthrough completed in ${elapsed.toFixed(1)}s`);
  assert.ok(elapsed <= 54, `Walkthrough took ${elapsed.toFixed(1)}s; must be <= 54s`);

  // Allow video buffer to settle to exact 50s target
  if (Date.now() - started < 50000) {
    await sleep(50000 - (Date.now() - started));
  }

  const video = page.video();
  await context.close();
  await browser.close();

  const rawVideoPath = await video.path();
  const targetVideoPath = join(outputDir, 'pwa-install-guide.mp4');
  const offset = Math.max(0, (started - recordingStarted) / 1000);

  console.log(`Encoding 1080x1920 30fps H.264 video -> ${targetVideoPath}...`);
  execFileSync(ffmpeg, [
    '-y',
    '-ss', String(offset),
    '-i', rawVideoPath,
    '-t', '50',
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1',
    '-r', '30',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    targetVideoPath,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  console.log(`✅ Successfully generated: ${targetVideoPath}`);
  await rm(scratch, { recursive: true, force: true });
}

run().catch(err => {
  console.error('Recording execution failed:', err);
  process.exit(1);
});
