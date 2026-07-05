// ===== DATE UTILS =====
export const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function fmtYmd(d) {
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export const todayStr = () => fmtYmd(new Date());

export function addDays(ymd, n) {
  const d = new Date(ymd + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return fmtYmd(d);
}
export function dowOf(ymd) {
  return new Date(ymd + 'T00:00:00').getDay();
}
export function startOfWeek(ymd) { // 월요일 시작
  return addDays(ymd, -((dowOf(ymd) + 6) % 7));
}
export function weekDays(startYmd) {
  return Array.from({ length: 7 }, (_, i) => addDays(startYmd, i));
}
export function fmtHuman(ymd) {
  const [, m, d] = ymd.split('-').map(Number);
  return `${m}월 ${d}일 (${DOW_KO[dowOf(ymd)]})`;
}

// ===== ITEM MODEL =====
// 모든 기록은 하나의 아이템 구조를 공유한다. type만 다르다.
export const TYPES = {
  inbox: '미분류',
  task: '할 일',
  project: '프로젝트',
  routine: '루틴',
  note: '메모',
};

export function blankItem(type = 'inbox') {
  return {
    type,
    title: '',
    body: '',
    tags: [],
    done: false,        // task 완료 여부
    doneDates: [],      // routine의 날짜별 완료 기록 ['YYYY-MM-DD']
    due: null,          // task 마감일 'YYYY-MM-DD'
    dueTime: null,      // task 마감 시각 'HH:MM' (선택)
    start: null,        // project 시작일
    end: null,          // project 종료일
    repeat: null,       // routine: 'daily' | 'weekdays' | 'weekly'
    repeatDays: [],     // routine weekly: 요일 번호 배열 (0=일)
    important: false,
    urgent: false,
    parentId: null,     // task -> 상위 project 연결
  };
}

// 캡처 입력에서 #태그를 뽑아낸다. "출장비 정산 #행정 #7월" -> 제목 + 태그
export function parseCapture(text) {
  const tags = [...new Set([...text.matchAll(/#([^\s#,]+)/g)].map(m => m[1]))];
  let title = text.replace(/#[^\s#,]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!title) title = text.trim();
  return { title, tags };
}

// ===== ITEM QUERIES =====
export function isRoutineOn(item, ymd) {
  if (item.type !== 'routine') return false;
  const dow = dowOf(ymd);
  if (item.repeat === 'weekdays') return dow >= 1 && dow <= 5;
  if (item.repeat === 'weekly') return (item.repeatDays || []).includes(dow);
  return true; // 'daily' 또는 미설정
}

export function isOverdue(item, today) {
  return item.type === 'task' && !item.done && !!item.due && item.due < today;
}

export function progressOf(items, projectId) {
  const kids = items.filter(i => i.parentId === projectId && i.type === 'task');
  const done = kids.filter(k => k.done).length;
  const total = kids.length;
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function taskSort(a, b) {
  if (a.done !== b.done) return a.done ? 1 : -1;               // 완료는 아래로
  const at = a.dueTime || '99:99', bt = b.dueTime || '99:99';  // 시각 빠른 순
  if (at !== bt) return at < bt ? -1 : 1;
  const ap = (a.urgent ? 2 : 0) + (a.important ? 1 : 0);       // 긴급/중요 우선
  const bp = (b.urgent ? 2 : 0) + (b.important ? 1 : 0);
  if (ap !== bp) return bp - ap;
  return (a.title || '').localeCompare(b.title || '');
}

// 태그 사용 횟수 집계: [['행정', 12], ['3학년', 5], ...] 많이 쓴 순
export function allTags(items) {
  const count = {};
  for (const i of items) for (const t of i.tags || []) count[t] = (count[t] || 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
