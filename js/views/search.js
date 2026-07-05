// ===== SEARCH VIEW =====
// 텍스트 + 태그 조합 검색. 데이터 전체를 메모리에서 즉시 필터링한다.
import { allTags } from '../model.js';
import { rowHtml, bindRows, esc } from '../ui.js';

const MAX_RESULTS = 100;

export function render(el, ctx) {
  const s = ctx.state.search;

  el.innerHTML = `
    <div class="search-box">
      <input type="text" id="search-q" placeholder="제목, 내용, 태그 검색" value="${esc(s.q)}" autocomplete="off">
    </div>
    <div class="tag-cloud" id="tag-cloud"></div>
    <div id="search-list"></div>
  `;
  const qInput = el.querySelector('#search-q');
  const cloud = el.querySelector('#tag-cloud');
  const list = el.querySelector('#search-list');

  const drawCloud = () => {
    const tags = allTags(ctx.items);
    cloud.innerHTML = tags.length
      ? tags.map(([t, c]) =>
          `<span class="tag${s.tags.includes(t) ? ' on' : ''}" data-tag="${esc(t)}">#${esc(t)} ${c}</span>`
        ).join(' ')
      : '<span class="inbox-hint">아직 태그가 없습니다. 캡처할 때 #태그 를 붙여 보세요.</span>';
  };

  const drawList = () => {
    const q = s.q.trim().toLowerCase();
    let res = ctx.items.filter(i => s.tags.every(t => (i.tags || []).includes(t)));
    if (q) {
      res = res.filter(i =>
        `${i.title} ${i.body || ''} ${(i.tags || []).join(' ')}`.toLowerCase().includes(q));
    }
    res = res.slice().sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    const over = res.length > MAX_RESULTS;
    list.innerHTML =
      (res.slice(0, MAX_RESULTS).map(i => rowHtml(i, ctx.items, { showType: true })).join('')
        || '<div class="empty">검색 결과가 없습니다</div>')
      + (over ? `<div class="empty">${MAX_RESULTS}건까지만 표시합니다. 검색어를 좁혀 보세요.</div>` : '');
  };

  qInput.addEventListener('input', () => { s.q = qInput.value; drawList(); });
  cloud.addEventListener('click', e => {
    const t = e.target.closest('[data-tag]')?.dataset.tag;
    if (!t) return;
    s.tags = s.tags.includes(t) ? s.tags.filter(x => x !== t) : [...s.tags, t];
    drawCloud();
    drawList();
  });
  bindRows(list, ctx);

  drawCloud();
  drawList();
}
