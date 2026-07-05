// ===== SHARED UI HELPERS =====
import { TYPES, DOW_KO, progressOf } from './model.js';

export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

// ===== TOAST =====
export function toast(msg) {
  const root = document.getElementById('toast-root');
  root.innerHTML = `<div class="toast">${esc(msg)}</div>`;
  const el = root.firstElementChild;
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 200); }, 2000);
}

// ===== MODAL =====
export function openModal(html) {
  const root = document.getElementById('modal-root');
  root.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`;
  root.firstElementChild.addEventListener('click', e => {
    if (e.target === root.firstElementChild) closeModal();
  });
  return root.querySelector('.modal');
}
export function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

// ===== SMALL PIECES =====
export const typeBadge = t => `<span class="type-badge type-${esc(t)}">${TYPES[t] || esc(t)}</span>`;
export const tagChips = (tags, on = []) =>
  (tags || []).map(t =>
    `<span class="tag${on.includes(t) ? ' on' : ''}" data-tag="${esc(t)}">#${esc(t)}</span>`
  ).join('');
export const prioMark = it =>
  `${it.important ? '<span class="prio prio-imp">중요</span>' : ''}` +
  `${it.urgent ? '<span class="prio prio-urg">긴급</span>' : ''}`;

// ===== ITEM ROW =====
// 뷰들이 공통으로 쓰는 한 줄 렌더링. opts.checked로 체크 상태를 덮어쓸 수 있다(루틴의 오늘 완료).
export function rowHtml(it, items, opts = {}) {
  const done = opts.checked !== undefined ? opts.checked : !!it.done;
  const showCheck = it.type === 'task' || it.type === 'routine';
  const meta = [];
  if (opts.showType) meta.push(typeBadge(it.type));
  if (it.due) meta.push(`<span class="mono">${esc(it.due)}${it.dueTime ? ' ' + esc(it.dueTime) : ''}</span>`);
  if (it.parentId) {
    const p = items.find(x => x.id === it.parentId);
    if (p) meta.push(esc(p.title));
  }
  if (it.tags && it.tags.length) meta.push(tagChips(it.tags));
  return `<div class="row${done ? ' done' : ''}" data-id="${it.id}">
    ${showCheck ? `<input type="checkbox" class="row-check"${done ? ' checked' : ''}>` : ''}
    <div class="row-main">
      <div class="row-title">${esc(it.title)}${prioMark(it)}</div>
      ${meta.length ? `<div class="row-meta">${meta.join(' · ')}</div>` : ''}
    </div>
  </div>`;
}

// 프로젝트 진행률 카드 (오늘/주간 뷰 공용)
export function projRow(p, items) {
  const pr = progressOf(items, p.id);
  const range = (p.start || p.end)
    ? `<span class="mono">${esc(p.start || '?')} ~ ${esc(p.end || '?')}</span> · ` : '';
  return `<div class="row" data-id="${p.id}">
    <div class="row-main">
      <div class="row-title">${esc(p.title)}${prioMark(p)}</div>
      <div class="row-meta">${range}하위 ${pr.done}/${pr.total} 완료 (${pr.pct}%)</div>
      <div class="progress"><div class="progress-fill" style="width:${pr.pct}%"></div></div>
    </div>
  </div>`;
}

// 행 이벤트 위임: 체크박스 = 완료 토글, 행 클릭 = 편집기 열기
export function bindRows(container, ctx) {
  container.addEventListener('change', e => {
    const check = e.target.closest('.row-check');
    if (!check) return;
    const id = check.closest('.row').dataset.id;
    const it = ctx.items.find(i => i.id === id);
    if (!it) return;
    if (it.type === 'routine') ctx.toggleRoutine(it);
    else ctx.save({ done: !it.done }, it.id);
  });
  container.addEventListener('click', e => {
    if (e.target.closest('.row-check') || e.target.closest('button')) return;
    const row = e.target.closest('.row');
    if (!row) return;
    const it = ctx.items.find(i => i.id === row.dataset.id);
    if (it) ctx.openEditor(it);
  });
}

// ===== ITEM EDITOR =====
// 인박스 분류와 항목 편집이 모두 이 편집기 하나를 쓴다.
export function openEditor(ctx, item) {
  const it = { ...item };
  const isNew = !it.id;
  const projects = ctx.items.filter(i => i.type === 'project' && i.id !== it.id);

  const modal = openModal(`
    <h2>${isNew ? '새 항목' : '항목 편집'}</h2>
    <form id="editor-form">
      <label>종류</label>
      <select name="type">${Object.entries(TYPES).map(([v, l]) =>
        `<option value="${v}"${it.type === v ? ' selected' : ''}>${l}</option>`).join('')}
      </select>
      <label>제목</label>
      <input type="text" name="title" value="${esc(it.title)}" required>
      <label>내용</label>
      <textarea name="body">${esc(it.body)}</textarea>
      <label>태그 (공백으로 구분)</label>
      <input type="text" name="tags" value="${esc((it.tags || []).join(' '))}">
      <div data-for="task">
        <label>마감일</label>
        <input type="date" name="due" value="${esc(it.due || '')}">
        <label>마감 시각 (선택)</label>
        <input type="time" name="dueTime" value="${esc(it.dueTime || '')}">
        <label>상위 프로젝트</label>
        <select name="parentId">
          <option value="">없음</option>
          ${projects.map(p => `<option value="${p.id}"${it.parentId === p.id ? ' selected' : ''}>${esc(p.title)}</option>`).join('')}
        </select>
      </div>
      <div data-for="project">
        <label>시작일</label>
        <input type="date" name="start" value="${esc(it.start || '')}">
        <label>종료일</label>
        <input type="date" name="end" value="${esc(it.end || '')}">
      </div>
      <div data-for="routine">
        <label>반복</label>
        <select name="repeat">
          <option value="daily"${it.repeat !== 'weekdays' && it.repeat !== 'weekly' ? ' selected' : ''}>매일</option>
          <option value="weekdays"${it.repeat === 'weekdays' ? ' selected' : ''}>평일 (월~금)</option>
          <option value="weekly"${it.repeat === 'weekly' ? ' selected' : ''}>요일 선택</option>
        </select>
        <div class="dow-row" data-dow>
          ${DOW_KO.map((d, i) =>
            `<label><input type="checkbox" name="repeatDays" value="${i}"${(it.repeatDays || []).includes(i) ? ' checked' : ''}><span>${d}</span></label>`
          ).join('')}
        </div>
      </div>
      <div class="prio-row" data-for="task project">
        <label class="check-label"><input type="checkbox" name="important"${it.important ? ' checked' : ''}> 중요</label>
        <label class="check-label"><input type="checkbox" name="urgent"${it.urgent ? ' checked' : ''}> 긴급</label>
      </div>
      <div class="modal-actions">
        ${isNew ? '' : '<button type="button" class="btn btn-danger" data-del>삭제</button>'}
        <span class="spacer"></span>
        <button type="button" class="btn" data-cancel>취소</button>
        <button type="submit" class="btn btn-primary">저장</button>
      </div>
    </form>`);

  const form = modal.querySelector('#editor-form');

  // 종류에 따라 관련 필드만 노출
  const sync = () => {
    const t = form.type.value;
    modal.querySelectorAll('[data-for]').forEach(d =>
      d.classList.toggle('hidden', !d.dataset.for.split(' ').includes(t)));
    modal.querySelector('[data-dow]').classList.toggle(
      'hidden', !(t === 'routine' && form.repeat.value === 'weekly'));
  };
  form.type.addEventListener('change', sync);
  form.repeat.addEventListener('change', sync);
  sync();

  modal.querySelector('[data-cancel]').addEventListener('click', closeModal);
  const delBtn = modal.querySelector('[data-del]');
  if (delBtn) delBtn.addEventListener('click', () => {
    if (confirm('이 항목을 삭제할까요?')) {
      ctx.remove(it.id);
      closeModal();
      toast('삭제됨');
    }
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const f = new FormData(form);
    const data = {
      type: f.get('type'),
      title: String(f.get('title')).trim(),
      body: String(f.get('body')),
      tags: [...new Set(String(f.get('tags')).split(/[\s,]+/).map(s => s.replace(/^#/, '')).filter(Boolean))],
      due: f.get('due') || null,
      dueTime: f.get('dueTime') || null,
      parentId: f.get('parentId') || null,
      start: f.get('start') || null,
      end: f.get('end') || null,
      repeat: f.get('repeat') || null,
      repeatDays: f.getAll('repeatDays').map(Number),
      important: f.has('important'),
      urgent: f.has('urgent'),
    };
    if (!data.title) return;
    ctx.save(data, it.id);
    closeModal();
    toast('저장됨');
  });
}
