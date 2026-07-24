import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseURL = process.env.LIVE_BASE_URL || 'https://4th-season.com';
const maxAttempts = Number(process.env.LIVE_MAX_ATTEMPTS || 36);
const delayMs = Number(process.env.LIVE_DELAY_MS || 10000);
const resultPath = process.env.LIVE_RESULT_PATH || '/tmp/career-senior-live-result.json';
const screenshotPath = process.env.LIVE_SCREENSHOT_PATH || '/tmp/career-senior-live.png';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const browser = await chromium.launch({ headless: true });
let lastError = null;

try {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    try {
      await page.goto(`${baseURL}/career-explorer/senior/`, { waitUntil: 'networkidle', timeout: 30000 });
      assert((await page.title()).includes('중장년·시니어'), `시니어 제목 불일치: ${await page.title()}`);
      assert(await page.locator('.start-card').count() === 6, '시작 유형 6개가 보이지 않음');

      await page.goto(`${baseURL}/career-explorer/?audience=senior&start=experience`, { waitUntil: 'networkidle', timeout: 30000 });
      const redirected = new URL(page.url());
      assert(redirected.pathname.endsWith('/career-explorer/senior/'), `통합 진입 리디렉션 실패: ${page.url()}`);
      assert(await page.locator('.start-card.is-active').getAttribute('data-code') === 'experience', 'start 값 전달 실패');

      await page.locator('#make-result').click();
      await page.locator('#result-panel:not([hidden])').waitFor({ timeout: 15000 });
      assert(await page.locator('#path-results .path-card').count() === 3, '공개 화면 경로 수 불일치');
      assert(await page.locator('#job-results .job-card').count() === 9, '공개 화면 직업 수 불일치');

      await page.screenshot({ path: screenshotPath, fullPage: true });

      await page.goto(`${baseURL}/career-explorer/`, { waitUntil: 'networkidle', timeout: 30000 });
      assert((await page.title()).includes('청소년'), `기존 청소년 제목 불일치: ${await page.title()}`);
      assert(pageErrors.length === 0, `페이지 오류: ${pageErrors.join(' | ')}`);

      const result = {
        verifiedAt: new Date().toISOString(),
        baseURL,
        attempt,
        seniorDirect: `${baseURL}/career-explorer/senior/`,
        seniorIntegrated: `${baseURL}/career-explorer/?audience=senior&start=experience`,
        youth: `${baseURL}/career-explorer/`,
        paths: 3,
        jobs: 9,
        status: 'passed'
      };
      await fs.writeFile(resultPath, JSON.stringify(result, null, 2), 'utf8');
      console.log(JSON.stringify(result, null, 2));
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt}/${maxAttempts} failed: ${error.message}`);
      if (attempt < maxAttempts) await sleep(delayMs);
    } finally {
      await context.close();
    }
  }

  if (lastError) throw lastError;
} finally {
  await browser.close();
}
