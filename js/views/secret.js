// ===== SECRET VIEW (금고) =====
// 내용은 기기에서 암호화 후 저장. 금고 암호는 세션 메모리에만 있고 저장되지 않는다.
// 암호 검증은 고정 문서(_check)를 복호화해 보는 방식.
import { esc, toast, openModal, closeModal } from '../ui.js';
import { encryptText, decryptText } from '../crypto.js';

export function render(el, ctx) {
  if (!ctx.state.secretPass) {
    renderLock(el, ctx);
    return;
  }

  const list = ctx.secrets
    .filter(s => s.id !== '_check')
    .sort((a, b) => (a.label || '').localeCompare(b.label || ''));

  el.innerHTML = `
    <div class="secret-head">
      <span class="section-title">금고</span>
      <span class="spacer"></span>
      <button class="btn btn-sm" data-lock>잠그기</button>
      <button class="btn btn-sm btn-primary" data-new>새 항목</button>
    </div>
    <div class="secret-note">내용은 이 기기에서 암호화된 뒤에만 저장됩니다. 금고 암호를 잊으면 내용을 복구할 수 없습니다.</div>
    ${list.length
      ? list.map(s => `<div class="row" data-id="${s.id}">
          <div class="row-main">
            <div class="row-title">${esc(s.label)}</div>
            <div class="row-meta mono">${(s.updatedAt || '').slice(0, 10)}</div>
          </div>
        </div>`).join('')
      : '<div class="empty">저장된 항목이 없습니다</div>'}
  `;

  el.querySelector('[data-lock]').addEventListener('click', () => {
    ctx.state.secretPass = null;
    ctx.rerender();
  });
  el.querySelector('[data-new]').addEventListener('click', () => openSecretModal(ctx, null));
  el.addEventListener('click', e => {
    if (e.target.closest('button')) return;
    const row = e.target.closest('.row');
    if (!row) return;
    const s = ctx.secrets.find(x => x.id === row.dataset.id);
    if (s) openSecretModal(ctx, s);
  });
}

// ===== LOCK SCREEN =====
function renderLock(el, ctx) {
  const check = ctx.secrets.find(s => s.id === '_check');
  el.innerHTML = `
    <div class="card lock-card">
      <div class="row-title">${check ? '금고 잠금 해제' : '금고 암호 설정'}</div>
      <div class="secret-note">${check
        ? '금고 암호를 입력하세요.'
        : '처음 사용합니다. 금고 암호를 정하세요. 이 암호는 어디에도 저장되지 않으며, 잊으면 내용을 복구할 수 없습니다.'}</div>
      <form id="lock-form">
        <input type="password" name="pass" placeholder="금고 암호" required autocomplete="off">
        <div class="modal-actions">
          <span class="spacer"></span>
          <button type="submit" class="btn btn-primary">${check ? '열기' : '설정'}</button>
        </div>
      </form>
    </div>
  `;
  el.querySelector('#lock-form').addEventListener('submit', async e => {
    e.preventDefault();
    const pass = String(new FormData(e.target).get('pass'));
    if (check) {
      try {
        await decryptText(pass, check);
      } catch {
        toast('암호가 다릅니다');
        return;
      }
    } else {
      await ctx.saveSecretCheck(await encryptText(pass, 'worknote-check'));
    }
    ctx.state.secretPass = pass;
    ctx.rerender();
  });
}

// ===== SECRET EDITOR =====
async function openSecretModal(ctx, s) {
  const pass = ctx.state.secretPass;
  let body = '';
  if (s) {
    try {
      body = await decryptText(pass, s);
    } catch {
      toast('해독 실패 — 금고 암호가 다릅니다');
      return;
    }
  }
  const modal = openModal(`
    <h2>${s ? '항목 편집' : '새 항목'}</h2>
    <form id="secret-form">
      <label>이름 (목록에 표시, 암호화되지 않음)</label>
      <input type="text" name="label" value="${esc(s ? s.label : '')}" required>
      <label>내용 (암호화됨)</label>
      <textarea name="body">${esc(body)}</textarea>
      <div class="modal-actions">
        ${s ? '<button type="button" class="btn btn-danger" data-del>삭제</button>' : ''}
        <span class="spacer"></span>
        <button type="button" class="btn" data-cancel>취소</button>
        <button type="submit" class="btn btn-primary">저장</button>
      </div>
    </form>`);

  modal.querySelector('[data-cancel]').addEventListener('click', closeModal);
  const delBtn = modal.querySelector('[data-del]');
  if (delBtn) delBtn.addEventListener('click', () => {
    if (confirm('이 항목을 삭제할까요?')) {
      ctx.deleteSecret(s.id);
      closeModal();
      toast('삭제됨');
    }
  });
  modal.querySelector('#secret-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const label = String(f.get('label')).trim();
    if (!label) return;
    const encd = await encryptText(pass, String(f.get('body')));
    const data = { label, ...encd };
    if (s) ctx.updateSecret(s.id, data);
    else ctx.addSecret(data);
    closeModal();
    toast('저장됨');
  });
}
