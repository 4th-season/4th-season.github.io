import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const IDS = ['social-connectedness','assertiveness','conflict-coping','relationship-reciprocity','support-resources'];
const MODE_KEYS = { pattern: 'patternResults', reflection: 'reflectionResults', scored: 'results' };

function validateRanges(results, max) {
  assert.ok(Array.isArray(results) && results.length === 4, '결과 구간은 4개여야 함');
  const sorted = [...results].sort((a,b)=>a.min-b.min);
  assert.equal(sorted[0].min, 0, '구간 시작점 오류');
  assert.equal(sorted.at(-1).max, max, '구간 종료점 오류');
  for (let i=1;i<sorted.length;i+=1) assert.equal(sorted[i].min, sorted[i-1].max+1, '구간 누락 또는 중복');
}

for (const id of IDS) {
  const path = `rescan/data/checklists/${id}.json`;
  const data = JSON.parse(await readFile(path, 'utf8'));
  assert.equal(data.id, id, `${id}: id 불일치`);
  assert.equal(data.status, 'published', `${id}: 공개 상태 오류`);
  assert.equal(data.schemaVersion, '1.2.0', `${id}: 스키마 버전 오류`);
  assert.equal(data.contentReview?.status, 'literature-reviewed', `${id}: 문헌 검토 상태 누락`);
  assert.equal(data.questions.length, 12, `${id}: 문항 수 오류`);
  assert.equal(new Set(data.questions.map(q=>q.id)).size, 12, `${id}: 문항 id 중복`);
  assert.equal(data.categories.length, 4, `${id}: 영역 수 오류`);
  assert.equal(Object.keys(data.categoryGuides || {}).length, 4, `${id}: 영역 안내 오류`);
  for (const category of data.categories) {
    assert.equal(data.questions.filter(q=>q.category===category.id).length, 3, `${id}/${category.id}: 영역별 문항 수 오류`);
  }
  assert.ok(data.questions.every(q=>typeof q.text==='string' && q.text.length>=12), `${id}: 짧거나 빈 문항`);
  assert.ok(data.questions.every(q=>typeof q.reverse==='boolean'), `${id}: 역채점 표기 누락`);
  validateRanges(data.results, 36);
  const modeKey = MODE_KEYS[data.mode];
  assert.ok(modeKey, `${id}: 지원하지 않는 모드`);
  if (modeKey !== 'results') {
    assert.deepEqual(data[modeKey], data.results, `${id}: 모드별 결과와 기본 결과 불일치`);
  }
  assert.ok(data.results.every(r=>r.questions?.length>=2 && r.actions?.length>=2), `${id}: 성찰 질문 또는 행동 제안 부족`);
  assert.match(data.methodNote, /자체 설명 구간|자체.*구간/, `${id}: 자체 구간 고지 누락`);
  assert.match(data.methodNote, /절단점|규준/, `${id}: 규준 비적용 고지 누락`);
  assert.ok(data.disclaimer?.length>=40, `${id}: 고지문 부족`);
}

const conflict = JSON.parse(await readFile('rescan/data/checklists/conflict-coping.json','utf8'));
assert.match(conflict.disclaimer, /안전|거리 두기|외부 지원/, '갈등 대처 안전 고지 누락');
const reciprocity = JSON.parse(await readFile('rescan/data/checklists/relationship-reciprocity.json','utf8'));
assert.match(reciprocity.disclaimer, /일시|상황|조정/, '관계 상호성의 상황별 불균형 고지 누락');
const support = JSON.parse(await readFile('rescan/data/checklists/support-resources.json','utf8'));
assert.match(support.disclaimer, /관계망의 크기|지원/, '지지 자원 개념 경계 고지 누락');

console.log(`W11 content review static validation passed: ${IDS.length} checklists`);
