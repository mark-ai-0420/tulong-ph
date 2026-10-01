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

  console.log('🚀 Launching Chrome to record Natural Pace Tutorial for TikTok / IG Voiceover (~55-60s)...');
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
  
  // Use local dev server hosting staging code
  const targetUrl = 'http://localhost:3000';
  console.log(`🌐 Navigating to ${targetUrl}...`);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  
  // Natural pause at the hero section
  console.log('⏱️ Beat 1 (0:00 - 0:05): Intro & Hero Section pause...');
  await page.waitForTimeout(3000);

  // Helper for natural, human-like typing with variable cadence
  async function typeHuman(selector, text, minDelay = 65, maxDelay = 110) {
    const el = await page.$(selector);
    if (!el) return;
    await el.click();
    await page.waitForTimeout(250);
    for (const char of text) {
      await page.keyboard.type(char);
      const delay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
      await page.waitForTimeout(delay);
    }
    await page.waitForTimeout(500);
  }

  // STEP 1: Fill Patient Details (0:05 - 0:15)
  console.log('📝 Beat 2 (0:05 - 0:15): Filling Patient Demographics & Senior Citizen...');
  await typeHuman('#patient-first-name', 'Juan');
  await typeHuman('#patient-last-name', 'Dela Cruz');
  
  // Birthday & Senior Toggle
  await page.fill('#patient-dob', '1955-08-15');
  await page.waitForTimeout(400);

  const seniorCheckbox = await page.$('#patient-is-senior');
  if (seniorCheckbox && !(await seniorCheckbox.isChecked())) {
    await seniorCheckbox.check();
  }
  await page.waitForTimeout(600);

  await typeHuman('#patient-city', 'Quezon City');
  await typeHuman('#patient-contact', '09171234567');
  await page.waitForTimeout(1000);

  // Click Next
  const nextBtn = await page.getByRole('button', { name: /Susunod: Detalye ng Ospital/i });
  await nextBtn.click();
  await page.waitForTimeout(2500);

  // STEP 2: Hospital & Diagnosis Setup (0:15 - 0:28)
  console.log('🏥 Beat 3 (0:15 - 0:28): Selecting Private Hospital, Bill, and Diagnosis...');
  
  // Select Private Hospital
  const privateCard = await page.getByRole('button', { name: /Private Hospital/i }).first();
  if (await privateCard.isVisible()) {
    await privateCard.click();
    await page.waitForTimeout(1000);
  }

  await typeHuman('#hospital-name', "St. Luke's Medical Center");
  await page.waitForTimeout(600);

  // Enter Total Bill
  console.log('💰 Entering ₱150,000 Hospital Bill...');
  await page.click('#total-bill');
  await page.waitForTimeout(200);
  await page.fill('#total-bill', '150000');
  await page.waitForTimeout(1200);

  // Select Pneumonia preset chip
  console.log('🩺 Selecting Pneumonia preset (38 PhilHealth Case Rates)...');
  const pneumoniaChip = await page.getByRole('button', { name: /Pneumonia/i }).first();
  if (await pneumoniaChip.isVisible()) {
    await pneumoniaChip.click();
    await page.waitForTimeout(1500);
  }

  // BEAT 4: THE MAGIC MOMENT - AUTO-COMPUTE (0:28 - 0:40)
  console.log('⚡ Beat 4 (0:28 - 0:40): Triggering 1-Click Auto-Compute & Statutory Breakdown...');
  const autoComputeBtn = await page.$('#btn-auto-compute');
  if (autoComputeBtn) {
    await autoComputeBtn.click();
    // Generous pause to register the instant number calculation
    await page.waitForTimeout(2500);
  }

  // Smooth scroll down to showcase the Statutory Breakdown Card
  console.log('📜 Lingering on Statutory Breakdown Card (RA 9994 / RA 10754)...');
  await page.mouse.wheel(0, 340);
  // 5 full seconds breathing room for voiceover explanation!
  await page.waitForTimeout(5000);

  // BEAT 5: GENERATE ROADMAP (0:40 - 0:50)
  console.log('🗺️ Beat 5 (0:40 - 0:50): Generating Aid Stacking Plan...');
  const planBtn = await page.getByRole('button', { name: /Gumawa ng Aid Stacking Plan/i });
  await planBtn.click();
  await page.waitForTimeout(3000);

  // Scroll into the 5-pillar sequence & Private Hospital routing
  console.log('📊 Demonstrating Aid Stacking Sequence & Private Routing...');
  await page.mouse.wheel(0, 380);
  await page.waitForTimeout(3500);

  // BEAT 6: VISUAL INFOGRAPHIC & WRAP-UP (0:50 - 0:58)
  console.log('🎨 Beat 6 (0:50 - 0:58): Opening Visual Infographic...');
  const infoBtn = await page.getByRole('button', { name: /Tingnan ang Visual Infographic/i }).first();
  if (await infoBtn.isVisible()) {
    await infoBtn.click();
    await page.waitForTimeout(3500);

    // Smooth scroll inside modal
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(3000);

    // Close Infographic cleanly via Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
  }

  // Final hold on the summary
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(2500);

  console.log('🎬 Wrapping up natural-pace recording...');
  const video = page.video();
  await page.close();
  await context.close();
  await browser.close();

  const webmPath = await video.path();
  console.log('✅ Raw WebM recorded at:', webmPath);

  const finalMp4Path = path.join(videoDir, 'tulongph-autocompute-natural-pace.mp4');
  console.log('🔄 Converting to mobile-friendly MP4 (H.264) via ffmpeg...');
  try {
    execSync(`"${ffmpegPath}" -y -i "${webmPath}" -c:v libx264 -pix_fmt yuv420p -preset fast -crf 23 -movflags +faststart "${finalMp4Path}"`, {
      stdio: 'inherit',
    });
    console.log('🎉 SUCCESS! Natural Pace MP4 Video ready at:', finalMp4Path);
  } catch (err) {
    console.error('Conversion note:', err.message);
  }
}

run().catch(err => {
  console.error('Recording error:', err);
  process.exit(1);
});
