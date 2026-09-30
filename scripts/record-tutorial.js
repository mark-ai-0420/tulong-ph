const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const ffmpegPath = require('ffmpeg-static');

async function run() {
  const videoDir = path.join(__dirname, '../videos');
  if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
  }

  console.log('🚀 Launching Chrome to record Scenario 1 Tutorial...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    recordVideo: {
      dir: videoDir,
      size: { width: 414, height: 896 },
    },
  });

  const page = await context.newPage();
  
  console.log('🌐 Navigating to https://tulongph.vercel.app...');
  await page.goto('https://tulongph.vercel.app', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Helper for human-like typing
  async function typeHuman(selector, text, delay = 45) {
    const el = await page.$(selector);
    if (!el) return;
    await el.click();
    await page.waitForTimeout(150);
    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(delay);
    }
    await page.waitForTimeout(300);
  }

  // STEP 1: Fill Patient Details
  console.log('📝 Filling Step 1: Patient details...');
  await typeHuman('#patient-first-name', 'Juan');
  await typeHuman('#patient-last-name', 'Dela Cruz');
  await typeHuman('#patient-contact', '09171234567');
  await typeHuman('#patient-city', 'Quezon City');
  await page.waitForTimeout(800);

  // Click Next
  const nextBtn = await page.getByRole('button', { name: /Susunod: Detalye ng Ospital/i });
  await nextBtn.click();
  await page.waitForTimeout(1500);

  // STEP 2: Hospital & Bill Details
  console.log('🏥 Filling Step 2: Hospital & ₱350,000 Bill details...');
  await typeHuman('#case-diagnosis', 'Coronary Artery Disease - Open Heart');
  await page.waitForTimeout(400);

  await typeHuman('#hospital-name', 'Philippine Heart Center');
  await page.waitForTimeout(400);

  // Set amounts
  await page.fill('#total-bill', '350000');
  await page.waitForTimeout(500);

  await page.fill('#philhealth-deduction', '45000');
  await page.waitForTimeout(500);

  await page.fill('#senior-pwd-discount', '30000');
  await page.waitForTimeout(1000);

  // Submit Step 2 to generate Roadmap
  console.log('⚡ Generating Aid Stacking Plan...');
  const planBtn = await page.getByRole('button', { name: /Gumawa ng Aid Stacking Plan/i });
  await planBtn.click();
  await page.waitForTimeout(2500);

  // STEP 3: Roadmap Walkthrough
  console.log('📊 Demonstrating Aid Stacking Roadmap...');
  // Smooth scroll down to 5-pillar sequence
  await page.mouse.wheel(0, 300);
  await page.waitForTimeout(2000);

  // Open Visual Infographic
  console.log('🎨 Opening Visual Infographic...');
  const infoBtn = await page.getByRole('button', { name: /Tingnan ang Visual Infographic/i }).first();
  if (await infoBtn.isVisible()) {
    await infoBtn.click();
    await page.waitForTimeout(3500);

    // Scroll infographic modal
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(2500);

    // Close Infographic via Escape key or back button
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
  }

  // Open PACe (Malacañang) Toolkit
  console.log('🏛️ Opening PACe (Malacañang) Toolkit...');
  await page.mouse.wheel(0, 450);
  await page.waitForTimeout(1500);

  const paceBtn = await page.getByRole('button', { name: /Buksan ang PACe Toolkit/i });
  if (await paceBtn.isVisible()) {
    await paceBtn.click();
    await page.waitForTimeout(3500);

    // Scroll down inside PACe modal to show Letter of Appeal to President
    await page.mouse.wheel(0, 350);
    await page.waitForTimeout(3000);

    // Close PACe modal via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1200);
  }

  // Final smooth scroll to show checklist & summary
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(2500);

  console.log('🎬 Wrapping up recording...');
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const webmPath = await video.path();
  console.log('✅ Raw WebM recorded at:', webmPath);

  const finalMp4Path = path.join(videoDir, 'tulongph-scenario1-tutorial.mp4');
  console.log('🔄 Converting to mobile-friendly MP4 (H.264) via ffmpeg...');
  try {
    execSync(`"${ffmpegPath}" -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -movflags +faststart "${finalMp4Path}"`, {
      stdio: 'inherit',
    });
    console.log('🎉 SUCCESS! MP4 Video ready at:', finalMp4Path);
  } catch (err) {
    console.error('Conversion note:', err.message);
  }
}

run().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});
