// Run: FFPROBE_PATH=/path/to/ffprobe node scripts/record-social-use-cases.mjs
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import { chromium } from 'playwright-core';
import ffmpeg from 'ffmpeg-static';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'videos/social-campaign');
const base = 'http://localhost:3000';
const probe = process.env.FFPROBE_PATH || 'ffprobe';
const sleep = ms => new Promise(r => setTimeout(r, ms));
let server;
let browser;
let scratch;
let stopping = false;
let sceneStarted;
async function until(seconds) { await sleep(Math.max(0, seconds * 1000 - (Date.now() - sceneStarted))); }
async function cleanup() {
  await browser?.close().catch(() => {});
  if (server) {
    // A separate process group contains only the server launched by this runner.
    try { process.kill(-server.pid, 'SIGTERM'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
    await sleep(500);
    try { process.kill(-server.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  if (scratch) await rm(scratch, { recursive: true, force: true });
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  if (stopping) return;
  stopping = true;
  void cleanup().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
});
async function ready() {
  const response = await fetch(base, { signal: AbortSignal.timeout(2500) });
  return response.ok && (await response.text()).includes('TulongPH');
}
async function startServer() {
  const occupied = await new Promise(resolvePort => {
    const socket = net.connect(3000, 'localhost');
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.destroy(); resolvePort(true); });
    socket.once('error', () => resolvePort(false));
    socket.once('timeout', () => { socket.destroy(); resolvePort(false); });
  });
  if (occupied) {
    assert.ok(await ready(), 'Port 3000 is occupied by something other than a ready TulongPH server');
    console.log('Reusing existing TulongPH server; it will remain running.');
    return;
  }
  server = spawn('pnpm', ['run', 'dev', '--port', '3000'], { cwd: root, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  server.stdout.on('data', chunk => { log = (log + chunk).slice(-4000); });
  server.stderr.on('data', chunk => { log = (log + chunk).slice(-4000); });
  server.on('error', error => { log += error.message; });
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await ready().catch(() => false)) return;
    if (server.exitCode !== null) throw new Error(`Dev server stopped: ${log}`);
    await sleep(500);
  }
  throw new Error(`Dev server readiness timeout: ${log}`);
}
async function type(page, selector, value) {
  const field = page.locator(selector);
  await field.scrollIntoViewIfNeeded();
  await field.fill('');
  await field.pressSequentially(String(value), { delay: 45 });
  await sleep(160);
}
async function show(locator, ms = 1500) {
  await locator.scrollIntoViewIfNeeded();
  await sleep(ms);
}
async function next(page) { await page.locator('button[type="submit"]').click(); await sleep(450); }
async function contains(page, text) {
  await page.getByText(text, { exact: false }).first().waitFor();
}
async function medical(page) {
  await type(page, '#patient-first-name', 'Juan');
  await type(page, '#patient-last-name', 'Dela Cruz');
  await page.locator('#patient-dob').fill('1957-08-15');
  await page.locator('#patient-is-senior').check();
  await type(page, '#patient-contact', '09000000000');
  await type(page, '#patient-province', 'Metro Manila');
  await type(page, '#patient-city', 'Quezon City');
  await until(10);
  await next(page);
  await page.getByRole('button', { name: /Public - DOH Retained/ }).click();
  await type(page, '#hospital-name', 'Lung Center of the Philippines');
  await page.locator('#hospital-suggestions-list button').first().click();
  await type(page, '#case-diagnosis', 'Severe Pneumonia');
  await type(page, '#total-bill', '150000');
  await page.locator('#btn-auto-compute').click();
  assert.equal(Number(await page.locator('#philhealth-deduction').inputValue()), 90100);
  assert.equal(Number(await page.locator('#senior-pwd-discount').inputValue()), 30000);
  assert.match(await page.locator('#net-remaining-amount').innerText(), /29,900/);
  await show(page.locator('#net-remaining-balance'), 3500);
  await until(25);
  await next(page);
  await show(page.locator('#roadmap-search'), 2000);
  for (const term of ['PhilHealth', 'Malasakit', 'PCSO', 'DSWD (Gamot)']) {
    await page.getByRole('button', { name: term, exact: true }).click();
    await page.mouse.wheel(0, 500);
    await sleep(2200);
  }
  await page.getByRole('button', { name: 'Lahat', exact: true }).click();
  await show(page.locator('#roadmap-search'), 2500);
  await until(48);
}
async function education(page) {
  await page.selectOption('#edu-level', 'college');
  await page.selectOption('#edu-school-type', 'suc_luc');
  await page.locator('#edu-tuition').fill('0');
  await page.locator('#edu-gwa').fill('96');
  await page.locator('#edu-year').fill('1');
  await page.locator('#edu-age').fill('18');
  await type(page, '#edu-school-search', 'Batangas State University');
  await page.locator('#edu-school-search').press('Enter');
  assert.equal(await page.locator('#edu-tuition').inputValue(), '0');
  assert.equal(await page.locator('#edu-gwa').inputValue(), '96');
  await show(page.locator('#edu-gwa'));
  await until(9);
  await next(page);
  await type(page, '#edu-degree-program', 'Nursing');
  await page.locator('#edu-degree-program').press('Enter');
  await type(page, '#edu-income', '180000');
  await page.locator('#edu-incoming').check();
  await page.locator('#edu-priority-course').check();
  await until(16);
  await next(page);
  await contains(page, '80,000');
  await show(page.getByText('80,000', { exact: false }).first(), 2500);
  await until(23);
  await page.getByText('Pang-monitor ng Grado', { exact: false }).click();
  await page.getByRole('button', { name: '+ Magdagdag ng semestre', exact: true }).click();
  await type(page, '#gwa-academic-year', '2025-2026');
  await page.locator('#gwa-scale').selectOption('one_to_five');
  await type(page, '#gwa-grade', '1.25');
  await type(page, '#gwa-units-enrolled', '24');
  await type(page, '#gwa-units-passed', '24');
  await type(page, '#gwa-expected', '40000');
  await type(page, '#gwa-received', '40000');
  await type(page, '#gwa-notes', 'BS Nursing. Demo total includes books.');
  await page.getByRole('button', { name: 'I-save ang term', exact: true }).click();
  await contains(page, 'Retained');
  await show(page.locator('#gwa-tracker-title'), 2000);
  await show(page.getByText('Retained', { exact: true }).last(), 2000);
  await until(40);
  await page.getByRole('button', { name: /Buksan ang printable scholarship packet/ }).click();
  await type(page, '#edu-print-name', 'Maria Santos');
  await show(page.getByText('Form 138', { exact: false }).first(), 1500);
  await until(48);
}
async function worker(page) {
  await page.locator('input[name="worker-scenario"][value="wages"]').check();
  await page.locator('#worker-sector').selectOption('displaced');
  await type(page, '#worker-monthlySalary', '19630');
  await type(page, '#worker-age', '42');
  await until(7);
  await next(page);
  await page.locator('#worker-payrollSchedule').selectOption('six_day_week');
  await type(page, '#worker-regionalDailyWage', '755');
  await type(page, '#worker-unpaidDays', '5');
  await page.locator('#worker-separationCause').selectOption('retrenchment_closure');
  await type(page, '#worker-yearsOfService', '6');
  for (const key of ['monthsWorkedInCurrentYear', 'unusedServiceIncentiveLeaveDays', 'unpaidOvertimeHours', 'unpaidHolidayDays']) await type(page, `#worker-${key}`, '0');
  await contains(page, '58,890');
  await contains(page, '3,775');
  await contains(page, '62,665');
  await show(page.getByText('62,665', { exact: false }).first(), 2500);
  await until(22);
  await next(page);
  await page.getByRole('button', { name: /SEnA|SENA/ }).filter({ hasText: /worksheet|tantiya|claim|Ilipat/i }).first().click();
  await type(page, '#worker-print-name', 'Danilo Reyes');
  assert.match(await page.locator('#worker-print-unpaid').inputValue(), /TOTAL ESTIMATED SENA CLAIM:/);
  await show(page.locator('#worker-print-unpaid'), 2000);
  await until(30);
  await page.getByRole('button', { name: /Gabay at Kompyutasyon|Gabay$/ }).first().click();
  await page.locator('input[name="worker-scenario"][value="unemployment"]').check();
  await type(page, '#worker-contributionMonths', '72');
  await next(page);
  await type(page, '#worker-unemploymentAverageMonthlySalaryCredit', '20000');
  await type(page, '#worker-unemploymentRecentContributions', '12');
  await page.locator('#worker-involuntarilySeparated').check();
  await next(page);
  await show(page.locator('[data-testid="worker-unemployment-total"]'), 1800);
  assert.match(await page.locator('[data-testid="worker-unemployment-total"]').innerText(), /20,000/);
  await show(page.getByText('TUPAD work-pay illustration:', { exact: false }).first(), 1500);
  await until(48);
}
const scenarios = [
  ['medical-aid-stacking', '/', medical],
  ['education-scholarship', '/edukasyon', education],
  ['worker-rights-aid', '/manggagawa', worker],
];
function validateManifest(manifest) {
  assert.equal(manifest.status, 'DRAFT_PENDING_USER_APPROVAL');
  assert.equal(manifest.entries.length, 9);
  assert.equal(new Set(manifest.entries.map(e => `${e.platform}/${e.pillar}`)).size, 9);
  for (const entry of manifest.entries) {
    assert.ok(['medical', 'education', 'worker'].includes(entry.pillar));
    assert.ok(['threads', 'tiktok', 'youtube_shorts'].includes(entry.platform));
    const count = entry.platform === 'youtube_shorts' ? entry.title.length : entry.caption_body.length;
    assert.equal(entry.character_count, count);
    assert.ok(count < ({ threads: 500, tiktok: 2200, youtube_shorts: 100 })[entry.platform]);
    assert.ok(entry.official_sources.length > 0 && entry.cua_execution_instructions.length > 0);
    assert.ok(entry.video_asset_path.startsWith('videos/social-campaign/') && entry.video_asset_path.endsWith('.mp4'));
    assert.ok(!JSON.stringify(entry).includes('\u2014'));
  }
}
async function main() {
  if (process.argv.includes('--validate')) {
    validateManifest(JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8')));
    console.log('Manifest: 9 unique payloads; strict character counts passed.');
    return;
  }
  execFileSync(probe, ['-version'], { stdio: 'ignore' });
  assert.equal(process.platform, 'darwin', 'Server process-group cleanup currently targets macOS/POSIX');
  await mkdir(output, { recursive: true });
  scratch = await mkdtemp(join(tmpdir(), 'tulong-social-'));
  await startServer();
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const warmup = await browser.newPage();
  for (const [, route] of scenarios) await warmup.goto(base + route);
  await warmup.close();
  const results = [];
  for (const [name, route, walkthrough] of scenarios) {
    console.log(`Recording ${name}`);
    const context = await browser.newContext({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      recordVideo: { dir: scratch, size: { width: 540, height: 960 } } });
    const recordingStarted = Date.now();
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.goto(base + route);
    await page.locator('form').first().waitFor();
    await sleep(1000);
    const started = Date.now();
    sceneStarted = started;
    try { await walkthrough(page); } catch (error) {
      await page.screenshot({ path: join(tmpdir(), `${name}-failure.png`) });
      await writeFile(join(tmpdir(), `${name}-failure.txt`), await page.locator('body').innerText());
      throw error;
    }
    const elapsed = (Date.now() - started) / 1000;
    assert.ok(elapsed <= 53, `${name} walkthrough took ${elapsed.toFixed(1)}s; shorten actions before recording`);
    await sleep(Math.max(0, 50000 - (Date.now() - started)));
    await page.screenshot({ path: join(scratch, `${name}-final.png`) });
    const video = page.video();
    await context.close();
    const raw = await video.path();
    const target = join(output, `${name}.mp4`);
    // Remove navigation/warmup, preserving every walkthrough action in real time.
    const offset = (started - recordingStarted) / 1000;
    execFileSync(ffmpeg, ['-y', '-ss', String(offset), '-i', raw, '-t', '50', '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1', '-r', '30', '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', target], { stdio: ['ignore', 'ignore', 'pipe'] });
    const info = JSON.parse(execFileSync(probe, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', target]));
    const stream = info.streams.find(s => s.codec_type === 'video');
    assert.equal(stream?.codec_name, 'h264');
    assert.equal(stream.width, 1080); assert.equal(stream.height, 1920);
    assert.equal(stream.avg_frame_rate, '30/1');
    assert.ok(Number(info.format.duration) >= 45 && Number(info.format.duration) <= 55);
    results.push({ file: `${name}.mp4`, width: stream.width, height: stream.height, codec: stream.codec_name, fps: stream.avg_frame_rate, duration: Number(info.format.duration), live_assertions: 'passed' });
    console.log(results.at(-1));
  }
  await writeFile(join(output, 'media-verification.json'), JSON.stringify({ verified_at: new Date().toISOString(), videos: results }, null, 2) + '\n');
}
try { await main(); } finally { await cleanup(); }
