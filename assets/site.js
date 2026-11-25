/* Elite Smart Hub storefront: loads data/*.json (edited from /admin), shows services, takes orders through shop-api.php and WhatsApp. */
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const tk = n => "৳" + Number(n || 0).toLocaleString("en-IN");
const BN = s => String(s).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
const img = s => !s ? "img/icon-512.png" : /^(https?:|data:|\/)/.test(s) ? s : "img/" + s;
const ICONS = {
  play: '<path d="M8 5v14l11-7z"/>', music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  spark: '<path d="M12 3l2 6.2L20 11l-6 1.8L12 19l-2-6.2L4 11l6-1.8z"/>', brush: '<path d="M14.5 4.5l5 5L10 19H5v-5z"/><path d="M12.5 6.5l5 5"/>',
  doc: '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>', check: '<circle cx="12" cy="12" r="9"/><path d="M8.5 12.2l2.4 2.4 4.6-4.8"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>', game: '<path d="M6 8h12a4 4 0 0 1 4 4v1a3 3 0 0 1-5.4 1.8L15 13H9l-1.6 1.8A3 3 0 0 1 2 13v-1a4 4 0 0 1 4-4z"/><path d="M7 10.5v3M5.5 12h3"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>', all: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>'
};
const ico = k => `<svg viewBox="0 0 24 24">${ICONS[k] || ICONS.all}</svg>`;
const ALIAS = { netflix: "নেটফ্লিক্স", youtube: "ইউটিউব yt", spotify: "স্পটিফাই গান", chatgpt: "চ্যাটজিপিটি gpt openai", canva: "ক্যানভা", capcut: "ক্যাপকাট", gemini: "জেমিনি google ai", "meta verified": "ব্লু টিক blue tick ভেরিফাইড facebook instagram", "free fire": "ফ্রি ফায়ার ডায়মন্ড ff", pubg: "পাবজি uc", vpn: "ভিপিএন", telegram: "টেলিগ্রাম", hoichoi: "হইচই", chorki: "চরকি", adobe: "photoshop premiere অ্যাডোবি", "microsoft": "office word excel", prime: "amazon প্রাইম" };
let D = { products: {}, categories: [], site: {}, reviews: [], banners: [] }, SV = [], CUR = "all", Q = "";

async function get(n, def) { try { const r = await fetch(`data/${n}.json?t=${Date.now()}`, { cache: "no-store" }); if (r.ok) return await r.json() } catch (e) { } return def }
function waNum() { return String((D.site.store || {}).whatsapp || "").replace(/\D/g, "") }
function waLink(text) { const n = waNum(); return `https://wa.me/${n}?text=${encodeURIComponent(text)}` }
function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 2600) }
function track(ev, data) { try { window.fbq && fbq("track", ev, data || {}) } catch (e) { } }

/* group plans (products) into services by brand inside each category */
function buildServices() {
  const cats = (D.categories || []).filter(c => c.on !== 0).sort((a, b) => (a.order || 0) - (b.order || 0));
  SV = [];
  for (const c of cats) {
    const map = new Map();
    (D.products[c.k] || []).forEach((x, j) => {
      if (x.off) return; const id = x.id || c.k + j, key = (x.b || x.n).trim().toLowerCase();
      if (!map.has(key)) map.set(key, { key, cat: c.k, name: x.b || x.n, img: x.i ? img(x.i) : (x.r || img("")), sd: x.sd || "", plans: [], bs: 0, nw: 0, ft: 0 });
      const s = map.get(key); s.plans.push({ ...x, id }); if (x.bs) s.bs = 1; if (x.nw) s.nw = 1; if (x.ft) s.ft = 1; if (!s.sd && x.sd) s.sd = x.sd;
    });
    for (const s of map.values()) {
      const priced = s.plans.filter(p => p.p); s.min = priced.length ? Math.min(...priced.map(p => p.p)) : 0;
      const mp = priced.find(p => p.p === s.min); s.old = mp && mp.o > mp.p ? mp.o : 0; s.off = s.old ? Math.round((s.old - s.min) / s.old * 100) : 0;
      s.find = (s.name + " " + s.plans.map(p => p.n + " " + (p.t || "")).join(" ") + " " + Object.entries(ALIAS).filter(([k]) => s.name.toLowerCase().includes(k)).map(([, v]) => v).join(" ") + " " + (c.name || "")).toLowerCase();
      SV.push(s);
    }
  }
  return cats;
}

function cardHTML(s) {
  return `<article class="card rv-in" data-s="${esc(s.key)}" tabindex="0" aria-label="${esc(s.name)}">
   <div class="art"><img src="${esc(s.img)}" alt="${esc(s.name)}" loading="lazy" width="400" height="400" onerror="this.src='img/icon-512.png'">
    <div class="bdg">${s.bs ? '<span class="bs">Best Seller</span>' : ""}${s.nw ? '<span class="nw">New</span>' : ""}</div>${s.off >= 5 ? `<span class="off">-${s.off}%</span>` : ""}</div>
   <div class="bd"><h3>${esc(s.name)}</h3><p class="sd">${esc(s.sd)}</p>
    <div class="meta"><div class="price">${s.min ? `${tk(s.min)}${s.old ? `<s>${tk(s.old)}</s>` : ""}${s.plans.length > 1 ? ` <small>থেকে</small>` : ""}` : '<small>দাম জানতে নক দিন</small>'}</div><span class="plans">${BN(s.plans.length)}টি প্ল্যান</span></div>
    <button class="btn red" type="button">অর্ডার করুন</button></div></article>`;
}

function render() {
  const cats = (D.categories || []).filter(c => c.on !== 0).sort((a, b) => (a.order || 0) - (b.order || 0));
  const list = SV.filter(s => (CUR === "all" || s.cat === CUR) && (!Q || Q.split(/\s+/).every(w => s.find.includes(w))));
  let html = "";
  if (CUR === "all" && !Q) {
    for (const c of cats) { const L = list.filter(s => s.cat === c.k); if (!L.length) continue; html += `<h3 class="cat-h" id="c-${esc(c.k)}">${ico(c.ic)}${esc(c.name)}<i></i></h3><div class="grid">${L.map(cardHTML).join("")}</div>` }
  } else html = list.length ? `<div class="grid" style="margin-top:8px">${list.map(cardHTML).join("")}</div>` : "";
  $("#grid").innerHTML = html; $("#empty").hidden = !!list.length;
  reveal();
}
function drawTabs(cats) {
  const n = k => SV.filter(s => k === "all" || s.cat === k).length;
  $("#tabs").innerHTML = [{ k: "all", name: "সব সার্ভিস", ic: "all" }, ...cats].filter(c => n(c.k)).map(c => `<button class="tab ${CUR === c.k ? "on" : ""}" role="tab" data-k="${esc(c.k)}">${ico(c.ic)}${esc(c.name)} <small>${n(c.k)}</small></button>`).join("");
}

/* ---------- order sheet ---------- */
function openSheet(html) { $("#sheetBox").innerHTML = html; $("#sheet").hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => { const f = $("#sheetBox .x"); f && f.focus({ preventScroll: true }) }, 60) }
function closeSheet() { $("#sheet").hidden = true; document.body.style.overflow = ""; if (/^#order\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search) }
function payMethods() { const p = D.site.payment || {}; const L = []; if (p.bkash) L.push(["bkash", "bKash", "#e2136e", p.bkash]); if (p.nagad) L.push(["nagad", "Nagad", "#f6921e", p.nagad]); if (p.rocket) L.push(["rocket", "Rocket", "#8c3494", p.rocket]); return L }
function openOrder(key, planId) {
  const s = SV.find(x => x.key === key); if (!s) return;
  const sel = s.plans.find(p => p.id === planId) || s.plans[0];
  const need = ((sel.d || "").match(/যা লাগবে:\s*(.+)/) || [])[1] || "আপনার ইমেইল";
  const PM = payMethods();
  track("ViewContent", { content_name: s.name, value: sel.p || 0, currency: "BDT" });
  history.replaceState(null, "", "#order/" + encodeURIComponent(s.key));
  openSheet(`<div class="sh-h"><img src="${esc(s.img)}" alt=""><div><h3 id="shTitle">${esc(s.name)}</h3><p>${esc(s.sd)}</p></div><button class="x" type="button" onclick="closeSheet()" aria-label="বন্ধ করুন">✕</button></div>
  <form class="sh-b" id="of" novalidate>
   <div><span class="lbl">প্ল্যান বেছে নিন</span><div class="pl">${s.plans.map(p => `<label><input type="radio" name="plan" value="${esc(p.id)}" ${p.id === sel.id ? "checked" : ""}><span>${esc(p.t || p.n)}</span>${p.o > p.p ? `<s>${tk(p.o)}</s>` : ""}<b>${p.p ? tk(p.p) : "নক দিন"}</b></label>`).join("")}</div></div>
   <div class="info" id="pinfo"></div>
   <div class="f">
    <div class="r2"><label>আপনার নাম *<input name="name" required maxlength="80" autocomplete="name" placeholder="যেমন: রাকিব হাসান"></label><label>WhatsApp নম্বর *<input name="phone" required inputmode="numeric" maxlength="14" autocomplete="tel" placeholder="01XXXXXXXXX"></label></div>
    <label><span id="needL">${esc(need)}</span><input name="acc" maxlength="200" id="needI" placeholder="${esc(/ID/i.test(need) ? "যেমন 1234567890" : /লিংক/.test(need) ? "https://facebook.com/…" : "you@gmail.com")}"></label>
   </div>
   <div><span class="lbl">পেমেন্ট মাধ্যম</span><div class="pm">${PM.map(([k, n, c], i) => `<label><input type="radio" name="pay" value="${k}" ${i === 0 ? "checked" : ""}><i class="c" style="background:${c}"></i>${n}</label>`).join("")}<label><input type="radio" name="pay" value="wa" ${PM.length ? "" : "checked"}>💬 WhatsApp এ কথা বলে</label></div></div>
   <div class="paybox" id="paybox"></div>
   <div class="f"><label>নোট <i>(ঐচ্ছিক)</i><textarea name="note" maxlength="300" placeholder="কিছু জানাতে চাইলে লিখুন"></textarea></label></div>
   <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
   <div class="tot"><span>মোট</span><b id="tot"></b></div>
   <p class="err" id="oerr" role="alert"></p>
   <button class="btn red lg" id="obtn">অর্ডার কনফার্ম করুন</button>
   <a class="btn ghost" data-wa-plan>সরাসরি WhatsApp এ জিজ্ঞেস করুন</a>
  </form>`);
  const F = $("#of");
  const cur = () => s.plans.find(p => p.id === (new FormData(F).get("plan"))) || sel;
  const upd = () => {
    const p = cur(), pay = new FormData(F).get("pay"), pm = PM.find(x => x[0] === pay);
    $("#pinfo").textContent = p.d || ""; $("#tot").textContent = p.p ? tk(p.p) : "নক দিন";
    const nd = ((p.d || "").match(/যা লাগবে:\s*(.+)/) || [])[1] || "আপনার ইমেইল"; $("#needL").textContent = nd;
    $("#paybox").innerHTML = pm ? `<div>নিচের ${pm[1]} নম্বরে <b>${p.p ? tk(p.p) : ""}</b> <b>Send Money</b> করুন:</div><div class="num">${esc(pm[3])} <button type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(pm[3])}').then(()=>toast('নম্বর কপি হয়েছে ✓'))">কপি</button></div><label class="f" style="gap:5px;font-weight:600">Transaction ID (TrxID) *<input name="trx" maxlength="40" placeholder="যেমন 9GH7K2LM0P" autocomplete="off"></label>${D.site.payment?.note ? `<small class="mu">${esc(D.site.payment.note)}</small>` : ""}`
      : `<div>অর্ডার কনফার্ম করার পর WhatsApp এ আমাদের সাথে কথা বলে পেমেন্ট করবেন। আমরা পেমেন্ট নম্বর পাঠিয়ে দেব।</div>`;
    $("[data-wa-plan]").href = waLink(`হ্যালো Elite Smart Hub, আমি ${s.name} (${p.t || p.n}${p.p ? ", " + tk(p.p) : ""}) নিতে চাই।`); $("[data-wa-plan]").target = "_blank";
  };
  F.onchange = e => { if (e.target.name === "plan" || e.target.name === "pay") upd() };
  upd();
  F.onsubmit = async e => {
    e.preventDefault(); const fd = new FormData(F), p = cur(), err = $("#oerr"); err.textContent = "";
    const name = (fd.get("name") || "").trim(), phone = (fd.get("phone") || "").replace(/\D/g, "").replace(/^880/, "0").replace(/^88/, ""), acc = (fd.get("acc") || "").trim(), pay = fd.get("pay"), trx = (fd.get("trx") || "").trim();
    if (!name) return err.textContent = "আপনার নাম লিখুন।";
    if (!/^01[3-9]\d{8}$/.test(phone)) return err.textContent = "সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন 017XXXXXXXX)।";
    if (pay !== "wa" && trx.length < 6) return err.textContent = "পেমেন্ট করে Transaction ID লিখুন (অথবা 'WhatsApp এ কথা বলে' বেছে নিন)।";
    const b = $("#obtn"); b.disabled = true; b.textContent = "অর্ডার হচ্ছে…";
    const body = { name, phone, address: acc, items: [{ id: p.id, q: 1 }], pay, trx, note: (fd.get("note") || "").trim(), website: fd.get("website") || "" };
    let j = null;
    try { const r = await fetch("shop-api.php?a=order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if ((r.headers.get("content-type") || "").includes("json")) j = await r.json() } catch (e) { }
    b.disabled = false; b.textContent = "অর্ডার কনফার্ম করুন";
    if (j && j.error) return err.textContent = j.error;
    const no = j && j.no ? j.no : "";
    const payTxt = pay === "wa" ? "WhatsApp এ কথা বলে পেমেন্ট করব" : `${pay} · TrxID ${trx}`;
    const msg = `হ্যালো Elite Smart Hub, আমি অর্ডার করেছি।${no ? `\nঅর্ডার নম্বর: ${no}` : ""}\nসার্ভিস: ${s.name}\nপ্ল্যান: ${p.t || p.n}\nদাম: ${p.p ? tk(p.p) : "-"}\nনাম: ${name}\nনম্বর: ${phone}${acc ? `\nইমেইল/আইডি: ${acc}` : ""}\nপেমেন্ট: ${payTxt}`;
    track("Purchase", { value: p.p || 0, currency: "BDT", content_name: s.name }, no);
    openSheet(`<div class="ok"><button class="x" type="button" onclick="closeSheet()" aria-label="বন্ধ করুন" style="position:absolute;right:16px;top:16px">✕</button><div class="tick"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></div>
      <h3>${no ? "অর্ডার হয়েছে, ধন্যবাদ!" : "প্রায় শেষ!"}</h3>${no ? `<div class="no">${esc(no)}</div><p>অর্ডার নম্বরটি রেখে দিন। এখন WhatsApp এ একটা মেসেজ দিন, দ্রুত চালু করে দিচ্ছি।</p>` : `<p>নিচের বাটনে চাপ দিয়ে WhatsApp এ অর্ডারটি পাঠিয়ে দিন।</p>`}
      <a class="btn wa lg" href="${esc(waLink(msg))}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" class="f"><use href="#i-wa"/></svg> WhatsApp এ কনফার্ম করুন</a></div>`);
  };
}

/* ---------- reviews ---------- */
function drawReviews() {
  const R = (D.reviews || []).filter(r => r.on);
  $("#rvList").innerHTML = R.length ? R.slice(0, 9).map(r => `<div class="rv rv-in"><span class="stars">${"★".repeat(Math.max(1, Math.min(5, r.stars || 5)))}</span><p>${esc(r.text)}</p><b>${esc(r.name)}</b><small>${esc(r.pet || "")}</small></div>`).join("")
    : `<p class="rv-empty">আপনার অভিজ্ঞতা জানাতে "রিভিউ লিখুন" বাটনে চাপ দিন।</p>`;
}
function openReview() {
  openSheet(`<div class="sh-h"><img src="img/icon-192.png" alt=""><div><h3 id="shTitle">রিভিউ লিখুন</h3><p>আপনার মতামত আমাদের কাছে মূল্যবান</p></div><button class="x" type="button" onclick="closeSheet()" aria-label="বন্ধ করুন">✕</button></div>
  <form class="sh-b f" id="rf"><label>আপনার নাম *<input name="name" required maxlength="60"></label><label>কোন সার্ভিস নিয়েছিলেন?<select name="pid">${SV.map(s => `<option value="${esc(s.plans[0].id)}">${esc(s.name)}</option>`).join("")}</select></label>
   <label>রেটিং<select name="rating"><option value="5">★★★★★ দারুণ</option><option value="4">★★★★ ভালো</option><option value="3">★★★ মোটামুটি</option><option value="2">★★ খারাপ</option><option value="1">★ খুব খারাপ</option></select></label>
   <label>রিভিউ *<textarea name="body" required maxlength="1000"></textarea></label><input class="hp" name="website" tabindex="-1" autocomplete="off"><p class="err" id="rerr"></p><button class="btn red">রিভিউ পাঠান</button></form>`);
  $("#rf").onsubmit = async e => {
    e.preventDefault(); const b = Object.fromEntries(new FormData(e.target)); let j = null;
    try { const r = await fetch("shop-api.php?a=review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); if ((r.headers.get("content-type") || "").includes("json")) j = await r.json() } catch (x) { }
    if (j && j.error) return $("#rerr").textContent = j.error;
    closeSheet(); toast(j ? "ধন্যবাদ! রিভিউ যাচাইয়ের পর দেখা যাবে ✓" : "ধন্যবাদ! (ডেমোতে রিভিউ সেভ হয় না)");
  };
}

/* ---------- top banner slider (Admin › Hero Banners) ---------- */
let SL = { i: 0, n: 0, t: null };
function slider() {
  const B = (D.banners || []).filter(b => b.on && b.img); if (!B.length) return;
  const tr = $("#slTrack");
  tr.innerHTML = B.map((b, i) => `<a class="sl" href="${esc(b.link || "#services")}" aria-label="${esc(b.title || "অফার " + (i + 1))}"><img src="${esc(img(b.img))}" alt="${esc(b.title || "")}" width="1600" height="800" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></a>`).join("");
  SL.n = B.length;
  $("#slDots").innerHTML = SL.n > 1 ? B.map((_, i) => `<button type="button" aria-label="ব্যানার ${i + 1}" data-i="${i}"></button>`).join("") : "";
  $$(".sl-btn").forEach(b => b.hidden = SL.n < 2);
  $("#slDots").onclick = e => { const d = e.target.closest("button"); if (d) slTo(+d.dataset.i) };
  let st; tr.addEventListener("scroll", () => { clearTimeout(st); st = setTimeout(() => { SL.i = Math.round(tr.scrollLeft / tr.clientWidth); slDots() }, 60) }, { passive: true });
  const stop = () => clearInterval(SL.t), go = () => { stop(); if (SL.n > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) SL.t = setInterval(() => slTo((SL.i + 1) % SL.n), 4500) };
  tr.addEventListener("pointerenter", stop); tr.addEventListener("pointerleave", go); tr.addEventListener("touchstart", stop, { passive: true }); tr.addEventListener("touchend", () => setTimeout(go, 3000), { passive: true });
  document.addEventListener("visibilitychange", () => document.hidden ? stop() : go());
  slDots(); go();
}
function slTo(i) { const tr = $("#slTrack"); SL.i = (i + SL.n) % SL.n; tr.scrollTo({ left: SL.i * tr.clientWidth, behavior: "smooth" }); slDots() }
function slGo(d) { slTo(SL.i + d) }
function slDots() { $$("#slDots button").forEach((b, i) => b.classList.toggle("on", i === SL.i)) }

/* ---------- popular row + today's offer (Admin › Homepage CMS deal) ---------- */
function popular() {
  const col = (D.collections || []).find(c => c.on && (c.ids || []).length);
  let L = col ? SV.filter(s => s.plans.some(p => col.ids.includes(p.id))) : SV.filter(s => s.bs);
  if (!L.length) L = SV.filter(s => s.ft);
  $("#popRow").innerHTML = L.slice(0, 14).map(cardHTML).join("");
  $("#popular").hidden = !L.length;
  $("#popRow").onclick = e => { const c = e.target.closest(".card"); if (c) openOrder(c.dataset.s) };
  const dl = (D.site.cms || {}).deal || {}; let s = null, p = null;
  for (const x of SV) { const y = x.plans.find(q => q.id === dl.id); if (y) { s = x; p = y } }
  if (!s || !p) return;
  const ends = dl.ends ? new Date(dl.ends).getTime() : 0; if (ends && ends < Date.now()) return;
  const box = $("#deal"); box.hidden = false;
  box.innerHTML = `<img src="${esc(s.img)}" alt=""><div><span class="tg">⚡ আজকের অফার</span><h3>${esc(s.name)}</h3><p>${esc(p.t || "")} · ${esc(s.sd)}</p>${ends ? '<div class="cd" id="cd"></div>' : ""}</div><div class="pz">${p.o > p.p ? `<s>${tk(p.o)}</s>` : ""}<b>${tk(p.p)}</b><span class="btn gold">এখনই নিন</span></div>`;
  box.onclick = () => openOrder(s.key, p.id);
  if (ends) { const tick = () => { const ms = Math.max(0, ends - Date.now()), h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4), sc = Math.floor(ms % 6e4 / 1e3); $("#cd").textContent = `অফার শেষ হবে: ${BN(h)} ঘণ্টা ${BN(m)} মিনিট ${BN(sc)} সেকেন্ড`; if (!ms) clearInterval(t) }; const t = setInterval(tick, 1000); tick() }
}

/* ---------- WhatsApp popup: once per visit, after the visitor scrolls ---------- */
function waPop() {
  let seen = false; try { seen = sessionStorage.getItem("esh_wp") } catch (e) { }
  if (seen) return;
  const show = () => { if (scrollY < 900 || !$("#sheet").hidden) return; removeEventListener("scroll", show); setTimeout(() => { if ($("#sheet").hidden) $("#wapop").hidden = false }, 1500) };
  addEventListener("scroll", show, { passive: true });
}
function closeWaPop() { $("#wapop").hidden = true; try { sessionStorage.setItem("esh_wp", 1) } catch (e) { } }

/* ---------- misc ---------- */
function reveal() {
  const els = $$(".rv-in:not(.vis)"); if (!("IntersectionObserver" in window)) return els.forEach(e => e.classList.add("vis"));
  const io = reveal.io || (reveal.io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); io.unobserve(e.target) } }), { rootMargin: "0px 0px -40px" }));
  els.forEach(e => io.observe(e));
}
function focusSearch() { $("#services").scrollIntoView({ behavior: "smooth" }); setTimeout(() => $("#q").focus({ preventScroll: true }), 450) }
function setLinks() {
  const st = D.site.store || {};
  $$("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener" });
  if (st.whatsapp) $("#cWa").textContent = "+" + waNum();
  const ms = st.messenger || (st.facebook ? st.facebook : ""); const cm = $("#cMs");
  if (ms) cm.href = /^https?:/.test(ms) ? ms : "https://m.me/" + ms; else { cm.href = "#contact"; cm.removeAttribute("target") }
  if (st.facebook) { $("#fbLink").href = st.facebook; $("#fbLink").hidden = false }
  if (st.email) { $("#cMail").href = "mailto:" + st.email; $("#cMailT").textContent = st.email }
  if (st.address) $("#cAddr").textContent = st.address;
}

async function init() {
  $("#yr").textContent = new Date().getFullYear();
  [D.products, D.categories, D.site, D.reviews, D.banners, D.collections] = await Promise.all([get("products", {}), get("categories", []), get("site", {}), get("reviews", []), get("banners", []), get("collections", [])]);
  const cats = buildServices();
  $("#stN").textContent = SV.length + "+";
  drawTabs(cats); render(); drawReviews(); setLinks();
  const mq = SV.slice(0, 24).map(s => `<a href="#order/${encodeURIComponent(s.key)}"><img src="${esc(s.img)}" alt="" loading="lazy" width="34" height="34">${esc(s.name)}</a>`).join("");
  $("#marq").innerHTML = mq + mq;
  $("#ftCats").innerHTML = cats.filter(c => SV.some(s => s.cat === c.k)).slice(0, 6).map(c => `<li><a href="#services" data-cat="${esc(c.k)}">${esc(c.name)}</a></li>`).join("");
  slider(); popular();
  $("#tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; CUR = t.dataset.k; $$(".tab").forEach(x => x.classList.toggle("on", x === t)); render(); t.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); const top = $("#tabs").getBoundingClientRect().top; if (top < 0 || top > 140) $("#services .tools").scrollIntoView({ behavior: "smooth" }) };
  $("#ftCats").onclick = e => { const a = e.target.closest("[data-cat]"); if (!a) return; const t = $(`.tab[data-k="${a.dataset.cat}"]`); t && t.click() };
  let qt; $("#q").oninput = e => { clearTimeout(qt); qt = setTimeout(() => { Q = e.target.value.trim().toLowerCase(); if (Q && CUR !== "all") { CUR = "all"; $$(".tab").forEach(x => x.classList.toggle("on", x.dataset.k === "all")) } render() }, 120) };
  $("#grid").onclick = e => { const c = e.target.closest(".card"); if (c) openOrder(c.dataset.s) };
  $("#grid").onkeydown = e => { if (e.key === "Enter") { const c = e.target.closest(".card"); if (c) openOrder(c.dataset.s) } };
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet() });
  document.addEventListener("click", e => { const a = e.target.closest('a[href^="#order/"]'); if (a) { e.preventDefault(); openOrder(decodeURIComponent(a.getAttribute("href").slice(7))) } if (e.target.closest("[data-wa]")) track("Contact") });
  const m = location.hash.match(/^#order\/(.+)/); if (m) openOrder(decodeURIComponent(m[1]));
  $("#trackForm").onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target), box = $("#trackRes"); box.hidden = false; box.textContent = "খোঁজা হচ্ছে…";
    const ST = { pending: "অপেক্ষমাণ", confirmed: "কনফার্মড", processing: "প্রসেসিং চলছে", shipped: "পাঠানো হয়েছে", delivered: "ডেলিভারি সম্পন্ন", cancelled: "বাতিল", returned: "ফেরত" };
    try { const r = await fetch(`shop-api.php?a=track&no=${encodeURIComponent(f.get("no").trim())}&phone=${encodeURIComponent(f.get("phone"))}`); const j = await r.json();
      box.innerHTML = j.error ? `<span style="color:#ff7b74">এই নম্বর ও ফোন দিয়ে কোনো অর্ডার পাওয়া যায়নি।</span>` : `<b>${esc(j.no)}</b> · <span class="st">${ST[j.status] || esc(j.status)}</span><p class="mu" style="margin:8px 0 0">মোট ${tk(j.total)} · ${new Date(j.t * 1000).toLocaleDateString("bn-BD")}</p>`;
    } catch (x) { box.textContent = "এখন ট্র্যাক করা যাচ্ছে না। WhatsApp এ অর্ডার নম্বর পাঠান।" }
  };
  // phone tab bar + nav highlight
  const secs = ["services", "how", "reviews", "faq", "track"].map(id => document.getElementById(id));
  const onScroll = () => { const y = scrollY + 120; let cur = "top"; secs.forEach(s => { if (s.offsetTop <= y) cur = s.id }); $$(".nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + cur)); $$(".tabbar a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + (cur === "how" || cur === "reviews" || cur === "faq" ? "services" : cur))) };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  reveal(); waPop();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });
  try { fetch("shop-api.php?a=hit&p=" + encodeURIComponent(location.pathname)) } catch (e) { }
}
init();
