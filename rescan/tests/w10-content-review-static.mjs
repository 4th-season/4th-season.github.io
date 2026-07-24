import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const IDS = ['self-efficacy', 'perfectionism', 'self-criticism', 'resilience', 'life-satisfaction'];
const ROOT = new URL('../', import.meta.url);
const readJson = async (relativePath) => JSON.parse(await readFile(new URL(relativePath, ROOT), 'utf8'));

const index = await readJson('data/index.json');
assert.equal(index.schemaVersion, '1.4.1', 'index schemaVersion 불일치');
assert.equal(new Set(index.items.map((item) => item.id)).size, index.items.length, 'index id 중복');

for (const id of IDS) {
  const item = index.items.find((entry) => entry.id === id);
  assert.ok(item, `${id}: index 항목 누락`);
  assert.equal(item.status, 'published', `${id}: published 상태 아님`);
  const data = await readJson(`data/checklists/${id}.json`);
  assert.equal(data.id, id, `${id}: 데이터 id 불일치`);
  assert.equal(data.schemaVersion, '1.2.0', `${id}: 내용 재검토 버전 불일치`);
  assert.equal(data.questions.length, 12, `${id}: 문항 수 불일치`);
  assert.equal(data.categories.length, 4, `${id}: 영역 수 불일치`);
  assert.equal(data.scale.length, 4, `${id}: 척도 수 불일치`);
  assert.equal(new Set(data.questions.map((question) => question.id)).size, 12, `${id}: 문항 id 중복`);

  const categoryIds = new Set(data.categories.map((category) => category.id));
  assert.ok(data.questions.every((question) => categoryIds.has(question.category)), `${id}: 존재하지 않는 영역에 연결된 문항`);
  assert.ok(data.questions.every((question) => typeof question.text === 'string' && question.text.trim()), `${id}: 빈 문항`);
  assert.ok(data.questions.every((question) => typeof question.reverse === 'boolean'), `${id}: reverse 형식 오류`);
  assert.ok(data.contentReview?.status === 'literature-reviewed', `${id}: 내용타당성 검토 상태 누락`);
  assert.match(data.contentReview.scope, /미검증/, `${id}: 심리측정 한계 고지 누락`);
  assert.match(data.methodNote, /자체 설명 구간/, `${id}: 자체 결과 구간 고지 누락`);

  const ranges = [...data.results].sort((a, b) => a.min - b.min);
  assert.equal(ranges.length, 4, `${id}: 결과 구간 수 불일치`);
  assert.equal(ranges[0].min, 0, `${id}: 결과 시작점 불일치`);
  assert.equal(ranges.at(-1).max, 36, `${id}: 결과 종료점 불일치`);
  for (let i = 1; i < ranges.length; i += 1) {
    assert.equal(ranges[i].min, ranges[i - 1].max + 1, `${id}: 결과 구간 중복 또는 누락`);
  }
  assert.ok(data.results.every((result) => Array.isArray(result.questions) && result.questions.length >= 2), `${id}: 성찰 질문 누락`);
  assert.ok(data.results.every((result) => Array.isArray(result.actions) && result.actions.length >= 2), `${id}: 행동 제안 누락`);
}

const life = await readJson('data/checklists/life-satisfaction.json');
assert.equal(life.title, '생활 만족과 삶의 방향', '생활 만족 도구 제목 재구성 미반영');
assert.match(life.methodNote, /SWLS와 다른 영역별 성찰 자료/, 'SWLS와의 구분 고지 누락');

const criticism = await readJson('data/checklists/self-criticism.json');
assert.ok(criticism.categories.some((category) => category.id === 'punitive-drive'), '자기비난의 처벌 기능 영역 누락');
assert.ok(!criticism.categories.some((category) => category.id === 'comparison-worth'), '자기비난에 비교·가치 구영역이 남아 있음');

console.log('W10 content review static validation passed.');
