document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const app = document.querySelector('#checklist-app');
  if (!app || !window.ReScanGuidance || !window.ReScanScoring) return;

  const params = new URLSearchParams(location.search);
  const checklistId = params.get('id');
  if (!checklistId) return;

  let latestAnswers = null;

  const loadJson = async (path, optional = false) => {
    const response = await fetch(path, { cache: 'no-store' });
    if (!response.ok) {
      if (optional && response.status === 404) return null;
      throw new Error(`데이터를 불러오지 못했습니다. (${response.status})`);
    }
    return response.json();
  };

  const dataPromise = (async () => {
    const index = await loadJson('/rescan/data/index.json');
    const item = Array.isArray(index.items) ? index.items.find((entry) => entry.id === checklistId) : null;
    if (!item || !item.dataPath) return null;
    const checklist = await loadJson(item.dataPath);
    const guidance = await loadJson(`/rescan/data/guidance/${encodeURIComponent(checklistId)}.json`, true);
    if (!guidance || guidance.checklistId !== checklistId) return null;
    return { checklist, guidance };
  })().catch(() => null);

  const findResultBlock = (resultView, headingText) => [...resultView.querySelectorAll('.result-block')]
    .find((block) => block.querySelector('h3')?.textContent.trim() === headingText);

  const removeGenericPrompts = (resultView) => {
    findResultBlock(resultView, '생활에서 다시 살펴볼 질문')?.remove();
    resultView.querySelectorAll('.action-block').forEach((block) => block.remove());
  };

  const createTextElement = (tagName, className, text) => {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text || '';
    return element;
  };

  const createGuidanceBlock = (card) => {
    const responseType = card.response?.type || 'scene';
    const block = document.createElement('div');
    block.className = `result-block guidance-card guidance-${responseType}`;
    block.dataset.guidanceCard = card.id;

    block.appendChild(createTextElement('p', 'guidance-label', '응답에서 확인된 한 장면'));
    block.appendChild(createTextElement('h3', '', card.title));
    block.appendChild(createTextElement('p', 'guidance-scene', card.scene));

    if (card.response && card.response.text) {
      const response = document.createElement('div');
      response.className = 'guidance-response';
      response.appendChild(createTextElement('h4', '', card.response.title || '조금 더 머물러 볼 대목'));
      response.appendChild(createTextElement('p', '', card.response.text));
      block.appendChild(response);
    }
    return block;
  };

  const applyGuidance = async () => {
    const resultView = app.querySelector('.result-view');
    if (!resultView || resultView.dataset.guidanceProcessed === 'true' || !latestAnswers) return;

    const data = await dataPromise;
    if (!data) return;

    let calculation;
    try {
      calculation = window.ReScanScoring.calculate(data.checklist, latestAnswers);
    } catch (error) {
      return;
    }

    const card = window.ReScanGuidance.selectCard(data.guidance, calculation, latestAnswers);
    removeGenericPrompts(resultView);

    if (card) {
      const guidanceBlock = createGuidanceBlock(card);
      const methodBlock = findResultBlock(resultView, '결과 계산 안내');
      const readingBlock = findResultBlock(resultView, '함께 읽기');
      resultView.insertBefore(guidanceBlock, methodBlock || readingBlock || resultView.querySelector('.notice'));
    }

    resultView.dataset.guidanceProcessed = 'true';
  };

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || form.id !== 'rescan-form') return;
    latestAnswers = Object.fromEntries([...new FormData(form).entries()].map(([key, value]) => [key, Number(value)]));
    setTimeout(applyGuidance, 0);
  }, true);

  const observer = new MutationObserver(() => {
    if (app.querySelector('.result-view')) applyGuidance();
  });
  observer.observe(app, { childList: true, subtree: true });
});
