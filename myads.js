const firebaseConfig = {
  apiKey: "AIzaSyBD4zpvsUdygm7KxRYXPDHbotwvf9Y7pOQ",
  authDomain: "js4accweb.firebaseapp.com",
  projectId: "js4accweb",
  storageBucket: "js4accweb.firebasestorage.app",
  messagingSenderId: "635891162580",
  appId: "1:635891162580:web:1ee495e5b51f96ab16ca41",
  measurementId: "G-0Y3LMPBEWJ"
};

const app = (firebase.apps && firebase.apps.length)
  ? firebase.app()
  : firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

function escapeHtml(value){
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getFirstImage(acc){
  const images = Array.isArray(acc?.images) ? acc.images : [];
  const first = images.find((x) => String(x || "").trim());
  const single = acc?.image || acc?.img || "";
  const pick = first || single || "";
  return String(pick || "").trim();
}

function formatStatus(status){
  const s = String(status || "pending").trim().toLowerCase();
  if (s === "approved") return { label: "مقبول", cls: "approved" };
  if (s === "rejected") return { label: "مرفوض", cls: "rejected" };
  if (s === "sold" || s === "completed") return { label: "تم البيع", cls: "sold" };
  return { label: "بانتظار المراجعة", cls: "pending" };
}

function formatPrice(acc){
  const raw = acc?.price ?? acc?.priceUSD ?? acc?.priceUsd ?? null;
  const num = Number(raw);
  if (!Number.isFinite(num)) return "";
  if (typeof window.formatCurrencyFromJOD === "function") {
    try { return window.formatCurrencyFromJOD(num); } catch {}
  }
  return num.toFixed(2) + " $";
}

function renderEmpty(message){
  const list = document.getElementById("myAdsList");
  if (!list) return;
  list.innerHTML = `<div class="empty">${escapeHtml(message || "لا توجد إعلانات بعد.")}</div>`;
}

function renderAds(ads){
  const list = document.getElementById("myAdsList");
  if (!list) return;
  if (!ads || !ads.length) { renderEmpty("لا توجد إعلانات بعد."); return; }

  list.innerHTML = ads.map((acc) => {
    const img = getFirstImage(acc);
    const title = String(acc?.title || "حساب").trim();
    const price = formatPrice(acc);
    const st = formatStatus(acc?.status);
    const created = acc?.createdAt ? (() => { try { return new Date(acc.createdAt).toLocaleString("ar-EG"); } catch { return ""; } })() : "";
    return `
      <article class="ad-card" data-id="${escapeHtml(acc.id)}" data-status="${escapeHtml(String(acc?.status || ""))}">
        ${img ? `<img class="ad-thumb" src="${escapeHtml(img)}" alt="صورة الإعلان">` : `<div class="ad-thumb" style="display:flex;align-items:center;justify-content:center;color:#9aa6c8;">لا توجد صورة</div>`}
        <div class="ad-body">
          <div class="row">
            <h3 class="ad-title">${escapeHtml(title)}</h3>
            <span class="badge ${escapeHtml(st.cls)}">${escapeHtml(st.label)}</span>
          </div>
          ${price ? `<div class="muted">${escapeHtml(price)}</div>` : ""}
          ${created ? `<div class="muted" style="font-size:12px;">${escapeHtml(created)}</div>` : ""}
          <div class="btns">
            <a class="btn primary" href="account.html?id=${encodeURIComponent(acc.id)}" target="_blank" rel="noopener noreferrer">فتح</a>
            <button class="btn danger" type="button" data-action="delete" data-id="${escapeHtml(acc.id)}">حذف</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

async function deleteAd(adId, status){
  if (!adId) return;
  const st = String(status || "").toLowerCase();
  const extraWarn = (st === "sold" || st === "completed")
    ? "\nتنبيه: حذف إعلان مباع قد يمنع المشتري من مشاهدة الصور والوصف من صفحة طلباته."
    : "";
  if (!confirm("هل أنت متأكد من حذف الإعلان؟" + extraWarn)) return;

  const btn = document.querySelector(`button[data-action="delete"][data-id="${CSS.escape(adId)}"]`);
  if (btn) btn.disabled = true;
  try {
    await db.collection("accounts").doc(adId).delete();
    try { await db.collection("accountPrivate").doc(adId).delete(); } catch {}
  } catch (e) {
    alert("تعذر حذف الإعلان: " + (e?.message || e));
    if (btn) btn.disabled = false;
  }
}

let _unsub = null;
auth.onAuthStateChanged(async (user) => {
  if (!user) {
    renderEmpty("سجّل الدخول لعرض إعلاناتك.");
    setTimeout(() => { try { window.location.href = "login.html"; } catch {} }, 400);
    return;
  }

  try { if (_unsub) { _unsub(); _unsub = null; } } catch {}
  try {
    _unsub = db.collection("accounts")
      .where("ownerId", "==", user.uid)
      .onSnapshot((snap) => {
        const ads = (snap?.docs || [])
          .map((d) => ({ id: d.id, ...(d.data() || {}) }))
          .sort((a, b) => (Number(b.createdAt) || 0) - (Number(a.createdAt) || 0));
        renderAds(ads);
      }, (err) => {
        console.warn("ads snapshot error:", err);
        renderEmpty("تعذر تحميل الإعلانات.");
      });
  } catch (e) {
    console.warn("ads init error:", e);
    renderEmpty("تعذر تحميل الإعلانات.");
  }
});

document.addEventListener("click", (e) => {
  const btn = e.target.closest && e.target.closest('button[data-action="delete"][data-id]');
  if (!btn) return;
  const id = btn.dataset.id;
  const card = btn.closest(".ad-card");
  const status = card ? (card.dataset.status || "") : "";
  deleteAd(id, status);
});
