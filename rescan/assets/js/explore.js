document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.querySelector('#topic-search');
  const filters = document.querySelector('#topic-filters');
  const reset = document.querySelector('#topic-reset');
  const list = document.querySelector('#checklist-list');
  const empty = document.querySelector('#topic-empty');

  const escapeHtml = (value = '') => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  if (searchInput && filters && list) {
    let items = [];

    const activeCategory = () => filters.querySelector('[aria-pressed="true"]')?.dataset.category || '전체';

    const ensureCategoryFilters = () => {
      const existing = new Set([...filters.querySelectorAll('button[data-category]')].map((button) => button.dataset.category));
      const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
      categories.forEach((category) => {
        if (existing.has(category)) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.category = category;
        button.setAttribute('aria-pressed', 'false');
        button.textContent = category;
        filters.appendChild(button);
      });
    };

    const render = () => {
      const term = searchInput.value.trim().toLowerCase();
      const category = activeCategory();
      const visible = items.filter((item) => {
        const categoryMatch = category === '전체' || item.category === category;
        const text = [item.title, item.subtitle, ...(item.keywords || [])].join(' ').toLowerCase();
        return categoryMatch && text.includes(term);
      });

      list.innerHTML = visible.map((item) => {
        const ready = item.status === 'published' && item.dataPath;
        const href = ready ? `/rescan/checklist.html?id=${encodeURIComponent(item.id)}` : '#';
        const disabled = ready ? '' : 'aria-disabled="true" tabindex="-1"';
        return `<a class="card${ready ? '' : ' is-planned'}" href="${href}" ${disabled}><span class="tag">${ready ? '검사 가능' : '준비 중'}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.subtitle)}</p><span class="go">${ready ? '심리 검사 시작 →' : '준비 중'}</span></a>`;
      }).join('');
      empty.hidden = visible.length > 0;
    };

    fetch('/rescan/data/index.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`목록을 불러오지 못했습니다. (${response.status})`);
        return response.json();
      })
      .then((data) => {
        items = (data.items || []).filter((item) => item.status !== 'hidden');
        ensureCategoryFilters();
        render();
      })
      .catch(() => {
        list.innerHTML = '<div class="panel"><p>심리 검사 목록을 불러오지 못했습니다.</p></div>';
      });

    searchInput.addEventListener('input', render);
    filters.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-category]');
      if (!button) return;
      filters.querySelectorAll('button[data-category]').forEach((item) => item.setAttribute('aria-pressed', 'false'));
      button.setAttribute('aria-pressed', 'true');
      render();
    });
    reset.addEventListener('click', () => {
      searchInput.value = '';
      filters.querySelectorAll('button[data-category]').forEach((item) => item.setAttribute('aria-pressed', item.dataset.category === '전체' ? 'true' : 'false'));
      render();
      searchInput.focus();
    });
  }

  const app = document.querySelector('#checklist-app');
  if (!app) return;

  const id = new URLSearchParams(location.search).get('id');
  if (!id) {
    document.querySelector('meta[name="robots"]')?.setAttribute('content', 'noindex,follow');
    return;
  }

  fetch('/rescan/data/index.json', { cache: 'no-store' })
    .then((response) => response.json())
    .then((data) => {
      const item = (data.items || []).find((entry) => entry.id === id);
      if (!item) return;
      const canonical = `https://4th-season.com/rescan/checklist.html?id=${encodeURIComponent(id)}`;
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.rel = 'canonical';
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.href = canonical;

      const setMeta = (selector, attribute, value) => {
        let element = document.querySelector(selector);
        if (!element) {
          element = document.createElement('meta');
          const match = selector.match(/\[(?:property|name)="([^"]+)/);
          if (attribute === 'property') element.setAttribute('property', match?.[1] || '');
          else element.name = match?.[1] || '';
          document.head.appendChild(element);
        }
        element.setAttribute('content', value);
      };

      setMeta('meta[name="description"]', 'name', item.subtitle);
      setMeta('meta[property="og:title"]', 'property', `${item.title} | Re:Scan 심리 검사`);
      setMeta('meta[property="og:description"]', 'property', item.subtitle);
      setMeta('meta[property="og:url"]', 'property', canonical);
      setMeta('meta[property="og:image"]', 'property', 'https://4th-season.com/assets/map-note.png');
      document.querySelector('meta[name="robots"]')?.setAttribute('content', item.status === 'published' ? 'index,follow' : 'noindex,follow');
    })
    .catch(() => {});
});
