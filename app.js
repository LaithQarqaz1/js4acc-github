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
    selectedGame: null,
    view: 'games',
    sort: 'latest',
    wallet: 0,
    categories: [],
  };
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
  const els = {
    userChip: document.getElementById('userChip'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginBtn: document.getElementById('loginBtn'),
    registerBtn: document.getElementById('registerBtn'),
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
    adminPurchasesList: document.getElementById('adminPurchasesList'),
    loader: document.getElementById('loader'),
    toast: document.getElementById('toast'),
  };

  const isAuthPage = () => {
    const path = window.location.pathname.toLowerCase();
    return path.includes('login') || path.includes('auth');
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

  const ADMIN_ROUTER_BASE = (window.ADMIN_ROUTER_BASE || window.ROUTER_BASE || window.BACKEND_BASE || '').toString().replace(/\/+$/, '');

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

      const applyWallet = action === 'topup-approve'
        ? db.collection('wallets').doc(topup.ownerId).set({
            balance: firebase.firestore.FieldValue.increment(topup.amount || 0),
            updatedAt: Date.now(),
          }, { merge: true })
        : Promise.resolve();

      Promise.all([
        db.collection('topups').doc(id).update({ status: newStatus, reviewedAt: Date.now(), reviewedBy: getCurrentUser()?.email || '' }),
        applyWallet,
      ]).then(() => {
        notify(action === 'topup-approve' ? 'تمت إضافة الرصيد' : 'تم رفض الطلب');
        loadFirebaseData();
      }).catch(() => notify('تعذر تحديث الطلب'));
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
    if (!db) {
      notify('فعّل اتصال Firebase أولًا');
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
    db.collection('paymentMethods').add({
      country,
      name,
      accountNumber,
      accountName,
      note,
      type: 'wallet',
      createdAt: Date.now(),
    }).then(() => {
      notify('تمت إضافة الطريقة');
      els.addMethodForm.reset();
      loadFirebaseData();
    }).catch(() => notify('تعذر الإضافة'));
  }

  function handleMethodAdminClick(e) {
    const btn = e.target.closest('button[data-method-id]');
    if (!btn) return;
    const id = btn.dataset.methodId;
    if (!db || !state.isAdmin) {
      notify('صلاحية الادمن مطلوبة');
      return;
    }
    db.collection('paymentMethods').doc(id).delete()
      .then(() => {
        notify('تم حذف الطريقة');
        loadFirebaseData();
      })
      .catch(() => notify('تعذر الحذف'));
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
    if (els.adminAddAccounts) els.adminAddAccounts.classList.toggle('hidden', !state.isAdmin);
    if (els.adminCategories) els.adminCategories.classList.toggle('hidden', !state.isAdmin);
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
            <span class="price-tag">${formatPriceCurrency(acc.price || 0)}</span>
          </div>
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
      if (user?.isAdmin) return true;
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
                <span class="price-tag">${formatPriceCurrency(acc.price || 0)}</span>
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
            <span class="price-tag">${formatPriceCurrency(p.price || 0)}</span>
          </div>
          <h3>${p.accountTitle || p.accountId || 'حساب'}</h3>
          <div class="muted tiny">المشتري: ${p.buyerId || '-'}</div>
          <div class="muted tiny">المالك: ${p.accountOwnerId || '-'}</div>
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
    if (!db) { notify('فعّل اتصال Firebase أولًا'); return; }
    const code = (els.currencyCodeInput?.value || '').trim().toUpperCase();
    const symbol = (els.currencySymbolInput?.value || '').trim();
    const rate = Number(els.currencyRateInput?.value || 0);
    if (!code || !symbol || !Number.isFinite(rate) || rate <= 0) {
      notify('أكمل بيانات العملة وقيمة صحيحة للسعر');
      return;
    }
    const nextList = state.currencies.filter(c => c.code !== code).concat([{ code, symbol, rate }]);
    const mergedMap = currenciesToMap(nextList);
    const payload = {
      rates: mergedMap,
      ratesJson: JSON.stringify(mergedMap),
      baseCode: 'USD'
    };
    db.collection('config').doc('currency').set(payload, { merge: false }).then(() => {
      notify('تم حفظ العملة');
      if (els.addCurrencyForm) els.addCurrencyForm.reset();
      state.currencies = nextList;
      try { localStorage.removeItem('currency:rates:cache'); } catch {}
      try { if (typeof applyRatesMap === 'function') applyRatesMap(mergedMap, { base: 'USD' }); } catch {}
      renderCurrencyAdminList();
    }).catch(() => notify('تعذر حفظ العملة'));
  }

  function handleCurrencyAdminClick(e){
    const btn = e.target.closest('button[data-currency-code]');
    if (!btn) return;
    const code = btn.dataset.currencyCode;
    if (!code) return;
    if (!confirm(`سيتم حذف العملة ${code} ولن تظهر في الخيارات.\nمتأكد من المتابعة؟`)) return;
    const nextList = state.currencies.filter(c => c.code !== code);
    const mergedMap = currenciesToMap(nextList);
    const payload = {
      rates: mergedMap,
      ratesJson: JSON.stringify(mergedMap),
      baseCode: 'USD'
    };
    db.collection('config').doc('currency').set(payload, { merge: false }).then(()=>{
      state.currencies = nextList;
      try { localStorage.removeItem('currency:rates:cache'); } catch {}
      try { if (typeof applyRatesMap === 'function') applyRatesMap(mergedMap, { base: 'USD' }); } catch {}
      renderCurrencyAdminList();
      notify('تم حذف العملة');
    }).catch(()=>notify('تعذر الحذف'));
  }

  function handleAddCategory(e) {
    e.preventDefault();
    if (!state.isAdmin) { notify('صلاحية الادمن فقط'); return; }
    if (!db) { notify('فعّل اتصال Firebase أولًا'); return; }
    const name = (els.categoryNameInput?.value || '').trim();
    let key = slugify(name);
    if (!name) { notify('أدخل اسمًا واضحاً للقسم'); return; }
    if (!key) { key = `cat-${Date.now().toString(16)}`; }
    const exists = getCategoryList().some((c) => (c.id || c.key || c.slug) === key);
    if (exists) { notify('المفتاح مستخدم من قبل'); return; }
    db.collection('categories').doc(key).set({
      label: name,
      name,
      key,
      createdAt: Date.now(),
    }).then(() => {
      notify('تمت إضافة القسم');
      if (els.addCategoryForm) els.addCategoryForm.reset();
      loadFirebaseData();
    }).catch(() => notify('تعذر إضافة القسم'));
  }

  function handleCategoryAdminClick(e) {
    const btn = e.target.closest('button[data-category-id]');
    if (!btn) return;
    if (!state.isAdmin || !db) { notify('صلاحية الادمن مطلوبة'); return; }
    const id = btn.dataset.categoryId;
    if (!id) return;
    if (!confirm('سيتم حذف القسم ولن يظهر في القوائم. متأكد؟')) return;
    db.collection('categories').doc(id).delete()
      .then(() => { notify('تم حذف القسم'); loadFirebaseData(); })
      .catch(() => notify('تعذر الحذف'));
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

  function attachEvents() {
    if (els.loginForm) els.loginForm.addEventListener('submit', handleLoginSubmit);
    if (els.registerForm) els.registerForm.addEventListener('submit', handleRegisterSubmit);
    if (els.addAccountForm) els.addAccountForm.addEventListener('submit', handleAddAccount);
    if (els.adminList) els.adminList.addEventListener('click', handleAdminAction);
    if (els.adminManageList) els.adminManageList.addEventListener('click', handleAdminManageClick);
    if (els.adminManageStatus) els.adminManageStatus.addEventListener('change', renderAdminManageList);
    if (els.addCategoryForm) els.addCategoryForm.addEventListener('submit', handleAddCategory);
    if (els.categoryAdminList) els.categoryAdminList.addEventListener('click', handleCategoryAdminClick);
    if (els.methodAdminList) els.methodAdminList.addEventListener('click', handleMethodAdminClick);
    if (els.addMethodForm) els.addMethodForm.addEventListener('submit', handleAddMethod);
    if (els.addCurrencyForm) els.addCurrencyForm.addEventListener('submit', handleAddCurrency);
    if (els.currencyAdminList) els.currencyAdminList.addEventListener('click', handleCurrencyAdminClick);
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
    renderCurrencyAdminList();
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
    if (!db) return;
    try {
      const user = getCurrentUser();
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

      let [gamesSnap, accountsSnap, methodsSnap, topupsSnap, currencyDoc, categoriesSnap, privatesSnap, purchasesSnap] = await Promise.all([
        db.collection('games').get(),
        db.collection('accounts').get(),
        db.collection('paymentMethods').get(),
        topupsPromise,
        db.collection('config').doc('currency').get(),
        db.collection('categories').get(),
        privatePromise,
        purchasesPromise,
      ]);
      state.games = gamesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.accounts = accountsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.accountPrivate = privatesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.purchases = purchasesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.paymentMethods = methodsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.topups = topupsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      state.categories = categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
    await initFirebase();
    initAuth();
    await loadFirebaseData();
    focusAuthFromHash();
    renderAll();
    setTimeout(hideLoader, 800);
  }

  init();
})();
