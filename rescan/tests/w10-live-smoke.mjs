import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const BASE_URL = (process.env.BASE_URL || 'https://4th-season.com').replace(/\/$/, '');
const ARTIFACT_DIR = 'rescan/tests/artifacts';
const IDS = ['self-efficacy', 'perfectionism', 'self-criticism', 'resilience', 'life-satisfaction'];
const TITLES = ['자기효능감', '완벽주의', '자기비난', '회복탄력성', '삶의 만족도'];
const ARTICLE_IDS = [
  'emotion-regulation',
  'anxiety-signals',
  'depressive-signals',
  'anger-regulation',
  'emotional-expression',
  ...IDS,
];

const report = {
  baseUrl: BASE_URL,
  startedAt: new Date().toISOString(),
  staticChecks: [],
  desktopChecks: [],
  mobileChecks: [],
  consoleErrors: [],
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchText(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const response = await fetch(url, {
    redirect: 'follow',
    cache: 'no-store',
    ...options,
  });
  return { response, text: await response.text(), url };
}

async function waitForDeployment() {
  const attempts = Number(process.env.DEPLOY_ATTEMPTS || 18);
  const delayMs = Number(process.env.DEPLOY_DELAY_MS || 10000);
  let lastMessage = '';

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const { response, text } = await fetchText('/rescan/data/index.json');
      if (!response.ok) throw new Error(`index HTTP ${response.status}`);
      const data = JSON.parse(text);
      const ids = new Set((data.items || []).map((item) => item.id));
      const missing = IDS.filter((id) => !ids.has(id));
      if (missing.length) throw new Error(`배포 목록 미반영: ${missing.join(', ')}`);

      const app = await fetchText('/rescan/assets/js/app.js');
      if (!app.response.ok) throw new Error(`app.js HTTP ${app.response.status}`);
      if (!app.text.includes('result-category-meter') || !app.text.includes('actionBlock')) {
        throw new Error('최신 결과 화면 코드가 아직 배포되지 않음');
      }

      console.log(`Deployment ready on attempt ${attempt}.`);
      return;
    } catch (error) {
      lastMessage = error.message;
      console.log(`Waiting for deployment (${attempt}/${attempts}): ${lastMessage}`);
      if (attempt < attempts) await sleep(delayMs);
    }
  }

  throw new Error(`배포 대기 시간 초과: ${lastMessage}`);
}

function validateRanges(results, expectedMax) {
  assert.ok(Array.isArray(results) && results.length > 0, '결과 구간이 비어 있음');
  const sorted = [...results].sort((a, b) => a.min - b.min);
  assert.equal(sorted[0].min, 0, '결과 구간 시작점 불일치');
  assert.equal(sorted.at(-1).max, expectedMax, '결과 구간 종료점 불일치');
  for (let index = 1; index < sorted.length; index += 1) {
    assert.equal(sorted[index].min, sorted[index - 1].max + 1, '결과 구간 중복 또는 누락');
  }
}

async function runStaticChecks() {
  const home = await fetchText('/rescan/');
  assert.equal(home.response.status, 200, 'Re:Scan 홈 HTTP 오류');
  assert.match(home.text, /심리 검사/, 'Re:Scan 홈 본문 누락');
  report.staticChecks.push({ name: 'home', status: home.response.status });

  const indexResult = await fetchText('/rescan/data/index.json');
  assert.equal(indexResult.response.status, 200, 'index.json HTTP 오류');
  const index = JSON.parse(indexResult.text);
  const published = (index.items || []).filter((item) => item.status === 'published');
  assert.ok(published.length >= 16, `공개 체크리스트 수 부족: ${published.length}`);
  assert.equal(new Set(index.items.map((item) => item.id)).size, index.items.length, 'index id 중복');

  for (const id of IDS) {
    const item = index.items.find((entry) => entry.id === id);
    assert.ok(item, `${id} index 등록 누락`);
    assert.equal(item.status, 'published', `${id} published 상태 아님`);

    const dataResult = await fetchText(item.dataPath);
    assert.equal(dataResult.response.status, 200, `${id} 데이터 HTTP 오류`);
    const data = JSON.parse(dataResult.text);
    assert.equal(data.id, id, `${id} 데이터 식별자 불일치`);
    assert.equal(data.questions.length, 12, `${id} 문항 수 불일치`);
    assert.equal(new Set(data.questions.map((question) => question.id)).size, 12, `${id} 문항 id 중복`);
    assert.equal(data.categories.length, 4, `${id} 영역 수 불일치`);
    assert.equal(data.scale.length, 4, `${id} 응답 척도 수 불일치`);
    validateRanges(data.results, 36);
    assert.ok(data.categoryGuides && Object.keys(data.categoryGuides).length === 4, `${id} 영역 안내 누락`);
    assert.ok(data.results.every((result) => Array.isArray(result.actions) && result.actions.length > 0), `${id} 행동 제안 누락`);

    const articleResult = await fetchText(item.articlePath);
    assert.equal(articleResult.response.status, 200, `${id} 안내 HTML HTTP 오류`);
    assert.match(articleResult.text, new RegExp(`checklist\\.html\\?id=${id}`), `${id} 정식 점검 링크 누락`);

    report.staticChecks.push({
      name: id,
      mode: data.mode,
      questionCount: data.questions.length,
      articleStatus: articleResult.response.status,
      dataStatus: dataResult.response.status,
    });
  }

  const sitemapResult = await fetchText('/sitemap.xml');
  assert.equal(sitemapResult.response.status, 200, 'sitemap HTTP 오류');
  for (const id of ARTICLE_IDS) {
    assert.ok(sitemapResult.text.includes(`/rescan/tistory/${id}.html`), `sitemap 누락: ${id}`);
  }
  report.staticChecks.push({ name: 'sitemap', articleCountChecked: ARTICLE_IDS.length });
}

function attachPageDiagnostics(page, label) {
  page.on('console', (message) => {
    if (message.type() === 'error') {
      report.consoleErrors.push({ label, type: 'console', text: message.text() });
    }
  });
  page.on('pageerror', (error) => {
    report.consoleErrors.push({ label, type: 'pageerror', text: error.message });
  });
}

async function completeChecklist(page, id, viewportLabel) {
  const url = `${BASE_URL}/rescan/checklist.html?id=${encodeURIComponent(id)}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.locator('.question-card').first().waitFor({ state: 'visible', timeout: 30000 });
  assert.equal(await page.locator('.question-card').count(), 12, `${id} 브라우저 문항 수 불일치`);

  const cards = page.locator('.question-card');
  for (let index = 0; index < await cards.count(); index += 1) {
    await cards.nth(index).locator('input[type="radio"]').last().check({ force: true });
  }

  await page.locator('#rescan-form button[type="submit"]').click();
  await page.locator('.result-view').waitFor({ state: 'visible', timeout: 15000 });

  assert.equal(await page.locator('.result-category-item').count(), 4, `${id} 영역 결과 수 불일치`);
  assert.equal(await page.locator('.result-category-meter').count(), 4, `${id} 영역 진행 막대 누락`);
  assert.equal(await page.locator('.result-category-guide').count(), 4, `${id} 영역 안내 누락`);
  assert.equal(await page.locator('.action-block').count(), 1, `${id} 행동 제안 블록 누락`);
  assert.equal(await page.locator('.result-method').count(), 1, `${id} 계산 안내 블록 누락`);
  assert.ok((await page.locator('.reflection-list li').count()) >= 2, `${id} 성찰 질문 누락`);
  assert.ok((await page.locator('.action-list li').count()) >= 2, `${id} 행동 제안 항목 부족`);

  const scoreText = (await page.locator('.result-summary > strong').innerText()).trim();
  assert.match(scoreText, /\d+점/, `${id} 총점 표시 누락`);

  await page.screenshot({
    path: `${ARTIFACT_DIR}/${viewportLabel}-${id}.png`,
    fullPage: true,
  });

  return {
    id,
    title: (await page.locator('.result-summary h2').innerText()).trim(),
    score: scoreText,
    categories: await page.locator('.result-category-item').count(),
    actions: await page.locator('.action-list li').count(),
  };
}

async function runBrowserChecks() {
  const browser = await chromium.launch({ headless: true });
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const homePage = await desktop.newPage();
    attachPageDiagnostics(homePage, 'desktop-home');
    await homePage.goto(`${BASE_URL}/rescan/`, { waitUntil: 'networkidle', timeout: 60000 });

    await homePage.locator('#topic-search').fill('자기효능감');
    await homePage.waitForTimeout(200);
    assert.equal(await homePage.locator('#checklist-list .card').count(), 1, '검색 결과 개수 불일치');
    assert.match(await homePage.locator('#checklist-list .card h3').innerText(), /자기효능감/, '검색 결과 제목 불일치');

    await homePage.locator('#topic-reset').click();
    const selfCategory = homePage.locator('#topic-filters button[data-category="자기이해"]');
    await selfCategory.waitFor({ state: 'visible', timeout: 10000 });
    await selfCategory.click();
    const selfTitles = await homePage.locator('#checklist-list .card h3').allInnerTexts();
    for (const title of TITLES) assert.ok(selfTitles.includes(title), `자기이해 필터 누락: ${title}`);
    report.desktopChecks.push({ name: 'home-search-filter', visibleTitles: selfTitles });
    await homePage.screenshot({ path: `${ARTIFACT_DIR}/desktop-home-self-category.png`, fullPage: true });

    for (const id of IDS) {
      const page = await desktop.newPage();
      attachPageDiagnostics(page, `desktop-${id}`);
      const result = await completeChecklist(page, id, 'desktop');
      report.desktopChecks.push(result);
      await page.close();
    }
    await desktop.close();

    const mobile = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true });
    const mobilePage = await mobile.newPage();
    attachPageDiagnostics(mobilePage, 'mobile-life-satisfaction');
    await mobilePage.goto(`${BASE_URL}/rescan/checklist.html?id=life-satisfaction`, { waitUntil: 'networkidle', timeout: 60000 });
    await mobilePage.locator('.question-card').first().waitFor({ state: 'visible', timeout: 30000 });
    const layoutBefore = await mobilePage.evaluate(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(layoutBefore.scrollWidth <= layoutBefore.viewport + 1, `모바일 가로 넘침: ${JSON.stringify(layoutBefore)}`);

    const mobileResult = await completeChecklist(mobilePage, 'life-satisfaction', 'mobile');
    const layoutAfter = await mobilePage.evaluate(() => ({
      viewport: window.innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    assert.ok(layoutAfter.scrollWidth <= layoutAfter.viewport + 1, `모바일 결과 가로 넘침: ${JSON.stringify(layoutAfter)}`);
    report.mobileChecks.push({ ...mobileResult, layoutBefore, layoutAfter });
    await mobile.close();
  } finally {
    await browser.close();
  }

  assert.equal(report.consoleErrors.length, 0, `브라우저 오류 발생: ${JSON.stringify(report.consoleErrors)}`);
}

async function main() {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  try {
    await waitForDeployment();
    await runStaticChecks();
    await runBrowserChecks();
    report.status = 'passed';
  } catch (error) {
    report.status = 'failed';
    report.error = error.stack || error.message;
    throw error;
  } finally {
    report.finishedAt = new Date().toISOString();
    await writeFile(`${ARTIFACT_DIR}/w10-live-smoke-report.json`, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
