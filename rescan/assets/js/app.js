document.addEventListener('DOMContentLoaded', async () => {
  const INDEX_PATH = '/rescan/data/index.json';
  const list = document.querySelector('#checklist-list');

  const loadJson = async (path) => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`);
    return response.json();
  };

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const isValidIndexEntry = (item) => Boolean(item && typeof item.id === 'string' && item.id.trim() && typeof item.title === 'string' && item.title.trim() && typeof item.subtitle === 'string' && item.subtitle.trim() && typeof item.grade === 'string' && item.grade.trim() && typeof item.mode === 'string' && item.mode.trim() && typeof item.category === 'string' && item.category.trim() && typeof item.status === 'string' && ['planned', 'sample', 'published', 'hidden'].includes(item.status));

  const validateChecklistData = (checklist, item) => {
    if (!checklist || typeof checklist !== 'object') return { ok: false, message: '체크리스트 데이터를 읽을 수 없습니다.' };
    const errors = [];
    ['id', 'title', 'subtitle', 'description', 'period'].forEach((field) => {
      if (typeof checklist[field] !== 'string' || !checklist[field].trim()) errors.push(`${field} 값이 비어 있습니다.`);
    });
    if (!Array.isArray(checklist.questions) || !checklist.questions.length) errors.push('문항이 비어 있습니다.');
    if (!Array.isArray(checklist.scale) || !checklist.scale.length) errors.push('척도가 비어 있습니다.');
    if (!['help', 'guide'].includes(checklist.mode) && (!Array.isArray(checklist.results) || !checklist.results.length)) errors.push('결과 구간이 비어 있습니다.');
    if (checklist.mode === 'pattern' && !Array.isArray(checklist.patternResults) && !Array.isArray(checklist.results)) errors.push('패턴형 결과 구간이 비어 있습니다.');
    if (checklist.mode === 'reflection' && !Array.isArray(checklist.reflectionResults) && !Array.isArray(checklist.results)) errors.push('성찰형 결과 구간이 비어 있습니다.');
    if (checklist.id !== item.id) errors.push('체크리스트 식별자가 일치하지 않습니다.');
    return { ok: !errors.length, message: errors[0] || '' };
  };

  const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const getBalancedQuestions = (checklist) => {
    const key = `rescan-order:${checklist.id}:${checklist.schemaVersion || '1'}`;
    const byId = new Map(checklist.questions.map((question) => [question.id, question]));
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (Array.isArray(saved) && saved.length === checklist.questions.length && saved.every((questionId) => byId.has(questionId))) {
        return saved.map((questionId) => byId.get(questionId));
      }
    } catch (error) {
      sessionStorage.removeItem(key);
    }

    const groups = new Map();
    checklist.questions.forEach((question) => {
      const category = question.category || 'uncategorized';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(question);
    });

    const queues = shuffle([...groups.entries()]).map(([category, questions]) => ({ category, questions: shuffle(questions) }));
    const ordered = [];
    let lastCategory = null;
    let sameCategoryRun = 0;

    while (queues.some((queue) => queue.questions.length)) {
      const candidates = queues.filter((queue) => queue.questions.length && !(queue.category === lastCategory && sameCategoryRun >= 2));
      const pool = candidates.length ? candidates : queues.filter((queue) => queue.questions.length);
      const preferred = pool.filter((queue) => queue.category !== lastCategory);
      const selectedPool = preferred.length ? preferred : pool;
      selectedPool.sort((a, b) => b.questions.length - a.questions.length || Math.random() - 0.5);
      const selected = selectedPool[0];
      const question = selected.questions.shift();
      ordered.push(question);
      if (selected.category === lastCategory) sameCategoryRun += 1;
      else {
        lastCategory = selected.category;
        sameCategoryRun = 1;
      }
    }

    try { sessionStorage.setItem(key, JSON.stringify(ordered.map((question) => question.id))); } catch (error) {}
    return ordered;
  };

  if (list) {
    try {
      const data = await loadJson(INDEX_PATH);
      const items = Array.isArray(data.items) ? data.items.filter(isValidIndexEntry) : [];
      list.innerHTML = items.map((item) => {
        const ready = Boolean(item.dataPath) && ['sample', 'testing', 'published'].includes(item.status);
        const href = ready ? `/rescan/checklist.html?id=${encodeURIComponent(item.id)}` : `/rescan/checklist.html?id=${encodeURIComponent(item.id)}&status=planned`;
        const label = ready ? '자가점검 보기' : '준비 중';
        return `<a class="card${ready ? '' : ' is-planned'}" href="${href}" aria-label="${escapeHtml(item.title)} ${label}">
          <span class="tag">${ready ? 'AVAILABLE' : 'COMING SOON'}</span><h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.subtitle)}</p><span class="go">${label} →</span></a>`;
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
    if (!item || !item.dataPath) throw new Error('아직 데이터가 연결되지 않은 주제입니다.');
    const checklist = await loadJson(item.dataPath);
    const validation = validateChecklistData(checklist, item);
    if (!validation.ok) throw new Error(validation.message || '체크리스트 데이터 형식이 올바르지 않습니다.');

    const orderedQuestions = getBalancedQuestions(checklist);
    if (title) title.textContent = checklist.title || item.title;
    if (description) description.textContent = checklist.description || item.subtitle;
    document.title = `${checklist.title || item.title} | Re:Scan [나 체크리스트]`;

    const categoryLabels = Object.fromEntries((checklist.categories || []).map((category) => [category.id, category.label]));
    const scaleHtml = checklist.scale.map((option) => `<span><b>${escapeHtml(option.value)}</b>${escapeHtml(option.label)}</span>`).join('');
    const questionHtml = orderedQuestions.map((question, index) => {
      const options = checklist.scale.map((option) => `<label class="answer-option"><input type="radio" name="${escapeHtml(question.id)}" value="${escapeHtml(option.value)}" required><span>${escapeHtml(option.label)}</span></label>`).join('');
      return `<fieldset class="question-card" data-question="${escapeHtml(question.id)}"><legend><span class="question-number">${String(index + 1).padStart(2, '0')}</span>${escapeHtml(question.text)}</legend><div class="answer-grid">${options}</div></fieldset>`;
    }).join('');

    app.classList.add('checklist-panel');
    app.innerHTML = `<div class="checklist-meta"><span>${escapeHtml(checklist.period || '현재 생활')}</span><span>${orderedQuestions.length}개 문항</span><span>응답은 저장되지 않음</span><span>문항 순서는 접속별로 달라질 수 있음</span></div>
      <div class="progress-wrap" aria-live="polite"><div class="progress-copy"><b id="progress-text">0 / ${orderedQuestions.length} 응답</b><span id="progress-percent">0%</span></div><div class="progress-track"><span id="progress-bar"></span></div></div>
      <div class="scale-guide" aria-label="응답 기준">${scaleHtml}</div>
      <form id="rescan-form" novalidate><div class="question-list">${questionHtml}</div>
      <div class="form-actions"><button class="button primary" type="submit">결과 확인</button><button class="button" type="reset">응답 지우기</button><a class="button" href="/rescan/#topics">다른 주제 보기</a></div>
      <p class="form-message" id="form-message" role="alert" aria-live="polite"></p></form>`;

    const form = document.querySelector('#rescan-form');
    const updateProgress = () => {
      const answered = orderedQuestions.filter((question) => form.querySelector(`input[name="${CSS.escape(question.id)}"]:checked`)).length;
      const percent = Math.round((answered / orderedQuestions.length) * 100);
      document.querySelector('#progress-text').textContent = `${answered} / ${orderedQuestions.length} 응답`;
      document.querySelector('#progress-percent').textContent = `${percent}%`;
      document.querySelector('#progress-bar').style.width = `${percent}%`;
    };
    form.addEventListener('change', updateProgress);
    form.addEventListener('reset', () => setTimeout(() => {
      updateProgress();
      document.querySelector('#form-message').textContent = '';
      window.scrollTo({ top: app.offsetTop - 90, behavior: 'smooth' });
    }, 0));

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const unanswered = orderedQuestions.find((question) => !form.querySelector(`input[name="${CSS.escape(question.id)}"]:checked`));
      const message = document.querySelector('#form-message');
      if (unanswered) {
        message.textContent = '모든 문항에 응답해 주세요.';
        form.querySelector(`[data-question="${CSS.escape(unanswered.id)}"]`).scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const answers = Object.fromEntries(orderedQuestions.map((question) => [question.id, Number(form.querySelector(`input[name="${CSS.escape(question.id)}"]:checked`).value)]));
      const calculation = window.ReScanScoring.calculate(checklist, answers);
      const categoryRows = Object.entries(calculation.categories).map(([categoryId, value]) => ({ id: categoryId, label: categoryLabels[categoryId] || categoryId, ...value }));
      const highest = categoryRows.length ? Math.max(...categoryRows.map((row) => row.percent)) : 0;
      const leading = categoryRows.filter((row) => row.percent === highest).map((row) => row.label);
      const leadingText = categoryRows.length
        ? (leading.length > 1 ? `${leading.join(' · ')} 영역이 함께 두드러집니다.` : `${leading[0]} 영역이 가장 두드러집니다.`)
        : '';
      const categoryHtml = categoryRows.map((row) => {
        const guides = checklist.categoryGuides && checklist.categoryGuides[row.id];
        const guideBand = row.percent <= 33 ? 'low' : (row.percent <= 66 ? 'mid' : 'high');
        const guide = guides && typeof guides[guideBand] === 'string' ? guides[guideBand] : '';
        return `<div class="result-category-item"><div class="result-category"><div><b>${escapeHtml(row.label)}</b><span>${row.score}/${row.max}점 · ${row.count}문항</span></div><strong>${row.percent}%</strong></div><div class="result-category-meter" aria-hidden="true"><span style="width:${row.percent}%"></span></div>${guide ? `<p class="result-category-guide">${escapeHtml(guide)}</p>` : ''}</div>`;
      }).join('');
      const questions = Array.isArray(calculation.result?.questions) ? calculation.result.questions : (calculation.mode === 'pattern' ? ['반복되는 상황과 영향이 가장 두드러진 순간은 언제였나요?', '어떤 환경에서 패턴이 완화되었나요?'] : (calculation.mode === 'reflection' ? ['지금 가장 고민되는 생각이나 감정은 무엇인가요?', '이 생각을 나누거나 멈추는 데 도움이 되는 방법은 무엇인가요?'] : ['최근 생활에서 이 신호가 두드러진 상황은 언제였나요?', '쉬거나 거리를 두었을 때 달라지는 부분이 있었나요?']));
      const actions = Array.isArray(calculation.result?.actions) ? calculation.result.actions : [];
      const links = Array.isArray(checklist.relatedLinks) ? checklist.relatedLinks : [];
      const linksHtml = links.length ? `<div class="related-grid">${links.map((link) => `<a class="related-card" href="${escapeHtml(link.url)}"><b>${escapeHtml(link.title)}</b><span>함께 읽기 →</span></a>`).join('')}</div>` : '<p class="result-empty">연결 글은 이후 단계에서 추가됩니다.</p>';
      const guideSteps = Array.isArray(checklist.guideSteps) ? checklist.guideSteps : [];
      const guideHtml = guideSteps.length ? `<ul class="reflection-list">${guideSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>` : '<p class="result-empty">생활 리듬을 회복하는 작은 단계를 다음 업데이트에서 더 채워 넣겠습니다.</p>';
      const actionHtml = actions.length ? `<ul class="action-list">${actions.map((action) => `<li>${escapeHtml(action)}</li>`).join('')}</ul>` : '';
      const methodHtml = typeof checklist.methodNote === 'string' && checklist.methodNote.trim() ? `<div class="result-block result-method"><h3>결과 계산 안내</h3><p>${escapeHtml(checklist.methodNote)}</p></div>` : '';
      const modeTitle = calculation.blocked ? '안내형 결과' : (calculation.mode === 'pattern' ? '반복 패턴 확인' : (calculation.mode === 'reflection' ? '성찰형 결과' : '현재 점검 결과'));
      const summaryTitle = calculation.blocked ? '안내를 먼저 확인해 보세요' : (calculation.result?.level || '결과 확인');
      const scoreMarkup = calculation.blocked ? '—' : `${calculation.total}<small>점</small>`;
      const categoryBlock = calculation.blocked ? '' : `<div class="result-block"><h3>영역별 신호</h3>${leadingText ? `<p class="result-leading">${escapeHtml(leadingText)}</p>` : ''}${categoryHtml || '<p class="result-empty">영역별 결과를 정리하는 중입니다.</p>'}</div>`;
      const actionBlock = !calculation.blocked && actionHtml ? `<div class="result-block action-block"><h3>지금 시도할 수 있는 작은 행동</h3>${actionHtml}</div>` : '';

      app.innerHTML = `<section class="result-view" tabindex="-1"><p class="result-kicker">${escapeHtml(modeTitle)}</p>
        <div class="result-summary"><div><span>전체 신호 수준</span><h2>${escapeHtml(summaryTitle)}</h2><p>${escapeHtml(calculation.message)}</p></div><strong>${scoreMarkup}</strong></div>
        ${categoryBlock}
        <div class="result-block"><h3>${calculation.blocked ? '먼저 시도할 안내' : '생활에서 다시 살펴볼 질문'}</h3>${calculation.blocked ? guideHtml : `<ul class="reflection-list">${questions.map((question) => `<li>${escapeHtml(question)}</li>`).join('')}</ul>`}</div>
        ${actionBlock}${methodHtml}
        <div class="result-block"><h3>함께 읽기</h3>${linksHtml}</div><div class="notice">${escapeHtml(checklist.disclaimer || '이 결과는 진단이 아닌 자가점검용 참고 자료입니다.')}</div>
        <div class="form-actions no-print"><button class="button primary" id="restart-checklist" type="button">다시 점검하기</button><button class="button" id="print-result" type="button">결과 인쇄·PDF 저장</button><a class="button" href="/rescan/#topics">다른 주제 보기</a></div></section>`;
      const resultView = app.querySelector('.result-view');
      resultView.focus();
      resultView.scrollIntoView({ behavior: 'smooth', block: 'start' });
      app.querySelector('#restart-checklist').addEventListener('click', () => location.reload());
      app.querySelector('#print-result').addEventListener('click', () => window.print());
    });
  } catch (error) {
    if (title) title.textContent = '체크리스트를 불러오지 못했습니다';
    if (description) description.textContent = error.message;
    app.innerHTML = '<div class="notice">요청한 주제의 데이터를 확인할 수 없습니다.</div><div class="actions"><a class="button primary" href="/rescan/#topics">주제별 보기</a><a class="button" href="/rescan/">Re:Scan 홈</a></div>';
  }
});