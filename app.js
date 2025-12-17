(() => {
  const KEYS = {
    sort: 'js4acc_sort',
  };

  const PLACEHOLDER = 'https://i.imgur.com/BN9T8xY.png';
  const IMGBB_UPLOAD_URL = 'https://api.imgbb.com/1/upload';
  const IMGBB_API_KEY = '2b029ac6f8b085f387494cc99a7e5da7'; // مفاتيح الرفع العامة
  const newAccountImages = [];

  const state = {
    accounts: [],
    accountPrivate: [],
    purchases: [],
    games: [],
    firebaseUser: null,
    isAdmin: false,
    paymentMethods: [],
    depositMethods: [],
    withdrawMethods: [],
    currencies: [],
    topups: [],
    depositRequests: [],
    withdrawRequests: [],
    walletTotals: { totalUSD: 0, count: 0 },
    selectedGame: null,
    view: 'games',
    sort: 'latest',
    wallet: 0,
    categories: [],
    fees: null,
    userProfile: null,
    adminUser: null,
    adminUserMeta: null,
    adminTab: load('admin_tab', 'review'),
    dataLoading: false,
    dataError: '',
    dataUpdatedAt: 0,
    dataSource: '',
  };
  state.fees = getDefaultFees();

  function normalizeMethod(method, fallbackId) {
    if (!method) return null;
    const id = method.id || method.methodId || fallbackId || uid('method');
    return { ...method, id };
  }

  function flattenDepositMethods(methods = []) {
    if (!methods) return [];
    if (Array.isArray(methods)) {
      return methods.map((m, idx) => normalizeMethod(m, `m-${idx}`)).filter(Boolean);
    }
    if (typeof methods === 'object') {
      return Object.keys(methods).map((id) => normalizeMethod({ id, ...(methods[id] || {}) }, id)).filter(Boolean);
    }
    return [];
  }
  function formatPriceCurrency(val){
    const n = Number(val);
    if (!Number.isFinite(n)) return 'غير محدد';
    if (typeof window.formatCurrencyFromJOD === 'function'){
      try { return window.formatCurrencyFromJOD(n); } catch(_){}
    }
    return n.toFixed(2) + ' $';
  }

  function normalizeRequestStatus(raw) {
    const text = (raw == null ? '' : String(raw)).trim();
    const lower = text.toLowerCase();
    if (!text) return { key: 'pending', label: 'pending' };
    if (lower === 'approved' || lower === 'accept' || lower === 'accepted' || lower === 'done' || lower === 'completed') {
      return { key: 'approved', label: text };
    }
    if (lower === 'rejected' || lower === 'reject' || lower === 'canceled' || lower === 'cancelled') {
      return { key: 'rejected', label: text };
    }
    if (lower === 'pending' || lower === 'review' || lower === 'in_review' || lower === 'processing') {
      return { key: 'pending', label: text };
    }
    if (/مقبول|مقبولة/.test(text)) return { key: 'approved', label: text };
    if (/مرفوض|مرفوضة/.test(text)) return { key: 'rejected', label: text };
    if (/قيد/.test(text)) return { key: 'pending', label: text };
    return { key: 'pending', label: text };
  }

  function currenciesToMap(list){
    const map = {};
    (list || []).forEach((c)=>{
      if (!c || !c.code) return;
      map[c.code.toUpperCase()] = {
        code: c.code.toUpperCase(),
        symbol: c.symbol || '',
        rate: Number(c.rate) || 0
      };
    });
    return map;
  }

  function getDefaultFees(){
    return {
      buyerMarkup: { customer: 0, trader: 0, vip: 0 },
      sellerFee: 0
    };
  }

  function normalizeBuyerLevel(value){
    const v = (value || '').toString().trim().toLowerCase();
    if (!v) return 'customer';
    if (v.includes('vip')) return 'vip';
    if (v.includes('تج') || v.includes('trader')) return 'trader';
    if (v.includes('زب') || v.includes('عميل') || v.includes('customer')) return 'customer';
    return 'customer';
  }

  function getBuyerLevel(){
    const profile = state.userProfile || {};
    return normalizeBuyerLevel(profile.level || profile.type || profile.role || profile.tier || '');
  }

  function applyBuyerMarkup(base){
    const level = getBuyerLevel();
    const fees = state.fees || getDefaultFees();
    const pct = Number(fees?.buyerMarkup?.[level]) || 0;
    const final = Math.max(0, Math.round(Number(base || 0) * (1 + pct / 100) * 100) / 100);
    return { level, pct, final };
  }

  function getDisplayPrice(acc, opts = {}){
    const base = Number(acc?.price) || 0;
    if (opts.skipMarkup) return { base, final: base, pct: 0, level: null };
    const applied = applyBuyerMarkup(base);
    return { base, final: applied.final, pct: applied.pct, level: applied.level };
  }
  const els = {
    userChip: document.getElementById('userChip'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
    adminMain: document.getElementById('adminMain'),
    searchInput: document.getElementById('searchInput'),
    gameGrid: document.getElementById('gameGrid'),
    listingGrid: document.getElementById('listingGrid'),
    currentGameTitle: document.getElementById('currentGameTitle'),
    categoriesPanel: document.getElementById('categoriesPanel'),
    listingsPanel: document.getElementById('listingsPanel'),
    backToGames: document.getElementById('backToGames'),
    sortSelect: document.getElementById('sortSelect'),
    addAccountForm: document.getElementById('addAccountForm'),
    imageFileInput: document.getElementById('imageFileInput'),
    imageUploadBtn: document.getElementById('imageUploadBtn'),
    imageGalleryPreview: document.getElementById('imageGalleryPreview'),
    accountCategory: document.getElementById('accountCategory'),
    accountCategoryFilter: document.getElementById('accountCategoryFilter'),
    addCategoryForm: document.getElementById('addCategoryForm'),
    categoryNameInput: document.getElementById('categoryNameInput'),
    categoryAdminList: document.getElementById('categoryAdminList'),
    adminCategories: document.getElementById('admin-categories'),
    gameSelect: document.getElementById('gameSelect'),
    titleInput: document.getElementById('titleInput'),
    priceInput: document.getElementById('priceInput'),
    contactInput: document.getElementById('contactInput'),
    imageInput: document.getElementById('imageInput'),
    descInput: document.getElementById('descInput'),
    loginForm: document.getElementById('loginForm'),
    loginEmailInput: document.getElementById('loginEmailInput'),
    loginPasswordInput: document.getElementById('loginPasswordInput'),
    registerForm: document.getElementById('registerForm'),
    registerNameInput: document.getElementById('registerNameInput'),
    registerEmailInput: document.getElementById('registerEmailInput'),
    registerPasswordInput: document.getElementById('registerPasswordInput'),
    yourSection: document.getElementById('yourSection'),
    yourListings: document.getElementById('yourListings'),
    addSection: document.getElementById('add-account'),
    adminPanel: document.getElementById('admin-panel'),
    adminList: document.getElementById('adminList'),
    adminManage: document.getElementById('admin-manage'),
    adminManageList: document.getElementById('adminManageList'),
    adminManageStatus: document.getElementById('adminManageStatus'),
    adminManageQuery: document.getElementById('adminManageQuery'),
    adminAddAccounts: document.getElementById('admin-add-accounts'),
    adminMethods: document.getElementById('admin-methods'),
    adminAuthPanel: document.getElementById('admin-auth'),
    adminAuthForm: document.getElementById('adminAuthForm'),
    adminAuthEmail: document.getElementById('adminAuthEmail'),
    adminAuthPassword: document.getElementById('adminAuthPassword'),
    adminAuthStatus: document.getElementById('adminAuthStatus'),
    adminTabNav: document.getElementById('adminTabNav'),
    addCurrencyForm: document.getElementById('addCurrencyForm'),
    currencyCodeInput: document.getElementById('currencyCodeInput'),
    currencySymbolInput: document.getElementById('currencySymbolInput'),
    currencyRateInput: document.getElementById('currencyRateInput'),
    currencyAdminList: document.getElementById('currencyAdminList'),
    addMethodForm: document.getElementById('addMethodForm'),
    methodCountryInput: document.getElementById('methodCountryInput'),
    methodNameInput: document.getElementById('methodNameInput'),
    methodAccountInput: document.getElementById('methodAccountInput'),
    methodHolderInput: document.getElementById('methodHolderInput'),
    methodNoteInput: document.getElementById('methodNoteInput'),
    methodAdminList: document.getElementById('methodAdminList'),
    withdrawMethodForm: document.getElementById('withdrawMethodForm'),
    withdrawCountryIdInput: document.getElementById('withdrawCountryIdInput'),
    withdrawCountryNameInput: document.getElementById('withdrawCountryNameInput'),
    withdrawMethodNameInput: document.getElementById('withdrawMethodNameInput'),
    withdrawMethodTypeInput: document.getElementById('withdrawMethodTypeInput'),
    withdrawCurrencyInput: document.getElementById('withdrawCurrencyInput'),
    withdrawRateUsdInput: document.getElementById('withdrawRateUsdInput'),
    withdrawBankInput: document.getElementById('withdrawBankInput'),
    withdrawAccountNameInput: document.getElementById('withdrawAccountNameInput'),
    withdrawAccountNumberInput: document.getElementById('withdrawAccountNumberInput'),
    withdrawWalletInput: document.getElementById('withdrawWalletInput'),
    withdrawMethodNoteInput: document.getElementById('withdrawMethodNoteInput'),
    withdrawMethodsList: document.getElementById('withdrawMethodsList'),
    depositMethodForm: document.getElementById('depositMethodForm'),
    depositCountryIdInput: document.getElementById('depositCountryIdInput'),
    depositCountryNameInput: document.getElementById('depositCountryNameInput'),
    depositCountryImageInput: document.getElementById('depositCountryImageInput'),
    depositCountryImageFileInput: document.getElementById('depositCountryImageFileInput'),
    depositCountryDropZone: document.getElementById('depositCountryDropZone'),
    depositCountrySelectExisting: document.getElementById('depositCountrySelectExisting'),
    depositFillExistingBtn: document.getElementById('depositFillExistingBtn'),
    depositMethodNameInput: document.getElementById('depositMethodNameInput'),
    depositMethodTypeInput: document.getElementById('depositMethodTypeInput'),
    depositCurrencyInput: document.getElementById('depositCurrencyInput'),
    depositRateUsdInput: document.getElementById('depositRateUsdInput'),
    depositBankInput: document.getElementById('depositBankInput'),
    depositAccountNameInput: document.getElementById('depositAccountNameInput'),
    depositAccountNumberInput: document.getElementById('depositAccountNumberInput'),
    depositIbanInput: document.getElementById('depositIbanInput'),
    depositWalletInput: document.getElementById('depositWalletInput'),
    depositMethodNoteInput: document.getElementById('depositMethodNoteInput'),
    depositLogoInput: document.getElementById('depositLogoInput'),
    depositLogoFileInput: document.getElementById('depositLogoFileInput'),
    depositLogoUploadBtn: document.getElementById('depositLogoUploadBtn'),
    depositMethodsList: document.getElementById('depositMethodsList'),
    walletTotalsPanel: document.getElementById('walletTotalsPanel'),
    walletTotalValue: document.getElementById('walletTotalValue'),
    walletTotalCount: document.getElementById('walletTotalCount'),
    adminFees: document.getElementById('admin-fees'),
    feesForm: document.getElementById('feesForm'),
    feeCustomerInput: document.getElementById('feeCustomerInput'),
    feeTraderInput: document.getElementById('feeTraderInput'),
    feeVipInput: document.getElementById('feeVipInput'),
    feeSellerInput: document.getElementById('feeSellerInput'),
    levelForm: document.getElementById('levelForm'),
    levelWebuidInput: document.getElementById('levelWebuidInput'),
    levelSelect: document.getElementById('levelSelect'),
    walletPanel: document.getElementById('walletPanel'),
    walletBalance: document.getElementById('walletBalance'),
    walletForm: document.getElementById('walletForm'),
    walletAmountInput: document.getElementById('walletAmountInput'),
    walletCountrySelect: document.getElementById('walletCountrySelect'),
    walletMethodSelect: document.getElementById('walletMethodSelect'),
    walletMethodInfo: document.getElementById('walletMethodInfo'),
    walletRefInput: document.getElementById('walletRefInput'),
    walletHistory: document.getElementById('walletHistory'),
    adminTopupsList: document.getElementById('adminTopupsList'),
    adminTopupsStatusFilter: document.getElementById('adminTopupsStatusFilter'),
    adminTopupsCodeQuery: document.getElementById('adminTopupsCodeQuery'),
    adminTopupsRefreshBtn: document.getElementById('adminTopupsRefreshBtn'),
    adminTopupsLoadStatus: document.getElementById('adminTopupsLoadStatus'),
    adminWithdrawList: document.getElementById('adminWithdrawList'),
    adminWithdrawStatusFilter: document.getElementById('adminWithdrawStatusFilter'),
    adminWithdrawCodeQuery: document.getElementById('adminWithdrawCodeQuery'),
    adminPurchasesList: document.getElementById('adminPurchasesList'),
    adminPromoteForm: document.getElementById('adminPromoteForm'),
    adminPromoteQuery: document.getElementById('adminPromoteQuery'),
    adminPromoteType: document.getElementById('adminPromoteType'),
    adminPromoteStatus: document.getElementById('adminPromoteStatus'),
    userLookupForm: document.getElementById('userLookupForm'),
    userLookupQuery: document.getElementById('userLookupQuery'),
    userLookupType: document.getElementById('userLookupType'),
    userLookupStatus: document.getElementById('userLookupStatus'),
    userLookupResult: document.getElementById('userLookupResult'),
    loader: document.getElementById('loader'),
    toast: document.getElementById('toast'),
  };

  const isAuthPage = () => {
    const path = window.location.pathname.toLowerCase();
    return path.includes('login') || path.includes('auth');
  };
  const isAdminPage = () => {
    const path = window.location.pathname.toLowerCase();
    return path.includes('admin');
  };
  const isHomePage = () => {
    const path = (window.location.pathname || '').toLowerCase();
    if (!path || path === '/') return true;
    const file = path.split('/').filter(Boolean).pop() || '';
    return file === 'index.html';
  };
  let db = null;
  let adminUserPhoneIti = null;

  let toastTimer;

  // ضع بيانات مشروع Firebase هنا
const firebaseConfig = {
  apiKey: "AIzaSyBD4zpvsUdygm7KxRYXPDHbotwvf9Y7pOQ",
  authDomain: "js4accweb.firebaseapp.com",
  projectId: "js4accweb",
  storageBucket: "js4accweb.firebasestorage.app",
  messagingSenderId: "635891162580",
  appId: "1:635891162580:web:1ee495e5b51f96ab16ca41",
  measurementId: "G-0Y3LMPBEWJ"
};

  const ADMIN_EMAILS = ['admin@js4acc.com'];

  function load(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function slugify(text) {
    return (text || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      // اسمح بحروف كل اللغات والأرقام مع الشرطة
      .replace(/[^\p{L}\p{N}\-]+/gu, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function displayTitle(raw) {
    const t = (raw ?? '').toString();
    if (!t) return '';
    const looksSlug = !/\s/.test(t) && t.includes('-');
    const normalized = looksSlug ? t.replace(/-/g, ' ') : t;
    return normalized.replace(/\s+/g, ' ').trim();
  }

  function escapeHTML(value) {
    const s = (value ?? '').toString();
    return s.replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch]));
  }

  function sortIntlCountriesAZ() {
    try {
      const data = window.intlTelInputGlobals && window.intlTelInputGlobals.getCountryData
        ? window.intlTelInputGlobals.getCountryData()
        : null;
      if (data && Array.isArray(data)) {
        data.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
      }
    } catch (_) {}
  }

  function destroyAdminUserPhonePicker() {
    if (adminUserPhoneIti && typeof adminUserPhoneIti.destroy === 'function') {
      try { adminUserPhoneIti.destroy(); } catch (_) {}
    }
    adminUserPhoneIti = null;
  }

  function initAdminUserPhonePicker(value) {
    try {
      const input = document.getElementById('adminUserPhoneInput');
      if (!input) { destroyAdminUserPhonePicker(); return; }
      destroyAdminUserPhonePicker();
      if (typeof window.intlTelInput !== 'function') return;
      sortIntlCountriesAZ();
      adminUserPhoneIti = window.intlTelInput(input, {
        initialCountry: 'sy',
        separateDialCode: true,
        preferredCountries: [],
      });
      const v = (value ?? '').toString().trim();
      if (v) {
        try { adminUserPhoneIti.setNumber(v); } catch (_) {}
      }
      try { input.setAttribute('dir', 'ltr'); } catch (_) {}
    } catch (_) {}
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage blocked', e);
    }
  }

  function uid(prefix = 'id') {
    const random = Math.random().toString(16).slice(2);
    if (window.crypto?.randomUUID) {
      return `${prefix}-${crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${random}`;
  }

  function seedDefaults() {
    const sort = load(KEYS.sort, 'latest') || 'latest';
    state.games = [];
    state.accounts = [];
    state.categories = [];
    state.sort = sort;
    persist();
  }

  function persist() {
    save(KEYS.sort, state.sort);
  }

  function getCurrentUser() {
    return state.firebaseUser;
  }

  const ADMIN_ROUTER_BASE = (window.ADMIN_ROUTER_BASE || window.ROUTER_BASE || window.BACKEND_BASE || 'https://js4acc.laithqarqaz1.workers.dev/').toString().replace(/\/+$/, '');

  async function getIdTokenSafe() {
    const user = getCurrentUser();
    if (!user || !user.getIdToken) return '';
    try { return await user.getIdToken(); } catch { return ''; }
  }

  async function sendAdminRequest(body) {
    if (!ADMIN_ROUTER_BASE) {
      throw new Error('ADMIN_ROUTER_BASE غير مضبوط');
    }
    const token = await getIdTokenSafe();
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${ADMIN_ROUTER_BASE}/accounts`, {
      method: 'POST',
      cache: 'no-store',
      headers,
    body: JSON.stringify(body || {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    const rawErr = data.error || data.message;
    if (rawErr === 'unknown_action') {
      throw new Error('السيرفر (Cloudflare Worker) لا يدعم هذا الإجراء حالياً. حدّث/أعد نشر آخر نسخة من الـ Worker ثم جرّب مرة أخرى.');
    }
    const msg = data.error || data.message || 'تعذر تنفيذ طلب الأدمن';
    const detail = data && data.details;
    const statusInfo = detail && detail.status ? ` (الحالة الحالية: ${detail.status})` : '';
    throw new Error(msg + statusInfo);
  }
  return data;
}

  function findFreeFireGameId() {
    const keys = ['free fire', 'freefire', 'فري فاير', 'فريفاير'];
    const lower = (s) => (s || '').toString().toLowerCase();
    const hit = state.games.find((g) => {
      const name = lower(g.name || g.title);
      return keys.some((k) => name.includes(k));
    });
    if (hit) return hit.id;
    return state.games[0] ? state.games[0].id : null;
  }

  function setSession(user) {
    state.firebaseUser = user;
    renderAll();
    loadWallet();
  }

  async function uploadImage(file) {
    if (!file) throw new Error('اختر صورة أولاً');
    const form = new FormData();
    form.append('image', file);
    const res = await fetch(`${IMGBB_UPLOAD_URL}?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: form,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !data?.data?.url) {
      throw new Error('فشل رفع الصورة');
    }
    return data.data.url;
  }

  function renderAccountImagesPreview() {
    if (!els.imageGalleryPreview) return;
    if (!newAccountImages.length) {
      els.imageGalleryPreview.innerHTML = '<p class="tiny muted" style="margin:4px 0;">لا توجد صور مرفوعة بعد.</p>';
      return;
    }
    els.imageGalleryPreview.innerHTML = newAccountImages.map((url) => (
      `<img src="${url}" style="width:70px;height:70px;object-fit:cover;border-radius:10px;border:1px solid rgba(255,255,255,0.1);" alt="صورة حساب">`
    )).join('');
  }

  function bindUpload(opts) {
    const { fileInput, button, targetInput, preview, multi, onAfterUpload } = opts;
    if (!fileInput || !button) return;
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const files = fileInput.files ? Array.from(fileInput.files) : [];
      if (!files.length) {
        notify('اختر صورة من جهازك أولاً');
        return;
      }
      button.disabled = true;
      const original = button.textContent;
      button.textContent = '...جاري الرفع';
      try {
        const urls = [];
        for (const f of files) {
          const url = await uploadImage(f);
          urls.push(url);
        }
        if (multi && typeof onAfterUpload === 'function') {
          onAfterUpload(urls);
        } else {
          const url = urls[0];
          if (targetInput) targetInput.value = url;
          if (preview) {
            preview.src = url;
            preview.style.display = 'block';
          }
          notify('تم رفع الصورة بنجاح');
        }
      } catch (err) {
        notify(err?.message || 'فشل رفع الصورة');
      } finally {
        button.disabled = false;
        button.textContent = original;
        try { fileInput.value = ''; } catch (_) {}
      }
    });
  }

  function notify(message) {
    if (!els.toast) return;
    clearTimeout(toastTimer);
    els.toast.textContent = message;
    els.toast.classList.remove('hidden');
    els.toast.style.opacity = '1';
    els.toast.style.transform = 'translate(-50%, 0)';
    toastTimer = setTimeout(() => {
      els.toast.style.opacity = '0';
      els.toast.style.transform = 'translate(-50%, 10px)';
      setTimeout(() => els.toast.classList.add('hidden'), 200);
    }, 2200);
  }

  // نافذة ردود بسيطة
  let respModal = null;
  function ensureResponseModal() {
    if (respModal) return respModal;
    const overlay = document.createElement('div');
    overlay.id = 'responseModal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.55)';
    overlay.style.display = 'none';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '12000';
    const box = document.createElement('div');
    box.style.background = 'linear-gradient(145deg,#0f172a,#111827)';
    box.style.padding = '18px 20px';
    box.style.borderRadius = '16px';
    box.style.border = '1px solid rgba(255,255,255,0.12)';
    box.style.boxShadow = '0 18px 44px rgba(0,0,0,0.45)';
    box.style.maxWidth = '420px';
    box.style.width = '90%';
    const title = document.createElement('h3');
    title.className = 'resp-title';
    title.style.margin = '0 0 8px';
    title.style.color = '#e6edff';
    const msg = document.createElement('p');
    msg.className = 'resp-message';
    msg.style.margin = '0 0 14px';
    msg.style.color = '#cdd8ff';
    msg.style.whiteSpace = 'pre-wrap';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'حسناً';
    closeBtn.className = 'btn primary';
    closeBtn.style.width = '100%';
    closeBtn.style.border = 'none';
    closeBtn.style.marginTop = '6px';
    closeBtn.addEventListener('click', () => closeResponseModal());
    box.appendChild(title); box.appendChild(msg); box.appendChild(closeBtn);
    overlay.appendChild(box);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeResponseModal(); });
    document.body.appendChild(overlay);
    respModal = overlay;
    return respModal;
  }
  function openResponseModal(message, title = 'تنبيه') {
    const modal = ensureResponseModal();
    const t = modal.querySelector('.resp-title');
    const m = modal.querySelector('.resp-message');
    if (t) t.textContent = title;
    if (m) m.textContent = message;
    modal.style.display = 'flex';
    modal.style.opacity = '1';
  }
  function closeResponseModal() {
    if (!respModal) return;
    respModal.style.opacity = '0';
    setTimeout(() => { respModal.style.display = 'none'; }, 150);
  }

  // ====== عارض صور الحسابات (أزرار أسهم للتنقل) ======
  let accountImageViewer = null;
  let accountImageViewerImg = null;
  let accountImageViewerCounter = null;
  let accountImageViewerOpenLink = null;
  let accountImageViewerPrevBtn = null;
  let accountImageViewerNextBtn = null;
  let accountImageViewerState = { urls: [], index: 0, restoreOverflow: '' };

  function getAccountImageUrls(acc) {
    const urls = [];
    const seen = new Set();
    const push = (value, { prepend = false } = {}) => {
      const s = (value || '').toString().trim();
      if (!s) return;
      if (seen.has(s)) return;
      seen.add(s);
      if (prepend) urls.unshift(s);
      else urls.push(s);
    };
    if (acc && acc.image) push(acc.image, { prepend: true });
    if (acc && Array.isArray(acc.images)) acc.images.forEach((u) => push(u));
    return urls;
  }

  function ensureAccountImageViewer() {
    if (accountImageViewer) return accountImageViewer;

    const overlay = document.createElement('div');
    overlay.id = 'accountImageViewer';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '13000';
    overlay.style.display = 'none';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '18px';
    overlay.style.boxSizing = 'border-box';
    overlay.style.background = 'rgba(0,0,0,0.76)';
    overlay.style.backdropFilter = 'blur(6px)';

    const box = document.createElement('div');
    box.style.width = 'min(980px, 96vw)';
    box.style.maxHeight = '92vh';
    box.style.background = 'linear-gradient(145deg,rgba(10,12,24,0.98),rgba(12,18,40,0.98))';
    box.style.border = '1px solid rgba(255,255,255,0.14)';
    box.style.borderRadius = '18px';
    box.style.boxShadow = '0 26px 80px rgba(0,0,0,0.55)';
    box.style.overflow = 'hidden';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';

    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'space-between';
    header.style.gap = '10px';
    header.style.padding = '10px 12px';
    header.style.borderBottom = '1px solid rgba(255,255,255,0.08)';

    const title = document.createElement('div');
    title.textContent = 'صور الحساب';
    title.style.color = '#e6edff';
    title.style.fontWeight = '800';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn ghost small';
    closeBtn.textContent = 'إغلاق';
    closeBtn.style.minWidth = '110px';
    closeBtn.addEventListener('click', closeAccountImageViewer);

    header.appendChild(title);
    header.appendChild(closeBtn);

    const stage = document.createElement('div');
    stage.style.display = 'flex';
    stage.style.alignItems = 'center';
    stage.style.justifyContent = 'space-between';
    stage.style.gap = '10px';
    stage.style.padding = '12px';
    stage.style.flex = '1';
    stage.style.minHeight = '0';

    const mkNavBtn = (label, aria) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = label;
      btn.setAttribute('aria-label', aria);
      btn.style.width = '46px';
      btn.style.height = '46px';
      btn.style.borderRadius = '14px';
      btn.style.border = '1px solid rgba(255,255,255,0.14)';
      btn.style.background = 'rgba(255,255,255,0.06)';
      btn.style.color = '#e6edff';
      btn.style.fontSize = '22px';
      btn.style.fontWeight = '900';
      btn.style.cursor = 'pointer';
      btn.style.flex = '0 0 auto';
      btn.style.userSelect = 'none';
      return btn;
    };

    // في RTL: التالي ← ، السابق →
    const nextBtn = mkNavBtn('‹', 'التالي');
    const prevBtn = mkNavBtn('›', 'السابق');
    nextBtn.addEventListener('click', accountImageViewerNext);
    prevBtn.addEventListener('click', accountImageViewerPrev);

    const frame = document.createElement('div');
    frame.style.flex = '1';
    frame.style.minHeight = '0';
    frame.style.display = 'flex';
    frame.style.alignItems = 'center';
    frame.style.justifyContent = 'center';
    frame.style.background = 'rgba(0,0,0,0.18)';
    frame.style.border = '1px solid rgba(255,255,255,0.08)';
    frame.style.borderRadius = '14px';
    frame.style.overflow = 'hidden';

    const img = document.createElement('img');
    img.alt = 'صورة';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '100%';
    img.style.objectFit = 'contain';
    img.style.display = 'block';
    img.style.background = 'rgba(0,0,0,0.22)';
    img.style.borderRadius = '12px';

    frame.appendChild(img);
    stage.appendChild(nextBtn);
    stage.appendChild(frame);
    stage.appendChild(prevBtn);

    const footer = document.createElement('div');
    footer.style.display = 'flex';
    footer.style.alignItems = 'center';
    footer.style.justifyContent = 'space-between';
    footer.style.gap = '10px';
    footer.style.padding = '10px 12px';
    footer.style.borderTop = '1px solid rgba(255,255,255,0.08)';
    footer.style.color = '#9aa6c8';
    footer.style.fontSize = '13px';

    const counter = document.createElement('span');
    counter.textContent = '—';

    const openLink = document.createElement('a');
    openLink.textContent = 'فتح في تبويب';
    openLink.target = '_blank';
    openLink.rel = 'noopener';
    openLink.href = '#';
    openLink.style.color = '#7aa7ff';
    openLink.style.fontWeight = '800';
    openLink.style.textDecoration = 'none';

    footer.appendChild(counter);
    footer.appendChild(openLink);

    box.appendChild(header);
    box.appendChild(stage);
    box.appendChild(footer);
    overlay.appendChild(box);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeAccountImageViewer();
    });

    document.body.appendChild(overlay);

    accountImageViewer = overlay;
    accountImageViewerImg = img;
    accountImageViewerCounter = counter;
    accountImageViewerOpenLink = openLink;
    accountImageViewerPrevBtn = prevBtn;
    accountImageViewerNextBtn = nextBtn;
    return accountImageViewer;
  }

  function renderAccountImageViewer() {
    if (!accountImageViewerImg || !accountImageViewerCounter || !accountImageViewerOpenLink) return;
    const urls = accountImageViewerState.urls || [];
    const len = urls.length;
    const idx = accountImageViewerState.index || 0;
    const src = urls[idx] || '';
    accountImageViewerImg.src = src;
    accountImageViewerOpenLink.href = src || '#';
    accountImageViewerCounter.textContent = len ? `${idx + 1} / ${len}` : '—';
    const disabled = len <= 1;
    if (accountImageViewerPrevBtn) {
      accountImageViewerPrevBtn.disabled = disabled;
      accountImageViewerPrevBtn.style.opacity = disabled ? '0.35' : '1';
      accountImageViewerPrevBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
    if (accountImageViewerNextBtn) {
      accountImageViewerNextBtn.disabled = disabled;
      accountImageViewerNextBtn.style.opacity = disabled ? '0.35' : '1';
      accountImageViewerNextBtn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
  }

  function openAccountImageViewer(urls, startIndex = 0) {
    const cleaned = (urls || []).map((u) => (u || '').toString().trim()).filter(Boolean);
    if (!cleaned.length) {
      notify('لا توجد صور لهذا الحساب');
      return;
    }
    ensureAccountImageViewer();
    const idx = Number(startIndex);
    const safeIndex = Number.isFinite(idx) && idx >= 0 && idx < cleaned.length ? idx : 0;
    accountImageViewerState.urls = cleaned;
    accountImageViewerState.index = safeIndex;
    renderAccountImageViewer();
    accountImageViewerState.restoreOverflow = document.body.style.overflow || '';
    document.body.style.overflow = 'hidden';
    accountImageViewer.style.display = 'flex';
    document.addEventListener('keydown', handleAccountImageViewerKeydown);
  }

  function closeAccountImageViewer() {
    if (!accountImageViewer) return;
    accountImageViewer.style.display = 'none';
    document.body.style.overflow = accountImageViewerState.restoreOverflow || '';
    document.removeEventListener('keydown', handleAccountImageViewerKeydown);
    accountImageViewerState.urls = [];
    accountImageViewerState.index = 0;
  }

  function accountImageViewerPrev() {
    const urls = accountImageViewerState.urls || [];
    if (urls.length <= 1) return;
    accountImageViewerState.index = (accountImageViewerState.index - 1 + urls.length) % urls.length;
    renderAccountImageViewer();
  }

  function accountImageViewerNext() {
    const urls = accountImageViewerState.urls || [];
    if (urls.length <= 1) return;
    accountImageViewerState.index = (accountImageViewerState.index + 1) % urls.length;
    renderAccountImageViewer();
  }

  function handleAccountImageViewerKeydown(e) {
    if (!accountImageViewer || accountImageViewer.style.display !== 'flex') return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeAccountImageViewer();
      return;
    }
    const isRtl = (document.documentElement.getAttribute('dir') || '').toLowerCase() === 'rtl';
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (isRtl) accountImageViewerNext();
      else accountImageViewerPrev();
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (isRtl) accountImageViewerPrev();
      else accountImageViewerNext();
    }
  }

  function handleOpenAccountImages(e) {
    const trigger = e.target.closest('[data-open-account-images]');
    if (!trigger) return;
    const accountId = (trigger.dataset.openAccountImages || '').trim();
    if (!accountId) return;
    const acc = state.accounts.find((a) => a && a.id === accountId);
    if (!acc) return;
    const urls = getAccountImageUrls(acc);
    if (!urls.length) {
      notify('لا توجد صور لهذا الحساب');
      return;
    }
    let clickedUrl = '';
    const encodedUrl = (trigger.dataset.imgUrl || '').trim();
    if (encodedUrl) {
      try { clickedUrl = decodeURIComponent(encodedUrl); }
      catch { clickedUrl = encodedUrl; }
    }
    let startIndex = 0;
    if (clickedUrl) {
      const found = urls.indexOf(clickedUrl);
      if (found >= 0) startIndex = found;
    } else if (trigger.dataset.imgIndex) {
      const idx = Number(trigger.dataset.imgIndex);
      if (Number.isFinite(idx) && idx >= 0 && idx < urls.length) startIndex = idx;
    }
    openAccountImageViewer(urls, startIndex);
  }

  function scrollToId(id) {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function injectReviewCTA() {
    // الأزرار السريعة يجب أن تظهر فقط في الصفحة الرئيسية
    if (!isHomePage()) return;
    if (isAdminPage() || isAuthPage()) return;
    const hash = (window.location.hash || '').toLowerCase();
    // اخفِ الأزرار في صفحات الـ inline داخل الرئيسية (wallet/settings/transfer...)
    if (hash.startsWith('#/') && hash !== '#/' && hash !== '#/home') return;
    if (document.getElementById('quickFloatingActions')) return;
    const wrap = document.createElement('div');
    wrap.id = 'quickFloatingActions';
    wrap.style.position = 'fixed';
    wrap.style.left = '16px';
    wrap.style.bottom = '16px';
    wrap.style.display = 'flex';
    wrap.style.flexDirection = 'column';
    wrap.style.gap = '10px';
    wrap.style.zIndex = '1200';
    wrap.style.alignItems = 'flex-start';

    const actions = [
      { id: 'reviewCtaBtn', href: 'review-request.html', text: 'عرض حساب' },
      { id: 'withdrawCtaBtn', href: 'sahb.html', text: 'سحب رصيد' },
    ];

    actions.forEach(({ id, href, text }) => {
      const btn = document.createElement('a');
      btn.id = id;
      btn.href = href;
      btn.textContent = text;
      btn.className = 'btn primary';
      btn.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)';
      btn.style.padding = '12px 16px';
      btn.style.borderRadius = '12px';
      btn.style.textDecoration = 'none';
      btn.style.fontWeight = '800';
      btn.style.backdropFilter = 'blur(4px)';
      btn.style.backgroundImage = 'linear-gradient(135deg,#2563eb,#1e40af)';
      wrap.appendChild(btn);
    });

    document.body.appendChild(wrap);
  }

  function getCategoryList() {
    return state.categories || [];
  }

  function getCategoryMap() {
    const map = {};
    getCategoryList().forEach((c) => {
      if (!c) return;
      const key = c.id || c.key || c.slug;
      const label = c.label || c.name || c.title || key;
      if (key) map[key] = displayTitle(label);
    });
    return map;
  }

  function getAccountPrivate(accId) {
    if (!accId) return null;
    return state.accountPrivate.find((p) => p.id === accId) || null;
  }

  function renderCategorySelect(el, opts = {}) {
    if (!el) return;
    const list = getCategoryList();
    const { includeAll, includePlaceholder } = opts;
    const parts = [];
    if (includePlaceholder) parts.push('<option value="">اختر القسم</option>');
    if (includeAll) parts.push('<option value="all">كل الأقسام</option>');
    list.forEach((c) => {
      const key = c.id || c.key || c.slug;
      if (!key) return;
      const label = c.label || c.name || c.title || key;
      const display = displayTitle(label);
      parts.push(`<option value="${key}">${display}</option>`);
    });
    el.innerHTML = parts.join('') || '<option value="">لا توجد أقسام</option>';
  }

  async function loadWallet() {
    if (!els.walletBalance) return;
    const user = getCurrentUser();
    if (!user) {
      state.wallet = 0;
      renderWallet();
      renderWalletHistory();
      return;
    }
    if (!db) {
      renderWallet();
      renderWalletHistory();
      return;
    }
    try {
      const doc = await db.collection('wallets').doc(user.uid).get();
      state.wallet = doc.exists ? doc.data().balance || 0 : 0;
    } catch (e) {
      state.wallet = 0;
    }
    renderWallet();
    renderWalletHistory();
  }

  async function loadFeesConfig() {
    if (!ADMIN_ROUTER_BASE) {
      state.fees = state.fees || getDefaultFees();
      renderFeesForm();
      return;
    }
    try {
      const res = await fetch(`${ADMIN_ROUTER_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fees:get' })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || data.message || 'تعذر جلب الرسوم');
      }
      const fees = data.fees || {};
      state.fees = {
        buyerMarkup: {
          customer: Number(fees?.buyerMarkup?.customer) || 0,
          trader: Number(fees?.buyerMarkup?.trader) || 0,
          vip: Number(fees?.buyerMarkup?.vip) || 0,
        },
        sellerFee: Number(fees?.sellerFee) || 0,
      };
    } catch (err) {
      console.warn('fees config load failed', err);
      state.fees = state.fees || getDefaultFees();
    }
    renderFeesForm();
    renderListings();
    renderAdminQueue();
    renderAdminManageList();
  }

  function renderWallet() {
    if (!els.walletBalance) return;
    const user = getCurrentUser();
    const value = user ? (state.wallet || 0) : 0;
    els.walletBalance.textContent = `${value} $`;
  }

  function evaluateAdmin(user) {
    if (!user) return false;
    const email = (user.email || '').toLowerCase();
    if (ADMIN_EMAILS.includes(email)) return true;
    return !!user.customAdmin;
  }

  function renderPaymentMethods() {
    if (!els.walletMethodSelect) return;
    const methods = (state.depositMethods && state.depositMethods.length)
      ? state.depositMethods
      : (state.paymentMethods || []);
    if (!methods.length) {
      els.walletMethodSelect.innerHTML = '<option value=\"\">لا توجد طرق إيداع</option>';
      if (els.walletCountrySelect) els.walletCountrySelect.innerHTML = '<option value=\"\">—</option>';
      if (els.walletMethodInfo) els.walletMethodInfo.textContent = '';
      return;
    }
    const prev = els.walletMethodSelect.value;
    els.walletMethodSelect.innerHTML = methods.map((m) => {
      const label = m.name || m.type || 'طريقة';
      const cur = (m.currencyCode || m.currency || '').toUpperCase();
      return `<option value="${m.id}">${label}${cur ? ` (${cur})` : ''}</option>`;
    }).join('');
    if (methods.some((m) => m.id === prev)) {
      els.walletMethodSelect.value = prev;
    }
    if (els.walletCountrySelect) {
      els.walletCountrySelect.innerHTML = '<option value="">—</option>';
    }
    renderMethodInfo();
  }

  function renderMethodInfo() {
    if (!els.walletMethodInfo) return;
    const methods = (state.depositMethods && state.depositMethods.length)
      ? state.depositMethods
      : (state.paymentMethods || []);
    const methodId = els.walletMethodSelect?.value || '';
    const method = methods.find((m) => (m.id || '').toString() === (methodId || '').toString());
    if (!method) {
      els.walletMethodInfo.textContent = '';
      return;
    }
    const info = method.info || {};
    const currencyLabel = (method.currency || method.currencyCode || '').toUpperCase();
    const bankLabel = method.bank || method.bankName || info.bank || '';
    const accountName = method.accountName || info.accountName || '';
    const accountNumber = method.accountNumber || info.accountNumber || info.wallet || '';
    const walletId = method.wallet || info.wallet || '';
    const iban = method.iban || info.iban || '';
    const note = (method.note || info.note || '').trim();
    const rateUsd = Number(method.ratePerUSD ?? method.rateUsd ?? method.rate);
    const rateJod = Number(method.ratePerJOD ?? method.rateJOD);
    const rateLines = [];
    if (Number.isFinite(rateUsd) && rateUsd > 0) rateLines.push(`1 USD = ${rateUsd} ${currencyLabel || ''}`.trim());
    if (Number.isFinite(rateJod) && rateJod > 0 && (!currencyLabel || currencyLabel !== 'JOD')) {
      rateLines.push(`1 JOD = ${rateJod} ${currencyLabel || ''}`.trim());
    }
    const details = [
      currencyLabel ? `العملة: ${currencyLabel}` : '',
      bankLabel ? `البنك/المحفظة: ${bankLabel}` : '',
      accountName ? `الاسم: ${accountName}` : '',
      accountNumber ? `الرقم/المعرف: ${accountNumber}` : '',
      walletId && !accountNumber ? `المحفظة: ${walletId}` : '',
      iban ? `IBAN: ${iban}` : '',
      rateLines.join(' | '),
      note,
    ].filter(Boolean).join(' • ');
    els.walletMethodInfo.textContent = details;
  }

  function setAdminAuthStatus(text, isError = false) {
    if (!els.adminAuthStatus) return;
    els.adminAuthStatus.textContent = text || '';
    els.adminAuthStatus.style.color = isError ? '#f87171' : 'var(--muted,#9aa6c8)';
  }

  function setAdminTopupsLoadStatus(text, isError = false) {
    if (!els.adminTopupsLoadStatus) return;
    const value = (text == null || text === '') ? '—' : String(text);
    els.adminTopupsLoadStatus.textContent = value;
    els.adminTopupsLoadStatus.style.color = isError ? '#f87171' : 'var(--muted,#9aa6c8)';
  }

  function handleAdminAuthLogin(e) {
    e.preventDefault();
    if (!els.adminAuthEmail || !els.adminAuthPassword) return;
    const email = els.adminAuthEmail.value.trim().toLowerCase();
    const password = els.adminAuthPassword.value;
    if (!email || !password) {
      setAdminAuthStatus('أدخل البريد وكلمة المرور للأدمن', true);
      return;
    }
    setAdminAuthStatus('جارٍ تسجيل الدخول...');
    firebase.auth().signInWithEmailAndPassword(email, password).then(async (cred) => {
      try {
        const token = await cred.user.getIdTokenResult();
        const isAdmin = !!token.claims?.admin || evaluateAdmin(cred.user);
        if (!isAdmin) {
          await firebase.auth().signOut();
          setAdminAuthStatus('هذا الحساب ليس أدمن. استخدم حساب الأدمن فقط.', true);
          return;
        }
        setAdminAuthStatus('تم تسجيل الدخول كأدمن');
      } catch (err) {
        setAdminAuthStatus(err?.message || 'تعذر التحقق من الصلاحيات', true);
      }
    }).catch((err) => {
      setAdminAuthStatus(err?.message || 'بيانات الدخول غير صحيحة', true);
    });
  }

  function renderWalletHistory() {
    if (!els.walletHistory) return;
    const user = getCurrentUser();
    if (!user) {
      els.walletHistory.innerHTML = '<p class="muted tiny">سجّل الدخول لعرض طلباتك.</p>';
      return;
    }
    const mine = state.topups.filter((t) => t.ownerId === user.uid);
    if (!mine.length) {
      els.walletHistory.innerHTML = '<p class="muted tiny">لا توجد طلبات شحن بعد.</p>';
      return;
    }
    els.walletHistory.innerHTML = mine.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((t) => `
      <article class="card">
        <div class="card-body">
          <div class="actions" style="justify-content: space-between;">
            <span class="badge ${t.status || 'pending'}">${t.status || 'pending'}</span>
            <span class="price-tag">${formatPriceCurrency(t.amount || 0)}</span>
          </div>
          <div class="muted tiny">${t.country || ''} • ${t.methodName || ''}</div>
          <p class="muted tiny">مرجع: ${t.reference || '-'}</p>
          <p class="muted tiny">${t.note || ''}</p>
          <div class="muted tiny">${t.createdAt ? new Date(t.createdAt).toLocaleString('ar-EG') : ''}</div>
        </div>
      </article>
    `).join('');
  }

  function handleLoginSubmit(e) {
    e.preventDefault();
    const email = els.loginEmailInput.value.trim().toLowerCase();
    const password = els.loginPasswordInput.value.trim();
    if (!email || !password) {
      notify('أدخل البريد وكلمة المرور');
      return;
    }
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        notify('تم تسجيل الدخول');
        if (isAuthPage()) window.location.href = 'index.html';
      })
      .catch(() => notify('بيانات الدخول غير صحيحة'));
  }

  function focusAuthFromHash() {
    if (!isAuthPage()) return;
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('register') && els.registerNameInput) {
      els.registerNameInput.focus();
    } else if (els.loginEmailInput) {
      els.loginEmailInput.focus();
    }
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();
    const name = els.registerNameInput.value.trim() || 'مستخدم جديد';
    const email = els.registerEmailInput.value.trim().toLowerCase();
    const password = els.registerPasswordInput.value.trim();
    if (!email || !password) {
      notify('أدخل البريد وكلمة المرور');
      return;
    }
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(async (cred) => {
        if (name) {
          await cred.user.updateProfile({ displayName: name }).catch(() => {});
        }
        if (db) {
          await db.collection('profiles').doc(cred.user.uid).set({
            name,
            email,
            createdAt: Date.now(),
          }).catch(() => {});
        }
        notify('تم إنشاء الحساب');
        els.registerForm.reset();
        if (isAuthPage()) window.location.href = 'index.html';
      })
      .catch(() => notify('تعذر إنشاء الحساب'));
  }

  async function handleWalletTopup(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      notify('سجّل الدخول أولًا');
      window.location.href = 'login.html';
      return;
    }
    if (!db) {
      notify('فعّل اتصال Firebase أولًا');
      return;
    }
    const amount = Number(els.walletAmountInput.value);
    if (!amount || amount <= 0) {
      notify('أدخل مبلغ صحيح');
      return;
    }
    const methods = (state.depositMethods && state.depositMethods.length)
      ? state.depositMethods
      : (state.paymentMethods || []);
    const methodId = els.walletMethodSelect?.value || '';
    const method = methods.find((m) => (m.id || '').toString() === (methodId || '').toString());
    if (!method) {
      notify('اختر طريقة إيداع');
      return;
    }
    const reference = els.walletRefInput?.value?.trim() || '';
    const methodName = method?.name || method?.type || 'تحويل';
    const countryName = method?.country || method?.region || '';

    // الأفضل إرسال الطلب عبر الباك-إند لإرسال إشعار تيليجرام + توحيد المصدر
    if (ADMIN_ROUTER_BASE) {
      try {
        await sendAdminRequest({
          action: 'topup:submit',
          amount,
          methodId,
          methodName,
          country: countryName || '',
          reference,
        });
        notify('تم إرسال طلب الشحن للأدمن');
        if (els.walletAmountInput) els.walletAmountInput.value = '';
        if (els.walletRefInput) els.walletRefInput.value = '';
        loadFirebaseData();
      } catch (err) {
        notify(err?.message || 'تعذر إرسال الطلب عبر الباك-إند');
      }
      return;
    }

    // fallback: ربط مباشر بفايرستور إن لم يتوفر باك-إند
    db.collection('topups').add({
      ownerId: user.uid,
      amount,
      country: countryName || methodName,
      methodId,
      methodName,
      reference,
      note: '',
      status: 'pending',
      createdAt: Date.now(),
    }).then(() => {
      notify('تم إرسال طلب الشحن للأدمن');
      if (els.walletAmountInput) els.walletAmountInput.value = '';
      if (els.walletRefInput) els.walletRefInput.value = '';
      loadFirebaseData();
    }).catch(() => notify('تعذر إرسال الطلب'));
  }

  async function handleAddAccount(e) {
    e.preventDefault();
    const user = getCurrentUser();
    if (!user) {
      notify('سجّل الدخول أولًا');
      window.location.href = 'login.html';
      return;
    }
    if (!db) {
      notify('فعّل اتصال Firebase أولًا');
      return;
    }

    const category = (els.accountCategory && els.accountCategory.value) || '';
    const title = els.titleInput ? els.titleInput.value.trim() : '';
    const priceVal = els.priceInput ? els.priceInput.value : '';
    const price = Number(priceVal);
    const contact = els.contactInput ? els.contactInput.value.trim() : '';
    const image = newAccountImages[0] || (els.imageInput ? els.imageInput.value.trim() : '');
    const description = els.descInput ? els.descInput.value.trim() : '';

    if (!category || !title || !priceVal || !contact || !description) {
      notify('أكمل الحقول المطلوبة');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      notify('أدخل سعرًا صحيحًا');
      return;
    }
    if (!image || !newAccountImages.length) {
      notify('ارفع صورة أو أكثر للحساب أولاً');
      return;
    }

    const accountData = {
      ownerId: user.uid,
      gameId: null,
      title,
      category,
      price,
      priceUSD: price,
      image,
      images: [...newAccountImages],
      description,
      contact,
      contactCode,
      contactNumber,
      status: 'pending',
      createdAt: Date.now(),
    };

    // حلّل رمز الدولة إن وُجد في الحقل
    let contactCode = '';
    let contactNumber = contact;
    const m = (contact || '').trim().match(/^(\+?\d{1,4})\s*(.*)$/);
    if (m) {
      contactCode = m[1].startsWith('+') ? m[1] : ('+' + m[1]);
      contactNumber = m[2] || '';
    }
    if (!contactCode) {
      notify('أدخل رقم الهاتف مع رمز الدولة (مثال: +971 5XXXXXXXX)');
      return;
    }

    // استخدم الباك اند إن توفر (يدعم إشعارات تيليجرام + إنشاء وثيقة خاصة)
    if (ADMIN_ROUTER_BASE) {
      try {
        await sendAdminRequest({
          action: 'submit',
          title,
          category,
          price,
          description,
          images: [...newAccountImages],
          image,
          contact,
          contactCode,
          contactNumber
        });
        notify('تم إرسال الإعلان للمراجعة');
        if (els.addAccountForm) els.addAccountForm.reset();
        if (els.accountCategory) els.accountCategory.value = 'royal';
        newAccountImages.splice(0, newAccountImages.length);
        renderAccountImagesPreview();
        if (els.imageInput) els.imageInput.value = '';
        loadFirebaseData();
      } catch (err) {
        notify(err?.message || 'تعذر الحفظ عبر الباك اند');
      }
      return;
    }

    db.collection('accounts').add(accountData).then((docRef) => {
      db.collection('accountPrivate').doc(docRef.id).set({
        ownerId: user.uid,
        contact,
        contactCode,
        contactNumber,
        accountId: docRef.id,
        createdAt: Date.now(),
      }).catch(() => {});
      notify('تم إرسال الإعلان للمراجعة');
      if (els.addAccountForm) els.addAccountForm.reset();
      if (els.accountCategory) els.accountCategory.value = 'royal';
      newAccountImages.splice(0, newAccountImages.length);
      renderAccountImagesPreview();
      if (els.imageInput) els.imageInput.value = '';
      loadFirebaseData();
    }).catch(() => notify('تعذر الحفظ، تحقق من الاتصال'));
  }

  async function handleAdminAction(e) {
    const btn = e.target.closest('button[data-action][data-id]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (!state.isAdmin) {
      notify('صلاحية الادمن مطلوبة');
      return;
    }
    if (!ADMIN_ROUTER_BASE) {
      notify('اضبط ADMIN_ROUTER_BASE للعمليات الإدارية');
      return;
    }
    // إعلانات
    if (action === 'approve' || action === 'reject' || action === 'delete') {
      const account = state.accounts.find((a) => a.id === id);
      if (!account) return;
      try {
        if (action === 'delete') {
          await sendAdminRequest({ action: 'admin:delete', accountId: id });
          notify('تم حذف الإعلان');
          loadFirebaseData();
          return;
        }
        const status = action === 'approve' ? 'approved' : 'rejected';
        if (action === 'approve') {
          const card = btn.closest('[data-acc-id]');
          const select = card ? card.querySelector('select.admin-category-select') : null;
          const nextCategory = select && select.value ? select.value : (account.category || '');
          if (!nextCategory) {
            notify('اختر القسم (التصنيف) لهذا الإعلان قبل الموافقة');
            if (select) select.focus();
            return;
          }
          await sendAdminRequest({
            action: 'admin:status',
            accountId: id,
            status,
            category: nextCategory
          });
          notify('تمت الموافقة');
          loadFirebaseData();
          return;
        }
        await sendAdminRequest({
          action: 'admin:status',
          accountId: id,
          status
        });
        notify(action === 'approve' ? 'تمت الموافقة' : 'تم الرفض');
        loadFirebaseData();
      } catch (err) {
        notify(err?.message || 'تعذر التحديث');
      }
      return;
    }

    // طلبات شحن الرصيد
    if (action === 'topup-approve' || action === 'topup-reject') {
      const topup = state.topups.find((t) => t.id === id);
      if (!topup) return;
      const newStatus = action === 'topup-approve' ? 'approved' : 'rejected';
      try {
        await sendAdminRequest({ action: 'topup:status', topupId: id, status: newStatus });
        notify(action === 'topup-approve' ? 'تمت إضافة الرصيد' : 'تم رفض الطلب');
        loadFirebaseData();
      } catch (err) {
        notify(err?.message || 'تعذر تحديث الطلب');
      }
      return;
    }

    // طلبات الإيداع (depositRequests / userDepositRequests)
    if (action === 'deposit-approve' || action === 'deposit-reject') {
      const newStatus = action === 'deposit-approve' ? 'accepted' : 'rejected';
      let userId = (btn.dataset.userId || '').toString().trim();
      if (!userId) {
        const hit = (state.depositRequests || []).find((d) => ((d.id || d.code || '') === id));
        userId = (hit?.userId || hit?.uid || '').toString().trim();
      }
      try {
        await sendAdminRequest({ action: 'deposit:status', depositCode: id, userId, status: newStatus });
        notify(action === 'deposit-approve' ? 'تم قبول الإيداع وإضافة الرصيد' : 'تم رفض الإيداع');
        loadFirebaseData();
      } catch (err) {
        notify(err?.message || 'تعذر تحديث الإيداع');
      }
      return;
    }
  }

  async function handleAdminManageClick(e) {
    const btn = e.target.closest('[data-manage-action][data-id]');
    if (!btn) return;
    if (!state.isAdmin) {
      notify('صلاحية الأدمن مطلوبة');
      return;
    }
    const action = btn.dataset.manageAction;
    const id = btn.dataset.id;
    const card = btn.closest('[data-acc-id]');
    if (!id || !card) return;

    if (action === 'delete') {
      if (!confirm('سيتم حذف الإعلان نهائياً. متأكد؟')) return;
      try {
        await sendAdminRequest({ action: 'admin:delete', accountId: id });
        notify('تم حذف الإعلان');
        loadFirebaseData();
      } catch (err) {
        notify(err?.message || 'تعذر الحذف');
      }
      return;
    }

    if (action === 'save') {
      const titleEl = card.querySelector('.admin-edit-title');
      const priceEl = card.querySelector('.admin-edit-price');
      const contactEl = card.querySelector('.admin-edit-contact');
      const categoryEl = card.querySelector('.admin-edit-category');
      const statusEl = card.querySelector('.admin-edit-status');
      const descEl = card.querySelector('.admin-edit-desc');
      const title = titleEl ? titleEl.value.trim() : '';
      const price = priceEl ? Number(priceEl.value) : 0;
      const contact = contactEl ? contactEl.value.trim() : '';
      const category = categoryEl ? (categoryEl.value || 'other') : 'other';
      const status = statusEl ? statusEl.value : '';
      const description = descEl ? descEl.value.trim() : '';
      if (!title || !contact || !category || !status || !Number.isFinite(price) || price < 0) {
        notify('أكمل الحقول المطلوبة بسعر صحيح');
        return;
      }
      try {
        await sendAdminRequest({
          action: 'admin:update',
          accountId: id,
          title,
          price,
          category,
          status,
          description,
          contact
        });
        notify('تم حفظ التعديلات');
        loadFirebaseData();
      } catch (err) {
        notify(err?.message || 'تعذر الحفظ');
      }
    }
  }

  function handleAddMethod(e) {
    e.preventDefault();
    if (!state.isAdmin) {
      notify('صلاحية الادمن فقط');
      return;
    }
    if (!ADMIN_ROUTER_BASE) {
      notify('اضبط ADMIN_ROUTER_BASE للعمليات الإدارية');
      return;
    }
    const country = els.methodCountryInput.value.trim();
    const name = els.methodNameInput.value.trim();
    const accountNumber = els.methodAccountInput.value.trim();
    const accountName = els.methodHolderInput.value.trim();
    const note = els.methodNoteInput.value.trim();
    if (!country || !name || !accountNumber) {
      notify('أكمل الحقول المطلوبة');
      return;
    }
    sendAdminRequest({
      action: 'method:add',
      country,
      name,
      accountNumber,
      accountName,
      note,
      type: 'wallet'
    }).then(() => {
      notify('تمت إضافة الطريقة');
      els.addMethodForm.reset();
      loadFirebaseData();
    }).catch((err) => notify(err?.message || 'تعذر الإضافة'));
  }

  function handleMethodAdminClick(e) {
    const btn = e.target.closest('button[data-method-id]');
    if (!btn) return;
    const id = btn.dataset.methodId;
    if (!state.isAdmin) {
      notify('صلاحية الادمن مطلوبة');
      return;
    }
    sendAdminRequest({ action: 'method:delete', id })
      .then(() => { notify('تم حذف الطريقة'); loadFirebaseData(); })
      .catch((err) => notify(err?.message || 'تعذر الحذف'));
  }

  function handleAddDepositMethod(e) {
    e.preventDefault();
    if (!state.isAdmin) {
      notify('صلاحية الادمن فقط');
      return;
    }
    if (!ADMIN_ROUTER_BASE) {
      notify('اضبط ADMIN_ROUTER_BASE للعمليات الإدارية');
      return;
    }
    const name = (els.depositMethodNameInput?.value || '').trim();
    const methodType = (els.depositMethodTypeInput?.value || '').trim() || 'wallet';
    const currencyCode = (els.depositCurrencyInput?.value || '').trim().toUpperCase();
    const ratePerUSD = Number(els.depositRateUsdInput?.value || 0);
    const hasRate = Number.isFinite(ratePerUSD) && ratePerUSD > 0;
    const isBank = methodType === 'bank';
    const isWallet = methodType === 'wallet';
    if (!name || !currencyCode || !hasRate) {
      notify('أكمل اسم الطريقة، العملة، وسعر الصرف (بالدولار)');
      return;
    }
    if (isBank && (!els.depositBankInput?.value || !els.depositAccountNumberInput?.value)) {
      notify('أدخل بيانات البنك ورقم الحساب');
      return;
    }
    if (isWallet && !els.depositWalletInput?.value) {
      notify('أدخل معرف المحفظة');
      return;
    }
    const label = '';
    const payload = {
      action: 'deposit:method:add',
      name,
      methodType,
      currencyCode,
      ratePerUSD,
      bank: (els.depositBankInput?.value || '').trim(),
      accountName: (els.depositAccountNameInput?.value || '').trim(),
      accountNumber: (els.depositAccountNumberInput?.value || '').trim(),
      iban: (els.depositIbanInput?.value || '').trim(),
      wallet: (els.depositWalletInput?.value || '').trim(),
      note: (els.depositMethodNoteInput?.value || '').trim(),
      logoUrl: (els.depositLogoInput?.value || '').trim(),
      country: label,
      region: label
    };
    sendAdminRequest(payload).then(() => {
      notify('تم حفظ طريقة الإيداع');
      if (els.depositMethodForm) els.depositMethodForm.reset();
      loadFirebaseData();
    }).catch((err) => notify(err?.message || 'تعذر الحفظ'));
  }

  function handleDepositMethodClick(e) {
    const methodBtn = e.target.closest('button[data-deposit-method]');
    if (methodBtn) {
      const methodId = methodBtn.dataset.depositMethod;
      if (!methodId) return;
      if (!confirm('سيتم حذف طريقة الإيداع. متابعة؟')) return;
      sendAdminRequest({ action: 'deposit:method:delete', methodId })
        .then(() => { notify('تم حذف الطريقة'); loadFirebaseData(); })
        .catch((err) => notify(err?.message || 'تعذر الحذف'));
    }
  }

  function renderSession() {
    const user = getCurrentUser();
    const chipText = user?.displayName || user?.email || 'ضيف';
    if (els.userChip) els.userChip.textContent = chipText;
    if (els.logoutBtn) els.logoutBtn.classList.toggle('hidden', !user);
    if (els.loginBtn) els.loginBtn.classList.toggle('hidden', !!user);
    if (els.registerBtn) els.registerBtn.classList.toggle('hidden', !!user);
    if (els.addSection) els.addSection.classList.toggle('hidden', !user);
    if (els.yourSection) els.yourSection.classList.toggle('hidden', !user);
    if (els.walletPanel) els.walletPanel.classList.toggle('hidden', !user);
    if (els.adminPanel) els.adminPanel.classList.toggle('hidden', !state.isAdmin);
    if (els.adminManage) els.adminManage.classList.toggle('hidden', !state.isAdmin);
    if (els.adminAddAccounts) els.adminAddAccounts.classList.toggle('hidden', !state.isAdmin);
    if (els.adminCategories) els.adminCategories.classList.toggle('hidden', !state.isAdmin);
    if (els.adminFees) els.adminFees.classList.toggle('hidden', !state.isAdmin);
    if (els.adminAuthPanel) els.adminAuthPanel.style.display = (!state.isAdmin && isAdminPage()) ? 'block' : 'none';
    if (els.adminMain) els.adminMain.classList.toggle('hidden', !state.isAdmin);
    if (els.adminTabNav) els.adminTabNav.style.display = state.isAdmin ? 'flex' : 'none';
  }

  function renderGameOptions() {
    if (!els.gameSelect) return;
    els.gameSelect.innerHTML = state.games
      .map((g) => `<option value="${g.id}">${g.name}</option>`)
      .join('');
  }

  function renderCategorySelectors() {
    const prevFilter = els.accountCategoryFilter ? els.accountCategoryFilter.value : 'all';
    const prevAdd = els.accountCategory ? els.accountCategory.value : '';
    renderCategorySelect(els.accountCategoryFilter, { includeAll: true });
    renderCategorySelect(els.accountCategory, { includePlaceholder: true });
    if (els.accountCategoryFilter) {
      els.accountCategoryFilter.value = prevFilter && prevFilter !== 'all' ? prevFilter : 'all';
    }
    if (els.accountCategory && prevAdd) {
      els.accountCategory.value = prevAdd;
    }
  }

  function renderGames() {
    if (!els.gameGrid) return;
    if (!els.searchInput) return;
    const term = (els.searchInput.value || '').toLowerCase();
    const filtered = state.games.filter((g) => g.name.toLowerCase().includes(term));
    if (!filtered.length) {
      els.gameGrid.innerHTML = '<p class="muted">لا توجد ألعاب مطابقة للبحث.</p>';
      if (els.listingGrid) els.listingGrid.innerHTML = '<p class="muted">اختر لعبة لعرض الإعلانات.</p>';
      if (els.currentGameTitle) els.currentGameTitle.textContent = '(اختر لعبة من الأعلى)';
      return;
    }

    els.gameGrid.innerHTML = filtered.map((g) => `
      <article class="game-card ${state.selectedGame === g.id ? 'active' : ''}" data-game-id="${g.id}">
        <img src="${g.image || PLACEHOLDER}" alt="${g.name}">
        <div class="title">${g.name}</div>
      </article>
    `).join('');
    renderListings();
  }

  function statusBadge(status) {
    const raw = (status == null) ? '' : String(status);
    const normalized = raw.trim().toLowerCase();
    const labels = {
      approved: 'مقبول',
      pending: 'انتظار',
      rejected: 'مرفوض',
      sold: 'تم البيع',
      completed: 'تم البيع',
    };
    const cls = (normalized === 'completed') ? 'sold' : normalized;
    return `<span class="badge ${cls}">${labels[normalized] || raw}</span>`;
  }

  function accountCard(acc, opts = {}) {
    const game = state.games.find((g) => g.id === acc.gameId);
    const img = acc.image || (Array.isArray(acc.images) ? acc.images[0] : '') || game?.image || PLACEHOLDER;
    const titleText = displayTitle(acc.title) || 'حساب';
    const created = acc.createdAt ? new Date(acc.createdAt).toLocaleDateString('ar-EG') : '';
    const reviewer = acc.reviewedBy ? acc.reviewedBy : '';
    const categoryLabel = getCategoryMap()[acc.category] || '';
    const priv = getAccountPrivate(acc.id);
    const contactVal = priv?.contact || acc.contact || '';
    const priceInfo = getDisplayPrice(acc, { skipMarkup: opts.skipMarkup || opts.admin });
    const priceTag = formatPriceCurrency(priceInfo.final || 0);
    const markupNote = (!opts.skipMarkup && !opts.admin && priceInfo.pct)
      ? `<div class="muted tiny">+${priceInfo.pct}% (${priceInfo.level === 'trader' ? 'تجار' : priceInfo.level === 'vip' ? 'VIP' : 'زبائن'})</div>`
      : '';

    const footer = (opts.showContact && contactVal)
      ? `<div class="muted tiny">تواصل: ${contactVal}</div>`
      : '';

    const adminActions = opts.admin
      ? `<div class="actions">
          <button class="btn primary small" data-action="approve" data-id="${acc.id}">موافقة</button>
          <button class="btn ghost small" data-action="reject" data-id="${acc.id}">رفض</button>
          <button class="btn danger small" data-action="delete" data-id="${acc.id}">حذف</button>
        </div>`
      : '';

    return `
      <article class="card">
        <img src="${img}" alt="${titleText}">
        <div class="card-body">
          <div class="actions" style="justify-content: space-between;">
            <span>${statusBadge(acc.status)}</span>
            <span class="price-tag">${priceTag}</span>
          </div>
          ${markupNote}
          <h3>${titleText}</h3>
          <div class="muted tiny">${game ? game.name : ''} ${created ? `• ${created}` : ''}</div>
          ${categoryLabel ? `<div class="muted tiny">القسم: ${categoryLabel}</div>` : ''}
          <p class="muted">${acc.description || ''}</p>
          ${reviewer ? `<div class="tiny muted">مراجَع بواسطة ${reviewer}</div>` : ''}
          ${footer}
          ${adminActions}
        </div>
      </article>
    `;
  }

  function sortAccounts(list) {
    const arr = [...list];
    switch (state.sort) {
      case 'oldest':
        return arr.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      case 'priceHigh':
        return arr.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'priceLow':
        return arr.sort((a, b) => (a.price || 0) - (b.price || 0));
      default:
        return arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }
  }

  function renderListings() {
    if (!els.listingGrid || !els.currentGameTitle) return;
    const user = getCurrentUser();
    const selected = state.games.find((g) => g.id === state.selectedGame);
    els.currentGameTitle.textContent = selected ? `إعلانات ${selected.name}` : '(اختر لعبة من الأعلى)';

    if (!selected) {
      els.listingGrid.innerHTML = '<p class="muted">اختر لعبة لعرض الإعلانات.</p>';
      return;
    }

    const visible = state.accounts.filter((a) => {
      if (a.gameId !== selected.id) return false;
      if (state.isAdmin || user?.isAdmin) return true;
      return a.status === 'approved';
    });

    if (!visible.length) {
      els.listingGrid.innerHTML = '<p class="muted">لا توجد إعلانات لهذا القسم حاليًا.</p>';
      return;
    }

    els.listingGrid.innerHTML = sortAccounts(visible)
      .map((a) => accountCard(a, { showContact: true }))
      .join('');
  }

  function renderYourListings() {
    if (!els.yourListings) return;
    const user = getCurrentUser();
    if (!user) return;
    const mine = state.accounts.filter((a) => a.ownerId === user.uid);
    if (!mine.length) {
      els.yourListings.innerHTML = '<p class="muted">لا يوجد لديك إعلانات بعد.</p>';
      return;
    }
    els.yourListings.innerHTML = sortAccounts(mine).map((a) => accountCard(a, { showContact: true })).join('');
  }

  function renderAdminQueue() {
    if (!els.adminList) return;
    const filter = (els.accountCategoryFilter && els.accountCategoryFilter.value) || 'all';
    const categoryMap = getCategoryMap();
    const pending = state.accounts.filter((a) => {
      if (a.status !== 'pending') return false;
      if (filter === 'all') return true;
      return (a.category || '') === filter;
    });
    if (!pending.length) {
      els.adminList.innerHTML = '<p class="muted">لا توجد طلبات بانتظار المراجعة.</p>';
      return;
    }
    const grouped = pending.reduce((acc, item) => {
      const key = item.category || 'other';
      acc[key] = acc[key] || [];
      acc[key].push(item);
      return acc;
    }, {});
    const sections = Object.keys(grouped).map((key) => {
      const list = sortAccounts(grouped[key]);
      const label = categoryMap[key] || 'حسابات أخرى';
      const cards = list.map((acc) => {
        const img = acc.image || (Array.isArray(acc.images) ? acc.images[0] : '') || PLACEHOLDER;
        const titleText = displayTitle(acc.title) || 'حساب';
        const images = getAccountImageUrls(acc);
        const more = images.length > 1 ? `<span class="more">${images.length} صور</span>` : '';
        const created = acc.createdAt ? new Date(acc.createdAt).toLocaleString('ar-EG') : '';
        const priv = getAccountPrivate(acc.id);
        const contact = priv?.contact || '';
        const selectedCat = acc.category || '';
        const buyerPriceInfo = getDisplayPrice(acc);
        const buyerPriceTag = buyerPriceInfo?.final ? formatPriceCurrency(buyerPriceInfo.final) : '';
        let catOptions = getCategoryList().map((c) => {
          const key = c.id || c.key || c.slug;
          const lbl = c.label || c.name || key;
          if (!key) return '';
          return `<option value="${key}" ${selectedCat === key ? 'selected' : ''}>${lbl}</option>`;
        }).join('');
        if (selectedCat && !catOptions.includes(`value="${selectedCat}"`)) {
          catOptions += `<option value="${selectedCat}" selected>${selectedCat}</option>`;
        }
        const categoryPicker = `
          <div class="field tiny muted" style="display:flex;flex-direction:column;gap:4px;">
            <label for="cat-select-${acc.id}" class="muted tiny">القسم</label>
            <select id="cat-select-${acc.id}" class="admin-category-select" data-acc-id="${acc.id}">
              <option value="">اختر القسم</option>
              ${catOptions}
            </select>
            ${selectedCat ? '' : '<span class="tiny muted">لم يتم تعيين القسم بعد</span>'}
          </div>
        `;
        return `
          <article class="account-card-admin" data-acc-id="${acc.id}">
            <div class="thumb" data-open-account-images="${acc.id}" data-img-index="0" title="عرض صور الحساب" style="cursor:pointer;">
              <img src="${img}" alt="${titleText}">
              ${more}
            </div>
            <div class="body">
              <div class="row">
                <div style="display:flex;flex-direction:column;gap:2px;">
                  <span class="price-tag">${formatPriceCurrency(acc.price || 0)}</span>
                  ${buyerPriceTag ? `<span class="muted tiny">سعر المشتري: ${buyerPriceTag}</span>` : ''}
                </div>
                ${statusBadge(acc.status)}
              </div>
              <h3>${titleText}</h3>
              <div class="muted tiny">${contact}</div>
              <p class="muted">${acc.description || ''}</p>
              <div class="muted tiny">${created}</div>
              ${categoryPicker}
              <div class="actions">
                <button class="btn primary small" data-action="approve" data-id="${acc.id}">موافقة</button>
                <button class="btn ghost small" data-action="reject" data-id="${acc.id}">رفض</button>
                <button class="btn danger small" data-action="delete" data-id="${acc.id}">حذف</button>
              </div>
            </div>
          </article>
        `;
      }).join('');
      return `
        <section class="account-group-admin">
          <div class="account-group-head">
            <h3>حسابات ${label}</h3>
            <span class="chip">${list.length} إعلان</span>
          </div>
          <div class="account-grid-admin">${cards}</div>
        </section>
      `;
    });
    els.adminList.innerHTML = sections.join('');
  }

  function renderAdminManageList() {
    if (!els.adminManageList) return;
    if (!state.isAdmin) {
      els.adminManageList.innerHTML = '<p class="muted">صلاحية الأدمن مطلوبة.</p>';
      return;
    }
    const statusFilterRaw = (els.adminManageStatus && els.adminManageStatus.value) || 'all';
    const statusFilter = String(statusFilterRaw || 'all').toLowerCase();
    const queryRaw = (els.adminManageQuery && els.adminManageQuery.value) || '';
    const query = String(queryRaw || '').trim().toLowerCase();
    const list = state.accounts
      .filter((a) => {
        if (statusFilter === 'all') return true;
        const st = (a && a.status != null) ? String(a.status).toLowerCase() : '';
        if (statusFilter === 'sold') return st === 'sold' || st === 'completed';
        return st === statusFilter;
      })
      .filter((a) => {
        if (!query) return true;
        const id = (a && a.id != null) ? String(a.id).toLowerCase() : '';
        const title = (a && a.title != null) ? String(a.title).toLowerCase() : '';
        const owner = (a && (a.ownerWebuid || a.ownerId) != null) ? String(a.ownerWebuid || a.ownerId).toLowerCase() : '';
        return id.includes(query) || title.includes(query) || owner.includes(query);
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!list.length) {
      els.adminManageList.innerHTML = '<p class="muted">لا توجد إعلانات مطابقة.</p>';
      return;
    }
    els.adminManageList.innerHTML = list.map((acc) => {
      const img = acc.image || (Array.isArray(acc.images) ? acc.images[0] : '') || PLACEHOLDER;
      const titleText = displayTitle(acc.title) || 'حساب';
      const created = acc.createdAt ? new Date(acc.createdAt).toLocaleString('ar-EG') : '';
      const priv = getAccountPrivate(acc.id);
      const contactVal = priv?.contact || '';
      const statusNorm = (acc.status == null) ? '' : String(acc.status).toLowerCase();
      const ownerLabel = (acc.ownerWebuid || acc.ownerId || '').toString().trim();
      const allImages = getAccountImageUrls(acc);
      let catOptionsForAcc = getCategoryList().map((c) => {
        const key = c.id || c.key || c.slug;
        const lbl = c.label || c.name || key;
        if (!key) return '';
        return `<option value="${key}" ${ (acc.category || 'other') === key ? 'selected' : ''}>${lbl}</option>`;
      }).join('');
      if (acc.category && !catOptionsForAcc.includes(`value="${acc.category}"`)) {
        catOptionsForAcc += `<option value="${acc.category}" selected>${acc.category}</option>`;
      }
      const imagesPreview = allImages.length
        ? [
          allImages.slice(0, 3).map((url) => (
            `<img src="${url}" data-open-account-images="${acc.id}" data-img-url="${encodeURIComponent(url)}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.12);cursor:pointer;" alt="صورة">`
          )).join(''),
          allImages.length > 3
            ? `<button type="button" class="btn ghost small" data-open-account-images="${acc.id}" data-img-index="0" style="padding:6px 10px;">عرض كل الصور (${allImages.length})</button>`
            : ''
        ].filter(Boolean).join(' ')
        : '<span class="muted tiny">لا توجد صور</span>';
      const videoPreview = acc.video
        ? `<video src="${acc.video}" controls style="max-width:240px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:#000;"></video>`
        : '<span class="muted tiny">لا يوجد فيديو</span>';
      return `
        <article class="manage-card" data-acc-id="${acc.id}">
          <div class="row">
            <img class="thumb" src="${img}" alt="${titleText}" data-open-account-images="${acc.id}" data-img-index="0" title="عرض صور الحساب" style="cursor:pointer;">
            <div class="fields">
              <label>العنوان<input class="admin-edit-title" type="text" placeholder="عنوان الإعلان" value="${acc.title || ''}" data-acc-id="${acc.id}"></label>
              <label>السعر ($)<input class="admin-edit-price" type="number" step="0.01" min="0" placeholder="0.00" value="${acc.price != null ? acc.price : ''}" data-acc-id="${acc.id}"></label>
              <label>التواصل<input class="admin-edit-contact" type="text" placeholder="واتساب / تليجرام" value="${contactVal}" data-acc-id="${acc.id}"></label>
              <label>القسم
                <select class="admin-edit-category" data-acc-id="${acc.id}">
                  <option value="">اختر القسم</option>
                  ${catOptionsForAcc}
                </select>
              </label>
              <label>الحالة
                <select class="admin-edit-status" data-acc-id="${acc.id}">
                  <option value="pending" ${statusNorm === 'pending' ? 'selected' : ''}>بانتظار</option>
                  <option value="approved" ${statusNorm === 'approved' ? 'selected' : ''}>مقبول</option>
                  <option value="rejected" ${statusNorm === 'rejected' ? 'selected' : ''}>مرفوض</option>
                  <option value="sold" ${statusNorm === 'sold' ? 'selected' : ''}>تم البيع</option>
                  <option value="completed" ${statusNorm === 'completed' ? 'selected' : ''}>تم البيع (مكتمل)</option>
                </select>
              </label>
            </div>
          </div>
          <label>الوصف
            <textarea class="admin-edit-desc" rows="3" placeholder="تفاصيل الحساب" data-acc-id="${acc.id}">${acc.description || ''}</textarea>
          </label>
          <div class="meta">
            <span>الحالة الحالية: ${statusBadge(acc.status)}</span>
            <span>تم الإنشاء: ${created || '-'}</span>
            <span>${ownerLabel ? `المالك: ${ownerLabel}` : ''}</span>
            <span>${acc.reviewedBy ? `آخر مراجع: ${acc.reviewedBy}` : ''}</span>
          </div>
          <div class="meta">الصور: ${imagesPreview}</div>
          <div class="meta" style="align-items:center;gap:8px;display:flex;flex-wrap:wrap;">فيديو: ${videoPreview}</div>
          <div class="actions">
            <button class="btn ghost small" data-manage-action="delete" data-id="${acc.id}">حذف</button>
            <button class="btn primary small" data-manage-action="save" data-id="${acc.id}">حفظ التعديلات</button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderAdminPurchases() {
    if (!els.adminPurchasesList) return;
    if (!state.isAdmin) {
      els.adminPurchasesList.innerHTML = '<p class="muted">صلاحية الأدمن مطلوبة.</p>';
      return;
    }
    const list = (state.purchases || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!list.length) {
      els.adminPurchasesList.innerHTML = '<p class="muted">لا توجد طلبات شراء.</p>';
      return;
    }
    const privatesById = new Map();
    (state.accountPrivate || []).forEach(pvt => {
      if (pvt && (pvt.accountId || pvt.id)) {
        privatesById.set(pvt.accountId || pvt.id, pvt);
      }
    });
    const accountsById = new Map();
    (state.accounts || []).forEach(acc => { if (acc && acc.id) accountsById.set(acc.id, acc); });
    els.adminPurchasesList.innerHTML = list.map((p) => {
      const sellerContact = (privatesById.get(p.accountId)?.contactNumber || privatesById.get(p.accountId)?.contact || '').trim();
      const buyerContact = (p.buyerPhone || p.buyerContact || '').trim();
      const buyerLabel = (p.buyerWebuid || p.buyerId || '').toString().trim();
      const ownerLabel = (p.sellerWebuid || p.accountOwnerId || p.ownerId || '').toString().trim();
      const acc = accountsById.get(p.accountId) || {};
      const thumb = (acc.images && acc.images[0]) || acc.image || '';
      return `
      <article class="card purchase-card">
        <div class="card-body">
          <div class="purchase-header">
            <div class="purchase-left">
              <div class="purchase-thumb">
                ${thumb ? `<img src="${thumb}" alt="صورة الحساب">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#9aa6c8;font-size:12px;">لا صورة</div>`}
              </div>
              <div class="purchase-meta">
                <h3 style="margin:0;">${displayTitle(p.accountTitle || p.accountId || 'حساب')}</h3>
                <div class="muted tiny wrap">المشتري: ${buyerLabel || '-'}</div>
                <div class="muted tiny wrap">المالك: ${ownerLabel || '-'}</div>
                ${p.buyerLevel ? `<div class="muted tiny">المستوى: ${p.buyerLevel}${p.buyerMarkupPct ? ` • زيادة ${p.buyerMarkupPct}%` : ''}</div>` : ''}
                <div class="muted tiny">${p.createdAt ? new Date(p.createdAt).toLocaleString('ar-EG') : ''}</div>
              </div>
            </div>
            <div class="purchase-pricing">
              <span class="badge ${p.status || 'pending'}">${p.status || 'pending'}</span>
              <span class="price-tag">${formatPriceCurrency(p.chargedPrice || p.price || 0)}</span>
              ${p.price && p.chargedPrice && p.chargedPrice !== p.price ? `<span class="muted tiny">أساس: ${formatPriceCurrency(p.price || 0)}</span>` : ''}
              ${p.sellerNet ? `<span class="muted tiny">صافي البائع: ${formatPriceCurrency(p.sellerNet)}</span>` : ''}
            </div>
          </div>
          <div class="purchase-lines">
            <div>رقم البائع: ${sellerContact || 'غير متوفر'}</div>
            <div>رقم المشتري: ${buyerContact || 'غير متوفر'}</div>
          </div>
          <div class="purchase-actions">
            <button class="btn ghost small" data-contact="${sellerContact}" data-contact-label="البائع">تواصل مع البائع</button>
            <button class="btn ghost small" data-contact="${buyerContact}" data-contact-label="المشتري">تواصل مع المشتري</button>
            <button class="btn primary small" data-purchase-review="approved" data-id="${p.id || p.code || ''}">تحرير الرصيد للبائع</button>
            <button class="btn danger small" data-purchase-review="rejected" data-id="${p.id || p.code || ''}">رفض وإرجاع المبلغ</button>
            <button class="btn danger small" data-purchase-delete="1" data-id="${p.id || p.code || ''}">حذف الطلب</button>
          </div>
        </div>
      </article>
    `;
    }).join('');

    els.adminPurchasesList.querySelectorAll('button[data-contact]').forEach(btn => {
      btn.addEventListener('click', () => {
        const raw = btn.dataset.contact || '';
        const c = raw.replace(/[^0-9]/g,'');
        if (!c) { showToast(`لا يوجد رقم ${btn.dataset.contactLabel || ''}`, true); return; }
        window.open(`https://wa.me/${c}`, '_blank');
      });
    });
    els.adminPurchasesList.querySelectorAll('button[data-purchase-review]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const decision = btn.dataset.purchaseReview;
        const id = btn.dataset.id;
        if (!id) { showToast('معرف الطلب مفقود', true); return; }
        try {
          const res = await sendAdminRequest({ action: 'purchase:review', purchaseId: id, status: decision });
          if (res.ok) {
            openResponseModal('تم تحديث الطلب بنجاح', 'نجاح');
          } else {
            throw new Error(res.error || 'تعذر التحديث');
          }
          await loadAdminSnapshot();
          renderAdminPurchases();
        } catch (err) {
          openResponseModal(err?.message || 'خطأ أثناء التحديث', 'تنبيه');
        }
      });
    });

    els.adminPurchasesList.querySelectorAll('button[data-purchase-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!id) { showToast('معرف الطلب مفقود', true); return; }
        if (!confirm('سيتم حذف طلب الشراء نهائياً. متأكد؟')) return;
        try {
          await sendAdminRequest({ action: 'purchase:delete', purchaseId: id });
          openResponseModal('تم حذف الطلب', 'نجاح');
          await loadAdminSnapshot();
          renderAdminPurchases();
        } catch (err) {
          openResponseModal(err?.message || 'تعذر حذف الطلب', 'تنبيه');
        }
      });
    });
  }

  function setAdminPromoteStatus(text, isError = false) {
    if (!els.adminPromoteStatus) return;
    els.adminPromoteStatus.textContent = text || '-';
    els.adminPromoteStatus.style.color = isError ? '#ef4444' : '';
  }

  function setUserLookupStatus(text, isError = false) {
    if (!els.userLookupStatus) return;
    els.userLookupStatus.textContent = text || '-';
    els.userLookupStatus.style.color = isError ? '#ef4444' : '';
  }

  function renderAdminUserPanel() {
    if (!els.userLookupResult) return;
    if (!state.isAdmin) {
      destroyAdminUserPhonePicker();
      els.userLookupResult.innerHTML = '<p class="muted">صلاحية الأدمن مطلوبة.</p>';
      return;
    }

    const u = state.adminUser;
    if (!u) {
      destroyAdminUserPhonePicker();
      els.userLookupResult.innerHTML = '<p class="muted">ابحث عن مستخدم عبر WebUID / UserUID / Email لعرض بياناته.</p>';
      return;
    }

    const uid = (u.id || u.useruid || '').toString().trim();
    const webuid = (u.webuid || u.webUid || '').toString().trim();
    const username = (u.username || u.name || u.displayName || '').toString();
    const email = (u.email || '').toString();
    const phone = (u.phone || u.phoneNumber || u.contactNumber || u.contact || '').toString();
    const phoneCode = (u.phoneCode || u.contactCode || '').toString();
    const fullPhone = (() => {
      const p = (phone || '').toString().trim();
      if (!p) return '';
      if (p.startsWith('+')) return p;
      const c0 = (phoneCode || '').toString().trim();
      if (!c0) return p;
      const c = c0.startsWith('+') ? c0 : ('+' + c0);
      return `${c}${p.replace(/\s+/g, '')}`;
    })();
    const balanceVal = Number(u.balance);
    const balance = Number.isFinite(balanceVal) ? balanceVal : '';
    const totalSpentVal = Number(u.totalspent ?? u.totalSpent);
    const totalspent = Number.isFinite(totalSpentVal) ? totalSpentVal : '';
    const normalizedLevel = normalizeBuyerLevel(u.levelCode || u.level || '');
    const isBanned = u.isBanned === true;

    els.userLookupResult.innerHTML = `
      <article class="user-admin-card">
        <div class="card-body">
          <div class="actions" style="justify-content:space-between;align-items:center;">
            <div>
              <h3 style="margin:0;">معلومات المستخدم</h3>
              <div class="muted tiny wrap">UserUID: ${escapeHTML(uid || '-')}</div>
              <div class="muted tiny wrap">WebUID: ${escapeHTML(webuid || '-')}</div>
            </div>
            <span class="badge ${isBanned ? 'rejected' : 'approved'}">${isBanned ? 'محظور' : 'نشط'}</span>
          </div>

          <div class="grid two" style="margin-top:14px;">
            <div class="field">
              <label>WebUID
                <input id="adminUserWebuidInput" type="text" value="${escapeHTML(webuid)}" placeholder="—">
              </label>
            </div>
            <div class="field">
              <label>الاسم
                <input id="adminUserUsernameInput" type="text" value="${escapeHTML(username)}" placeholder="—">
              </label>
            </div>
            <div class="field">
              <label>Email
                <input id="adminUserEmailInput" type="text" value="${escapeHTML(email)}" placeholder="—">
              </label>
            </div>
            <div class="field">
              <label>Phone
                <div class="phone-field">
                  <input id="adminUserPhoneInput" type="tel" value="${escapeHTML(fullPhone)}" placeholder="—" dir="ltr">
                </div>
              </label>
            </div>
            <div class="field">
              <label>Balance
                <input id="adminUserBalanceInput" type="number" step="0.01" value="${escapeHTML(balance)}" placeholder="—">
              </label>
            </div>
            <div class="field">
              <label>Total Spent
                <input id="adminUserTotalSpentInput" type="number" step="0.01" value="${escapeHTML(totalspent)}" placeholder="—">
              </label>
            </div>
            <div class="field">
              <label>الرتبة
                <select id="adminUserLevelSelect">
                  <option value="customer" ${normalizedLevel === 'customer' ? 'selected' : ''}>زبون</option>
                  <option value="trader" ${normalizedLevel === 'trader' ? 'selected' : ''}>تاجر</option>
                  <option value="vip" ${normalizedLevel === 'vip' ? 'selected' : ''}>VIP</option>
                </select>
              </label>
            </div>
            <div class="field">
              <label>الحظر
                <select id="adminUserBanSelect">
                  <option value="0" ${!isBanned ? 'selected' : ''}>غير محظور</option>
                  <option value="1" ${isBanned ? 'selected' : ''}>محظور</option>
                </select>
              </label>
            </div>
          </div>

          <div class="actions">
            <button class="btn primary" type="button" data-user-admin-action="save">حفظ التعديلات</button>
            <button class="btn ${isBanned ? 'ghost' : 'danger'}" type="button" data-user-admin-action="toggle-ban">${isBanned ? 'إلغاء الحظر' : 'حظر'}</button>
            <button class="btn ghost" type="button" data-user-admin-action="refresh">تحديث</button>
          </div>
        </div>
      </article>
    `;
    initAdminUserPhonePicker(fullPhone);
  }

  async function handleAdminPromoteSubmit(e) {
    e.preventDefault();
    if (!state.isAdmin) { openResponseModal('Admin privilege required.'); return; }
    const query = (els.adminPromoteQuery?.value || '').toString().trim();
    const by = (els.adminPromoteType?.value || 'auto').toString().trim();
    if (!query) { setAdminPromoteStatus('Enter UID / WebUID / Email', true); return; }

    setAdminPromoteStatus('Promoting...');
    try {
      const payload = { action: 'admin:promote', query, by };
      if (by === 'uid') payload.uid = query;
      const res = await sendAdminRequest(payload);
      setAdminPromoteStatus('Promoted to admin', false);
      openResponseModal('Promoted ' + (res?.uid || query) + ' to admin', 'Done');
    } catch (err) {
      setAdminPromoteStatus(err?.message || 'Promotion failed', true);
    }
  }

  async function handleUserLookupSubmit(e) {
    e.preventDefault();
    if (!state.isAdmin) { openResponseModal('صلاحية الأدمن مطلوبة.'); return; }
    const query = (els.userLookupQuery?.value || '').toString().trim();
    const by = (els.userLookupType?.value || 'auto').toString().trim();
    if (!query) { setUserLookupStatus('أدخل قيمة البحث', true); openResponseModal('أدخل WebUID أو UserUID أو Email للبحث', 'تنبيه'); return; }
    setUserLookupStatus('...جاري البحث');
    try {
      const res = await sendAdminRequest({ action: 'admin:user:get', query, by });
      state.adminUser = res.user || null;
      state.adminUserMeta = res.meta || null;
      setUserLookupStatus('—');
      openResponseModal('تم جلب بيانات المستخدم', 'نجاح');
      renderAdminUserPanel();
    } catch (err) {
      state.adminUser = null;
      state.adminUserMeta = null;
      setUserLookupStatus(err?.message || 'تعذر جلب بيانات المستخدم', true);
      renderAdminUserPanel();
    }
  }

  async function handleAdminUserPanelClick(e) {
    const btn = e.target.closest('button[data-user-admin-action]');
    if (!btn) return;
    if (!state.isAdmin) { openResponseModal('صلاحية الأدمن مطلوبة.'); return; }
    const action = btn.dataset.userAdminAction;
    const userId = (state.adminUser?.id || '').toString().trim();
    if (!userId) return;

    const root = els.userLookupResult;
    const q = (sel) => root ? root.querySelector(sel) : null;

    try {
      if (action === 'refresh') {
        setUserLookupStatus('...جاري التحديث');
        const res = await sendAdminRequest({ action: 'admin:user:get', query: userId, by: 'uid' });
        state.adminUser = res.user || null;
        state.adminUserMeta = res.meta || null;
        setUserLookupStatus('—');
        openResponseModal('تم تحديث بيانات المستخدم', 'نجاح');
        renderAdminUserPanel();
        return;
      }

      if (action === 'toggle-ban') {
        const next = !(state.adminUser?.isBanned === true);
        setUserLookupStatus('...جاري التحديث');
        const res = await sendAdminRequest({ action: 'admin:user:update', userId, patch: { isBanned: next } });
        state.adminUser = res.user || state.adminUser;
        setUserLookupStatus('—');
        openResponseModal(next ? 'تم حظر المستخدم' : 'تم إلغاء حظر المستخدم', 'نجاح');
        renderAdminUserPanel();
        return;
      }

      if (action === 'save') {
        const current = state.adminUser || {};
        const webuid = (q('#adminUserWebuidInput')?.value || '').toString().trim();
        const username = (q('#adminUserUsernameInput')?.value || '').toString();
        const email = (q('#adminUserEmailInput')?.value || '').toString();
        let phone = (q('#adminUserPhoneInput')?.value || '').toString().trim();
        if (adminUserPhoneIti && typeof adminUserPhoneIti.getNumber === 'function') {
          const full = adminUserPhoneIti.getNumber();
          if (full && typeof full === 'string') phone = full.trim();
        }
        const levelCode = (q('#adminUserLevelSelect')?.value || '').toString().trim();
        const isBanned = (q('#adminUserBanSelect')?.value || '0') === '1';

        const balanceRaw = (q('#adminUserBalanceInput')?.value || '').toString().trim();
        const totalSpentRaw = (q('#adminUserTotalSpentInput')?.value || '').toString().trim();
        const balance = balanceRaw === '' ? null : Number(balanceRaw);
        const totalspent = totalSpentRaw === '' ? null : Number(totalSpentRaw);

        const patch = {};
        const curWebuid = (current.webuid || current.webUid || '').toString().trim();
        const curUsername = (current.username || current.name || current.displayName || '').toString();
        const curEmail = (current.email || '').toString();
        const curPhone = (current.phone || current.phoneNumber || current.contactNumber || current.contact || '').toString().trim();
        const curLevel = normalizeBuyerLevel(current.levelCode || current.level || '');
        const curBanned = current.isBanned === true;

        if (webuid !== curWebuid) patch.webuid = webuid;
        if (username !== curUsername) patch.username = username;
        if (email !== curEmail) patch.email = email;
        if (phone !== curPhone) patch.phone = phone;
        if (levelCode && levelCode !== curLevel) patch.levelCode = levelCode;
        if (isBanned !== curBanned) patch.isBanned = isBanned;

        if (balance != null && Number.isFinite(balance)) {
          const curBal = Number(current.balance);
          if (!Number.isFinite(curBal) || Math.round(curBal * 100) / 100 !== Math.round(balance * 100) / 100) patch.balance = Math.round(balance * 100) / 100;
        }
        if (totalspent != null && Number.isFinite(totalspent)) {
          const curSpent = Number(current.totalspent ?? current.totalSpent);
          if (!Number.isFinite(curSpent) || Math.round(curSpent * 100) / 100 !== Math.round(totalspent * 100) / 100) patch.totalspent = Math.round(totalspent * 100) / 100;
        }

        if (!Object.keys(patch).length) {
          setUserLookupStatus('—');
          openResponseModal('لا توجد تغييرات للحفظ', 'تنبيه');
          return;
        }

        setUserLookupStatus('...جاري الحفظ');
        const res = await sendAdminRequest({ action: 'admin:user:update', userId, patch });
        state.adminUser = res.user || state.adminUser;
        setUserLookupStatus('—');
        openResponseModal('تم حفظ التعديلات بنجاح', 'نجاح');
        renderAdminUserPanel();
        return;
      }
    } catch (err) {
      openResponseModal(err?.message || 'حدث خطأ');
      setUserLookupStatus(err?.message || 'حدث خطأ', true);
    }
  }

  function renderAdminTopups() {
    if (!els.adminTopupsList) return;
    const statusFilter = (els.adminTopupsStatusFilter?.value || 'pending').toString().trim().toLowerCase();
    const codeQuery = (els.adminTopupsCodeQuery?.value || '').toString().trim().toLowerCase();

    const countLike = (v) => {
      if (!v) return 0;
      if (Array.isArray(v)) return v.length;
      if (typeof v === 'object') return Object.keys(v).length;
      return 0;
    };
    const totalRaw = countLike(state.depositRequests) + countLike(state.topups);
    if (state.dataLoading && totalRaw === 0) {
      els.adminTopupsList.innerHTML = '<p class="muted">...جاري جلب الطلبات</p>';
      return;
    }
    if (state.dataError && totalRaw === 0) {
      els.adminTopupsList.innerHTML = `<p class="muted">${escapeHTML(`تعذر جلب الطلبات: ${state.dataError}`)}</p>`;
      return;
    }

    const toMs = (v) => {
      if (v == null) return 0;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (typeof v === 'string') {
        const parsed = Date.parse(v);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      if (v instanceof Date) return v.getTime();
      if (typeof v?.toMillis === 'function') {
        try { return v.toMillis(); } catch { return 0; }
      }
      if (typeof v?.seconds === 'number') return v.seconds * 1000;
      return 0;
    };

    const toArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'object') {
        return Object.keys(value).map((id) => ({ id, ...(value[id] || {}) }));
      }
      return [];
    };

    const merged = [
      ...toArray(state.depositRequests).map((d) => ({ ...d, __kind: 'depositRequest' })),
      ...toArray(state.topups).map((t) => ({ ...t, __kind: 'topup' })),
    ].sort((a, b) => (toMs(b.createdAt) - toMs(a.createdAt)));

    const filtered = merged.filter((item) => {
      const statusInfo = normalizeRequestStatus(item.status);
      if (statusFilter && statusFilter !== 'all' && statusInfo.key !== statusFilter) return false;
      if (codeQuery) {
        const code = (item.id || item.code || '').toString().toLowerCase();
        if (!code.includes(codeQuery)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      const emptyText = codeQuery
        ? 'لا توجد نتائج لهذا الكود.'
        : statusFilter === 'approved'
          ? 'لا توجد طلبات مقبولة.'
          : statusFilter === 'rejected'
            ? 'لا توجد طلبات مرفوضة.'
            : statusFilter === 'pending'
              ? 'لا توجد طلبات بانتظار المراجعة.'
              : 'لا توجد طلبات.';
      els.adminTopupsList.innerHTML = `<p class="muted">${emptyText}</p>`;
      return;
    }

    els.adminTopupsList.innerHTML = filtered.map((item) => {
      const isDepositRequest = item.__kind === 'depositRequest';
      const statusInfo = normalizeRequestStatus(item.status);
      const createdMs = toMs(item.createdAt);
      const created = createdMs ? new Date(createdMs).toLocaleString('ar-EG') : '';

      const code = (item.id || item.code || '').toString();
      const userId = (isDepositRequest ? item.userId : item.ownerId) || '';
      const methodName = (item.methodName || '').toString();

      const amountUSD = isDepositRequest
        ? Number(item.amountUSD ?? item.addedUSD ?? item.creditedUSD ?? item.addedAmount ?? item.added ?? item.amountJOD ?? item.amount ?? 0)
        : Number(item.amount ?? item.amountUSD ?? item.usd ?? 0);
      const amountCurrency = isDepositRequest ? Number(item.amountCurrency ?? item.client_payAmount ?? item.payAmount ?? NaN) : NaN;
      const currencyCode = isDepositRequest ? (item.currency || '').toString().trim().toUpperCase() : '';

      const currencyLabel = (Number.isFinite(amountCurrency) && currencyCode)
        ? `${(Math.round(amountCurrency * 100) / 100).toFixed(2)} ${currencyCode}`
        : '';

      const proofUrl = isDepositRequest ? (item.proofUrl || item.proof || '') : '';
      const proofLooksImage = (() => {
        const u = (proofUrl || '').toString().trim();
        if (!u) return false;
        if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|#|$)/i.test(u)) return true;
        if (/(?:i\.ibb\.co|imgbb\.com|i\.imgur\.com)/i.test(u)) return true;
        return false;
      })();
      const reference = !isDepositRequest ? (item.reference || '-') : '';
      const country = !isDepositRequest ? (item.country || '') : '';

      return `
        <article class="card request-card ${isDepositRequest ? 'request-card--deposit' : 'request-card--topup'}">
          <div class="card-body">
            <div class="actions" style="justify-content: space-between; align-items: flex-start;">
              <span class="badge ${statusInfo.key}">${statusInfo.label}</span>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
                <span class="price-tag">${formatPriceCurrency(amountUSD || 0)}</span>
                ${currencyLabel ? `<span class="muted tiny">${currencyLabel}</span>` : ''}
              </div>
            </div>
            <h3>${methodName || (isDepositRequest ? 'طلب إيداع' : '')}</h3>
            <div class="muted tiny">الكود: ${code || '-'}</div>
            <div class="muted tiny">المستخدم: ${userId || '-'}</div>
            ${country ? `<div class="muted tiny">${country}</div>` : ''}
            ${!isDepositRequest ? `<p class="muted tiny">مرجع: ${reference}</p>` : ''}
            ${isDepositRequest ? `
              ${proofUrl
                ? (proofLooksImage
                  ? `<div class="proof-preview"><img src="${escapeHTML(proofUrl)}" alt="إثبات" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div>`
                  : `<div class="actions"><a class="btn ghost small" href="${escapeHTML(proofUrl)}" target="_blank" rel="noopener">فتح الإثبات</a></div>`
                )
                : `<span class="muted tiny">لا يوجد إثبات</span>`
              }
              <div class="actions" style="gap:8px;flex-wrap:wrap;">
                ${state.isAdmin && statusInfo.key === 'pending' && code && userId ? `
                  <button class="btn primary small" data-action="deposit-approve" data-id="${escapeHTML(code)}" data-user-id="${escapeHTML(userId)}">قبول</button>
                  <button class="btn ghost small" data-action="deposit-reject" data-id="${escapeHTML(code)}" data-user-id="${escapeHTML(userId)}">رفض</button>
                ` : ''}
              </div>
            ` : `
              <div class="actions" style="gap:8px;flex-wrap:wrap;">
                ${state.isAdmin && statusInfo.key === 'pending' ? `
                  <button class="btn primary small" data-action="topup-approve" data-id="${item.id}">تأكيد الشحن</button>
                  <button class="btn ghost small" data-action="topup-reject" data-id="${item.id}">رفض</button>
                ` : ''}
              </div>
            `}
            <div class="muted tiny">${created}</div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderAdminWithdraws() {
    if (!els.adminWithdrawList) return;
    const statusFilter = (els.adminWithdrawStatusFilter?.value || 'pending').toString().trim().toLowerCase();
    const codeQuery = (els.adminWithdrawCodeQuery?.value || '').toString().trim().toLowerCase();
    const list = (state.withdrawRequests || []).slice().sort((a, b) => (Number(b.createdAt || 0) - Number(a.createdAt || 0)));

    const filtered = list.filter((w) => {
      const statusInfo = normalizeRequestStatus(w.status);
      if (statusFilter && statusFilter !== 'all' && statusInfo.key !== statusFilter) return false;
      if (codeQuery) {
        const code = (w.id || w.code || '').toString().toLowerCase();
        if (!code.includes(codeQuery)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      const emptyText = codeQuery
        ? 'لا توجد نتائج لهذا الكود.'
        : statusFilter === 'approved'
          ? 'لا توجد طلبات سحب مقبولة.'
          : statusFilter === 'rejected'
            ? 'لا توجد طلبات سحب مرفوضة.'
            : statusFilter === 'pending'
              ? 'لا توجد طلبات سحب بانتظار المراجعة.'
              : 'لا توجد طلبات سحب.';
      els.adminWithdrawList.innerHTML = `<p class="muted">${emptyText}</p>`;
      return;
    }

    els.adminWithdrawList.innerHTML = filtered.map((w) => {
      const statusInfo = normalizeRequestStatus(w.status);
      const isPending = statusInfo.key === 'pending';
      const usd = formatPriceCurrency(w.amountUSD ?? w.debitedUSD ?? 0);
      const amountCurrency = Number(w.amountCurrency);
      const currencyLabel = Number.isFinite(amountCurrency)
        ? `${(Math.round(amountCurrency * 100) / 100).toFixed(2)} ${w.currency || ''}`
        : '';
      const created = w.createdAt ? new Date(w.createdAt).toLocaleString('ar-EG') : '';
      const code = w.id || w.code || '';
      const typeLabel = (w.methodType || w.type) === 'bank' ? 'بنك' : (w.methodType || w.type) === 'wallet' ? 'محفظة' : 'أخرى';
      const infoLine = [w.bank, w.accountName, w.accountNumber, w.wallet].filter(Boolean).join(' • ');
      return `
        <article class="card">
          <div class="card-body">
            <div class="actions" style="justify-content: space-between;">
              <span class="badge ${statusInfo.key}">${statusInfo.label || statusInfo.key}</span>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
                <span class="price-tag">${usd}</span>
                ${currencyLabel ? `<span class="muted tiny">${currencyLabel}</span>` : ''}
              </div>
            </div>
            <h3>${w.methodName || 'طريقة سحب'}</h3>
            <div class="muted tiny">الكود: ${code || '-'}</div>
            <div class="muted tiny">${typeLabel}</div>
            <div class="muted tiny">${w.countryName || w.countryId || ''}</div>
            <div class="muted tiny">المستخدم: ${w.userId || '-'}</div>
            ${infoLine ? `<div class="muted tiny">${infoLine}</div>` : ''}
            ${w.payoutTarget ? `<p class="muted tiny">رقم التحويل: ${w.payoutTarget}</p>` : ''}
            ${w.payoutName ? `<p class="muted tiny">الاسم: ${w.payoutName}</p>` : ''}
            <div class="muted tiny">${created}</div>
            ${isPending ? `
              <div class="actions">
                <button class="btn primary small" data-action="withdraw-approve" data-id="${code}">تنفيذ</button>
                <button class="btn ghost small" data-action="withdraw-reject" data-id="${code}">رفض + رد الرصيد</button>
              </div>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');
  }

  function renderMethodAdminList() {
    if (!els.methodAdminList) return;
    if (!state.paymentMethods.length) {
      els.methodAdminList.innerHTML = '<p class="muted">لا توجد طرق دفع.</p>';
      return;
    }
    els.methodAdminList.innerHTML = state.paymentMethods.map((m) => `
      <article class="card method-card">
        <div class="muted tiny">${m.country || ''}</div>
        <h3>${m.name || m.type || 'طريقة تحويل'}</h3>
        <p class="muted tiny">${m.accountName || ''}</p>
        <p class="muted tiny">${m.accountNumber || ''}</p>
        <p class="muted tiny">${m.note || ''}</p>
        <div class="actions">
          <button class="btn danger small" data-method-id="${m.id}">حذف</button>
        </div>
      </article>
    `).join('');
  }

  function renderDepositMethods() {
    if (!els.depositMethodsList) return;
    const methods = (state.depositMethods && state.depositMethods.length)
      ? state.depositMethods
      : (state.paymentMethods || []);
    if (!methods.length) {
      els.depositMethodsList.innerHTML = '<p class="muted">لا توجد طرق إيداع بعد.</p>';
      return;
    }
    const sorted = [...methods].sort((a, b) => (Number(b.order) || 0) - (Number(a.order) || 0));
    els.depositMethodsList.innerHTML = sorted.map((m) => {
      const currency = (m.currencyCode || m.currency || '').toUpperCase();
      const rateUsd = Number(m.ratePerUSD ?? m.ratePerUsd ?? m.rate);
      const rateJod = Number(m.ratePerJOD ?? m.ratePerJod);
      const rateLineParts = [];
      if (Number.isFinite(rateUsd) && rateUsd > 0) rateLineParts.push(`1 USD = ${rateUsd} ${currency || ''}`.trim());
      if (Number.isFinite(rateJod) && rateJod > 0 && currency !== 'JOD') rateLineParts.push(`1 JOD = ${rateJod} ${currency || ''}`.trim());
      const info = m.info || {};
      const infoLine = [info.bank || m.bank, info.accountName || m.accountName, info.accountNumber || m.accountNumber, info.iban || m.iban, info.wallet || m.wallet]
        .filter(Boolean)
        .join(' • ');
      const note = (m.note || info.note || '').trim();
      const typeLabel = (m.methodType || m.type) === 'bank' ? 'بنك' : (m.methodType || m.type) === 'wallet' ? 'محفظة' : 'أخرى';
      return `
        <article class="card">
          <div class="card-body">
            <div class="actions" style="justify-content: space-between; align-items:flex-start;">
              <div>
                <h3>${m.name || 'طريقة'}</h3>
                <div class="muted tiny">${typeLabel}</div>
                <div class="muted tiny">${currency || ''}</div>
                ${rateLineParts.length ? `<div class="muted tiny">${rateLineParts.join(' | ')}</div>` : ''} 
                ${infoLine ? `<div class="muted tiny">${infoLine}</div>` : ''} 
                ${note ? `<div class="muted tiny">${note}</div>` : ''} 
              </div>
              <button class="btn danger small" data-deposit-method="${m.id}">حذف</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderWalletTotals() {
    if (!els.walletTotalsPanel) return;
    const isAdmin = !!state.isAdmin;
    if (!isAdmin) {
      els.walletTotalsPanel.style.display = 'none';
      return;
    }
    // يظل التحكم النهائي في الظهور حسب التبويب النشط عبر renderAdminTabs
    if (!els.walletTotalsPanel.dataset.adminSection) {
      els.walletTotalsPanel.dataset.adminSection = 'wallet';
    }
    const total = Number(state.walletTotals?.totalUSD) || 0;
    const count = Number(state.walletTotals?.count) || 0;
    if (els.walletTotalValue) els.walletTotalValue.textContent = formatPriceCurrency(total);
    if (els.walletTotalCount) els.walletTotalCount.textContent = `${count} محفظة`;
  }

  function renderWithdrawMethods() {
    if (!els.withdrawMethodsList) return;
    const methods = state.withdrawMethods || [];
    if (!methods.length) {
      els.withdrawMethodsList.innerHTML = '<p class="muted">لا توجد طرق سحب بعد.</p>';
      return;
    }
    const sorted = [...methods].sort((a, b) => (Number(b.order) || 0) - (Number(a.order) || 0));
    els.withdrawMethodsList.innerHTML = sorted.map((m) => {
      const rateUsd = m.ratePerUSD || m.ratePerUsd || m.rate || null;
      const rateJod = m.ratePerJOD || m.ratePerJod || null;
      const rateLine = rateUsd ? `1 USD = ${rateUsd}` : '';
      const rateJodLine = rateJod ? `1 JOD = ${rateJod}` : '';
      const typeLabel = (m.methodType || m.type) === 'bank' ? 'بنك' : (m.methodType || m.type) === 'wallet' ? 'محفظة' : 'أخرى';
      const infoLine = [m.bank, m.accountName, m.accountNumber, m.wallet].filter(Boolean).join(' • ');
      const note = (m.note || '').trim();
      return `
        <article class="card">
          <div class="card-body">
            <div class="actions" style="justify-content: space-between;">
              <div>
                <strong>${m.name || 'طريقة'}</strong>
                <div class="muted tiny">${typeLabel}</div>
                <div class="muted tiny">${m.currencyCode || m.currency || ''}</div>
                ${rateLine ? `<div class="muted tiny">${rateLine}</div>` : ''} 
                ${rateJodLine ? `<div class="muted tiny">${rateJodLine}</div>` : ''} 
                ${infoLine ? `<div class="muted tiny">${infoLine}</div>` : ''} 
                ${note ? `<div class="muted tiny">${note}</div>` : ''} 
              </div>
              <button class="btn danger small" data-withdraw-method="${m.id}">حذف</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderCurrencyAdminList() {
    if (!els.currencyAdminList) return;
    if (!state.currencies.length) {
      els.currencyAdminList.innerHTML = '<p class="muted">لا توجد عملات بعد.</p>';
      return;
    }
    els.currencyAdminList.innerHTML = state.currencies.map((c) => `
      <article class="card method-card currency-card">
        <h3>${c.code}</h3>
        <p class="muted tiny">الرمز: ${c.symbol || ''}</p>
        <p class="muted tiny">السعر مقابل الدولار: ${c.rate || ''}</p>
        <div class="actions">
          <button class="btn danger small" data-currency-code="${c.code}">حذف</button>
        </div>
      </article>
    `).join('');
  }

  function renderFeesForm() {
    if (!els.feesForm) return;
    const fees = state.fees || getDefaultFees();
    if (els.feeCustomerInput) els.feeCustomerInput.value = fees?.buyerMarkup?.customer ?? 0;
    if (els.feeTraderInput) els.feeTraderInput.value = fees?.buyerMarkup?.trader ?? 0;
    if (els.feeVipInput) els.feeVipInput.value = fees?.buyerMarkup?.vip ?? 0;
    if (els.feeSellerInput) els.feeSellerInput.value = fees?.sellerFee ?? 0;
  }

  function updateMethodTypeUI(kind) {
    const isDeposit = kind === 'deposit';
    const typeEl = isDeposit ? els.depositMethodTypeInput : els.withdrawMethodTypeInput;
    if (!typeEl) return;
    const type = (typeEl.value || '').toLowerCase();
    const showBank = type === 'bank' || type === 'other';
    const showWallet = type === 'wallet' || type === 'other';
    const bankClass = isDeposit ? '.deposit-bank-fields' : '.withdraw-bank-fields';
    const walletClass = isDeposit ? '.deposit-wallet-fields' : '.withdraw-wallet-fields';
    document.querySelectorAll(bankClass).forEach((el) => { el.style.display = showBank ? '' : 'none'; });
    document.querySelectorAll(walletClass).forEach((el) => { el.style.display = showWallet ? '' : 'none'; });
    if (isDeposit) {
      if (els.depositBankInput) els.depositBankInput.required = type === 'bank';
      if (els.depositAccountNumberInput) els.depositAccountNumberInput.required = type === 'bank';
      if (els.depositWalletInput) els.depositWalletInput.required = type === 'wallet';
    } else {
      if (els.withdrawBankInput) els.withdrawBankInput.required = type === 'bank';
      if (els.withdrawAccountNumberInput) els.withdrawAccountNumberInput.required = type === 'bank';
      if (els.withdrawWalletInput) els.withdrawWalletInput.required = type === 'wallet';
    }
  }

  function renderCategoryAdminList() {
    if (!els.categoryAdminList) return;
    const list = getCategoryList();
    if (!list.length) {
      els.categoryAdminList.innerHTML = '<p class="muted">لا توجد أقسام بعد.</p>';
      return;
    }
    els.categoryAdminList.innerHTML = list.map((c) => {
      const key = c.id || c.key || c.slug;
      const label = displayTitle(c.label || c.name || key);
      const count = state.accounts.filter((a) => (a.category || '') === key).length;
      return `
        <div class="category-card" data-category-id="${key}">
          <div>
            <div class="label">${label}</div>
            <div class="muted tiny" title="${key}">${label}</div>
            <div class="muted tiny">${count} إعلان</div>
          </div>
          <button class="btn danger small" data-category-id="${key}">حذف</button>
        </div>
      `;
    }).join('');
  }

  function hideLoader() {
    if (els.loader) els.loader.classList.add('hidden');
  }

  function handleAddCurrency(e) {
    e.preventDefault();
    if (!state.isAdmin) { notify('صلاحية الادمن فقط'); return; }
    if (!ADMIN_ROUTER_BASE) { notify('اضبط ADMIN_ROUTER_BASE للعمليات الإدارية'); return; }
    const code = (els.currencyCodeInput?.value || '').trim().toUpperCase();
    const symbol = (els.currencySymbolInput?.value || '').trim();
    const rate = Number(els.currencyRateInput?.value || 0);
    if (!code || !symbol || !Number.isFinite(rate) || rate <= 0) {
      notify('أكمل بيانات العملة وقيمة صحيحة للسعر');
      return;
    }
    sendAdminRequest({ action: 'currency:add', code, symbol, rate }).then((res) => {
      notify('تم حفظ العملة');
      if (els.addCurrencyForm) els.addCurrencyForm.reset();
      const map = res?.rates || {};
      state.currencies = Object.keys(map).map((c) => ({ code: c, symbol: map[c]?.symbol || '', rate: map[c]?.rate }));
      const mergedMap = currenciesToMap(state.currencies);
      try { localStorage.removeItem('currency:rates:cache'); } catch {}
      try { if (typeof applyRatesMap === 'function') applyRatesMap(mergedMap, { base: 'USD' }); } catch {}
      renderCurrencyAdminList();
    }).catch((err) => notify(err?.message || 'تعذر حفظ العملة'));
  }

  function handleCurrencyAdminClick(e){
    const btn = e.target.closest('button[data-currency-code]');
    if (!btn) return;
    const code = btn.dataset.currencyCode;
    if (!code) return;
    if (!confirm(`سيتم حذف العملة ${code} ولن تظهر في الخيارات.\nمتأكد من المتابعة؟`)) return;
    sendAdminRequest({ action: 'currency:delete', code }).then((res) => {
      const map = res?.rates || {};
      state.currencies = Object.keys(map).map((c) => ({ code: c, symbol: map[c]?.symbol || '', rate: map[c]?.rate }));
      const mergedMap = currenciesToMap(state.currencies);
      try { localStorage.removeItem('currency:rates:cache'); } catch {}
      try { if (typeof applyRatesMap === 'function') applyRatesMap(mergedMap, { base: 'USD' }); } catch {}
      renderCurrencyAdminList();
      notify('تم حذف العملة');
    }).catch((err)=>notify(err?.message || 'تعذر الحذف'));
  }

  function handleAddWithdrawMethod(e) {
    e.preventDefault();
    if (!state.isAdmin) { notify('صلاحية الادمن مطلوبة'); return; }
    if (!ADMIN_ROUTER_BASE) { notify('اضبط ADMIN_ROUTER_BASE للعمليات الإدارية'); return; }
    const methodName = (els.withdrawMethodNameInput?.value || '').trim();
    const methodType = (els.withdrawMethodTypeInput?.value || '').trim() || 'wallet';
    const currencyCode = (els.withdrawCurrencyInput?.value || '').trim().toUpperCase();
    const ratePerUSD = Number(els.withdrawRateUsdInput?.value || 0);
    const note = (els.withdrawMethodNoteInput?.value || '').trim();
    const isBank = methodType === 'bank';
    const isWallet = methodType === 'wallet';
    if (!methodName || !currencyCode) {
      notify('أكمل بيانات الطريقة والعملة');
      return;
    }
    const hasUsd = Number.isFinite(ratePerUSD) && ratePerUSD > 0;
    if (!hasUsd) {
      notify('أدخل سعر صرف صحيح بالدولار');
      return;
    }
    if (isBank && (!els.withdrawBankInput?.value || !els.withdrawAccountNumberInput?.value)) {
      notify('أدخل بيانات البنك ورقم الحساب');
      return;
    }
    if (isWallet && !els.withdrawWalletInput?.value) {
      notify('أدخل معرف المحفظة');
      return;
    }
    const label = '';
    sendAdminRequest({
      action: 'withdraw:method:add',
      name: methodName,
      methodType,
      currencyCode,
      ratePerUSD,
      bank: (els.withdrawBankInput?.value || '').trim(),
      accountName: (els.withdrawAccountNameInput?.value || '').trim(),
      accountNumber: (els.withdrawAccountNumberInput?.value || '').trim(),
      wallet: (els.withdrawWalletInput?.value || '').trim(),
      note,
      country: label,
      region: label
    }).then(() => {
      notify('تم حفظ طريقة السحب');
      if (els.withdrawMethodForm) els.withdrawMethodForm.reset();
      loadFirebaseData();
    }).catch((err) => notify(err?.message || 'تعذر حفظ طريقة السحب'));
  }

  function handleWithdrawMethodClick(e) {
    const methodBtn = e.target.closest('button[data-withdraw-method]');
    if (methodBtn) {
      const methodId = methodBtn.dataset.withdrawMethod;
      if (!methodId) return;
      if (!confirm('سيتم حذف طريقة السحب. متابعة؟')) return;
      sendAdminRequest({ action: 'withdraw:method:delete', methodId })
        .then(() => { notify('تم حذف الطريقة'); loadFirebaseData(); })
        .catch((err) => notify(err?.message || 'تعذر الحذف'));
    }
  }

  function handleWithdrawAction(e) {
    const btn = e.target.closest('button[data-action^="withdraw-"]');
    if (!btn) return;
    const id = btn.dataset.id;
    if (!id) return;
    const status = btn.dataset.action === 'withdraw-approve' ? 'approved' : 'rejected';
    sendAdminRequest({ action: 'withdraw:status', id, status })
      .then((res) => {
        const item = (state.withdrawRequests || []).find((w) => w.id === id || w.code === id);
        if (item) item.status = status;
        renderAdminWithdraws();
        notify(status === 'approved' ? 'تم اعتماد السحب' : 'تم رفض الطلب وإرجاع الرصيد');
        return res;
      })
      .catch((err) => notify(err?.message || 'تعذر تحديث حالة السحب'));
  }

  function handleSaveFees(e) {
    e.preventDefault();
    if (!state.isAdmin) { notify('صلاحية الادمن مطلوبة'); return; }
    if (!ADMIN_ROUTER_BASE) { notify('اضبط ADMIN_ROUTER_BASE للعمليات الإدارية'); return; }
    const clamp = (v) => {
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0) return 0;
      if (n > 100) return 100;
      return Math.round(n * 100) / 100;
    };
    const buyerMarkup = {
      customer: clamp(els.feeCustomerInput?.value || 0),
      trader: clamp(els.feeTraderInput?.value || 0),
      vip: clamp(els.feeVipInput?.value || 0),
    };
    const sellerFee = clamp(els.feeSellerInput?.value || 0);
    sendAdminRequest({
      action: 'fees:set',
      buyerMarkup,
      sellerFee,
    }).then((res) => {
      state.fees = res?.fees || { buyerMarkup, sellerFee };
      renderFeesForm();
      renderListings();
      renderAdminQueue();
      notify('تم حفظ نسب التسعير');
    }).catch((err) => notify(err?.message || 'تعذر حفظ الرسوم'));
  }

  function handleLevelSubmit(e) {
    e.preventDefault();
    if (!state.isAdmin) { notify('صلاحية الأدمن مطلوبة'); return; }
    if (!ADMIN_ROUTER_BASE) { notify('اضبط ADMIN_ROUTER_BASE للعمليات الإدارية'); return; }
    const webuid = (els.levelWebuidInput?.value || '').trim();
    const level = (els.levelSelect?.value || '').trim();
    if (!webuid || !level) { notify('أدخل الـ WebUID والرتبة'); return; }
    sendAdminRequest({ action: 'admin:setLevel', webuid, level })
      .then(() => {
        notify('تم تحديث الرتبة');
        if (els.levelForm) els.levelForm.reset();
      })
      .catch((err) => notify(err?.message || 'تعذر تحديث الرتبة'));
  }

  function handleAddCategory(e) {
    e.preventDefault();
    if (!state.isAdmin) { notify('صلاحية الادمن فقط'); return; }
    if (!ADMIN_ROUTER_BASE) { notify('اضبط ADMIN_ROUTER_BASE للعمليات الإدارية'); return; }
    const name = (els.categoryNameInput?.value || '').trim();
    let key = slugify(name);
    if (!name) { notify('أدخل اسمًا واضحاً للقسم'); return; }
    if (!key) { key = `cat-${Date.now().toString(16)}`; }
    const exists = getCategoryList().some((c) => (c.id || c.key || c.slug) === key);
    if (exists) { notify('المفتاح مستخدم من قبل'); return; }
    sendAdminRequest({ action: 'category:add', name, key }).then(() => {
      notify('تمت إضافة القسم');
      if (els.addCategoryForm) els.addCategoryForm.reset();
      loadFirebaseData();
    }).catch((err) => notify(err?.message || 'تعذر إضافة القسم'));
  }

  function handleCategoryAdminClick(e) {
    const btn = e.target.closest('button[data-category-id]');
    if (!btn) return;
    if (!state.isAdmin) { notify('صلاحية الادمن مطلوبة'); return; }
    const id = btn.dataset.categoryId;
    if (!id) return;
    if (!confirm('سيتم حذف القسم ولن يظهر في القوائم. متأكد؟')) return;
    sendAdminRequest({ action: 'category:delete', id })
      .then(() => { notify('تم حذف القسم'); loadFirebaseData(); })
      .catch((err) => notify(err?.message || 'تعذر الحذف'));
  }

  function setSelectedGame(id) {
    state.selectedGame = id;
    state.view = 'listings';
    renderAll();
  }

  function backToGames() {
    state.view = 'games';
    state.selectedGame = null;
    if (els.currentGameTitle) els.currentGameTitle.textContent = '(اختر لعبة من الأعلى)';
    if (els.listingGrid) els.listingGrid.innerHTML = '<p class="muted">اختر لعبة لعرض الإعلانات.</p>';
    renderAll();
  }

  function setAdminTab(tab) {
    state.adminTab = tab;
    save('admin_tab', tab);
    renderAdminTabs();
    if (tab === 'topups' || tab === 'withdraw' || tab === 'purchases') {
      loadFirebaseData();
    }
  }

  function renderAdminTabs() {
    if (!state.isAdmin) return;
    const availableKeys = Array.from(document.querySelectorAll('.admin-tab-btn')).map((btn) => btn.dataset.adminTab);
    const active = (state.adminTab && availableKeys.includes(state.adminTab)) ? state.adminTab : 'review';
    state.adminTab = active;
    document.querySelectorAll('.admin-tab-btn').forEach((btn) => {
      const key = btn.dataset.adminTab;
      btn.classList.toggle('active', key === active);
    });
    document.querySelectorAll('.admin-section').forEach((section) => {
      const key = section.dataset.adminSection;
      section.style.display = key === active ? 'block' : 'none';
    });
  }

  function attachEvents() {
    if (els.loginForm) els.loginForm.addEventListener('submit', handleLoginSubmit);
    if (els.registerForm) els.registerForm.addEventListener('submit', handleRegisterSubmit);
    if (els.adminAuthForm) els.adminAuthForm.addEventListener('submit', handleAdminAuthLogin);
    if (els.addAccountForm) els.addAccountForm.addEventListener('submit', handleAddAccount);
    if (els.adminList) els.adminList.addEventListener('click', handleAdminAction);
    if (els.adminList) els.adminList.addEventListener('click', handleOpenAccountImages);
    if (els.adminTopupsList) els.adminTopupsList.addEventListener('click', handleAdminAction);
    if (els.adminManageList) els.adminManageList.addEventListener('click', handleAdminManageClick);
    if (els.adminManageList) els.adminManageList.addEventListener('click', handleOpenAccountImages);
    if (els.adminManageStatus) els.adminManageStatus.addEventListener('change', renderAdminManageList);
    if (els.adminManageQuery) els.adminManageQuery.addEventListener('input', renderAdminManageList);
    if (els.addCategoryForm) els.addCategoryForm.addEventListener('submit', handleAddCategory);
    if (els.categoryAdminList) els.categoryAdminList.addEventListener('click', handleCategoryAdminClick);
    if (els.methodAdminList) els.methodAdminList.addEventListener('click', handleMethodAdminClick);
    if (els.addMethodForm) els.addMethodForm.addEventListener('submit', handleAddMethod);
    if (els.withdrawMethodsList) els.withdrawMethodsList.addEventListener('click', handleWithdrawMethodClick);
    if (els.withdrawMethodForm) els.withdrawMethodForm.addEventListener('submit', handleAddWithdrawMethod);
    if (els.depositMethodsList) els.depositMethodsList.addEventListener('click', handleDepositMethodClick);
    if (els.depositMethodForm) els.depositMethodForm.addEventListener('submit', handleAddDepositMethod);
    if (els.addCurrencyForm) els.addCurrencyForm.addEventListener('submit', handleAddCurrency);
    if (els.currencyAdminList) els.currencyAdminList.addEventListener('click', handleCurrencyAdminClick);
    if (els.feesForm) els.feesForm.addEventListener('submit', handleSaveFees);
    if (els.levelForm) els.levelForm.addEventListener('submit', handleLevelSubmit);
    if (els.adminPromoteForm) els.adminPromoteForm.addEventListener('submit', handleAdminPromoteSubmit);
    if (els.userLookupForm) els.userLookupForm.addEventListener('submit', handleUserLookupSubmit);
    if (els.userLookupResult) els.userLookupResult.addEventListener('click', handleAdminUserPanelClick);
    if (els.adminWithdrawList) els.adminWithdrawList.addEventListener('click', handleWithdrawAction);
    if (els.adminTopupsStatusFilter) els.adminTopupsStatusFilter.addEventListener('change', renderAdminTopups);
    if (els.adminTopupsCodeQuery) els.adminTopupsCodeQuery.addEventListener('input', renderAdminTopups);
    if (els.adminTopupsRefreshBtn) els.adminTopupsRefreshBtn.addEventListener('click', () => { loadFirebaseData(); });
    if (els.adminWithdrawStatusFilter) els.adminWithdrawStatusFilter.addEventListener('change', renderAdminWithdraws);
    if (els.adminWithdrawCodeQuery) els.adminWithdrawCodeQuery.addEventListener('input', renderAdminWithdraws);
    if (els.adminTabNav) {
      els.adminTabNav.addEventListener('click', (e) => {
        const btn = e.target.closest('.admin-tab-btn');
        if (!btn) return;
        const key = btn.dataset.adminTab;
        if (!key) return;
        setAdminTab(key);
      });
    }
    if (els.accountCategoryFilter) {
      els.accountCategoryFilter.addEventListener('change', () => renderAdminQueue());
    }
    window.addEventListener('currency:change', () => renderAll());
    window.addEventListener('currency:rates:change', () => renderAll());
    renderAccountImagesPreview();
    bindUpload({
      fileInput: els.imageFileInput,
      button: els.imageUploadBtn,
      targetInput: els.imageInput,
      multi: true,
      onAfterUpload: (urls) => {
        urls.forEach((u) => { if (!newAccountImages.includes(u)) newAccountImages.push(u); });
        if (els.imageInput && newAccountImages[0]) els.imageInput.value = newAccountImages[0];
        renderAccountImagesPreview();
        notify(`تم رفع ${urls.length} صورة`);
      },
    });
    bindUpload({
      fileInput: els.depositLogoFileInput,
      button: els.depositLogoUploadBtn,
      targetInput: els.depositLogoInput,
      multi: false,
      onAfterUpload: (urls) => {
        if (els.depositLogoInput) els.depositLogoInput.value = urls[0] || '';
        notify('تم رفع الشعار');
      },
    });
    if (els.depositCountryImageFileInput) {
      const dz = els.depositCountryDropZone;
      const setState = (state) => {
        if (!dz) return;
        dz.classList.toggle('uploading', state === 'uploading');
      };
      const handleUpload = async (files) => {
        if (!files || !files.length) return;
        setState('uploading');
        try {
          const url = await uploadImage(files[0]);
          if (els.depositCountryImageInput) els.depositCountryImageInput.value = url;
          notify('تم رفع صورة الدولة');
        } catch (err) {
          notify('فشل رفع صورة الدولة');
        } finally {
          setState(null);
          try { els.depositCountryImageFileInput.value = ''; } catch (_) {}
        }
      };
      els.depositCountryImageFileInput.addEventListener('change', (e) => handleUpload(e.target.files));
      if (dz) dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('hover'); });
      if (dz) dz.addEventListener('dragleave', () => dz.classList.remove('hover'));
      if (dz) dz.addEventListener('drop', (e) => {
        e.preventDefault();
        dz.classList.remove('hover');
        const files = e.dataTransfer?.files;
        handleUpload(files);
      });
    }

    if (els.depositMethodTypeInput) {
      els.depositMethodTypeInput.addEventListener('change', () => updateMethodTypeUI('deposit'));
      updateMethodTypeUI('deposit');
    }
    if (els.withdrawMethodTypeInput) {
      els.withdrawMethodTypeInput.addEventListener('change', () => updateMethodTypeUI('withdraw'));
      updateMethodTypeUI('withdraw');
    }

    if (els.logoutBtn) {
      els.logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut().then(() => notify('تم تسجيل الخروج'));
      });
    }

    if (els.loginBtn) {
      els.loginBtn.addEventListener('click', (e) => {
        if (isAuthPage()) return;
        e.preventDefault();
        window.location.href = 'login.html';
      });
    }

    if (els.registerBtn) {
      els.registerBtn.addEventListener('click', (e) => {
        if (isAuthPage()) return;
        e.preventDefault();
        window.location.href = 'login.html';
      });
    }

    if (els.gameGrid) {
      els.gameGrid.addEventListener('click', (e) => {
        const card = e.target.closest('[data-game-id]');
        if (card) {
          setSelectedGame(card.dataset.gameId);
          scrollToId('#listingsPanel');
        }
      });
    }

    if (els.searchInput) {
      els.searchInput.addEventListener('input', () => renderGames());
    }

    if (els.sortSelect) {
      els.sortSelect.addEventListener('change', () => {
        state.sort = els.sortSelect.value;
        persist();
        renderListings();
        renderYourListings();
        renderAdminQueue();
      });
    }

    if (els.backToGames) {
      els.backToGames.addEventListener('click', (e) => {
        e.preventDefault();
        backToGames();
        scrollToId('#categoriesPanel');
      });
    }

    if (els.walletForm) {
      els.walletForm.addEventListener('submit', handleWalletTopup);
    }

    if (els.walletMethodSelect) {
      els.walletMethodSelect.addEventListener('change', renderMethodInfo);
    }

    if (isAdminPage()) {
      window.addEventListener('focus', () => { if (state.isAdmin) loadFirebaseData(); });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && state.isAdmin) loadFirebaseData();
      });
    }
  }

  function renderAll() {
    if (els.categoriesPanel) {
      els.categoriesPanel.classList.toggle('hidden', state.view !== 'games');
    }
    if (els.listingsPanel) {
      els.listingsPanel.classList.toggle('hidden', state.view === 'games');
    }
    renderCategorySelectors();
    renderSession();
    renderGameOptions();
    renderGames();
    renderListings();
    if (getCurrentUser()) {
      renderYourListings();
      renderAdminQueue();
      renderAdminManageList();
      renderAdminPurchases();
      renderAdminUserPanel();
    }
    if (els.sortSelect) els.sortSelect.value = state.sort;
    renderWallet();
    renderWalletHistory();
    renderMethodAdminList();
    renderDepositMethods();
    renderWithdrawMethods();
    renderCurrencyAdminList();
    renderAdminTopups();
    renderAdminWithdraws();
    renderFeesForm();
    renderWalletTotals();
    renderAdminTabs();
  }

  async function initFirebase() {
    if (db || !window.firebase) return;
    if (!firebase.apps.length) {
      if (!firebaseConfig.projectId) {
        notify('أضف إعدادات Firebase في app.js');
        return;
      }
      firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
  }

  function initAuth() {
    if (!window.firebase?.auth) return;
    firebase.auth().onAuthStateChanged(async (user) => {
      state.firebaseUser = user;
      state.isAdmin = false;
      state.adminUser = null;
      state.adminUserMeta = null;
      if (user) {
        try {
          const token = await user.getIdTokenResult();
          state.isAdmin = !!token.claims?.admin || evaluateAdmin(user);
        } catch (e) {
          state.isAdmin = evaluateAdmin(user);
        }
      }
      renderAll();
      loadWallet();
      await loadFirebaseData();
    });
  }

  async function loadFirebaseData() {
    if (state.dataLoading) return;
    state.dataLoading = true;
    state.dataError = '';
    state.dataSource = '';
    if (els.adminTopupsRefreshBtn) els.adminTopupsRefreshBtn.disabled = true;
    setAdminTopupsLoadStatus('...جاري جلب الطلبات');
    try { renderAdminTopups(); } catch {}

    const user = getCurrentUser();
    try {
      // لوحة الأدمن عبر الراوتر الخلفي
      if (state.isAdmin && ADMIN_ROUTER_BASE) {
        try {
          const snapshot = await sendAdminRequest({ action: 'admin:snapshot' });
          state.games = snapshot.games || [];
          state.accounts = snapshot.accounts || [];
          state.accountPrivate = snapshot.accountPrivate || [];
          state.topups = snapshot.topups || [];
          state.depositRequests = snapshot.depositRequests || [];
          state.categories = snapshot.categories || [];
          state.purchases = snapshot.purchases || [];
          state.currencies = snapshot.currencies || [];
          state.withdrawRequests = snapshot.withdrawRequests || [];
          state.withdrawMethods = flattenDepositMethods(snapshot.withdrawMethods || []);
          state.depositMethods = flattenDepositMethods(snapshot.depositMethods || snapshot.paymentMethods);
          state.walletTotals = snapshot.walletTotals || { totalUSD: 0, count: 0 };
          state.paymentMethods = state.depositMethods;
          const mergedMap = currenciesToMap(state.currencies);
          try { if (typeof applyRatesMap === 'function') applyRatesMap(mergedMap, { base: 'USD' }); } catch {}
          renderPaymentMethods();
          renderCurrencyAdminList();
          renderWithdrawMethods();
          renderDepositMethods();
          renderWalletHistory();
          renderAdminTopups();
          renderAdminWithdraws();
          renderAdminPurchases();
          renderCategoryAdminList();
          renderWalletTotals();
          await loadFeesConfig();
          await loadWallet();
          state.dataUpdatedAt = Date.now();
          state.dataSource = 'router-admin';
          setAdminTopupsLoadStatus(`آخر تحديث: ${new Date(state.dataUpdatedAt).toLocaleTimeString('ar-EG')}`);
          renderAll();
          renderAdminTabs();
          hideLoader();
          return;
        } catch (e) {
          const msg = e?.message || 'تعذر جلب بيانات الأدمن';
          state.dataError = msg;
          setAdminTopupsLoadStatus(msg, true);
          try { renderAdminTopups(); } catch {}
          notify('تعذر جلب بيانات الأدمن');
          hideLoader();
          return;
        }
      }

      // المستخدمون العاديون عبر الراوتر الخلفي (لتجاوز قيود القواعد)
      if (!state.isAdmin && ADMIN_ROUTER_BASE) {
        try {
          const snapshot = await sendAdminRequest({ action: 'public:snapshot' });
          state.games = snapshot.games || [];
          state.accounts = snapshot.accounts || [];
          state.topups = snapshot.topups || [];
          state.depositRequests = snapshot.depositRequests || [];
          state.categories = snapshot.categories || [];
          state.currencies = snapshot.currencies || [];
          state.withdrawMethods = flattenDepositMethods(snapshot.withdrawMethods || []);
          state.withdrawRequests = snapshot.withdrawRequests || [];
          state.depositMethods = flattenDepositMethods(snapshot.depositMethods || snapshot.paymentMethods);
          state.walletTotals = snapshot.walletTotals || { totalUSD: 0, count: 0 };
          state.paymentMethods = state.depositMethods;
          const mergedMap = currenciesToMap(state.currencies);
          try { if (typeof applyRatesMap === 'function') applyRatesMap(mergedMap, { base: 'USD' }); } catch {}
          renderPaymentMethods();
          renderCurrencyAdminList();
          renderWalletHistory();
          renderWithdrawMethods();
          renderDepositMethods();
          renderWalletTotals();
          renderAdminTopups();
          renderAdminWithdraws();
          renderAdminPurchases();
          renderCategoryAdminList();
          await loadFeesConfig();
          await loadWallet();
          state.dataUpdatedAt = Date.now();
          state.dataSource = 'router-public';
          setAdminTopupsLoadStatus(`آخر تحديث: ${new Date(state.dataUpdatedAt).toLocaleTimeString('ar-EG')}`);
          renderAll();
          renderAdminTabs();
          hideLoader();
          return;
        } catch (err) {
          console.warn('public snapshot failed, fallback to Firebase', err);
        }
      }

      if (!db) {
        const msg = state.dataError || 'تعذر جلب البيانات: Firebase غير جاهز';
        state.dataError = msg;
        setAdminTopupsLoadStatus(msg, true);
        try { renderAdminTopups(); } catch {}
        return;
      }

      const topupsPromise = user
        ? state.isAdmin
          ? db.collection('topups').get()
          : db.collection('topups').where('ownerId', '==', user.uid).get()
        : Promise.resolve({ docs: [] });
      // ✅ NEW: depositRequests (legacy) + userDepositRequests/{uid}.byCode (map)
      const depositRequestsLegacyPromise = user
        ? state.isAdmin
          ? db.collection('depositRequests').get()
          : db.collection('depositRequests').where('userId', '==', user.uid).get()
        : Promise.resolve({ docs: [] });
      const userDepositRequestsPromise = user
        ? state.isAdmin
          ? db.collection('userDepositRequests').get()
          : db.collection('userDepositRequests').doc(user.uid).get()
        : Promise.resolve(null);
      const privatePromise = state.isAdmin
        ? db.collection('accountPrivate').get()
        : Promise.resolve({ docs: [] });
      const purchasesPromise = state.isAdmin
        ? db.collection('accountPurchases').get()
        : (user
          ? db.collection('accountPurchases').where('buyerId', '==', user.uid).get()
          : Promise.resolve({ docs: [] }));
      const profilePromise = user
        ? db.collection('users').doc(user.uid).get()
        : Promise.resolve(null);

      const paymentMethodsDocPromise = db.collection('config').doc('paymentMethods').get().catch(() => null);

      let [gamesSnap, accountsSnap, topupsSnap, depositRequestsSnap, userDepositRequestsSnap, currencyDoc, categoriesSnap, privatesSnap, purchasesSnap, profileSnap, paymentMethodsDoc] = await Promise.all([
        db.collection('games').get(),
        db.collection('accounts').get(),
        topupsPromise,
        depositRequestsLegacyPromise.catch(() => ({ docs: [] })),
        userDepositRequestsPromise.catch(() => null),
        db.collection('config').doc('currency').get(),
        db.collection('categories').get(),
        privatePromise,
        purchasesPromise,
        profilePromise,
        paymentMethodsDocPromise,
      ]);
      state.games = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.accounts = accountsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.accountPrivate = privatesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.purchases = purchasesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.topups = topupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const legacyDepositRequests = depositRequestsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const flattenUserDepositDoc = (docId, data) => {
        const byCode = (data && (data.byCode || data.requests || data.depositRequests)) || {};
        if (!byCode || typeof byCode !== 'object') return [];
        return Object.keys(byCode).map((code) => {
          const entry = byCode[code] || {};
          const out = { id: code, ...entry };
          if (!out.code) out.code = code;
          if (!out.userId && docId) out.userId = docId;
          return out;
        });
      };
      let mapDepositRequests = [];
      try {
        if (state.isAdmin) {
          const docs = userDepositRequestsSnap?.docs || [];
          mapDepositRequests = docs.flatMap((d) => flattenUserDepositDoc(d.id, d.data()));
        } else if (userDepositRequestsSnap && userDepositRequestsSnap.exists) {
          mapDepositRequests = flattenUserDepositDoc(user.uid, userDepositRequestsSnap.data());
        }
      } catch (_) { mapDepositRequests = []; }
      const mergeByCode = (a, b) => {
        const map = {};
        [].concat(a || [], b || []).forEach((item) => {
          if (!item) return;
          const code = (item.code || item.id || '').toString();
          if (!code) return;
          map[code] = { ...(map[code] || {}), ...item, code };
        });
        return Object.keys(map).map((k) => map[k]);
      };
      state.depositRequests = mergeByCode(legacyDepositRequests, mapDepositRequests);
      state.categories = categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.userProfile = profileSnap && profileSnap.exists ? { id: profileSnap.id, ...profileSnap.data() } : null;
      const paymentData = paymentMethodsDoc && paymentMethodsDoc.exists ? (paymentMethodsDoc.data() || {}) : {};
      state.depositMethods = flattenDepositMethods(paymentData.deposit || []);
      state.withdrawMethods = flattenDepositMethods(paymentData.withdraw || []);
      state.paymentMethods = state.depositMethods;
      state.walletTotals = state.walletTotals || { totalUSD: 0, count: 0 };
      if (currencyDoc && currencyDoc.exists) {
        const data = currencyDoc.data() || {};
        const map = data.rates || data.ratesJson || {};
        state.currencies = Object.keys(map).map((code) => {
          const v = map[code] || {};
          return { code, symbol: v.symbol || '', rate: v.rate };
        });
        const base = 'USD'; // الأسعار المحفوظة في القاعدة تعتبر بالدولار فقط
        try { window.__CURRENCY_BASE__ = base; } catch {}
        try { if (typeof applyRatesMap === 'function') applyRatesMap(map, { base }); } catch {}
      }
      await loadWallet();
      renderPaymentMethods();
      renderCurrencyAdminList();
      renderWalletHistory();
      renderAdminTopups();
      renderAdminPurchases();
      renderCategoryAdminList();
      await loadFeesConfig();
      state.dataUpdatedAt = Date.now();
      state.dataSource = 'firebase';
      setAdminTopupsLoadStatus(`آخر تحديث: ${new Date(state.dataUpdatedAt).toLocaleTimeString('ar-EG')}`);
      renderAll();
      hideLoader();
    } catch (e) {
      const msg = e?.message || 'تعذر جلب البيانات من Firebase';
      state.dataError = msg;
      setAdminTopupsLoadStatus(msg, true);
      try { renderAdminTopups(); } catch {}
      notify('تعذر جلب البيانات من Firebase');
      hideLoader();
    } finally {
      state.dataLoading = false;
      if (els.adminTopupsRefreshBtn) els.adminTopupsRefreshBtn.disabled = false;
    }
  }

  async function init() {
    seedDefaults();
    attachEvents();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', injectReviewCTA, { once: true });
    } else {
      injectReviewCTA();
    }
    await initFirebase();
    initAuth();
    await loadFirebaseData();
    focusAuthFromHash();
    renderAll();
    setTimeout(hideLoader, 800);
  }

  init();
})();
