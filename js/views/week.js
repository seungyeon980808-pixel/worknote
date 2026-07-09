// ===== WEEK VIEW =====
// 7일 컬럼 + 이 주에 걸친 프로젝트. 모바일은 세로 나열, 데스크톱은 7열 그리드.
import { todayStr, addDays, startOfWeek, weekDays, dowOf, DOW_KO, taskSort } from '../model.js';
import { rowHtml, projRow, bindRows, bindDayAdd } from '../ui.js';

export function render(el, ctx) {
  const items = ctx.items;
  const today = todayStr();
  const start = ctx.state.weekAnchor;
  const days = weekDays(start);
  const end = days[6];

  const projects = items.filter(p =>
    p.type === 'project' && p.start && p.end && p.start <= end && p.end >= start);

  el.innerHTML = `
    <div class="week-head">
      <button class="btn btn-sm" data-prev>이전</button>
      <span class="week-range mono">${start} ~ ${end}</span>
      <button class="btn btn-sm" data-next>다음</button>
      <button class="btn btn-sm" data-this>이번 주</button>
    </div>
    ${projects.length ? `
      <div class="section-title">이 주의 프로젝트 <span class="count">${projects.length}</span></div>
      ${projects.map(p => projRow(p, items)).join('')}` : ''}
    ${weekGridHtml(start, items, today)}
  `;

  el.querySelector('[data-prev]').addEventListener('click', () => {
    ctx.state.weekAnchor = addDays(start, -7);
    ctx.rerender();
  });
  el.querySelector('[data-next]').addEventListener('click', () => {
    ctx.state.weekAnchor = addDays(start, 7);
    ctx.rerender();
  });
  el.querySelector('[data-this]').addEventListener('click', () => {
    ctx.state.weekAnchor = startOfWeek(today);
    ctx.rerender();
  });
  bindDayAdd(el, ctx);
  bindRows(el, ctx);
}

// 7일 그리드 HTML. 오늘 뷰 대시보드에서도 재사용한다.
export function weekGridHtml(startYmd, items, today) {
  const days = weekDays(startYmd);
  return `<div class="week-days">${days.map(d => dayCol(d, items, today)).join('')}</div>`;
}

function dayCol(d, items, today) {
  const tasks = items.filter(i => i.type === 'task' && i.due === d).sort(taskSort);
  return `<div class="day-col">
    <div class="day-head${d === today ? ' today' : ''}">
      <span>${Number(d.slice(8))}일 (${DOW_KO[dowOf(d)]})</span>
      <button class="btn btn-ghost btn-sm day-add" data-add="${d}">+</button>
    </div>
    ${tasks.map(t => rowHtml(t, items)).join('') || '<div class="empty">&mdash;</div>'}
  </div>`;
}
