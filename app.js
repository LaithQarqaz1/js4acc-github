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
    currencies: [],
    topups: [],
    withdrawRequests: [],
    withdrawCountries: [],
    selectedGame: null,
    view: 'games',
    sort: 'latest',
    wallet: 0,
    categories: [],
    fees: null,
    userProfile: null,
    adminTab: load('admin_tab', 'review'),
  };
  state.fees = getDefaultFees();
  function formatPriceCurrency(val){
    const n = Number(val);
    if (!Number.isFinite(n)) return 'غير محدد';
    if (typeof window.formatCurrencyFromJOD === 'function'){
      try { return window.formatCurrencyFromJOD(n); } catch(_){}
    }
    return n.toFixed(2) + ' $';
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
    withdrawCurrencyInput: document.getElementById('withdrawCurrencyInput'),
    withdrawRateUsdInput: document.getElementById('withdrawRateUsdInput'),
    withdrawRateJodInput: document.getElementById('withdrawRateJodInput'),
    withdrawMethodNoteInput: document.getElementById('withdrawMethodNoteInput'),
    withdrawMethodsList: document.getElementById('withdrawMethodsList'),
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
    adminWithdrawList: document.getElementById('adminWithdrawList'),
    adminPurchasesList: document.getElementById('adminPurchasesList'),
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
  let db = null;

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
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${ADMIN_ROUTER_BASE}/accounts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      const msg = data.error || data.message || 'تعذر تنفيذ طلب الأدمن';
      throw new Error(msg);
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

  function scrollToId(id) {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function injectReviewCTA() {
    if (isAdminPage() || isAuthPage()) return;
    if (document.getElementById('reviewCtaBtn')) return;
    const btn = document.createElement('a');
    btn.id = 'reviewCtaBtn';
    btn.href = 'review-request.html';
    btn.textContent = 'طلب مراجعة أدمن';
    btn.className = 'btn primary';
    btn.style.position = 'fixed';
    btn.style.left = '16px';
    btn.style.bottom = '16px';
    btn.style.zIndex = '1200';
    btn.style.boxShadow = '0 12px 28px rgba(0,0,0,0.3)';
    btn.style.padding = '12px 16px';
    btn.style.borderRadius = '12px';
    btn.style.textDecoration = 'none';
    btn.style.fontWeight = '800';
    document.body.appendChild(btn);
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
      if (key) map[key] = label;
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
      parts.push(`<option value="${key}">${label}</option>`);
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
    if (!els.walletCountrySelect || !els.walletMethodSelect) return;
    const countries = Array.from(new Set(state.paymentMethods.map((m) => m.country || 'غير محدد')));
    els.walletCountrySelect.innerHTML = countries.map((c) => `<option value="${c}">${c}</option>`).join('');
    renderMethodsForCountry();
  }

  function renderMethodsForCountry() {
    if (!els.walletCountrySelect || !els.walletMethodSelect) return;
    const country = els.walletCountrySelect.value;
    const methods = state.paymentMethods.filter((m) => (m.country || 'غير محدد') === country);
    els.walletMethodSelect.innerHTML = methods.map((m) => `<option value="${m.id}">${m.name || m.type || 'طريقة'}</option>`).join('');
    renderMethodInfo();
  }

  function renderMethodInfo() {
    if (!els.walletMethodInfo) return;
    const methodId = els.walletMethodSelect?.value;
    const method = state.paymentMethods.find((m) => m.id === methodId);
    if (!method) {
      els.walletMethodInfo.textContent = '';
      return;
    }
    const details = [
      method.bankName ? `البنك/المحفظة: ${method.bankName}` : '',
      method.accountName ? `الاسم: ${method.accountName}` : '',
      method.accountNumber ? `الرقم/المعرف: ${method.accountNumber}` : '',
      method.note ? method.note : '',
    ].filter(Boolean).join(' • ');
    els.walletMethodInfo.textContent = details;
  }

  function setAdminAuthStatus(text, isError = false) {
    if (!els.adminAuthStatus) return;
    els.adminAuthStatus.textContent = text || '';
    els.adminAuthStatus.style.color = isError ? '#f87171' : 'var(--muted,#9aa6c8)';
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

  function handleWalletTopup(e) {
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
    const country = els.walletCountrySelect?.value || '';
    const methodId = els.walletMethodSelect?.value || '';
    const method = state.paymentMethods.find((m) => m.id === methodId);
    const reference = els.walletRefInput?.value?.trim() || '';
    const methodName = method?.name || method?.type || 'تحويل';
    db.collection('topups').add({
      ownerId: user.uid,
      amount,
      country,
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
      status: 'pending',
      createdAt: Date.now(),
    };

    // استخدم الباك اند إن توفر
    if (state.isAdmin && ADMIN_ROUTER_BASE) {
      try {
        await sendAdminRequest({
          action: 'submit',
          title,
          category,
          price,
          description,
          images: [...newAccountImages],
          image,
          contact
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
    const account = state.accounts.find((a) => a.id === id);
    if (!account) return;

    // إعلانات
    if (action === 'approve' || action === 'reject' || action === 'delete') {
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
    const labels = { approved: 'مقبول', pending: 'انتظار', rejected: 'مرفوض' };
    return `<span class="badge ${status}">${labels[status] || status}</span>`;
  }

  function accountCard(acc, opts = {}) {
    const game = state.games.find((g) => g.id === acc.gameId);
    const img = acc.image || (Array.isArray(acc.images) ? acc.images[0] : '') || game?.image || PLACEHOLDER;
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
        <img src="${img}" alt="${acc.title}">
        <div class="card-body">
          <div class="actions" style="justify-content: space-between;">
            <span>${statusBadge(acc.status)}</span>
            <span class="price-tag">${priceTag}</span>
          </div>
          ${markupNote}
          <h3>${acc.title}</h3>
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
        const more = Array.isArray(acc.images) && acc.images.length > 1 ? `<span class="more">+${acc.images.length - 1} صور</span>` : '';
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
            <div class="thumb">
              <img src="${img}" alt="${acc.title}">
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
              <h3>${acc.title}</h3>
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
    const statusFilter = (els.adminManageStatus && els.adminManageStatus.value) || 'all';
    const list = state.accounts
      .filter((a) => statusFilter === 'all' ? true : (a.status === statusFilter))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!list.length) {
      els.adminManageList.innerHTML = '<p class="muted">لا توجد إعلانات مطابقة.</p>';
      return;
    }
    els.adminManageList.innerHTML = list.map((acc) => {
      const img = acc.image || (Array.isArray(acc.images) ? acc.images[0] : '') || PLACEHOLDER;
      const created = acc.createdAt ? new Date(acc.createdAt).toLocaleString('ar-EG') : '';
      const priv = getAccountPrivate(acc.id);
      const contactVal = priv?.contact || '';
      let catOptionsForAcc = getCategoryList().map((c) => {
        const key = c.id || c.key || c.slug;
        const lbl = c.label || c.name || key;
        if (!key) return '';
        return `<option value="${key}" ${ (acc.category || 'other') === key ? 'selected' : ''}>${lbl}</option>`;
      }).join('');
      if (acc.category && !catOptionsForAcc.includes(`value="${acc.category}"`)) {
        catOptionsForAcc += `<option value="${acc.category}" selected>${acc.category}</option>`;
      }
      const imagesPreview = Array.isArray(acc.images) && acc.images.length
        ? acc.images.slice(0,3).map((url)=>`<img src="${url}" style="width:48px;height:48px;object-fit:cover;border-radius:8px;border:1px solid rgba(255,255,255,0.12);" alt="صورة">`).join('')
        : '<span class="muted tiny">لا توجد صور أخرى</span>';
      const videoPreview = acc.video
        ? `<video src="${acc.video}" controls style="max-width:240px;border-radius:12px;border:1px solid rgba(255,255,255,0.12);background:#000;"></video>`
        : '<span class="muted tiny">لا يوجد فيديو</span>';
      return `
        <article class="manage-card" data-acc-id="${acc.id}">
          <div class="row">
            <img class="thumb" src="${img}" alt="${acc.title}">
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
                  <option value="pending" ${acc.status === 'pending' ? 'selected' : ''}>بانتظار</option>
                  <option value="approved" ${acc.status === 'approved' ? 'selected' : ''}>مقبول</option>
                  <option value="rejected" ${acc.status === 'rejected' ? 'selected' : ''}>مرفوض</option>
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
            <span>${acc.ownerId ? `المالك: ${acc.ownerId}` : ''}</span>
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
    els.adminPurchasesList.innerHTML = list.map((p) => `
      <article class="card">
        <div class="card-body">
          <div class="actions" style="justify-content: space-between;">
            <span class="badge ${p.status || 'pending'}">${p.status || 'pending'}</span>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
              <span class="price-tag">${formatPriceCurrency(p.chargedPrice || p.price || 0)}</span>
              ${p.price && p.chargedPrice && p.chargedPrice !== p.price ? `<span class="muted tiny">أساس: ${formatPriceCurrency(p.price || 0)}</span>` : ''}
              ${p.sellerNet ? `<span class="muted tiny">صافي البائع: ${formatPriceCurrency(p.sellerNet)}</span>` : ''}
            </div>
          </div>
          <h3>${p.accountTitle || p.accountId || 'حساب'}</h3>
          <div class="muted tiny">المشتري: ${p.buyerId || '-'}</div>
          <div class="muted tiny">المالك: ${p.accountOwnerId || '-'}</div>
          ${p.buyerLevel ? `<div class="muted tiny">المستوى: ${p.buyerLevel}${p.buyerMarkupPct ? ` • زيادة ${p.buyerMarkupPct}%` : ''}</div>` : ''}
          <div class="muted tiny">${p.createdAt ? new Date(p.createdAt).toLocaleString('ar-EG') : ''}</div>
        </div>
      </article>
    `).join('');
  }

  function renderAdminTopups() {
    if (!els.adminTopupsList) return;
    const pending = state.topups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!pending.length) {
      els.adminTopupsList.innerHTML = '<p class="muted">لا توجد طلبات شحن.</p>';
      return;
    }
    els.adminTopupsList.innerHTML = pending.map((t) => `
      <article class="card">
        <div class="card-body">
          <div class="actions" style="justify-content: space-between;">
            <span class="badge ${t.status || 'pending'}">${t.status || 'pending'}</span>
            <span class="price-tag">${formatPriceCurrency(t.amount || 0)}</span>
          </div>
          <h3>${t.methodName || ''}</h3>
          <div class="muted tiny">${t.country || ''}</div>
          <p class="muted tiny">مرجع: ${t.reference || '-'}</p>
          <div class="actions">
            <button class="btn primary small" data-action="topup-approve" data-id="${t.id}">تأكيد الشحن</button>
            <button class="btn ghost small" data-action="topup-reject" data-id="${t.id}">رفض</button>
          </div>
        </div>
      </article>
    `).join('');
  }

  function renderAdminWithdraws() {
    if (!els.adminWithdrawList) return;
    const list = (state.withdrawRequests || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!list.length) {
      els.adminWithdrawList.innerHTML = '<p class="muted">لا توجد طلبات سحب.</p>';
      return;
    }
    els.adminWithdrawList.innerHTML = list.map((w) => {
      const status = (w.status || 'pending').toLowerCase();
      const isPending = status === 'pending';
      const usd = formatPriceCurrency(w.amountUSD ?? w.debitedUSD ?? 0);
      const amountCurrency = Number(w.amountCurrency);
      const currencyLabel = Number.isFinite(amountCurrency)
        ? `${(Math.round(amountCurrency * 100) / 100).toFixed(2)} ${w.currency || ''}`
        : '';
      const created = w.createdAt ? new Date(w.createdAt).toLocaleString('ar-EG') : '';
      const code = w.id || w.code || '';
      return `
        <article class="card">
          <div class="card-body">
            <div class="actions" style="justify-content: space-between;">
              <span class="badge ${status}">${status || 'pending'}</span>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
                <span class="price-tag">${usd}</span>
                ${currencyLabel ? `<span class="muted tiny">${currencyLabel}</span>` : ''}
              </div>
            </div>
            <h3>${w.methodName || 'طريقة سحب'}</h3>
            <div class="muted tiny">${w.countryName || w.countryId || ''}</div>
            <div class="muted tiny">المستخدم: ${w.userId || '-'}</div>
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

  function renderWithdrawMethods() {
    if (!els.withdrawMethodsList) return;
    const countries = state.withdrawCountries || [];
    if (!countries.length) {
      els.withdrawMethodsList.innerHTML = '<p class="muted">لا توجد طرق سحب بعد.</p>';
      return;
    }
    els.withdrawMethodsList.innerHTML = countries.map((c) => {
      const methods = (c.methods || []).map((m) => {
        const rateUsd = m.ratePerUSD || m.ratePerUsd || m.rate || null;
        const rateJod = m.ratePerJOD || m.ratePerJod || null;
        const rateLine = [
          rateUsd ? `1 USD = ${rateUsd}` : '',
          rateJod ? `1 JOD = ${rateJod}` : ''
        ].filter(Boolean).join(' | ');
        return `
          <div class="card" style="margin:6px 0; padding:10px; border:1px solid rgba(255,255,255,0.08);">
            <div class="actions" style="justify-content: space-between;">
              <div>
                <strong>${m.name || 'طريقة'}</strong>
                <div class="muted tiny">${m.currencyCode || m.currency || ''}</div>
                ${rateLine ? `<div class="muted tiny">${rateLine}</div>` : ''}
                ${m.note ? `<div class="muted tiny">${m.note}</div>` : ''}
              </div>
              <button class="btn danger small" data-withdraw-country="${c.id}" data-withdraw-method="${m.id}">حذف</button>
            </div>
          </div>
        `;
      }).join('');
      return `
        <article class="card">
          <div class="card-body">
            <div class="actions" style="justify-content: space-between;">
              <div>
                <h3>${c.name || c.label || c.id || 'دولة'}</h3>
                <div class="muted tiny">${c.id || ''}</div>
              </div>
              <button class="btn ghost small" data-withdraw-country-delete="${c.id}">حذف الدولة</button>
            </div>
            ${methods || '<p class="muted tiny">لا توجد طرق لهذه الدولة.</p>'}
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

  function renderCategoryAdminList() {
    if (!els.categoryAdminList) return;
    const list = getCategoryList();
    if (!list.length) {
      els.categoryAdminList.innerHTML = '<p class="muted">لا توجد أقسام بعد.</p>';
      return;
    }
    els.categoryAdminList.innerHTML = list.map((c) => {
      const key = c.id || c.key || c.slug;
      const label = c.label || c.name || key;
      const count = state.accounts.filter((a) => (a.category || '') === key).length;
      return `
        <div class="category-card" data-category-id="${key}">
          <div>
            <div class="label">${label}</div>
            <div class="muted tiny">${key}</div>
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
    const countryId = (els.withdrawCountryIdInput?.value || '').trim();
    const countryName = (els.withdrawCountryNameInput?.value || '').trim();
    const methodName = (els.withdrawMethodNameInput?.value || '').trim();
    const currencyCode = (els.withdrawCurrencyInput?.value || '').trim().toUpperCase();
    const ratePerUSD = Number(els.withdrawRateUsdInput?.value || 0);
    const ratePerJOD = Number(els.withdrawRateJodInput?.value || 0);
    const note = (els.withdrawMethodNoteInput?.value || '').trim();
    if (!countryId || !countryName || !methodName || !currencyCode) {
      notify('أكمل بيانات الدولة والطريقة والعملة');
      return;
    }
    const hasUsd = Number.isFinite(ratePerUSD) && ratePerUSD > 0;
    const hasJod = Number.isFinite(ratePerJOD) && ratePerJOD > 0;
    if (!hasUsd && !hasJod) {
      notify('أدخل سعر صرف صحيح (USD أو JOD)');
      return;
    }
    sendAdminRequest({
      action: 'withdraw:method:add',
      countryId,
      countryName,
      name: methodName,
      currencyCode,
      ratePerUSD,
      ratePerJOD,
      note
    }).then(() => {
      notify('تم حفظ طريقة السحب');
      if (els.withdrawMethodForm) els.withdrawMethodForm.reset();
      loadFirebaseData();
    }).catch((err) => notify(err?.message || 'تعذر حفظ طريقة السحب'));
  }

  function handleWithdrawMethodClick(e) {
    const methodBtn = e.target.closest('button[data-withdraw-method]');
    if (methodBtn) {
      const countryId = methodBtn.dataset.withdrawCountry;
      const methodId = methodBtn.dataset.withdrawMethod;
      if (!countryId || !methodId) return;
      if (!confirm('سيتم حذف طريقة السحب. متابعة؟')) return;
      sendAdminRequest({ action: 'withdraw:method:delete', countryId, methodId })
        .then(() => { notify('تم حذف الطريقة'); loadFirebaseData(); })
        .catch((err) => notify(err?.message || 'تعذر حذف الطريقة'));
      return;
    }
    const countryBtn = e.target.closest('button[data-withdraw-country-delete]');
    if (countryBtn) {
      const countryId = countryBtn.dataset.withdrawCountryDelete;
      if (!countryId) return;
      if (!confirm('سيتم حذف الدولة وجميع طرقها. متأكد؟')) return;
      sendAdminRequest({ action: 'withdraw:country:delete', countryId })
        .then(() => { notify('تم حذف الدولة وطرقها'); loadFirebaseData(); })
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
  }

  function renderAdminTabs() {
    if (!state.isAdmin) return;
    const active = state.adminTab || 'review';
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
    if (els.adminManageList) els.adminManageList.addEventListener('click', handleAdminManageClick);
    if (els.adminManageStatus) els.adminManageStatus.addEventListener('change', renderAdminManageList);
    if (els.addCategoryForm) els.addCategoryForm.addEventListener('submit', handleAddCategory);
    if (els.categoryAdminList) els.categoryAdminList.addEventListener('click', handleCategoryAdminClick);
    if (els.methodAdminList) els.methodAdminList.addEventListener('click', handleMethodAdminClick);
    if (els.addMethodForm) els.addMethodForm.addEventListener('submit', handleAddMethod);
    if (els.withdrawMethodsList) els.withdrawMethodsList.addEventListener('click', handleWithdrawMethodClick);
    if (els.withdrawMethodForm) els.withdrawMethodForm.addEventListener('submit', handleAddWithdrawMethod);
    if (els.addCurrencyForm) els.addCurrencyForm.addEventListener('submit', handleAddCurrency);
    if (els.currencyAdminList) els.currencyAdminList.addEventListener('click', handleCurrencyAdminClick);
    if (els.feesForm) els.feesForm.addEventListener('submit', handleSaveFees);
    if (els.levelForm) els.levelForm.addEventListener('submit', handleLevelSubmit);
    if (els.adminWithdrawList) els.adminWithdrawList.addEventListener('click', handleWithdrawAction);
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

    if (els.walletCountrySelect) {
      els.walletCountrySelect.addEventListener('change', renderMethodsForCountry);
    }
    if (els.walletMethodSelect) {
      els.walletMethodSelect.addEventListener('change', renderMethodInfo);
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
    }
    if (els.sortSelect) els.sortSelect.value = state.sort;
    renderWallet();
    renderWalletHistory();
    renderMethodAdminList();
    renderWithdrawMethods();
    renderCurrencyAdminList();
    renderAdminTopups();
    renderAdminWithdraws();
    renderFeesForm();
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
    const user = getCurrentUser();
    // لوحة الأدمن عبر الراوتر الخلفي
    if (state.isAdmin && ADMIN_ROUTER_BASE) {
      try {
        const snapshot = await sendAdminRequest({ action: 'admin:snapshot' });
        state.games = snapshot.games || [];
        state.accounts = snapshot.accounts || [];
        state.accountPrivate = snapshot.accountPrivate || [];
        state.paymentMethods = snapshot.paymentMethods || [];
        state.topups = snapshot.topups || [];
        state.categories = snapshot.categories || [];
        state.purchases = snapshot.purchases || [];
        state.currencies = snapshot.currencies || [];
        state.withdrawRequests = snapshot.withdrawRequests || [];
        state.withdrawCountries = snapshot.withdrawCountries || [];
        const mergedMap = currenciesToMap(state.currencies);
        try { if (typeof applyRatesMap === 'function') applyRatesMap(mergedMap, { base: 'USD' }); } catch {}
        renderPaymentMethods();
        renderCurrencyAdminList();
        renderWithdrawMethods();
        renderWalletHistory();
        renderAdminTopups();
        renderAdminWithdraws();
        renderAdminPurchases();
        renderCategoryAdminList();
        await loadFeesConfig();
        await loadWallet();
        renderAll();
        renderAdminTabs();
        hideLoader();
        return;
      } catch (e) {
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
        state.paymentMethods = snapshot.paymentMethods || [];
        state.topups = snapshot.topups || [];
        state.categories = snapshot.categories || [];
        state.currencies = snapshot.currencies || [];
        state.withdrawCountries = snapshot.withdrawCountries || [];
        state.withdrawRequests = snapshot.withdrawRequests || [];
        const mergedMap = currenciesToMap(state.currencies);
        try { if (typeof applyRatesMap === 'function') applyRatesMap(mergedMap, { base: 'USD' }); } catch {}
        renderPaymentMethods();
        renderCurrencyAdminList();
        renderWalletHistory();
        renderWithdrawMethods();
        renderAdminTopups();
        renderAdminWithdraws();
        renderAdminPurchases();
        renderCategoryAdminList();
        await loadFeesConfig();
        await loadWallet();
        renderAll();
        renderAdminTabs();
        hideLoader();
        return;
      } catch (err) {
        console.warn('public snapshot failed, fallback to Firebase', err);
      }
    }

    if (!db) return;
    try {
      const topupsPromise = user
        ? state.isAdmin
          ? db.collection('topups').get()
          : db.collection('topups').where('ownerId', '==', user.uid).get()
        : Promise.resolve({ docs: [] });
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

      let [gamesSnap, accountsSnap, methodsSnap, topupsSnap, currencyDoc, categoriesSnap, privatesSnap, purchasesSnap, profileSnap] = await Promise.all([
        db.collection('games').get(),
        db.collection('accounts').get(),
        db.collection('paymentMethods').get(),
        topupsPromise,
        db.collection('config').doc('currency').get(),
        db.collection('categories').get(),
        privatePromise,
        purchasesPromise,
        profilePromise,
      ]);
      state.games = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.accounts = accountsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.accountPrivate = privatesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.purchases = purchasesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.paymentMethods = methodsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.topups = topupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.categories = categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.userProfile = profileSnap && profileSnap.exists ? { id: profileSnap.id, ...profileSnap.data() } : null;
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
      renderAll();
      hideLoader();
    } catch (e) {
      notify('تعذر جلب البيانات من Firebase');
      hideLoader();
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
