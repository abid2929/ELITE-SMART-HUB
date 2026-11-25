/* Elite Smart Hub storefront: loads data/*.json (edited from /admin), shows services, takes orders through shop-api.php and WhatsApp. */
"use strict";
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const tk = n => "৳" + Number(n || 0).toLocaleString("en-IN");
const BN = s => String(s);
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

const CAT_TONES = [["#e11d2a","#ff7a59"],["#7c3aed","#c084fc"],["#0ea5e9","#38bdf8"],["#16a34a","#4ade80"],["#f97316","#fbbf24"],["#db2777","#f472b6"],["#0d9488","#2dd4bf"],["#4f46e5","#818cf8"],["#ca8a04","#facc15"],["#be123c","#fb7185"]];
const PAGE = document.body.dataset.page || "home";
const pURL = k => "product.html?s=" + encodeURIComponent(k);
const goP = k => { location.href = pURL(k) };
const shopURL = k => "services.html" + (k && k !== "all" ? "?c=" + encodeURIComponent(k) : "");
function cardHTML(s) {
  return `<article class="card rv-in" data-s="${esc(s.key)}" tabindex="0" aria-label="${esc(s.name)}">
   <div class="art"><img src="${esc(s.img)}" alt="${esc(s.name)}" loading="lazy" width="400" height="400" onerror="this.src='img/icon-512.png'">
    <div class="bdg">${s.bs ? '<span class="bs">Best Seller</span>' : ""}${s.nw ? '<span class="nw">New</span>' : ""}</div>${s.off >= 5 ? `<span class="off">-${s.off}%</span>` : ""}</div>
   <div class="bd"><h3>${esc(s.name)}</h3><p class="sd">${esc(s.sd)}</p>
    <div class="meta"><div class="price">${s.min ? `${tk(s.min)}${s.old ? `<s>${tk(s.old)}</s>` : ""}${s.plans.length > 1 ? ` <small>from</small>` : ""}` : '<small>Ask for price</small>'}</div><span class="plans">${s.plans.length} plan${s.plans.length > 1 ? "s" : ""}</span></div>
    <button class="btn red" type="button">Order Now</button></div></article>`;
}

function render() {
  const cats = (D.categories || []).filter(c => c.on !== 0).sort((a, b) => (a.order || 0) - (b.order || 0));
  const list = SV.filter(s => (CUR === "all" || s.cat === CUR) && (!Q || Q.split(/\s+/).every(w => s.find.includes(w))));
  let html = "";
  if (PAGE === "home" && !Q) {
    for (const c of cats) { const L = list.filter(s => s.cat === c.k); if (!L.length) continue; const top = [...L.filter(s => s.bs || s.ft), ...L.filter(s => !(s.bs || s.ft))].slice(0, 8); const ci = cats.indexOf(c) % CAT_TONES.length; html += `<div class="cat-blk" style="--c1:${CAT_TONES[ci][0]};--c2:${CAT_TONES[ci][1]}"><div class="cat-row"><h3 class="cat-h" id="c-${esc(c.k)}">${ico(c.ic)}${esc(c.name)}<i></i></h3><a class="see-all" href="${shopURL(c.k)}">View all ${L.length} →</a></div><div class="hrow">${top.map(cardHTML).join("")}</div></div>` }
  } else if (CUR === "all" && !Q) {
    for (const c of cats) { const L = list.filter(s => s.cat === c.k); if (!L.length) continue; html += `<h3 class="cat-h" id="c-${esc(c.k)}">${ico(c.ic)}${esc(c.name)}<i></i></h3><div class="grid">${L.map(cardHTML).join("")}</div>` }
  } else html = list.length ? `<div class="grid" style="margin-top:8px">${list.map(cardHTML).join("")}</div>` : "";
  $("#grid").innerHTML = html; $("#empty").hidden = !!list.length;
  reveal();
}
function drawTabs(cats) {
  const n = k => SV.filter(s => k === "all" || s.cat === k).length;
  $("#tabs").innerHTML = [{ k: "all", name: "All Services", ic: "all" }, ...cats].filter(c => n(c.k)).map(c => `<button class="tab ${CUR === c.k ? "on" : ""}" role="tab" data-k="${esc(c.k)}">${ico(c.ic)}${esc(c.name)} <small>${n(c.k)}</small></button>`).join("");
}

/* ---------- order sheet ---------- */
function openSheet(html) { $("#sheetBox").innerHTML = html; $("#sheet").hidden = false; document.body.style.overflow = "hidden"; setTimeout(() => { const f = $("#sheetBox .x"); f && f.focus({ preventScroll: true }) }, 60) }
function closeSheet() { $("#sheet").hidden = true; document.body.style.overflow = ""; if (/^#order\//.test(location.hash)) history.replaceState(null, "", location.pathname + location.search) }
function payMethods() { const p = D.site.payment || {}; const L = []; if (p.bkash) L.push(["bkash", "bKash", "#e2136e", p.bkash]); if (p.nagad) L.push(["nagad", "Nagad", "#f6921e", p.nagad]); if (p.rocket) L.push(["rocket", "Rocket", "#8c3494", p.rocket]); return L }
const PDI = {
  bolt: '<svg viewBox="0 0 24 24"><path d="M13 3L5 14h6l-1 7 8-11h-6z"/></svg>',
  shield: '<svg viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>',
  card: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>',
  chat: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>'
};
function productPage() {
  const key = new URLSearchParams(location.search).get("s") || "";
  const s = SV.find(x => x.key === key), box = $("#pd");
  if (!s) { box.innerHTML = `<div class="pd-nf"><h1>Service not found</h1><p>This service may have been removed or renamed.</p><a class="btn red lg" href="services.html">Browse all services</a></div>`; $("#rel").hidden = true; return }
  const cat = (D.categories || []).find(c => c.k === s.cat) || { name: "" };
  document.title = s.name + " | Elite Smart Hub";
  const md = document.querySelector('meta[name="description"]'); if (md) md.content = s.name + " in Bangladesh. " + (s.sd || "") + " Pay with bKash or Nagad, delivered in minutes.";
  $("#crumbCat").innerHTML = `<a href="${shopURL(s.cat)}">${esc(cat.name)}</a>`; $("#crumbName").textContent = s.name;
  let sel = s.plans.find(p => p.p === s.min) || s.plans[0];
  const lines = p => (p.d || "").split("\n").map(l => l.replace(/^•\s*/, "").trim()).filter(l => l && !/^Payment:/i.test(l) && !/^Plan:/i.test(l));
  const draw = () => {
    const save = sel.o > sel.p ? Math.round((sel.o - sel.p) / sel.o * 100) : 0;
    box.innerHTML = `<div class="pd-grid">
    <div class="pd-media"><div class="pd-art"><img src="${esc(s.img)}" alt="${esc(s.name)}" width="600" height="600"><div class="bdg">${s.bs ? '<span class="bs">Best Seller</span>' : ""}${s.nw ? '<span class="nw">New</span>' : ""}</div></div>
     <ul class="pd-trust"><li>${PDI.bolt}<span><b>Fast delivery</b>10-30 minutes</span></li><li>${PDI.shield}<span><b>Full guarantee</b>For the whole plan</span></li><li>${PDI.card}<span><b>bKash · Nagad</b>Easy payment</span></li><li>${PDI.chat}<span><b>24/7 support</b>On WhatsApp</span></li></ul></div>
    <div class="pd-info">
     <a class="pd-cat" href="${shopURL(s.cat)}">${esc(cat.name)}</a>
     <h1 class="pd-h">${esc(s.name)}</h1>
     <div class="pd-rate"><span class="stars">★★★★★</span><span>100% recommended</span><span class="pd-stock"><i></i>In stock</span></div>
     <p class="pd-sd">${esc(s.sd)}</p>
     <div class="pd-price"><b>${sel.p ? tk(sel.p) : "Ask for price"}</b>${sel.o > sel.p ? `<s>${tk(sel.o)}</s><span class="pd-save">Save ${save}%</span>` : ""}</div>
     <div class="pd-lbl">Choose your plan <span>${s.plans.length} option${s.plans.length > 1 ? "s" : ""}</span></div>
     <div class="pd-plans">${s.plans.map(p => `<button type="button" class="pd-plan${p.id === sel.id ? " on" : ""}" data-id="${esc(p.id)}"><i></i><span>${esc(p.t || p.n)}</span>${p.o > p.p ? `<s>${tk(p.o)}</s>` : ""}<b>${p.p ? tk(p.p) : "Ask"}</b></button>`).join("")}</div>
     <div class="pd-cta"><button class="btn red lg" type="button" id="pdBuy">Order Now · ${sel.p ? tk(sel.p) : "Ask"}</button><a class="btn wa lg" data-wa="Hello Elite Smart Hub, I want ${esc(s.name)} (${esc(sel.t || sel.n)})."><svg viewBox="0 0 24 24" class="f"><use href="#i-wa"/></svg>Ask on WhatsApp</a></div>
     <div class="pd-box"><h2>What you get</h2><ul class="pd-list">${lines(sel).map(l => `<li>${esc(l)}</li>`).join("")}</ul></div>
     <div class="pd-steps"><div><b>1</b><span>Choose a plan and order</span></div><div><b>2</b><span>Pay with bKash or Nagad</span></div><div><b>3</b><span>Get access on WhatsApp</span></div></div>
    </div></div>`;
    $$(".pd-plan").forEach(b => b.onclick = () => { sel = s.plans.find(p => p.id === b.dataset.id) || sel; draw() });
    $("#pdBuy").onclick = () => openOrder(s.key, sel.id);
    $$("[data-wa]", box).forEach(a => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener" });
  };
  draw();
  track("ViewContent", { content_name: s.name, value: s.min || 0, currency: "BDT" });
  const rel = SV.filter(x => x.cat === s.cat && x.key !== s.key).slice(0, 10);
  const more = rel.length < 5 ? SV.filter(x => x.bs && x.key !== s.key && x.cat !== s.cat).slice(0, 10 - rel.length) : [];
  $("#relRow").innerHTML = [...rel, ...more].map(cardHTML).join(""); $("#relAll").href = shopURL(s.cat);
}

function openOrder(key, planId) {
  const s = SV.find(x => x.key === key); if (!s) return;
  const sel = s.plans.find(p => p.id === planId) || s.plans[0];
  const need = ((sel.d || "").match(/You need:\s*(.+)/) || [])[1] || "Your email";
  const PM = payMethods();
  track("ViewContent", { content_name: s.name, value: sel.p || 0, currency: "BDT" });
  history.replaceState(null, "", "#order/" + encodeURIComponent(s.key));
  openSheet(`<div class="sh-h"><img src="${esc(s.img)}" alt=""><div><h3 id="shTitle">${esc(s.name)}</h3><p>${esc(s.sd)}</p></div><button class="x" type="button" onclick="closeSheet()" aria-label="Close">✕</button></div>
  <form class="sh-b" id="of" novalidate>
   <div><span class="lbl">Choose a plan</span><div class="pl">${s.plans.map(p => `<label><input type="radio" name="plan" value="${esc(p.id)}" ${p.id === sel.id ? "checked" : ""}><span>${esc(p.t || p.n)}</span>${p.o > p.p ? `<s>${tk(p.o)}</s>` : ""}<b>${p.p ? tk(p.p) : "Ask us"}</b></label>`).join("")}</div></div>
   <div class="info" id="pinfo"></div>
   <div class="f">
    <div class="r2"><label>Your name *<input name="name" required maxlength="80" autocomplete="name" placeholder="e.g. Rakib Hasan"></label><label>WhatsApp number *<input name="phone" required inputmode="numeric" maxlength="14" autocomplete="tel" placeholder="01XXXXXXXXX"></label></div>
    <label><span id="needL">${esc(need)}</span><input name="acc" maxlength="200" id="needI" placeholder="${esc(/ID/i.test(need) ? "e.g. 1234567890" : /link/i.test(need) ? "https://facebook.com/…" : "you@gmail.com")}"></label>
   </div>
   <div><span class="lbl">Payment method</span><div class="pm">${PM.map(([k, n, c], i) => `<label><input type="radio" name="pay" value="${k}" ${i === 0 ? "checked" : ""}><i class="c" style="background:${c}"></i>${n}</label>`).join("")}<label><input type="radio" name="pay" value="wa" ${PM.length ? "" : "checked"}>💬 Pay on WhatsApp</label></div></div>
   <div class="paybox" id="paybox"></div>
   <div class="f"><label>Note <i>(optional)</i><textarea name="note" maxlength="300" placeholder="Anything you want to tell us"></textarea></label></div>
   <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
   <div class="tot"><span>Total</span><b id="tot"></b></div>
   <p class="err" id="oerr" role="alert"></p>
   <button class="btn red lg" id="obtn">Confirm Order</button>
   <a class="btn ghost" data-wa-plan>Ask directly on WhatsApp</a>
  </form>`);
  const F = $("#of");
  const cur = () => s.plans.find(p => p.id === (new FormData(F).get("plan"))) || sel;
  const upd = () => {
    const p = cur(), pay = new FormData(F).get("pay"), pm = PM.find(x => x[0] === pay);
    $("#pinfo").textContent = p.d || ""; $("#tot").textContent = p.p ? tk(p.p) : "Ask us";
    const nd = ((p.d || "").match(/You need:\s*(.+)/) || [])[1] || "Your email"; $("#needL").textContent = nd;
    $("#paybox").innerHTML = pm ? `<div><b>Send Money</b> ${p.p ? `<b>${tk(p.p)}</b> ` : ""}to this ${pm[1]} number:</div><div class="num">${esc(pm[3])} <button type="button" onclick="navigator.clipboard&&navigator.clipboard.writeText('${esc(pm[3])}').then(()=>toast('Number copied ✓'))">Copy</button></div><label class="f" style="gap:5px;font-weight:600">Transaction ID (TrxID) *<input name="trx" maxlength="40" placeholder="e.g. 9GH7K2LM0P" autocomplete="off"></label>${D.site.payment?.note ? `<small class="mu">${esc(D.site.payment.note)}</small>` : ""}`
      : `<div>After you confirm the order, chat with us on WhatsApp and pay there. We will send you the payment number.</div>`;
    $("[data-wa-plan]").href = waLink(`Hello Elite Smart Hub, I want ${s.name} (${p.t || p.n}${p.p ? ", " + tk(p.p) : ""}).`); $("[data-wa-plan]").target = "_blank";
  };
  F.onchange = e => { if (e.target.name === "plan" || e.target.name === "pay") upd() };
  upd();
  F.onsubmit = async e => {
    e.preventDefault(); const fd = new FormData(F), p = cur(), err = $("#oerr"); err.textContent = "";
    const name = (fd.get("name") || "").trim(), phone = (fd.get("phone") || "").replace(/\D/g, "").replace(/^880/, "0").replace(/^88/, ""), acc = (fd.get("acc") || "").trim(), pay = fd.get("pay"), trx = (fd.get("trx") || "").trim();
    if (!name) return err.textContent = "Please write your name.";
    if (!/^01[3-9]\d{8}$/.test(phone)) return err.textContent = "Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).";
    if (pay !== "wa" && trx.length < 6) return err.textContent = "Please pay and enter the Transaction ID (or choose 'Pay on WhatsApp').";
    const b = $("#obtn"); b.disabled = true; b.textContent = "Placing order…";
    const body = { name, phone, address: acc, items: [{ id: p.id, q: 1 }], pay, trx, note: (fd.get("note") || "").trim(), website: fd.get("website") || "" };
    let j = null;
    try { const r = await fetch("shop-api.php?a=order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if ((r.headers.get("content-type") || "").includes("json")) j = await r.json() } catch (e) { }
    b.disabled = false; b.textContent = "Confirm Order";
    if (j && j.error) return err.textContent = j.error;
    const no = j && j.no ? j.no : "";
    const payTxt = pay === "wa" ? "I will pay on WhatsApp" : `${pay} · TrxID ${trx}`;
    const msg = `Hello Elite Smart Hub, I placed an order.${no ? `\nOrder no: ${no}` : ""}\nService: ${s.name}\nPlan: ${p.t || p.n}\nPrice: ${p.p ? tk(p.p) : "-"}\nName: ${name}\nNumber: ${phone}${acc ? `\nEmail/ID: ${acc}` : ""}\nPayment: ${payTxt}`;
    track("Purchase", { value: p.p || 0, currency: "BDT", content_name: s.name }, no);
    openSheet(`<div class="ok"><button class="x" type="button" onclick="closeSheet()" aria-label="Close" style="position:absolute;right:16px;top:16px">✕</button><div class="tick"><svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-10"/></svg></div>
      <h3>${no ? "Order placed, thank you!" : "Almost done!"}</h3>${no ? `<div class="no">${esc(no)}</div><p>Keep your order number. Now send us a WhatsApp message and we will activate it fast.</p>` : `<p>Tap the button below to send your order on WhatsApp.</p>`}
      <a class="btn wa lg" href="${esc(waLink(msg))}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" class="f"><use href="#i-wa"/></svg> Confirm on WhatsApp</a></div>`);
  };
}

/* ---------- reviews ---------- */
function drawReviews() {
  if (!$("#rvList")) return;
  const R = (D.reviews || []).filter(r => r.on);
  $("#rvList").innerHTML = R.length ? R.slice(0, 9).map(r => `<div class="rv rv-in"><span class="stars">${"★".repeat(Math.max(1, Math.min(5, r.stars || 5)))}</span><p>${esc(r.text)}</p><b>${esc(r.name)}</b><small>${esc(r.pet || "")}</small></div>`).join("")
    : `<p class="rv-empty">Tap "Write a review" to share your experience.</p>`;
}
function openReview() {
  openSheet(`<div class="sh-h"><img src="img/icon-192.png" alt=""><div><h3 id="shTitle">Write a review</h3><p>Your feedback means a lot to us</p></div><button class="x" type="button" onclick="closeSheet()" aria-label="Close">✕</button></div>
  <form class="sh-b f" id="rf"><label>Your name *<input name="name" required maxlength="60"></label><label>Which service did you buy?<select name="pid">${SV.map(s => `<option value="${esc(s.plans[0].id)}">${esc(s.name)}</option>`).join("")}</select></label>
   <label>Rating<select name="rating"><option value="5">★★★★★ Excellent</option><option value="4">★★★★ Good</option><option value="3">★★★ Okay</option><option value="2">★★ Poor</option><option value="1">★ Very poor</option></select></label>
   <label>Review *<textarea name="body" required maxlength="1000"></textarea></label><input class="hp" name="website" tabindex="-1" autocomplete="off"><p class="err" id="rerr"></p><button class="btn red">Send review</button></form>`);
  $("#rf").onsubmit = async e => {
    e.preventDefault(); const b = Object.fromEntries(new FormData(e.target)); let j = null;
    try { const r = await fetch("shop-api.php?a=review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }); if ((r.headers.get("content-type") || "").includes("json")) j = await r.json() } catch (x) { }
    if (j && j.error) return $("#rerr").textContent = j.error;
    closeSheet(); toast(j ? "Thank you! Your review will show after approval ✓" : "Thank you! (Reviews are not saved in the demo)");
  };
}

/* ---------- top banner slider (Admin › Hero Banners) ---------- */
let SL = { i: 0, n: 0, t: null };
function slider() {
  if (!$("#slTrack")) return;
  const B = (D.banners || []).filter(b => b.on && b.img); if (!B.length) return;
  const tr = $("#slTrack");
  tr.innerHTML = B.map((b, i) => `<a class="sl" href="${esc(b.link || "#services")}" aria-label="${esc(b.title || "Offer " + (i + 1))}" style="--bg:url('${esc(new URL(img(b.img), location.href).href)}')"><img src="${esc(img(b.img))}" alt="${esc(b.title || "")}" width="2560" height="720" ${i ? 'loading="lazy"' : 'fetchpriority="high"'}></a>`).join("");
  SL.n = B.length;
  $("#slDots").innerHTML = SL.n > 1 ? B.map((_, i) => `<button type="button" aria-label="Banner ${i + 1}" data-i="${i}"></button>`).join("") : "";
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
  if (!$("#popRow")) return;
  const col = (D.collections || []).find(c => c.on && (c.ids || []).length);
  let L = col ? SV.filter(s => s.plans.some(p => col.ids.includes(p.id))) : SV.filter(s => s.bs);
  if (!L.length) L = SV.filter(s => s.ft);
  $("#popRow").innerHTML = L.slice(0, 14).map(cardHTML).join("");
  $("#popular").hidden = !L.length;
  $("#popRow").onclick = e => { const c = e.target.closest(".card"); if (c) goP(c.dataset.s) };
  const dl = (D.site.cms || {}).deal || {}; let s = null, p = null;
  for (const x of SV) { const y = x.plans.find(q => q.id === dl.id); if (y) { s = x; p = y } }
  if (!s || !p) return;
  const ends = dl.ends ? new Date(dl.ends).getTime() : 0; if (ends && ends < Date.now()) return;
  const box = $("#deal"); box.hidden = false;
  box.innerHTML = `<img src="${esc(s.img)}" alt=""><div><span class="tg">⚡ Today's Offer</span><h3>${esc(s.name)}</h3><p>${esc(p.t || "")} · ${esc(s.sd)}</p>${ends ? '<div class="cd" id="cd"></div>' : ""}</div><div class="pz">${p.o > p.p ? `<s>${tk(p.o)}</s>` : ""}<b>${tk(p.p)}</b><span class="btn gold">Get it now</span></div>`;
  box.onclick = () => goP(s.key);
  if (ends) { const tick = () => { const ms = Math.max(0, ends - Date.now()), h = Math.floor(ms / 36e5), m = Math.floor(ms % 36e5 / 6e4), sc = Math.floor(ms % 6e4 / 1e3); $("#cd").textContent = `Offer ends in ${h}h ${m}m ${sc}s`; if (!ms) clearInterval(t) }; const t = setInterval(tick, 1000); tick() }
}

/* ---------- WhatsApp popup: once per visit, after the visitor scrolls ---------- */
function waPop() {
  let seen = false; try { seen = sessionStorage.getItem("esh_wp") } catch (e) { }
  if (seen) return;
  const show = () => { if (scrollY < 900 || !$("#sheet").hidden) return; removeEventListener("scroll", show); setTimeout(() => { const w = $("#wapop"); if (w && $("#sheet").hidden) w.hidden = false }, 1500) };
  addEventListener("scroll", show, { passive: true });
}
function closeWaPop() { $("#wapop").hidden = true; try { sessionStorage.setItem("esh_wp", 1) } catch (e) { } }

/* ---------- misc ---------- */
function reveal() {
  const els = $$(".rv-in:not(.vis)"); if (!("IntersectionObserver" in window)) return els.forEach(e => e.classList.add("vis"));
  const io = reveal.io || (reveal.io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("vis"); io.unobserve(e.target) } }), { rootMargin: "0px 0px -40px" }));
  els.forEach(e => io.observe(e));
}
function focusSearch() { if (PAGE !== "shop") return location.href = "services.html#q"; $("#services").scrollIntoView({ behavior: "smooth" }); setTimeout(() => $("#q").focus({ preventScroll: true }), 450) }
function setLinks() {
  const st = D.site.store || {};
  $$("[data-wa]").forEach(a => { a.href = waLink(a.dataset.wa); a.target = "_blank"; a.rel = "noopener" });
  if (!$("#cMs")) return;
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
  if (PAGE === "shop") { const c = new URLSearchParams(location.search).get("c"); if (c && cats.some(x => x.k === c)) CUR = c }
  if ($("#stN")) $("#stN").textContent = SV.length + "+";
  if (PAGE === "product") productPage(); else if ($("#grid")) { drawTabs(cats); render() } drawReviews(); setLinks();
  const mq = SV.slice(0, 24).map(s => `<a href="${pURL(s.key)}"><img src="${esc(s.img)}" alt="" loading="lazy" width="34" height="34">${esc(s.name)}</a>`).join("");
  if ($("#marq")) $("#marq").innerHTML = mq + mq;
  $("#ftCats").innerHTML = cats.filter(c => SV.some(s => s.cat === c.k)).slice(0, 6).map(c => `<li><a href="${shopURL(c.k)}">${esc(c.name)}</a></li>`).join("");
  slider(); popular();
  if ($("#tabs")) $("#tabs").onclick = e => { const t = e.target.closest(".tab"); if (!t) return; if (PAGE === "home") { location.href = shopURL(t.dataset.k); return } CUR = t.dataset.k; $$(".tab").forEach(x => x.classList.toggle("on", x === t)); render(); history.replaceState(null, "", shopURL(CUR)); t.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" }); const g = $("#services"); scrollTo({ top: g.getBoundingClientRect().top + scrollY - 70, behavior: "smooth" }) };
  let qt; if ($("#q")) $("#q").oninput = e => { clearTimeout(qt); qt = setTimeout(() => { Q = e.target.value.trim().toLowerCase(); if (Q && CUR !== "all") { CUR = "all"; $$(".tab").forEach(x => x.classList.toggle("on", x.dataset.k === "all")) } render() }, 120) };
  document.addEventListener("click", e => { const c = e.target.closest(".card[data-s]"); if (c && !c.closest("#popRow")) goP(c.dataset.s) });
  document.addEventListener("keydown", e => { if (e.key === "Enter") { const c = e.target.closest && e.target.closest(".card[data-s]"); if (c) goP(c.dataset.s) } });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#sheet").hidden) closeSheet() });
  document.addEventListener("click", e => { const a = e.target.closest('a[href^="#order/"]'); if (a) { e.preventDefault(); goP(decodeURIComponent(a.getAttribute("href").slice(7))) } if (e.target.closest("[data-wa]")) track("Contact") });
  const m = location.hash.match(/^#order\/(.+)/); if (m) { if (PAGE === "product") openOrder(decodeURIComponent(m[1])); else return goP(decodeURIComponent(m[1])) }
  if (PAGE === "shop" && location.hash === "#q") setTimeout(() => $("#q").focus(), 300);
  if ($("#trackForm")) $("#trackForm").onsubmit = async e => {
    e.preventDefault(); const f = new FormData(e.target), box = $("#trackRes"); box.hidden = false; box.textContent = "Searching…";
    const ST = { pending: "Pending", confirmed: "Confirmed", processing: "Processing", shipped: "Access sent", delivered: "Completed", cancelled: "Cancelled", returned: "Refunded" };
    try { const r = await fetch(`shop-api.php?a=track&no=${encodeURIComponent(f.get("no").trim())}&phone=${encodeURIComponent(f.get("phone"))}`); const j = await r.json();
      box.innerHTML = j.error ? `<span style="color:#ff7b74">No order found with this number and phone.</span>` : `<b>${esc(j.no)}</b> · <span class="st">${ST[j.status] || esc(j.status)}</span><p class="mu" style="margin:8px 0 0">Total ${tk(j.total)} · ${new Date(j.t * 1000).toLocaleDateString("en-GB")}</p>`;
    } catch (x) { box.textContent = "Tracking is not available right now. Send your order number on WhatsApp." }
  };
  document.addEventListener("click", e => { const a = e.target.closest('a[href="#top"]'); if (a) { e.preventDefault(); scrollTo({ top: 0, behavior: "smooth" }); history.replaceState(null, "", location.pathname + location.search) } });
  // phone tab bar + nav highlight
  const secs = ["services", "how", "reviews", "faq", "track"].map(id => document.getElementById(id)).filter(Boolean);
  const onScroll = () => { const y = scrollY + 120; let cur = "top"; secs.forEach(s => { if (s.offsetTop <= y) cur = s.id }); $$(".nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + cur)); $$(".tabbar a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#" + (cur === "how" || cur === "reviews" || cur === "faq" ? "services" : cur))) };
  // nav highlight is static per page now
  reveal(); waPop();
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => { });
  try { fetch("shop-api.php?a=hit&p=" + encodeURIComponent(location.pathname)) } catch (e) { }
}
init();
