const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scoringPath = path.join(__dirname, '..', 'assets', 'js', 'scoring.js');
const source = fs.readFileSync(scoringPath, 'utf8');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const { ReScanScoring } = sandbox.window;

test('pattern mode derives a pattern-focused result', () => {
  const checklist = {
    mode: 'pattern',
    questions: [
      { id: 'q01', category: 'tension', text: 'test', reverse: false },
      { id: 'q02', category: 'recovery', text: 'test', reverse: false }
    ],
    scale: [{ value: 0, label: '없음' }, { value: 1, label: '가끔' }, { value: 2, label: '자주' }],
    patternResults: [{ min: 0, max: 2, level: '안정', summary: '안정', questions: [] }]
  };

  const calculation = ReScanScoring.calculate(checklist, { q01: 2, q02: 1 });
  assert.equal(calculation.total, 3);
  assert.equal(calculation.result.level, '안정');
  assert.match(calculation.message, /안정|패턴/);
});

test('reflection mode returns a reflection-focused result', () => {
  const checklist = {
    mode: 'reflection',
    questions: [
      { id: 'q01', category: 'tension', text: 'test', reverse: false },
      { id: 'q02', category: 'recovery', text: 'test', reverse: false }
    ],
    scale: [{ value: 0, label: '없음' }, { value: 1, label: '가끔' }],
    reflectionResults: [{ min: 0, max: 2, level: '안정', summary: '안정', questions: ['한 번 더 생각해 볼 질문'] }]
  };

  const calculation = ReScanScoring.calculate(checklist, { q01: 1, q02: 1 });
  assert.equal(calculation.total, 2);
  assert.equal(calculation.result.level, '안정');
  assert.ok(Array.isArray(calculation.result.questions) && calculation.result.questions.length > 0);
});
