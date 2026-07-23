document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const PROFILE_PATH = '/rescan/data/profiles/temperament-character-candidate.json';
  const MODULE_PATH = '/rescan/data/profiles/interpretation-modules.v01.json';
  const STORAGE_KEY = 'rescan-profile:temperament-character-self-check:v01';
  const app = document.querySelector('#profile-app');
  if (!app) return;

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const loadJson = async (path) => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`);
    return response.json();
  };

  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buildBalancedOrder = (profile) => {
    const groups = new Map(profile.domains.map((domain) => [domain.id, []]));
    profile.questions.forEach((question) => groups.get(question.domain)?.push(question));
    const queues = [...groups.values()].map((questions) => shuffle(questions));
    const ordered = [];
    let cursor = 0;
    while (ordered.length < profile.questions.length) {
      const queue = queues[cursor % queues.length];
      if (queue.length) ordered.push(queue.shift());
      cursor += 1;
    }
    return ordered;
  };

  const readSession = (profile) => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
      const validIds = new Set(profile.questions.map((question) => question.id));
      if (!saved || !Array.isArray(saved.order) || saved.order.length !== profile.questions.length) return null;
      if (!saved.order.every((id) => validIds.has(id))) return null;
      const answers = Object.fromEntries(Object.entries(saved.answers || {}).filter(([id]) => validIds.has(id)));
      return { order: saved.order, answers, stage: Number.isInteger(saved.stage) ? saved.stage : 0, consent: Boolean(saved.consent) };
    } catch (error) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
  };

  const saveSession = (state) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ order: state.order, answers: state.answers, stage: state.stage, consent: state.consent }));
    } catch (error) {}
  };

  const clearSession = () => sessionStorage.removeItem(STORAGE_KEY);

  try {
    const [profile, modules] = await Promise.all([loadJson(PROFILE_PATH), loadJson(MODULE_PATH)]);
    window.ReScanProfileScoring.validateProfile(profile);

    const restored = readSession(profile);
    const state = {
      profile,
      modules,
      order: restored?.order || buildBalancedOrder(profile).map((question) => question.id),
      answers: restored?.answers || {},
      stage: Math.min(Math.max(restored?.stage || 0, 0), 6),
      consent: restored?.consent || false,
      started: Boolean(restored?.consent),
      result: null
    };

    const questionMap = new Map(profile.questions.map((question) => [question.id, question]));
    const orderedQuestions = state.order.map((id) => questionMap.get(id));
    const stageSize = 10;
    const totalStages = Math.ceil(orderedQuestions.length / stageSize);

    const renderStart = () => {
      const answered = Object.keys(state.answers).length;
      app.innerHTML = `<div class="profile-start">
        <div class="panel">
          <div class="profile-facts">
            <div class="profile-fact"><b>70문항</b><span>7개 영역 · 5점 척도</span></div>
            <div class="profile-fact"><b>약 10~15분</b><span>10문항씩 7단계</span></div>
            <div class="profile-fact"><b>브라우저 계산</b><span>응답 외부 전송 없음</span></div>
          </div>
          <div class="notice"><b>초기 공개판 안내</b><br>${escapeHtml(profile.disclaimer)}</div>
          <label class="consent-box"><input id="profile-consent" type="checkbox" ${state.consent ? 'checked' : ''}><span><b>이용 범위를 확인했습니다.</b><span>결과가 진단이나 능력·가치 판정이 아니며, 만 18세 이상 성인의 자기이해 참고 자료라는 점을 이해합니다.</span></span></label>
          <div class="actions"><button id="profile-start" class="button primary" type="button">${answered ? '이어서 진행하기' : '점검 시작하기'}</button><a class="button" href="/rescan/methodology.html">설계 원칙 보기</a></div>
          <p id="start-message" class="profile-message" role="alert"></p>
          <p class="privacy-note">진행 중 새로고침에 대비해 문항 순서와 응답을 현재 탭의 sessionStorage에 임시 저장합니다. 탭을 닫으면 브라우저 정책에 따라 삭제되며, 결과 화면에서 직접 초기화할 수 있습니다.</p>
        </div>
      </div>`;

      document.querySelector('#profile-start').addEventListener('click', () => {
        const checked = document.querySelector('#profile-consent').checked;
        if (!checked) {
          document.querySelector('#start-message').textContent = '이용 범위를 확인한 뒤 체크해 주세요.';
          return;
        }
        state.consent = true;
        state.started = true;
        saveSession(state);
        renderStage();
        window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' });
      });
    };

    const renderStage = () => {
      const start = state.stage * stageSize;
      const questions = orderedQuestions.slice(start, start + stageSize);
      const answeredCount = Object.keys(state.answers).length;
      const progress = Math.round((answeredCount / orderedQuestions.length) * 100);
      const questionHtml = questions.map((question, index) => {
        const options = profile.scale.map((option) => `<label class="profile-answer"><input type="radio" name="${escapeHtml(question.id)}" value="${option.value}" ${Number(state.answers[question.id]) === Number(option.value) ? 'checked' : ''}><span>${escapeHtml(option.label)}</span></label>`).join('');
        return `<fieldset class="profile-question" data-question="${escapeHtml(question.id)}"><legend><span class="question-number">${String(start + index + 1).padStart(2, '0')}</span>${escapeHtml(question.text)}</legend><div class="profile-answer-grid">${options}</div></fieldset>`;
      }).join('');

      app.innerHTML = `<div class="stage-panel">
        <div class="profile-meta"><span>성인 18세 이상</span><span>7개 영역</span><span>응답 외부 전송 없음</span></div>
        <div class="stage-head"><div class="stage-copy"><b>${state.stage + 1} / ${totalStages}단계</b><span>${answeredCount} / ${orderedQuestions.length} 응답 · ${progress}%</span></div><div class="stage-track"><span style="width:${progress}%"></span></div></div>
        <p class="stage-guide">최근 몇 달의 평소 모습에 가장 가까운 응답을 선택해 주세요. 오래 고민하기보다 자주 나타나는 경향을 기준으로 답합니다.</p>
        <form id="profile-form" novalidate><div class="profile-question-list">${questionHtml}</div>
          <div class="stage-actions">${state.stage > 0 ? '<button id="profile-prev" class="button" type="button">이전 단계</button>' : ''}<button class="button primary" type="submit">${state.stage === totalStages - 1 ? '결과 확인' : '다음 단계'}</button></div>
          <p id="profile-message" class="profile-message" role="alert"></p>
        </form>
      </div>`;

      const form = document.querySelector('#profile-form');
      form.addEventListener('change', (event) => {
        if (!event.target.matches('input[type="radio"]')) return;
        state.answers[event.target.name] = Number(event.target.value);
        saveSession(state);
        const count = Object.keys(state.answers).length;
        const percent = Math.round((count / orderedQuestions.length) * 100);
        document.querySelector('.stage-copy span').textContent = `${count} / ${orderedQuestions.length} 응답 · ${percent}%`;
        document.querySelector('.stage-track span').style.width = `${percent}%`;
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
          return;
        }
        createResult();
      });
    };

    const extractText = (module) => module.text || module.summary || module.message || '';
    const renderDomainDetails = (item) => {
      const details = [
        ['도움이 될 수 있는 장면', item.strength || item.helpful || item.positive],
        ['부담이 될 수 있는 장면', item.caution || item.burden || item.watch],
        ['함께 살펴볼 조건', item.environment || item.context || item.condition]
      ].filter((entry) => entry[1]);
      const cards = details.length ? `<div class="detail-grid">${details.map(([label, text]) => `<div class="detail-card"><b>${label}</b><span>${escapeHtml(text)}</span></div>`).join('')}</div>` : '';
      const question = item.question || item.reflectionQuestion;
      return `<section class="report-section"><span class="tag">영역 해석 · ${Math.round(item.score ?? 0)}점</span><h4>${escapeHtml(item.title || item.domainId)}</h4><p>${escapeHtml(extractText(item))}</p>${cards}${question ? `<div class="reflection-box"><b>생각해 볼 질문</b><p>${escapeHtml(question)}</p></div>` : ''}</section>`;
    };

    const createResult = () => {
      try {
        const calculation = window.ReScanProfileScoring.calculate(profile, state.answers);
        const interpretation = window.ReScanProfileInterpreter.interpret(calculation, modules, { maxPairs: 2, maxDomains: 7 });
        state.result = { calculation, interpretation };
        renderResult();
        window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' });
      } catch (error) {
        app.innerHTML = `<div class="notice" role="alert"><b>결과를 계산하지 못했습니다.</b><br>${escapeHtml(error.message)}</div><div class="actions"><button id="retry-profile" class="button primary" type="button">응답 화면으로 돌아가기</button></div>`;
        document.querySelector('#retry-profile')?.addEventListener('click', renderStage);
      }
    };

    const renderResult = () => {
      const { calculation, interpretation } = state.result;
      const groupLabel = (id) => calculation.domains[id]?.group === 'temperament' ? '기질 경향' : '성격 경향';
      const scores = calculation.ranking.map((row) => `<div class="score-row"><div class="score-label"><b>${escapeHtml(row.label)}</b><span>${groupLabel(row.id)}</span></div><div class="score-bar"><span style="width:${row.percent}%"></span></div><strong>${Math.round(row.percent)}</strong></div>`).join('');
      const pairs = interpretation.pairs.map((item) => `<section class="report-section"><span class="tag">함께 나타나는 경향</span><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(extractText(item))}</p></section>`).join('');
      const domainSections = interpretation.domains.map(renderDomainDetails).join('');

      app.innerHTML = `<div class="profile-result">
        <section class="profile-summary"><p class="result-kicker">YOUR PROFILE · PUBLIC BETA</p><h2>${escapeHtml(interpretation.overview.title)}</h2><p>${escapeHtml(extractText(interpretation.overview))}</p></section>
        <section class="score-panel"><h3>7개 영역의 이번 응답</h3><div class="score-list">${scores}</div><div class="notice">점수는 다른 사람이나 사회적 평균과 비교한 값이 아닙니다. 7개 영역을 같은 0~100 범위로 환산해 이번 응답 안의 모양을 보여줍니다.</div></section>
        <section class="report-panel"><h3>전체 프로필 읽기</h3><section class="report-section"><span class="tag">영역 간 차이</span><h4>${escapeHtml(interpretation.balance.title)}</h4><p>${escapeHtml(extractText(interpretation.balance))}</p></section>${pairs}</section>
        <section class="report-panel"><h3>영역별로 살펴보기</h3>${domainSections}</section>
        <section class="report-panel"><h3>결과 참고도</h3><section class="report-section"><span class="tag">RESPONSE GUIDE</span><h4>${escapeHtml(interpretation.confidence.title)}</h4><p>${escapeHtml(extractText(interpretation.confidence))}</p></section><div class="notice">${escapeHtml(interpretation.notice)}</div></section>
        <div class="profile-result-actions no-print"><button id="print-profile" class="button primary" type="button">인쇄·PDF 저장</button><button id="restart-profile" class="button" type="button">처음부터 다시 하기</button><a class="button" href="/rescan/">Re:Scan 홈</a></div>
        <p class="privacy-note">결과는 현재 브라우저에서만 계산되었습니다. 인쇄·PDF 파일을 저장한 경우 파일 보관과 삭제는 사용자가 직접 관리합니다.</p>
      </div>`;

      document.querySelector('#print-profile').addEventListener('click', () => window.print());
      document.querySelector('#restart-profile').addEventListener('click', () => {
        clearSession();
        state.answers = {};
        state.stage = 0;
        state.consent = false;
        state.started = false;
        state.result = null;
        state.order = buildBalancedOrder(profile).map((question) => question.id);
        renderStart();
        window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' });
      });
    };

    renderStart();
  } catch (error) {
    app.innerHTML = `<div class="notice" role="alert"><b>점검 화면을 준비하지 못했습니다.</b><br>${escapeHtml(error.message)}</div><div class="actions"><a class="button primary" href="/rescan/">Re:Scan 홈으로 돌아가기</a></div>`;
  }
});