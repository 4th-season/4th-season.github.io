document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const PROFILE_PATH = '/rescan/data/profiles/temperament-character-candidate.json';
  const MODULE_PATH = '/rescan/data/profiles/interpretation-modules.v01.json';
  const STORAGE_KEY = 'rescan-profile:temperament-character-self-check:v01';
  const app = document.querySelector('#profile-app');
  if (!app) return;

  const esc = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const loadJson = async (path) => { const response = await fetch(path, { cache: 'no-store' }); if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`); return response.json(); };
  const shuffle = (items) => { const copy = [...items]; for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; } return copy; };
  const buildOrder = (profile) => { const groups = new Map(profile.domains.map((domain) => [domain.id, []])); profile.questions.forEach((question) => groups.get(question.domain).push(question)); const queues = [...groups.values()].map(shuffle); const output = []; let cursor = 0; while (output.length < profile.questions.length) { const queue = queues[cursor % queues.length]; if (queue.length) output.push(queue.shift()); cursor += 1; } return output.map((question) => question.id); };
  const loadSession = (profile) => { try { const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null'); const valid = new Set(profile.questions.map((question) => question.id)); if (!saved || !Array.isArray(saved.order) || saved.order.length !== profile.questions.length || !saved.order.every((id) => valid.has(id))) return null; return { order: saved.order, answers: saved.answers || {}, stage: Number(saved.stage) || 0, consent: Boolean(saved.consent) }; } catch { sessionStorage.removeItem(STORAGE_KEY); return null; } };
  const saveSession = (state) => sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ order: state.order, answers: state.answers, stage: state.stage, consent: state.consent }));
  const textOf = (item) => item.text || item.summary || item.message || '';

  try {
    const [profile, modules] = await Promise.all([loadJson(PROFILE_PATH), loadJson(MODULE_PATH)]);
    window.ReScanProfileScoring.validateProfile(profile);
    const restored = loadSession(profile);
    const state = { order: restored?.order || buildOrder(profile), answers: restored?.answers || {}, stage: Math.min(Math.max(restored?.stage || 0, 0), 6), consent: restored?.consent || false, result: null };
    const questionMap = new Map(profile.questions.map((question) => [question.id, question]));
    const ordered = state.order.map((id) => questionMap.get(id));
    const stageSize = 10;
    const totalStages = 7;

    const renderStart = () => {
      const answered = Object.keys(state.answers).length;
      app.innerHTML = `<div class="profile-start"><div class="panel">
        <div class="profile-facts"><div class="profile-fact"><b>70문항</b><span>7개 영역 · 5점 척도</span></div><div class="profile-fact"><b>약 10~15분</b><span>10문항씩 7단계</span></div><div class="profile-fact"><b>유형형 결과</b><span>강점·그림자·방향성 해석</span></div></div>
        <div class="notice"><b>초기 공개판 안내</b><br>${esc(profile.disclaimer)}</div>
        <label class="consent-box"><input id="profile-consent" type="checkbox" ${state.consent ? 'checked' : ''}><span><b>이용 범위를 확인했습니다.</b><span>유형명은 이번 응답을 쉽게 읽기 위한 별칭이며, 진단이나 능력·가치 판정이 아니라는 점을 이해합니다.</span></span></label>
        <div class="actions"><button id="profile-start" class="button primary" type="button">${answered ? '이어서 진행하기' : '점검 시작하기'}</button><a class="button" href="/rescan/privacy.html">응답 처리 안내</a></div>
        <p id="start-message" class="profile-message" role="alert"></p><p class="privacy-note">문항 순서와 응답은 현재 탭의 sessionStorage에 임시 저장됩니다.</p>
      </div></div>`;
      document.querySelector('#profile-start').addEventListener('click', () => { if (!document.querySelector('#profile-consent').checked) { document.querySelector('#start-message').textContent = '이용 범위를 확인한 뒤 체크해 주세요.'; return; } state.consent = true; saveSession(state); renderStage(); });
    };

    const renderStage = () => {
      const start = state.stage * stageSize;
      const questions = ordered.slice(start, start + stageSize);
      const count = Object.keys(state.answers).length;
      const progress = Math.round((count / ordered.length) * 100);
      app.innerHTML = `<div class="stage-panel"><div class="profile-meta"><span>성인 18세 이상</span><span>7개 영역</span><span>응답 외부 전송 없음</span></div>
        <div class="stage-head"><div class="stage-copy"><b>${state.stage + 1} / ${totalStages}단계</b><span>${count} / ${ordered.length} 응답 · ${progress}%</span></div><div class="stage-track"><span style="width:${progress}%"></span></div></div>
        <p class="stage-guide">최근 몇 달의 평소 모습에 가장 가까운 응답을 선택해 주세요.</p>
        <form id="profile-form" novalidate><div class="profile-question-list">${questions.map((question, index) => `<fieldset class="profile-question" data-question="${esc(question.id)}"><legend><span class="question-number">${String(start + index + 1).padStart(2, '0')}</span>${esc(question.text)}</legend><div class="profile-answer-grid">${profile.scale.map((option) => `<label class="profile-answer"><input type="radio" name="${esc(question.id)}" value="${option.value}" ${Number(state.answers[question.id]) === option.value ? 'checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}</div></fieldset>`).join('')}</div>
        <div class="stage-actions">${state.stage > 0 ? '<button id="profile-prev" class="button" type="button">이전 단계</button>' : ''}<button class="button primary" type="submit">${state.stage === totalStages - 1 ? '결과 확인' : '다음 단계'}</button></div><p id="profile-message" class="profile-message" role="alert"></p></form></div>`;
      const form = document.querySelector('#profile-form');
      form.addEventListener('change', (event) => { if (!event.target.matches('input[type="radio"]')) return; state.answers[event.target.name] = Number(event.target.value); saveSession(state); });
      document.querySelector('#profile-prev')?.addEventListener('click', () => { state.stage -= 1; saveSession(state); renderStage(); window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' }); });
      form.addEventListener('submit', (event) => { event.preventDefault(); const unanswered = questions.find((question) => !(question.id in state.answers)); if (unanswered) { document.querySelector('#profile-message').textContent = '이 단계의 모든 문항에 응답해 주세요.'; document.querySelector(`[data-question="${CSS.escape(unanswered.id)}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' }); return; } if (state.stage < totalStages - 1) { state.stage += 1; saveSession(state); renderStage(); window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' }); } else createResult(); });
    };

    const renderDomain = (item) => `<section class="report-section"><span class="tag">영역 해석 · ${Math.round(item.score || 0)}점</span><h4>${esc(item.title)}</h4><p>${esc(textOf(item))}</p><div class="detail-grid"><div class="detail-card"><b>이 경향의 장점</b><span>${esc(item.strength || '')}</span></div><div class="detail-card"><b>약점으로 바뀔 수 있는 지점</b><span>${esc(item.caution || '')}</span></div></div><div class="reflection-box"><b>스스로 확인할 질문</b><p>${esc(item.question || '')}</p></div></section>`;
    const list = (items) => `<ul class="type-list">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;

    const createResult = () => {
      try { const calculation = window.ReScanProfileScoring.calculate(profile, state.answers); const interpretation = window.ReScanProfileInterpreter.interpret(calculation, modules, { maxDomains: 7 }); state.result = { calculation, interpretation }; renderResult(); }
      catch (error) { app.innerHTML = `<div class="notice" role="alert"><b>결과를 계산하지 못했습니다.</b><br>${esc(error.message)}</div><div class="actions"><button id="retry-profile" class="button primary" type="button">응답 화면으로 돌아가기</button></div>`; document.querySelector('#retry-profile').addEventListener('click', renderStage); }
    };

    const renderResult = () => {
      const { calculation, interpretation } = state.result;
      const type = interpretation.typeProfile;
      const scores = calculation.ranking.map((row) => `<div class="score-row"><div class="score-label"><b>${esc(row.label)}</b><span>${calculation.domains[row.id].group === 'temperament' ? '기질 경향' : '성격 경향'}</span></div><div class="score-bar"><span style="width:${row.percent}%"></span></div><strong>${Math.round(row.percent)}</strong></div>`).join('');
      app.innerHTML = `<div class="profile-result">
        <section class="profile-summary type-hero"><p class="result-kicker">YOUR PROFILE · PUBLIC BETA</p><h2>${esc(type.title)} <small>· ${esc(type.modifier.label)}</small></h2><p class="type-code">${esc(type.code)}</p><p>${esc(type.portrait)}</p></section>
        <section class="report-panel type-overview"><h3>당신의 기본 모양</h3><p>${esc(type.portrait)}</p><div class="axis-chip-grid">${type.axes.map((axis) => `<span><b>${esc(axis.label)}</b><small>${Math.round(axis.score)}점</small></span>`).join('')}</div></section>
        <section class="report-panel"><h3>이 유형이 가진 힘</h3>${list(type.strengths)}</section>
        <section class="report-panel shadow-panel"><h3>장점이 약점으로 바뀌는 순간</h3>${list(type.shadows)}</section>
        <section class="report-panel scenario-grid"><article><span class="tag">관계에서</span><h3>사람 사이에서 나타나는 모습</h3><p>${esc(type.relationship)}</p></article><article><span class="tag">일과 결정에서</span><h3>힘을 쓰기 좋은 방식</h3><p>${esc(type.work)}</p></article><article><span class="tag">압박받을 때</span><h3>그림자가 커지는 장면</h3><p>${esc(type.pressure)}</p></article><article><span class="tag">회복할 때</span><h3>반대 성향에서 빌릴 자원</h3><p>${esc(type.recovery)}</p></article></section>
        <section class="direction-panel"><span class="tag">지금의 방향</span><h3>해결책보다 먼저 살펴볼 기준</h3><p>${esc(type.direction)}</p></section>
        <section class="score-panel"><details><summary>7개 영역 점수와 해석 근거 보기</summary><div class="score-list">${scores}</div><div class="notice">점수는 다른 사람이나 사회적 평균과 비교한 값이 아닙니다.</div></details></section>
        <section class="report-panel"><h3>영역별 자세히 보기</h3>${interpretation.domains.map(renderDomain).join('')}</section>
        <section class="report-panel"><h3>결과를 읽을 때</h3><section class="report-section"><h4>${esc(interpretation.confidence.title)}</h4><p>${esc(textOf(interpretation.confidence))}</p></section><div class="notice">${esc(interpretation.notice)}</div></section>
        <div class="profile-result-actions no-print"><button id="print-profile" class="button primary" type="button">인쇄·PDF 저장</button><button id="restart-profile" class="button" type="button">처음부터 다시 하기</button><a class="button" href="/rescan/">Re:Scan 홈</a></div>
      </div>`;
      document.querySelector('#print-profile').addEventListener('click', () => window.print());
      document.querySelector('#restart-profile').addEventListener('click', () => { sessionStorage.removeItem(STORAGE_KEY); state.order = buildOrder(profile); state.answers = {}; state.stage = 0; state.consent = false; state.result = null; renderStart(); });
      window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' });
    };

    renderStart();
  } catch (error) { app.innerHTML = `<div class="notice" role="alert"><b>점검 화면을 준비하지 못했습니다.</b><br>${esc(error.message)}</div>`; }
});