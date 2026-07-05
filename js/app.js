// ===== APP BOOTSTRAP =====
import { login, logout, watchAuth } from './firebase.js';
import {
  subscribeItems, subscribeSecrets, addItem, updateItem, deleteItem,
  addSecret, updateSecret, deleteSecret, setSecretCheck,
  subscribeMeta, setScratch,
} from './store.js';
import { blankItem, parseCapture, todayStr, startOfWeek } from './model.js';
import { openEditor, toast } from './ui.js';
import * as todayView from './views/today.js';
import * as weekView from './views/week.js';
import * as inboxView from './views/inbox.js';
import * as searchView from './views/search.js';
import * as secretView from './views/secret.js';

const VIEWS = { today: todayView, week: weekView, inbox: inboxView, search: searchView, secret: secretView };

// ===== STATE =====
const state = {
  user: null,
  items: [],
  secrets: [],
  weekAnchor: startOfWeek(todayStr()), // 주간 뷰가 보고 있는 주의 월요일
  secretPass: null,                    // 금고 암호 (세션 메모리에만 보관)
  search: { q: '', tags: [] },
  scratch: '',                         // 오늘 뷰 빠른 메모
};
let unsubItems = null;
let unsubSecrets = null;
let unsubMeta = null;

const $ = id => document.getElementById(id);

// ===== AUTH =====
$('btn-login').addEventListener('click', login);
$('btn-logout').addEventListener('click', () => { if (confirm('로그아웃할까요?')) logout(); });

watchAuth(user => {
  state.user = user;
  $('login-screen').classList.toggle('hidden', !!user);
  $('app').classList.toggle('hidden', !user);
  if (unsubItems) { unsubItems(); unsubItems = null; }
  if (unsubSecrets) { unsubSecrets(); unsubSecrets = null; }
  if (unsubMeta) { unsubMeta(); unsubMeta = null; }
  if (user) {
    $('user-name').textContent = user.displayName || user.email || '';
    unsubItems = subscribeItems(user.uid, items => { state.items = items; render(); });
    unsubSecrets = subscribeSecrets(user.uid, secrets => {
      state.secrets = secrets;
      if (currentView() === 'secret') render();
    });
    unsubMeta = subscribeMeta(user.uid, meta => {
      state.scratch = meta.text || '';
      // 입력 중 포커스를 뺏지 않도록, 편집 중이 아닐 때만 값을 반영
      const pad = document.getElementById('scratch-pad');
      if (pad && document.activeElement !== pad) pad.value = state.scratch;
    });
  } else {
    state.items = [];
    state.secrets = [];
    state.secretPass = null;
    state.scratch = '';
  }
});

// ===== CAPTURE =====
// 어떤 화면에서든 위 입력창으로 즉시 인박스에 저장. 분류는 나중에.
$('capture-form').addEventListener('submit', e => {
  e.preventDefault();
  if (!state.user) return;
  const input = $('capture-input');
  const parsed = parseCapture(input.value);
  if (!parsed.title) return;
  addItem(state.user.uid, { ...blankItem('inbox'), ...parsed });
  input.value = '';
  input.focus();
  toast('인박스에 저장됨');
});

// ===== ROUTER / RENDER =====
const currentView = () => location.hash.slice(1) || 'today';
window.addEventListener('hashchange', render);

function buildCtx() {
  const uid = state.user.uid;
  const ctx = {
    items: state.items,
    secrets: state.secrets,
    state,
    save: (data, id) => id ? updateItem(uid, id, data) : addItem(uid, { ...blankItem(), ...data }),
    remove: id => deleteItem(uid, id),
    saveScratch: text => setScratch(uid, text),
    toggleRoutine: it => {
      const t = todayStr();
      const dd = it.doneDates || [];
      updateItem(uid, it.id, { doneDates: dd.includes(t) ? dd.filter(x => x !== t) : [...dd, t] });
    },
    addSecret: data => addSecret(uid, data),
    updateSecret: (id, data) => updateSecret(uid, id, data),
    deleteSecret: id => deleteSecret(uid, id),
    saveSecretCheck: data => setSecretCheck(uid, data),
    rerender: render,
  };
  ctx.openEditor = item => openEditor(ctx, item);
  return ctx;
}

function render() {
  if (!state.user) return;
  const view = VIEWS[currentView()] ? currentView() : 'today';
  document.querySelectorAll('.nav a').forEach(a =>
    a.classList.toggle('active', a.dataset.view === view));
  const n = state.items.filter(i => i.type === 'inbox').length;
  const badge = $('inbox-badge');
  badge.textContent = n;
  badge.classList.toggle('hidden', n === 0);
  // 매 렌더마다 새 루트를 만들어 이벤트 리스너 중복을 방지
  const root = document.createElement('div');
  VIEWS[view].render(root, buildCtx());
  $('view').replaceChildren(root);
}

// ===== PWA =====
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
