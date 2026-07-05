// ===== TODAY VIEW =====
// 하루 허브: 빠른 메모 · 정보 검색 · 지연 · 교시별 할 일 · 루틴 · 프로젝트 진척.
import {
  todayStr, fmtHuman, isRoutineOn, isOverdue, taskSort,
  SCHEDULE, currentSlot, blankItem,
} from '../model.js';
import { rowHtml, projRow, bindRows, esc } from '../ui.js';

export function render(el, ctx) {
  const items = ctx.items;
  const today = todayStr();
  const nowSlot = currentSlot();

  const overdue = items.filter(i => isOverdue(i, today)).sort((a, b) => a.due < b.due ? -1 : 1);
  const todayTasks = items.filter(i => i.type === 'task' && i.due === today);
  const doneCount = todayTasks.filter(t => t.done).length;
  const unassigned = todayTasks.filter(t => !t.period).sort(taskSort);
  const routines = items.filter(i => isRoutineOn(i, today));
  const routinesDone = routines.filter(r => (r.doneDates || []).includes(today)).length;
  const projects = items.filter(i => i.type === 'project' && (!i.end || i.end >= today));

  el.innerHTML = `
    <div class="today-date">${fmtHuman(today)}</div>

    <div class="section-title">빠른 메모</div>
    <textarea id="scratch-pad" class="scratch" placeholder="떠오르는 것을 바로 적으세요. 자동 저장됩니다.">${esc(ctx.state.scratch || '')}</textarea>

    <div class="section-title">정보 검색</div>
    <input type="text" id="mini-search" class="mini-search" placeholder="제목 · 내용 · #태그 로 즉시 검색" autocomplete="off">
    <div id="mini-results"></div>

    ${overdue.length ? `
      <div class="section-title text-danger">지연됨 <span class="count">${overdue.length}</span></div>
      ${overdue.map(i => rowHtml(i, items)).join('')}` : ''}

    <div class="section-title">교시별 할 일 <span class="count">${doneCount}/${todayTasks.length}</span></div>
    ${unassigned.length ? `
      <div class="slot-block">
        <div class="slot-head"><span>미배정</span></div>
        ${unassigned.map(t => rowHtml(t, items)).join('')}
      </div>` : ''}
    ${SCHEDULE.map(s => slotBlock(s, todayTasks, items, nowSlot)).filter(Boolean).join('')}
    ${todayTasks.length === 0 ? '<div class="empty">오늘 할 일이 없습니다. 위에서 캡처하거나 각 교시의 + 를 누르세요.</div>' : ''}

    <div class="section-title">루틴 <span class="count">${routinesDone}/${routines.length}</span></div>
    ${routines.length
      ? routines.map(r => rowHtml(r, items, { checked: (r.doneDates || []).includes(today) })).join('')
      : '<div class="empty">오늘 반복할 루틴이 없습니다</div>'}

    <div class="section-title">진행 중 프로젝트 <span class="count">${projects.length}</span></div>
    ${projects.length
      ? projects.map(p => projRow(p, items)).join('')
      : '<div class="empty">진행 중인 프로젝트가 없습니다</div>'}
  `;

  // ── 빠른 메모 자동 저장 (600ms 디바운스) ──
  const pad = el.querySelector('#scratch-pad');
  let tmr = null;
  pad.addEventListener('input', () => {
    ctx.state.scratch = pad.value;
    clearTimeout(tmr);
    tmr = setTimeout(() => ctx.saveScratch(pad.value), 600);
  });

  // ── 정보 검색 (입력 시 즉시 필터) ──
  const q = el.querySelector('#mini-search');
  const res = el.querySelector('#mini-results');
  q.addEventListener('input', () => {
    const term = q.value.trim().toLowerCase();
    if (!term) { res.innerHTML = ''; return; }
    const hits = items.filter(i =>
      `${i.title} ${i.body || ''} ${(i.tags || []).join(' ')}`.toLowerCase().includes(term)
    ).slice(0, 8);
    res.innerHTML = hits.length
      ? hits.map(i => rowHtml(i, items, { showType: true })).join('')
      : '<div class="empty">검색 결과가 없습니다</div>';
  });

  // ── 교시 + 버튼: 그 교시로 배정된 오늘 할 일 새로 만들기 ──
  el.querySelectorAll('[data-slot-add]').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    ctx.openEditor({ ...blankItem('task'), due: today, period: b.dataset.slotAdd });
  }));

  bindRows(el, ctx);
}

// 교시 한 칸. 빈 쉬는시간은 생략, 그 외에는 스켈레톤으로 항상 노출.
function slotBlock(s, todayTasks, items, nowSlot) {
  const tasks = todayTasks.filter(t => t.period === s.id).sort(taskSort);
  const isNow = nowSlot && nowSlot.id === s.id;
  return `<div class="slot-block${isNow ? ' now' : ''}">
    <div class="slot-head">
      <span>${s.label} <span class="slot-time mono">${s.start}~${s.end}</span></span>
      <button class="btn btn-ghost btn-sm" data-slot-add="${s.id}">+</button>
    </div>
    ${tasks.length ? tasks.map(t => rowHtml(t, items)).join('') : '<div class="slot-empty">비어 있음</div>'}
  </div>`;
}
