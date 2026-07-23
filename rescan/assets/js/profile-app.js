document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const PROFILE_PATH = '/rescan/data/profiles/temperament-character-candidate.json';
  const MODULE_PATH = '/rescan/data/profiles/interpretation-modules.v01.json';
  const STORAGE_KEY = 'rescan-profile:temperament-character-self-check:v01';
  const app = document.querySelector('#profile-app');
  if (!app) return;

  const esc = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const loadJson = async (path) => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`);
    return response.json();
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = '/rescan/';
  };

  const bindBackButtons = (root = document) => {
    root.querySelectorAll('[data-profile-back]').forEach((button) => {
      if (button.dataset.backBound === 'true') return;
      button.dataset.backBound = 'true';
      button.addEventListener('click', goBack);
    });
  };

  bindBackButtons();

  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buildOrder = (profile) => {
    const groups = new Map(profile.domains.map((domain) => [domain.id, []]));
    profile.questions.forEach((question) => groups.get(question.domain).push(question));
    const queues = [...groups.values()].map(shuffle);
    const output = [];
    let cursor = 0;
    while (output.length < profile.questions.length) {
      const queue = queues[cursor % queues.length];
      if (queue.length) output.push(queue.shift());
      cursor += 1;
    }
    return output.map((question) => question.id);
  };

  const loadSession = (profile) => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      const valid = new Set(profile.questions.map((question) => question.id));
      if (!saved || !Array.isArray(saved.order) || saved.order.length !== profile.questions.length || !saved.order.every((id) => valid.has(id))) return null;
      return { order: saved.order, answers: saved.answers || {}, stage: Number(saved.stage) || 0, consent: Boolean(saved.consent) };
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  const saveSession = (state) => sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
    order: state.order,
    answers: state.answers,
    stage: state.stage,
    consent: state.consent
  }));

  const textOf = (item) => item.text || item.summary || item.message || '';
  const list = (items = []) => `<ul class="type-list">${items.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`;

  try {
    const [profile, modules] = await Promise.all([loadJson(PROFILE_PATH), loadJson(MODULE_PATH)]);
    window.ReScanProfileScoring.validateProfile(profile);

    const restored = loadSession(profile);
    const state = {
      order: restored?.order || buildOrder(profile),
      answers: restored?.answers || {},
      stage: Math.min(Math.max(restored?.stage || 0, 0), 6),
      consent: restored?.consent || false,
      result: null
    };

    const questionMap = new Map(profile.questions.map((question) => [question.id, question]));
    const ordered = state.order.map((id) => questionMap.get(id));
    const stageSize = 10;
    const totalStages = 7;

    const renderStart = () => {
      const answered = Object.keys(state.answers).length;
      app.innerHTML = `<div class="profile-start">
        <div class="profile-back-row"><button class="button profile-back-button" type="button" data-profile-back>← 이전 페이지로 돌아가기</button></div>
        <div class="panel">
          <div class="profile-facts">
            <div class="profile-fact"><b>70문항</b><span>7개 영역 · 5점 척도</span></div>
            <div class="profile-fact"><b>약 10~15분</b><span>10문항씩 7단계</span></div>
            <div class="profile-fact"><b>상세 유형 해설</b><span>강점 · 주의점 · 관계 · 일 · 방향</span></div>
          </div>
          <div class="notice"><b>공개판 이용 안내</b><br>Re:Scan이 독자적으로 구성한 성인 자기이해 성향 점검입니다. 7개 영역의 상대적인 경향을 바탕으로 생활 장면과 유형별 특징을 설명합니다. 의료·상담 목적의 진단이나 표준화 심리검사를 대신하지 않습니다.</div>
          <label class="consent-box"><input id="profile-consent" type="checkbox" ${state.consent ? 'checked' : ''}><span><b>이용 범위를 확인했습니다.</b><span>유형명과 점수는 다른 사람과의 우열을 정하는 값이 아니라, 이번 응답에서 나타난 경향을 이해하기 위한 해설이라는 점을 확인합니다.</span></span></label>
          <div class="actions">
            <button id="profile-start" class="button primary" type="button">${answered ? '이어서 진행하기' : '점검 시작하기'}</button>
            <a class="button" href="/rescan/privacy.html">응답 처리 안내</a>
            <button class="button" type="button" data-profile-back>이전 페이지</button>
          </div>
          <p id="start-message" class="profile-message" role="alert"></p>
          <p class="privacy-note">문항 순서와 응답은 진행 중 새로고침에 대비해 현재 탭의 sessionStorage에 임시 저장됩니다.</p>
        </div>
      </div>`;

      bindBackButtons(app);
      document.querySelector('#profile-start').addEventListener('click', () => {
        if (!document.querySelector('#profile-consent').checked) {
          document.querySelector('#start-message').textContent = '이용 범위를 확인한 뒤 체크해 주세요.';
          return;
        }
        state.consent = true;
        saveSession(state);
        renderStage();
      });
    };

    const renderStage = () => {
      const start = state.stage * stageSize;
      const questions = ordered.slice(start, start + stageSize);
      const count = Object.keys(state.answers).length;
      const progress = Math.round((count / ordered.length) * 100);

      app.innerHTML = `<div class="stage-panel">
        <div class="profile-meta"><span>성인 18세 이상</span><span>7개 영역</span><span>응답 외부 전송 없음</span></div>
        <div class="stage-head"><div class="stage-copy"><b>${state.stage + 1} / ${totalStages}단계</b><span>${count} / ${ordered.length} 응답 · ${progress}%</span></div><div class="stage-track"><span style="width:${progress}%"></span></div></div>
        <p class="stage-guide">최근 몇 달 동안 자주 나타난 평소 모습에 가장 가까운 응답을 선택해 주세요. 이상적인 모습보다 실제 생활에서의 반응을 기준으로 답하는 것이 좋습니다.</p>
        <form id="profile-form" novalidate>
          <div class="profile-question-list">${questions.map((question, index) => `<fieldset class="profile-question" data-question="${esc(question.id)}"><legend><span class="question-number">${String(start + index + 1).padStart(2, '0')}</span>${esc(question.text)}</legend><div class="profile-answer-grid">${profile.scale.map((option) => `<label class="profile-answer"><input type="radio" name="${esc(question.id)}" value="${option.value}" ${Number(state.answers[question.id]) === option.value ? 'checked' : ''}><span>${esc(option.label)}</span></label>`).join('')}</div></fieldset>`).join('')}</div>
          <div class="stage-actions">${state.stage > 0 ? '<button id="profile-prev" class="button" type="button">이전 단계</button>' : ''}<button class="button primary" type="submit">${state.stage === totalStages - 1 ? '결과 확인' : '다음 단계'}</button></div>
          <p id="profile-message" class="profile-message" role="alert"></p>
        </form>
      </div>`;

      const form = document.querySelector('#profile-form');
      form.addEventListener('change', (event) => {
        if (!event.target.matches('input[type="radio"]')) return;
        state.answers[event.target.name] = Number(event.target.value);
        saveSession(state);
      });

      document.querySelector('#profile-prev')?.addEventListener('click', () => {
        state.stage -= 1;
        saveSession(state);
        renderStage();
        window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' });
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const unanswered = questions.find((question) => !(question.id in state.answers));
        if (unanswered) {
          document.querySelector('#profile-message').textContent = '이 단계의 모든 문항에 응답해 주세요.';
          document.querySelector(`[data-question="${CSS.escape(unanswered.id)}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
        if (state.stage < totalStages - 1) {
          state.stage += 1;
          saveSession(state);
          renderStage();
          window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' });
        } else createResult();
      });
    };

    const renderDomain = (item) => `<section class="report-section">
      <span class="tag">영역 해석 · ${Math.round(item.score || 0)}점</span>
      <h4>${esc(item.title)}</h4>
      <p>${esc(textOf(item))}</p>
      <div class="detail-grid">
        <div class="detail-card"><b>이 경향의 장점</b><span>${esc(item.strength || '')}</span></div>
        <div class="detail-card"><b>주의해서 볼 지점</b><span>${esc(item.caution || '')}</span></div>
      </div>
      <div class="reflection-box"><b>스스로 확인할 질문</b><p>${esc(item.question || '')}</p></div>
    </section>`;

    const createResult = () => {
      try {
        const calculation = window.ReScanProfileScoring.calculate(profile, state.answers);
        const interpretation = window.ReScanProfileInterpreter.interpret(calculation, modules, { maxDomains: 7 });
        state.result = { calculation, interpretation };
        renderResult();
      } catch (error) {
        app.innerHTML = `<div class="notice" role="alert"><b>결과를 계산하지 못했습니다.</b><br>${esc(error.message)}</div><div class="actions"><button id="retry-profile" class="button primary" type="button">응답 화면으로 돌아가기</button></div>`;
        document.querySelector('#retry-profile').addEventListener('click', renderStage);
      }
    };

    const renderResult = () => {
      const { calculation, interpretation } = state.result;
      const type = interpretation.typeProfile;
      const scores = calculation.ranking.map((row) => `<div class="score-row"><div class="score-label"><b>${esc(row.label)}</b><span>${calculation.domains[row.id].group === 'temperament' ? '기질 경향' : '성격 경향'}</span></div><div class="score-bar"><span style="width:${row.percent}%"></span></div><strong>${Math.round(row.percent)}</strong></div>`).join('');

      app.innerHTML = `<div class="profile-result">
        <section class="profile-summary type-hero">
          <p class="result-kicker">YOUR PROFILE · PUBLIC EDITION</p>
          <h2>${esc(type.title)} <small>· ${esc(type.modifier.label)}</small></h2>
          <p class="type-code">${esc(type.code)}</p>
          <p>${esc(type.portrait)}</p>
        </section>

        <section class="report-panel easy-summary-panel">
          <span class="tag">쉽게 말하면</span>
          <h3>이 결과를 한눈에 읽기</h3>
          <p>${esc(type.plainSummary || type.portrait)}</p>
        </section>

        <section class="report-panel type-overview">
          <h3>당신의 기본 반응 방식</h3>
          <p>${esc(type.portrait)}</p>
          <div class="axis-chip-grid">${type.axes.map((axis) => `<span><b>${esc(axis.label)}</b><small>${Math.round(axis.score)}점</small></span>`).join('')}</div>
        </section>

        <section class="report-panel modifier-panel">
          <span class="tag">성격 경향</span>
          <h3>${esc(type.modifier.label)}이 더해지는 방식</h3>
          <p>${esc(type.modifier.text)}</p>
          <div class="detail-grid">
            <div class="detail-card"><b>이 경향이 주는 힘</b><span>${esc(type.modifier.strength)}</span></div>
            <div class="detail-card"><b>균형을 위해 볼 지점</b><span>${esc(type.modifier.caution)}</span></div>
          </div>
        </section>

        <section class="report-panel"><h3>이 유형이 가진 힘</h3>${list(type.strengths)}</section>
        <section class="report-panel shadow-panel"><h3>장점이 약점으로 바뀌는 순간</h3>${list(type.shadows)}</section>

        <section class="report-panel scenario-grid">
          <article><span class="tag">관계에서</span><h3>사람 사이에서 나타나는 모습</h3><p>${esc(type.relationship)}</p></article>
          <article><span class="tag">일과 결정에서</span><h3>힘을 쓰기 좋은 방식</h3><p>${esc(type.work)}</p></article>
          <article><span class="tag">압박받을 때</span><h3>평소의 강점이 과해지는 장면</h3><p>${esc(type.pressure)}</p></article>
          <article><span class="tag">회복할 때</span><h3>반대 성향에서 빌릴 자원</h3><p>${esc(type.recovery)}</p></article>
        </section>

        <section class="direction-panel">
          <span class="tag">지금의 방향</span>
          <h3>해결책보다 먼저 살펴볼 기준</h3>
          <p>${esc(type.direction)}</p>
          ${type.directionSteps?.length ? `<ol class="direction-steps">${type.directionSteps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>` : ''}
        </section>

        <section class="score-panel"><details><summary>7개 영역 점수와 해석 근거 보기</summary><div class="score-list">${scores}</div><div class="notice">점수는 다른 사람이나 사회적 평균과 비교한 값이 아닙니다. 이번 응답 안에서 일곱 영역을 같은 범위로 환산해 상대적인 모양을 보여 줍니다.</div></details></section>
        <section class="report-panel"><h3>영역별 자세히 보기</h3>${interpretation.domains.map(renderDomain).join('')}</section>
        <section class="report-panel"><h3>결과를 읽을 때</h3><section class="report-section"><h4>${esc(interpretation.confidence.title)}</h4><p>${esc(textOf(interpretation.confidence))}</p></section><div class="notice">${esc(interpretation.notice)}</div></section>

        <div class="profile-result-actions no-print">
          <button id="print-profile" class="button primary" type="button">인쇄·PDF 저장</button>
          <button id="restart-profile" class="button" type="button">처음부터 다시 하기</button>
          <button class="button" type="button" data-profile-back>이전 페이지로 돌아가기</button>
          <a class="button" href="/rescan/">Re:Scan 홈</a>
        </div>
      </div>`;

      bindBackButtons(app);
      document.querySelector('#print-profile').addEventListener('click', () => window.print());
      document.querySelector('#restart-profile').addEventListener('click', () => {
        sessionStorage.removeItem(STORAGE_KEY);
        state.order = buildOrder(profile);
        state.answers = {};
        state.stage = 0;
        state.consent = false;
        state.result = null;
        renderStart();
      });
      window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' });
    };

    renderStart();
  } catch (error) {
    app.innerHTML = `<div class="notice" role="alert"><b>점검 화면을 준비하지 못했습니다.</b><br>${esc(error.message)}</div>`;
  }
});