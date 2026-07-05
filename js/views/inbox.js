// ===== INBOX VIEW =====
// 캡처된 미분류 항목들. "분류"를 누르면 편집기에서 종류/날짜/태그를 정한다.
import { esc } from '../ui.js';

export function render(el, ctx) {
  const list = ctx.items
    .filter(i => i.type === 'inbox')
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  el.innerHTML = `
    <div class="inbox-hint">일단 던져 넣고, 시간이 날 때 분류하세요. 분류된 항목은 각 화면에 자동으로 나타납니다.</div>
    ${list.length ? list.map(row).join('') : '<div class="empty">인박스가 비어 있습니다</div>'}
  `;

  el.addEventListener('click', e => {
    const rowEl = e.target.closest('.row');
    if (!rowEl) return;
    const it = ctx.items.find(i => i.id === rowEl.dataset.id);
    if (!it) return;
    const act = e.target.closest('button')?.dataset.act;
    if (act === 'del') {
      if (confirm('이 항목을 삭제할까요?')) ctx.remove(it.id);
      return;
    }
    if (act === 'sort') {
      // 분류 시작: 종류 기본값만 '할 일'로 바꿔서 편집기 열기
      ctx.openEditor({ ...it, type: 'task' });
      return;
    }
    ctx.openEditor(it);
  });
}

function row(it) {
  const created = (it.createdAt || '').slice(0, 10);
  const tags = (it.tags || []).map(t => '#' + t).join(' ');
  return `<div class="row" data-id="${it.id}">
    <div class="row-main">
      <div class="row-title">${esc(it.title)}</div>
      <div class="row-meta">${created}${tags ? ' · ' + esc(tags) : ''}</div>
    </div>
    <div class="row-actions">
      <button class="btn btn-sm btn-primary" data-act="sort">분류</button>
      <button class="btn btn-sm" data-act="del">삭제</button>
    </div>
  </div>`;
}
