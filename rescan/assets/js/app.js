document.addEventListener('DOMContentLoaded', async () => {
  const INDEX_PATH = '/rescan/data/index.json';
  const list = document.querySelector('#checklist-list');

  const loadJson = async (path) => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`);
    return response.json();
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  if (list) {
    try {
      const data = await loadJson(INDEX_PATH);
      const items = Array.isArray(data.items) ? data.items : [];
      list.innerHTML = items.map((item) => {
        const ready = Boolean(item.dataPath) && ['sample', 'testing', 'published'].includes(item.status);
        const href = ready
          ? `/rescan/checklist.html?id=${encodeURIComponent(item.id)}`
          : `/rescan/checklist.html?id=${encodeURIComponent(item.id)}&status=planned`;
        const label = ready ? '자가점검 보기' : '준비 중';
        return `<a class="card${ready ? '' : ' is-planned'}" href="${href}" aria-label="${escapeHtml(item.title)} ${label}">
          <span class="tag">${ready ? 'AVAILABLE' : 'COMING SOON'}</span>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.subtitle)}</p>
          <span class="go">${label} →</span>
        </a>`;
      }).join('');
      if (!items.length) throw new Error('등록된 주제가 없습니다.');
    } catch (error) {
      list.innerHTML = '<div class="panel"><p>체크리스트 목록을 불러오지 못했습니다.</p><p style="margin-top:12px"><a class="button" href="/rescan/about.html">이용 안내 보기</a></p></div>';
    }
  }

  const app = document.querySelector('#checklist-app');
  if (!app) return;

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const planned = params.get('status') === 'planned';
  const title = document.querySelector('#checklist-title');
  const description = document.querySelector('#checklist-description');

  if (!id) {
    if (title) title.textContent = '점검할 주제를 선택해 주세요';
    if (description) description.textContent = 'Re:Scan 홈에서 관심 있는 주제를 먼저 선택할 수 있습니다.';
    app.innerHTML = '<div class="notice">선택된 주제가 없습니다.</div><div class="actions"><a class="button primary" href="/rescan/#topics">주제별 보기</a><a class="button" href="/rescan/about.html">이용 안내</a></div>';
    return;
  }

  if (planned) {
    if (title) title.textContent = '이 체크리스트는 준비 중입니다';
    if (description) description.textContent = '문항과 결과 해석을 검토한 뒤 순서대로 공개합니다.';
    app.innerHTML = '<div class="notice">아직 공개되지 않은 주제입니다.</div><div class="actions"><a class="button primary" href="/rescan/#topics">다른 주제 보기</a><a class="button" href="/rescan/about.html">이용 안내</a></div>';
    return;
  }

  app.innerHTML = '<p>체크리스트 데이터를 불러오는 중입니다.</p>';

  try {
    const indexData = await loadJson(INDEX_PATH);
    const item = Array.isArray(indexData.items) ? indexData.items.find((entry) => entry.id === id) : null;
    if (!item) throw new Error('등록되지 않은 주제입니다.');
    if (!item.dataPath) throw new Error('아직 데이터가 연결되지 않은 주제입니다.');

    const checklist = await loadJson(item.dataPath);
    if (checklist.id !== id) throw new Error('체크리스트 식별자가 일치하지 않습니다.');
    if (!Array.isArray(checklist.questions) || !checklist.questions.length || !Array.isArray(checklist.scale) || !checklist.scale.length) {
      throw new Error('체크리스트 데이터 형식이 올바르지 않습니다.');
    }

    if (title) title.textContent = checklist.title || item.title;
    if (description) description.textContent = checklist.description || item.subtitle;
    document.title = `${checklist.title || item.title} | Re:Scan [나 체크리스트]`;
    app.dataset.checklistId = checklist.id;
    app.dataset.mode = checklist.mode || item.mode || '';

    const scaleHtml = checklist.scale.map((option) => `<span><b>${escapeHtml(option.value)}</b>${escapeHtml(option.label)}</span>`).join('');
    const questionHtml = checklist.questions.map((question, index) => {
      const options = checklist.scale.map((option) => `<label class="answer-option">
        <input type="radio" name="${escapeHtml(question.id)}" value="${escapeHtml(option.value)}" required>
        <span>${escapeHtml(option.label)}</span>
      </label>`).join('');
      return `<fieldset class="question-card" data-question="${escapeHtml(question.id)}">
        <legend><span class="question-number">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(question.text)}</legend>
        <div class="answer-grid">${options}</div>
      </fieldset>`;
    }).join('');

    app.classList.add('checklist-panel');
    app.innerHTML = `<div class="checklist-meta">
        <span>${escapeHtml(checklist.period || '현재 생활')}</span>
        <span>${checklist.questions.length}개 문항</span>
      </div>
      <div class="scale-guide" aria-label="응답 기준">${scaleHtml}</div>
      <form id="rescan-form" novalidate>
        <div class="question-list">${questionHtml}</div>
        <div class="form-actions">
          <button class="button primary" type="submit">결과 확인</button>
          <a class="button" href="/rescan/#topics">다른 주제 보기</a>
        </div>
        <p class="form-message" id="form-message" role="alert" aria-live="polite"></p>
      </form>`;

    const form = document.querySelector('#rescan-form');
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const unanswered = checklist.questions.find((question) => !form.querySelector(`input[name="${CSS.escape(question.id)}"]:checked`));
      const message = document.querySelector('#form-message');
      if (unanswered) {
        message.textContent = '모든 문항에 응답해 주세요.';
        form.querySelector(`[data-question="${CSS.escape(unanswered.id)}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      message.textContent = '응답이 완료되었습니다. 점수 계산과 결과 화면은 다음 단계에서 연결됩니다.';
    });
  } catch (error) {
    if (title) title.textContent = '체크리스트를 불러오지 못했습니다';
    if (description) description.textContent = error.message;
    app.innerHTML = '<div class="notice">요청한 주제의 데이터를 확인할 수 없습니다.</div><div class="actions"><a class="button primary" href="/rescan/#topics">주제별 보기</a><a class="button" href="/rescan/">Re:Scan 홈</a></div>';
  }
});