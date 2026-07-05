// ===== TODAY VIEW =====
// 오늘 기준으로 지연/마감/루틴/프로젝트를 한 화면에 모은다.
import { todayStr, fmtHuman, isRoutineOn, isOverdue, taskSort } from '../model.js';
import { rowHtml, projRow, bindRows } from '../ui.js';

export function render(el, ctx) {
  const items = ctx.items;
  const today = todayStr();

  const overdue = items.filter(i => isOverdue(i, today)).sort((a, b) => a.due < b.due ? -1 : 1);
  const dueToday = items.filter(i => i.type === 'task' && i.due === today).sort(taskSort);
  const routines = items.filter(i => isRoutineOn(i, today));
  const routinesDone = routines.filter(r => (r.doneDates || []).includes(today)).length;
  const projects = items.filter(i => i.type === 'project' && (!i.end || i.end >= today));

  el.innerHTML = `
    <div class="today-date">${fmtHuman(today)}</div>
    ${overdue.length ? `
      <div class="section-title text-danger">지연됨 <span class="count">${overdue.length}</span></div>
      ${overdue.map(i => rowHtml(i, items)).join('')}` : ''}
    <div class="section-title">오늘 할 일 <span class="count">${dueToday.length}</span></div>
    ${dueToday.length
      ? dueToday.map(i => rowHtml(i, items)).join('')
      : '<div class="empty">오늘 마감인 할 일이 없습니다</div>'}
    <div class="section-title">루틴 <span class="count">${routinesDone}/${routines.length}</span></div>
    ${routines.length
      ? routines.map(r => rowHtml(r, items, { checked: (r.doneDates || []).includes(today) })).join('')
      : '<div class="empty">오늘 반복할 루틴이 없습니다</div>'}
    <div class="section-title">진행 중 프로젝트 <span class="count">${projects.length}</span></div>
    ${projects.length
      ? projects.map(p => projRow(p, items)).join('')
      : '<div class="empty">진행 중인 프로젝트가 없습니다</div>'}
  `;
  bindRows(el, ctx);
}
