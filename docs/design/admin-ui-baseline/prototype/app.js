// ==========================================================================
// Lingora Admin UI Baseline Prototype Controller
// ==========================================================================

const stateSelect = document.getElementById('stateSelect');
const authView = document.getElementById('authView');
const appContainer = document.getElementById('appContainer');

// Modals
const languageFormModal = document.getElementById('languageFormModal');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const deleteBlockedModal = document.getElementById('deleteBlockedModal');
const sessionLostModal = document.getElementById('sessionLostModal');

// Form fields
const formModalTitle = document.getElementById('formModalTitle');
const langCodeInput = document.getElementById('langCodeInput');
const codeHint = document.getElementById('codeHint');
const codeError = document.getElementById('codeError');
const langViInput = document.getElementById('langViInput');
const langEnInput = document.getElementById('langEnInput');
const checkLearnable = document.getElementById('checkLearnable');
const checkUiLocale = document.getElementById('checkUiLocale');
const formSubmitBtn = document.getElementById('formSubmitBtn');

// Delete modals content & buttons
const deleteConfirmMessage = document.getElementById('deleteConfirmMessage');
const deleteBlockedMessage = document.getElementById('deleteBlockedMessage');
const deleteCancelBtn = document.getElementById('deleteCancelBtn');
const deleteSubmitBtn = document.getElementById('deleteSubmitBtn');
const blockedCloseBtn = document.getElementById('blockedCloseBtn');
const sessionLoginBtn = document.getElementById('sessionLoginBtn');

// Table states
const populatedTable = document.getElementById('populatedTable');
const emptyTableView = document.getElementById('emptyTableView');
const loadingTableView = document.getElementById('loadingTableView');
const fetchErrorTableView = document.getElementById('fetchErrorTableView');
const tableSummary = document.getElementById('tableSummary');
const tableMutationStatus = document.getElementById('tableMutationStatus');
const searchInput = document.querySelector('.search-input');

// Auth states
const loginAlert = document.getElementById('loginAlert');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');

// Track trigger for focus restoration & active delete code
let triggerElement = null;
let currentDeleteCode = null;

// Initial Fixture Data (authoritative default catalogue)
const DEFAULT_LANGUAGES = [
  { code: 'vi', vi: 'Tiếng Việt', en: 'Vietnamese', learnable: true, uiLocale: true, blocked: true },
  { code: 'en', vi: 'Tiếng Anh', en: 'English', learnable: true, uiLocale: true, blocked: true },
  { code: 'ja', vi: 'Tiếng Nhật', en: 'Japanese', learnable: true, uiLocale: false, blocked: false },
  { code: 'fr', vi: 'Tiếng Pháp', en: 'French', learnable: false, uiLocale: false, blocked: false }
];

let languages = JSON.parse(JSON.stringify(DEFAULT_LANGUAGES));

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showMutationStatus(message) {
  if (!tableMutationStatus) return;
  tableMutationStatus.textContent = message;
  tableMutationStatus.style.display = 'inline-block';
}

function clearMutationStatus() {
  if (!tableMutationStatus) return;
  tableMutationStatus.textContent = '';
  tableMutationStatus.style.display = 'none';
}

function renderTable(filterQuery = '') {
  if (!populatedTable) return;
  const tbody = populatedTable.querySelector('tbody');
  if (!tbody) return;

  const query = filterQuery.trim().toLowerCase();
  const visibleItems = query
    ? languages.filter(l => l.code.toLowerCase().includes(query) || l.vi.toLowerCase().includes(query) || (l.en && l.en.toLowerCase().includes(query)))
    : languages;

  if (languages.length === 0) {
    populatedTable.style.display = 'none';
    emptyTableView.style.display = 'flex';
    if (tableSummary) {
      tableSummary.style.display = 'none';
      tableSummary.textContent = '0 ngôn ngữ trong danh mục';
    }
    return;
  }

  populatedTable.style.display = 'table';
  emptyTableView.style.display = 'none';
  if (tableSummary) {
    tableSummary.style.display = 'block';
    tableSummary.textContent = `${languages.length} ngôn ngữ trong danh mục`;
  }

  tbody.innerHTML = visibleItems.map(lang => {
    const safeCode = escapeHtml(lang.code);
    const safeVi = escapeHtml(lang.vi);
    const safeEn = escapeHtml(lang.en);
    return `
    <tr id="row-${safeCode}">
      <td class="col-code">${safeCode}</td>
      <td>
        <div class="col-names">
          <span class="name-vi">${safeVi}</span>
          ${lang.en ? `<span class="name-en">${safeEn}</span>` : ''}
        </div>
      </td>
      <td>
        <span class="${lang.learnable ? 'flag-yes' : 'flag-no'}">${lang.learnable ? 'Học được' : '— Không'}</span>
      </td>
      <td>
        <span class="${lang.uiLocale ? 'flag-yes' : 'flag-no'}">${lang.uiLocale ? 'Hỗ trợ giao diện' : '— Không'}</span>
      </td>
      <td style="text-align: right;">
        <div class="col-actions" style="justify-content: flex-end;">
          <button type="button" class="btn-text-action btn-text-edit" id="btn-edit-${safeCode}" data-code="${safeCode}">Sửa</button>
          <button type="button" class="btn-text-action btn-text-delete" id="btn-delete-${safeCode}" data-code="${safeCode}">Xóa</button>
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

function setAppInert(isInert) {
  if (appContainer) {
    if (isInert) {
      appContainer.setAttribute('inert', '');
    } else {
      appContainer.removeAttribute('inert');
    }
  }
}

function trapFocus(modalElement, preventEscape = false) {
  const focusables = modalElement.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  modalElement.onkeydown = function(e) {
    if (e.key === 'Escape') {
      if (preventEscape) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      closeModals();
      return;
    }
    if (e.key === 'Tab') {
      if (focusables.length === 1) {
        e.preventDefault();
        focusables[0].focus();
        return;
      }
      if (e.shiftKey && document.activeElement === first) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  };
}

function closeModals() {
  languageFormModal.style.display = 'none';
  deleteConfirmModal.style.display = 'none';
  deleteBlockedModal.style.display = 'none';
  sessionLostModal.style.display = 'none';
  currentDeleteCode = null;
  setAppInert(false);

  if (triggerElement && typeof triggerElement.focus === 'function') {
    triggerElement.focus();
    triggerElement = null;
  }
}

function openCreateModal(trigger) {
  clearMutationStatus();
  triggerElement = trigger || document.getElementById('openCreateBtn');
  setAppInert(true);

  formModalTitle.textContent = 'Thêm ngôn ngữ';
  langCodeInput.readOnly = false;
  langCodeInput.value = '';
  langCodeInput.classList.remove('is-error');
  codeHint.textContent = 'Từ 2–10 ký tự thường (ví dụ: vi, en, zh-cn). Không thể đổi sau khi tạo.';
  codeError.style.display = 'none';

  langViInput.value = '';
  langEnInput.value = '';
  checkLearnable.checked = false;
  checkUiLocale.checked = false;
  formSubmitBtn.textContent = 'Tạo ngôn ngữ';

  languageFormModal.style.display = 'flex';
  trapFocus(languageFormModal, false);
  langCodeInput.focus();
}

function openEditTarget(code, trigger) {
  clearMutationStatus();
  triggerElement = trigger || document.activeElement;
  setAppInert(true);

  const data = languages.find(l => l.code === code) || DEFAULT_LANGUAGES.find(l => l.code === code) || DEFAULT_LANGUAGES[3];
  formModalTitle.textContent = `Chỉnh sửa ngôn ngữ: ${data.vi}`;
  langCodeInput.readOnly = true;
  langCodeInput.value = data.code;
  langCodeInput.classList.remove('is-error');
  codeHint.textContent = 'Mã ngôn ngữ không thể thay đổi sau khi tạo.';
  codeError.style.display = 'none';

  langViInput.value = data.vi;
  langEnInput.value = data.en || '';
  checkLearnable.checked = !!data.learnable;
  checkUiLocale.checked = !!data.uiLocale;
  formSubmitBtn.textContent = 'Lưu thay đổi';

  languageFormModal.style.display = 'flex';
  trapFocus(languageFormModal, false);
  langViInput.focus();
}

function openDeleteTarget(code, trigger) {
  clearMutationStatus();
  triggerElement = trigger || document.activeElement;
  setAppInert(true);

  const data = languages.find(l => l.code === code) || DEFAULT_LANGUAGES.find(l => l.code === code) || DEFAULT_LANGUAGES[3];
  currentDeleteCode = data.code;

  const safeVi = escapeHtml(data.vi);
  const safeCode = escapeHtml(data.code);

  if (data.blocked) {
    deleteBlockedMessage.innerHTML = `Ngôn ngữ <strong>${safeVi} (${safeCode})</strong> đang được sử dụng trong các khóa học hoặc tài khoản người dùng.`;
    deleteBlockedModal.style.display = 'flex';
    trapFocus(deleteBlockedModal, false);
    blockedCloseBtn.focus();
  } else {
    deleteConfirmMessage.innerHTML = `Bạn có chắc chắn muốn xóa ngôn ngữ <strong>${safeVi} (${safeCode})</strong>? Thao tác này không thể hoàn tác.`;
    deleteConfirmModal.style.display = 'flex';
    trapFocus(deleteConfirmModal, false);
    deleteCancelBtn.focus();
  }
}

function handleSessionLoginReturn() {
  closeModals();
  switchState('login-normal');
}

function switchState(stateName) {
  if (stateSelect && stateSelect.value !== stateName) {
    stateSelect.value = stateName;
  }

  // Reset modals, inert and mutation feedback
  closeModals();
  clearMutationStatus();

  // Reset login fields
  loginAlert.style.display = 'none';
  loginEmail.value = '';
  loginPassword.value = '';
  loginPassword.classList.remove('is-error');

  // Reset table containers
  populatedTable.style.display = 'none';
  emptyTableView.style.display = 'none';
  loadingTableView.style.display = 'none';
  fetchErrorTableView.style.display = 'none';
  if (tableSummary) tableSummary.style.display = 'none';

  switch (stateName) {
    case 'login-normal':
      authView.style.display = 'flex';
      appContainer.style.display = 'none';
      loginEmail.value = '';
      loginPassword.value = '';
      setTimeout(() => loginEmail.focus(), 50);
      break;

    case 'login-invalid':
      authView.style.display = 'flex';
      appContainer.style.display = 'none';
      loginAlert.style.display = 'block';
      loginEmail.value = 'admin@lingora.edu.vn';
      loginPassword.value = '';
      loginPassword.classList.add('is-error');
      setTimeout(() => loginPassword.focus(), 50);
      break;

    case 'languages-populated':
      languages = JSON.parse(JSON.stringify(DEFAULT_LANGUAGES));
      renderTable();
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      populatedTable.style.display = 'table';
      if (tableSummary) tableSummary.style.display = 'block';
      break;

    case 'languages-empty':
      languages = [];
      renderTable();
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      emptyTableView.style.display = 'flex';
      break;

    case 'language-create':
      languages = JSON.parse(JSON.stringify(DEFAULT_LANGUAGES));
      renderTable();
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      populatedTable.style.display = 'table';
      if (tableSummary) tableSummary.style.display = 'block';
      openCreateModal(document.getElementById('openCreateBtn'));
      break;

    case 'language-create-duplicate':
      languages = JSON.parse(JSON.stringify(DEFAULT_LANGUAGES));
      renderTable();
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      populatedTable.style.display = 'table';
      if (tableSummary) tableSummary.style.display = 'block';
      openCreateModal(document.getElementById('openCreateBtn'));

      langCodeInput.value = 'en';
      langCodeInput.classList.add('is-error');
      codeError.style.display = 'block';
      codeError.textContent = "Mã ngôn ngữ 'en' đã tồn tại trong hệ thống.";
      langViInput.value = 'Tiếng Anh (Mỹ)';
      langEnInput.value = 'English (US)';
      checkLearnable.checked = true;
      checkUiLocale.checked = true;
      langCodeInput.focus();
      break;

    case 'language-edit':
      languages = JSON.parse(JSON.stringify(DEFAULT_LANGUAGES));
      renderTable();
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      populatedTable.style.display = 'table';
      if (tableSummary) tableSummary.style.display = 'block';
      openEditTarget('fr');
      break;

    case 'delete-confirmation':
      languages = JSON.parse(JSON.stringify(DEFAULT_LANGUAGES));
      renderTable();
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      populatedTable.style.display = 'table';
      if (tableSummary) tableSummary.style.display = 'block';
      openDeleteTarget('fr');
      break;

    case 'delete-blocked':
      languages = JSON.parse(JSON.stringify(DEFAULT_LANGUAGES));
      renderTable();
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      populatedTable.style.display = 'table';
      if (tableSummary) tableSummary.style.display = 'block';
      openDeleteTarget('vi');
      break;

    case 'languages-loading':
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      loadingTableView.style.display = 'block';
      break;

    case 'languages-fetch-error':
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      fetchErrorTableView.style.display = 'flex';
      break;

    case 'session-lost':
      languages = JSON.parse(JSON.stringify(DEFAULT_LANGUAGES));
      renderTable();
      authView.style.display = 'none';
      appContainer.style.display = 'flex';
      populatedTable.style.display = 'table';
      if (tableSummary) tableSummary.style.display = 'block';
      setAppInert(true);
      sessionLostModal.style.display = 'flex';
      trapFocus(sessionLostModal, true);
      sessionLoginBtn.focus({ focusVisible: true });
      break;

    default:
      switchState('languages-populated');
      break;
  }
}

// Event Listeners for Delegation & Controls
if (stateSelect) {
  stateSelect.addEventListener('change', (e) => {
    switchState(e.target.value);
  });
}

document.getElementById('openCreateBtn').addEventListener('click', (e) => {
  openCreateModal(e.currentTarget);
});

document.getElementById('loginSubmitBtn').addEventListener('click', () => {
  switchState('languages-populated');
});

if (sessionLoginBtn) {
  sessionLoginBtn.addEventListener('click', () => {
    handleSessionLoginReturn();
  });
}

// Table Action Delegation (Edit / Delete)
if (populatedTable) {
  const tbody = populatedTable.querySelector('tbody');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-text-edit');
      if (editBtn) {
        const code = editBtn.dataset.code;
        openEditTarget(code, editBtn);
        return;
      }
      const deleteBtn = e.target.closest('.btn-text-delete');
      if (deleteBtn) {
        const code = deleteBtn.dataset.code;
        openDeleteTarget(code, deleteBtn);
        return;
      }
    });
  }
}

// Search input clears status and filters
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    clearMutationStatus();
    renderTable(e.target.value);
  });
  searchInput.addEventListener('focus', () => {
    clearMutationStatus();
  });
}

// Form Submission Simulation (Create / Edit)
if (formSubmitBtn) {
  formSubmitBtn.addEventListener('click', () => {
    clearMutationStatus();
    const isCreate = !langCodeInput.readOnly;

    if (isCreate) {
      const code = langCodeInput.value.trim().toLowerCase();
      if (!code) {
        langCodeInput.focus();
        return;
      }
      // Check duplicate code
      const exists = languages.some(l => l.code === code);
      if (exists) {
        langCodeInput.classList.add('is-error');
        codeError.style.display = 'block';
        codeError.textContent = `Mã ngôn ngữ '${code}' đã tồn tại trong hệ thống.`;
        langCodeInput.focus();
        return;
      }

      // Valid simulated create
      const newLang = {
        code: code,
        vi: langViInput.value.trim() || code,
        en: langEnInput.value.trim() || '',
        learnable: checkLearnable.checked,
        uiLocale: checkUiLocale.checked,
        blocked: false
      };
      languages.push(newLang);
      closeModals();
      renderTable(searchInput ? searchInput.value : '');
      showMutationStatus('Đã thêm ngôn ngữ');
      document.getElementById('openCreateBtn').focus();
    } else {
      // Edit mode
      const code = langCodeInput.value.trim().toLowerCase();
      const target = languages.find(l => l.code === code);
      if (target) {
        target.vi = langViInput.value.trim() || target.vi;
        target.en = langEnInput.value.trim(); // empty string clears optional en
        target.learnable = checkLearnable.checked;
        target.uiLocale = checkUiLocale.checked;
      }
      closeModals();
      renderTable(searchInput ? searchInput.value : '');
      showMutationStatus('Đã cập nhật ngôn ngữ');
      const editBtn = document.getElementById(`btn-edit-${code}`);
      if (editBtn) {
        editBtn.focus();
      } else {
        document.getElementById('openCreateBtn').focus();
      }
    }
  });
}

// Delete Confirmation Simulation
if (deleteSubmitBtn) {
  deleteSubmitBtn.addEventListener('click', () => {
    clearMutationStatus();
    if (!currentDeleteCode) {
      closeModals();
      return;
    }

    const idx = languages.findIndex(l => l.code === currentDeleteCode);
    if (idx !== -1) {
      languages.splice(idx, 1);
    }

    // Determine surviving focus target before rerender
    let targetFocusCode = null;
    let focusAddFallback = false;
    if (languages.length === 0) {
      focusAddFallback = true;
    } else if (idx < languages.length) {
      targetFocusCode = languages[idx].code;
    } else {
      targetFocusCode = languages[languages.length - 1].code;
    }

    closeModals();
    renderTable(searchInput ? searchInput.value : '');
    showMutationStatus('Đã xóa ngôn ngữ');

    if (focusAddFallback) {
      const emptyBtn = emptyTableView ? emptyTableView.querySelector('button') : null;
      if (emptyBtn) {
        emptyBtn.focus();
      } else {
        document.getElementById('openCreateBtn').focus();
      }
    } else if (targetFocusCode) {
      const survivingAction = document.getElementById(`btn-delete-${targetFocusCode}`) || document.getElementById(`btn-edit-${targetFocusCode}`);
      if (survivingAction) {
        survivingAction.focus();
      } else {
        document.getElementById('openCreateBtn').focus();
      }
    }
  });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('capture') === '1' || urlParams.get('capture') === 'true') {
    document.body.classList.add('capture-mode');
  }
  const stateQuery = urlParams.get('state');
  const hash = window.location.hash.replace('#', '');
  const initial = stateQuery || hash || 'languages-populated';
  switchState(initial);
});

window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    switchState(hash);
  }
});
