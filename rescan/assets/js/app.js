document.addEventListener('DOMContentLoaded', async () => {
  const list = document.querySelector('#checklist-list');

  if (list) {
    try {
      const response = await fetch('/rescan/data/index.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('목록을 불러오지 못했습니다.');

      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];

      list.innerHTML = items.map((item) => {
        const ready = item.status === 'published';
        const href = ready
          ? `/rescan/checklist.html?id=${encodeURIComponent(item.id)}`
          : `/rescan/checklist.html?id=${encodeURIComponent(item.id)}&status=planned`;
        const label = ready ? '자가점검 시작' : '준비 중';

        return `<a class="card${ready ? '' : ' is-planned'}" href="${href}" aria-label="${item.title} ${label}">
          <span class="tag">${ready ? 'AVAILABLE' : 'COMING SOON'}</span>
          <h3>${item.title}</h3>
          <p>${item.subtitle}</p>
          <span class="go">${label} →</span>
        </a>`;
      }).join('');

      if (!items.length) throw new Error('등록된 주제가 없습니다.');
    } catch (error) {
      list.innerHTML = '<div class="panel"><p>체크리스트 목록을 준비하고 있습니다.</p><p style="margin-top:12px"><a class="button" href="/rescan/about.html">이용 안내 보기</a></p></div>';
    }
  }

  const app = document.querySelector('#checklist-app');
  if (app) {
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
      app.innerHTML = '<div class="notice">아직 공개되지 않은 주제입니다. 오류가 아니라 준비 중 상태입니다.</div><div class="actions"><a class="button primary" href="/rescan/#topics">다른 주제 보기</a><a class="button" href="/rescan/about.html">이용 안내</a><a class="button" href="/rescan/">Re:Scan 홈</a></div>';
      return;
    }

    app.innerHTML = '<p>선택한 체크리스트 데이터를 불러올 준비가 되었습니다.</p><div class="actions"><a class="button" href="/rescan/">Re:Scan 홈</a><a class="button" href="/rescan/about.html">이용 안내</a></div>';
  }
});
