import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:4173';
const startCodes = ['continue', 'retire', 'reemploy', 'lighter', 'experience', 'newfield'];
const results = [];

function record(name, passed, detail = '') {
  results.push({ name, passed, detail });
  const prefix = passed ? 'PASS' : 'FAIL';
  console.log(`${prefix} | ${name}${detail ? ` | ${detail}` : ''}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') pageErrors.push(`console: ${message.text()}`);
  });

  for (const code of startCodes) {
    const name = `시작 유형 ${code} 전체 완주`;
    try {
      await page.goto(`${baseURL}/career-explorer/senior/?start=${code}`, { waitUntil: 'networkidle' });

      const activeCode = await page.locator('.start-card.is-active').getAttribute('data-code');
      assert(activeCode === code, `직접 진입 코드 불일치: ${activeCode}`);

      if (code === 'newfield') {
        await page.locator('input[name="condition-training"][value="required"]').check({ force: true });
      }
      if (code === 'lighter') {
        await page.locator('input[name="condition-hours"][value="required"]').check({ force: true });
        await page.locator('input[name="condition-physical"][value="required"]').check({ force: true });
      }

      await page.locator('#make-result').click();
      await page.locator('#result-panel:not([hidden])').waitFor();

      const pathCount = await page.locator('#path-results .path-card').count();
      const jobCount = await page.locator('#job-results .job-card').count();
      const narrativeCount = await page.locator('#integrated-narrative p').count();
      const actionCount = await page.locator('#next-actions li').count();

      assert(pathCount === 3, `경로 수 ${pathCount}`);
      assert(jobCount === 9, `직업 수 ${jobCount}`);
      assert(narrativeCount >= 4, `통합 결과문 문단 수 ${narrativeCount}`);
      assert(actionCount === 5, `다음 행동 수 ${actionCount}`);

      const pathNames = await page.locator('#path-results .path-card h3').allTextContents();
      assert(new Set(pathNames).size === 3, '중복 경로가 포함됨');

      if (code === 'newfield') {
        assert(pathNames[0].includes('새로운 분야') || pathNames[0].includes('교육 후'), `새 분야 우선 경로 불일치: ${pathNames[0]}`);
      }
      if (code === 'lighter') {
        assert(pathNames.some(value => value.includes('운영·사무') || value.includes('전수')), `강도 조정 경로 불일치: ${pathNames.join(', ')}`);
      }

      await page.locator('#show-report').click();
      await page.locator('#report-preview:not([hidden]) .report-sheet').waitFor();
      const reportSections = await page.locator('#report-preview .report-section').count();
      assert(reportSections === 6, `보고서 본문 구역 수 ${reportSections}`);

      await page.evaluate(() => {
        window.__printCalled = false;
        window.print = () => { window.__printCalled = true; };
      });
      await page.locator('#print-report').click();
      const printCalled = await page.evaluate(() => window.__printCalled === true);
      assert(printCalled, '인쇄 함수가 호출되지 않음');

      record(name, true, `3경로·9직업·보고서 ${reportSections}구역`);
    } catch (error) {
      record(name, false, error.message);
    }
  }

  try {
    await page.goto(`${baseURL}/career-explorer/senior/?start=continue`, { waitUntil: 'networkidle' });
    await page.locator('#industry').fill('A'.repeat(180));
    await page.locator('#career-note').fill('긴 입력 검증 '.repeat(80));
    await page.locator('#make-result').click();
    await page.locator('#result-panel:not([hidden])').waitFor();
    await page.locator('#restart').click();
    assert(await page.locator('#result-panel').getAttribute('hidden') !== null, '초기화 뒤 결과가 숨겨지지 않음');
    assert(await page.locator('#industry').inputValue() === '', '초기화 뒤 업종 입력이 남음');
    record('긴 입력과 초기화', true);
  } catch (error) {
    record('긴 입력과 초기화', false, error.message);
  }

  try {
    const mobile = await context.newPage();
    await mobile.setViewportSize({ width: 360, height: 800 });
    await mobile.goto(`${baseURL}/career-explorer/senior/?start=reemploy`, { waitUntil: 'networkidle' });
    await mobile.locator('#make-result').click();
    await mobile.locator('#result-panel:not([hidden])').waitFor();
    const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 1, `가로 넘침 ${overflow}px`);
    await mobile.close();
    record('모바일 360×800 가로 넘침', true);
  } catch (error) {
    record('모바일 360×800 가로 넘침', false, error.message);
  }

  try {
    const keyboard = await context.newPage();
    await keyboard.goto(`${baseURL}/career-explorer/senior/`, { waitUntil: 'networkidle' });
    await keyboard.locator('.start-card').first().focus();
    await keyboard.keyboard.press('Enter');
    const active = await keyboard.locator('.start-card.is-active').count();
    assert(active === 1, '키보드 Enter로 시작 유형을 선택하지 못함');
    await keyboard.close();
    record('키보드 시작 유형 선택', true);
  } catch (error) {
    record('키보드 시작 유형 선택', false, error.message);
  }

  try {
    await page.goto(`${baseURL}/career-explorer/`, { waitUntil: 'networkidle' });
    const youthTitle = await page.title();
    const youthH1 = await page.locator('h1').first().textContent();
    assert(/청소년|학과|관심/.test(`${youthTitle} ${youthH1}`), `청소년 화면 식별 실패: ${youthTitle} / ${youthH1}`);
    record('기존 청소년 화면 회귀 확인', true, youthTitle);
  } catch (error) {
    record('기존 청소년 화면 회귀 확인', false, error.message);
  }

  if (pageErrors.length) {
    record('콘솔·페이지 오류 없음', false, pageErrors.join(' | '));
  } else {
    record('콘솔·페이지 오류 없음', true);
  }

  const pdfPage = await context.newPage();
  try {
    await pdfPage.goto(`${baseURL}/career-explorer/senior/?start=experience`, { waitUntil: 'networkidle' });
    await pdfPage.locator('#make-result').click();
    await pdfPage.locator('#result-panel:not([hidden])').waitFor();
    await pdfPage.evaluate(() => { document.querySelector('#print-root').hidden = false; });
    await pdfPage.emulateMedia({ media: 'print' });
    const pdfPath = process.env.PDF_PATH || '/tmp/career-senior-s09.pdf';
    await pdfPage.pdf({ path: pdfPath, format: 'A4', printBackground: true, preferCSSPageSize: true });
    const stat = await fs.stat(pdfPath);
    assert(stat.size > 20_000, `PDF 크기가 너무 작음: ${stat.size}`);
    record('A4 PDF 파일 생성', true, `${stat.size} bytes`);
  } catch (error) {
    record('A4 PDF 파일 생성', false, error.message);
  } finally {
    await pdfPage.close();
  }

  const failed = results.filter(item => !item.passed);
  console.log(`\nTOTAL ${results.length} | PASS ${results.length - failed.length} | FAIL ${failed.length}`);
  if (failed.length) process.exitCode = 1;
} finally {
  await browser.close();
}
