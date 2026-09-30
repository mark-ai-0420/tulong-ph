import { chromium } from 'playwright-core';
import assert from 'node:assert';

async function runE2ETests() {
  console.log('🚀 Starting Automated E2E Browser & DOM Test Suite on http://localhost:3000...');

  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  try {
    // -------------------------------------------------------------
    // Test 1: Desktop Viewport (1280x800) - Full Auto-Compute Flow
    // -------------------------------------------------------------
    console.log('\n🖥️ [Test 1] Testing Desktop Viewport (1280px)...');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const page = await desktopContext.newPage();
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

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

    await page.fill('#patient-barangay', 'Barangay 1');
    await page.fill('#patient-city', 'Quezon City');
    await page.fill('#patient-contact', '09171234567');

    // Advance to Step 2
    const nextBtn = await page.$('button[type="submit"]:has-text("Susunod")');
    assert.ok(nextBtn, 'Next button should be found on Step 1');
    await nextBtn.click();
    await page.waitForTimeout(800);

    // Verify Step 2 is rendered by waiting for #case-diagnosis
    const diagInput = await page.waitForSelector('#case-diagnosis', { timeout: 5000 });
    assert.ok(diagInput, 'Step 2 Medical Case diagnosis input should be visible');

    // Select Private Hospital
    const privateHospitalCard = await page.$('button:has-text("Private Hospital")');
    assert.ok(privateHospitalCard, 'Private Hospital card button should exist');
    await privateHospitalCard.click();
    await page.waitForTimeout(400);

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
    await mobilePage.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
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
    await mobilePage.fill('#patient-barangay', 'Barangay 2');
    await mobilePage.fill('#patient-city', 'Manila');
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

    console.log('\n🎉 ALL AUTOMATED E2E & STATUTORY TESTS PASSED WITH 0 ERRORS!\n');
  } finally {
    await browser.close();
  }
}

runE2ETests().catch((err) => {
  console.error('\n❌ E2E Test Failure:', err);
  process.exit(1);
});
