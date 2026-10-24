(function () {
  "use strict";

  /* ===== Estadísticas de visitas (apagadas hasta tener cuenta) =====
     Para activarlas: crea una cuenta gratis en GoatCounter, elige un código
     (por ejemplo "masertec") y escríbelo aquí: var GC_CODE = "masertec";
     Si queda vacío no se carga nada y no se envía ningún dato.
     Solo se cuentan visitas y clics, nunca nombres, teléfonos ni mensajes. */
  var GC_CODE = "";

  var PAGE = document.body.getAttribute("data-page") || "";
  function $(id) { return document.getElementById(id); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]; }); }
  function norm(t) { return String(t).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  /* ---------- estadísticas ---------- */
  function track(name) {
    try {
      if (GC_CODE && window.goatcounter && window.goatcounter.count)
        window.goatcounter.count({ path: "evento/" + name, title: name, event: true });
    } catch (e) {}
  }
  if (GC_CODE) {
    var gcs = document.createElement("script");
    gcs.async = true;
    gcs.src = "https://gc.zgo.at/count.js";
    gcs.setAttribute("data-goatcounter", "https://" + GC_CODE + ".goatcounter.com/count");
    document.head.appendChild(gcs);
    var pv = $("privacy");
    if (pv) {
      var p = document.createElement("p");
      p.innerHTML = "<b>Estadísticas.</b> Contamos las visitas y los clics de forma anónima con GoatCounter, sin cookies y sin guardar datos personales.";
      pv.appendChild(p);
    }
  }

  /* ---------- cotización (se conserva al cambiar de página) ---------- */
  var picked = [];
  try {
    var raw = JSON.parse(sessionStorage.getItem("mt-picked") || "[]");
    if (Array.isArray(raw)) picked = raw.filter(function (x) { return typeof x === "string"; });
  } catch (e) {}
  function persist() { try { sessionStorage.setItem("mt-picked", JSON.stringify(picked)); } catch (e) {} }
  if (PAGE === "gracias") { picked = []; persist(); }

  var toastEl = $("toast"), toastMsg = $("toast-msg"), liveEl = $("live"), toastT = null;
  var qbar = $("qbar"), qn = $("qn"), qlabel = $("qlabel");
  var pickedEl = $("picked"), fsv = $("f-services");

  function updateDock() {
    if (!qbar) return;
    var n = picked.length;
    qn.textContent = n;
    qlabel.textContent = n === 1 ? "elegido" : "elegidos";
    qbar.hidden = !(n > 0 && PAGE !== "contacto");
    document.body.classList.toggle("has-qbar", !qbar.hidden);
  }
  function notify(name, added) {
    var n = picked.length;
    var msg = (added ? "Agregado: " : "Quitado: ") + name + (n ? ". Llevas " + n + "." : ". Tu lista está vacía.");
    if (liveEl) { liveEl.textContent = ""; setTimeout(function () { liveEl.textContent = msg; }, 30); }
    if (PAGE === "contacto" || !toastEl) return;
    toastMsg.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.hidden = true; }, 3600);
  }
  function renderPicked() {
    var pc = $("pick-count");
    if (pc) pc.textContent = picked.length ? "(" + picked.length + (picked.length === 1 ? " elegido)" : " elegidos)") : "";
    var em = $("e-msg"); if (em) em.hidden = true;
    if (fsv) fsv.value = picked.join(", ");
    var ddl = $("dd-label");
    if (ddl) ddl.textContent = picked.length ? picked.length + (picked.length === 1 ? " seleccionado" : " seleccionados") : "Selecciona servicios o materiales";
    if (pickedEl) {
      pickedEl.innerHTML = "";
      if (!picked.length) {
        var e = document.createElement("span");
        e.className = "empty";
        e.textContent = "Ninguno todavía. Abre la lista y marca lo que necesitas, o descríbelo en el mensaje.";
        pickedEl.appendChild(e);
      }
      picked.forEach(function (name) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "chip"; b.setAttribute("aria-label", "Quitar " + name);
        b.innerHTML = esc(name) + ' <span aria-hidden="true">×</span>';
        b.addEventListener("click", function () { toggle(name); });
        pickedEl.appendChild(b);
      });
    }
    qsa(".add,.opt").forEach(function (btn) {
      var on = picked.indexOf(btn.getAttribute("data-name")) > -1;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (btn.classList.contains("add"))
        btn.textContent = on ? "Agregado ✓" : (btn.getAttribute("data-label") || "Agregar a cotización");
    });
    persist();
    updateDock();
  }
  function toggle(name) {
    var i = picked.indexOf(name), added = i === -1;
    if (added) picked.push(name); else picked.splice(i, 1);
    renderPicked();
    notify(name, added);
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest && ev.target.closest(".add,.opt");
    if (b) toggle(b.getAttribute("data-name"));
  });
  renderPicked();

  /* ---------- menú desplegable de servicios y materiales ---------- */
  var dd = $("dd"), ddBtn = $("dd-btn"), ddPanel = $("opts");
  if (dd && ddBtn && ddPanel) {
    var setDd = function (open) {
      ddPanel.hidden = !open;
      ddBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        var r = ddPanel.getBoundingClientRect(), over = r.bottom - window.innerHeight + 16;
        if (over > 0) { try { window.scrollBy({ top: over, behavior: "instant" }); } catch (e) { window.scrollBy(0, over); } }
      }
    };
    ddBtn.addEventListener("click", function () { setDd(ddPanel.hidden); });
    $("dd-done").addEventListener("click", function () { setDd(false); ddBtn.focus(); });
    document.addEventListener("click", function (ev) { if (!ddPanel.hidden && !dd.contains(ev.target)) setDd(false); });
    dd.addEventListener("keydown", function (e) { if (e.key === "Escape" && !ddPanel.hidden) { setDd(false); ddBtn.focus(); } });
    dd.addEventListener("focusout", function (e) { if (!ddPanel.hidden && e.relatedTarget && !dd.contains(e.relatedTarget)) setDd(false); });
  }

  /* ---------- filtros de servicios ---------- */
  var cardsEl = $("cards");
  if (cardsEl) {
    var fq = $("s-q"), fcount = $("s-count"), fempty = $("s-empty"), fg = "all", prob = null;
    var probChips = qsa("#prob .pchip");
    var groupChips = qsa(".fchip[data-g]");
    var paintProb = function () { probChips.forEach(function (b) { b.setAttribute("aria-pressed", b === prob ? "true" : "false"); }); };
    var applyFilter = function () {
      var q = norm(fq.value.trim()), shown = 0, perG = {};
      var codes = prob ? prob.getAttribute("data-codes").split(",") : null;
      qsa(".card", cardsEl).forEach(function (c) {
        var ok = (fg === "all" || c.getAttribute("data-g") === fg) &&
                 (!q || c.getAttribute("data-text").indexOf(q) > -1) &&
                 (!codes || codes.indexOf(c.getAttribute("data-code")) > -1);
        c.hidden = !ok;
        if (ok) { shown++; perG[c.getAttribute("data-g")] = true; }
      });
      qsa(".group-label", cardsEl).forEach(function (l) { l.hidden = !perG[l.getAttribute("data-g")]; });
      fcount.textContent = prob
        ? "Para «" + prob.textContent + "» te recomendamos " + shown + (shown === 1 ? " servicio" : " servicios") + ". Pulsa Todos para ver los 15."
        : "Mostrando " + shown + " de 15 servicios";
      fempty.hidden = shown > 0;
    };
    probChips.forEach(function (b) {
      b.addEventListener("click", function () {
        prob = (prob === b) ? null : b;
        if (prob) {
          fg = "all"; fq.value = "";
          groupChips.forEach(function (o) { o.setAttribute("aria-pressed", o.getAttribute("data-g") === "all" ? "true" : "false"); });
        }
        paintProb(); applyFilter();
      });
    });
    fq.addEventListener("input", function () { prob = null; paintProb(); applyFilter(); });
    groupChips.forEach(function (b) {
      b.addEventListener("click", function () {
        fg = b.getAttribute("data-g"); prob = null; paintProb();
        groupChips.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        applyFilter();
      });
    });
    applyFilter();
  }

  /* ---------- formulario de cotización (Netlify Forms) ---------- */
  var form = $("quote");
  var currentMsg = "";
  function fallbackCopy(node) {
    var r = document.createRange(); r.selectNodeContents(node);
    var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
  }
  function copy(text, node, done) {
    try { navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(node); }); }
    catch (e) { fallbackCopy(node); }
  }
  if (form) {
    var result = $("result"), out = $("out"), state = $("copy-state"), sendBtn = $("send-btn"), sending = false;
    form.addEventListener("input", function (e) {
      var er = e.target.parentNode && e.target.parentNode.querySelector ? e.target.parentNode.querySelector(".err") : null;
      if (er) er.hidden = true;
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (sending) return;
      var name = $("f-name").value.trim(), phone = $("f-phone").value.trim(), email = $("f-email").value.trim();
      var type = $("f-type").value, msg = $("f-msg").value.trim();
      var bad = false;
      function err(id, show) { $(id).hidden = !show; if (show) bad = true; }
      err("e-name", name.length < 2);
      err("e-phone", phone.replace(/\D/g, "").length < 10);
      err("e-email", email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email));
      err("e-msg", !msg && !picked.length);
      if (bad) {
        result.hidden = true;
        var first = form.querySelector(".err:not([hidden])");
        var inp = first && first.parentNode.querySelector("input,textarea");
        if (inp) inp.focus();
        return;
      }
      var lines = ["Hola MASERTEC, quisiera una cotización."];
      lines.push("Nombre o empresa: " + name);
      lines.push("Tipo de cliente: " + type);
      lines.push("Mi teléfono: " + phone);
      if (email) lines.push("Mi correo: " + email);
      if (picked.length) lines.push("Me interesa: " + picked.join(", "));
      if (msg) lines.push("Detalle: " + msg);
      currentMsg = lines.join("\n");

      sending = true;
      sendBtn.disabled = true;
      sendBtn.textContent = "Enviando…";
      result.hidden = true;
      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString()
      }).then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        track("solicitud-enviada");
        picked = []; persist();
        window.location.href = "gracias.html";
      }).catch(function (err) {
        try { console.error("Envío del formulario falló:", err); } catch (e) {}
        var det = $("err-detail");
        if (det) det.textContent = err && err.message ? " (" + err.message + ")" : "";
        sending = false;
        sendBtn.disabled = false;
        sendBtn.textContent = "Enviar solicitud";
        out.textContent = currentMsg;
        $("wa-link").href = "https://wa.me/18293657007?text=" + encodeURIComponent(currentMsg);
        var subj = "Solicitud de cotización - " + name;
        $("gmail-link").href = "https://mail.google.com/mail/?view=cm&to=" + encodeURIComponent("masertecma@gmail.com") + "&su=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(currentMsg);
        $("mail-link").href = "mailto:masertecma@gmail.com?subject=" + encodeURIComponent(subj) + "&body=" + encodeURIComponent(currentMsg);
        result.hidden = false;
        try { result.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
      });
    });
    $("copy-msg").addEventListener("click", function () {
      copy(currentMsg, out, function () { state.textContent = "Mensaje copiado."; });
    });
  }
  qsa(".copy[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var t = b.getAttribute("data-copy"), old = b.textContent;
      copy(t, b.parentNode, function () { b.textContent = "Copiado"; setTimeout(function () { b.textContent = old; }, 1600); });
    });
  });

  /* ---------- clics a medir (si hay contador) ---------- */
  document.addEventListener("click", function (ev) {
    var t = ev.target.closest && ev.target.closest("a,button");
    if (!t) return;
    if (t.id === "wa-link" || t.classList.contains("wa-link") || t.classList.contains("wa-btn")) track("clic-whatsapp");
    else if (t.id === "gmail-link" || t.id === "mail-link") track("clic-correo");
    else if (t.id === "copy-msg") track("copiar-mensaje");
    else if (t.classList.contains("pdf-dl")) track("descarga-catalogo");
    else if (t.classList.contains("add") || t.classList.contains("opt")) track("cotizacion-agregar");
  });

  /* ---------- menú móvil, saltar al contenido, tema ---------- */
  var topEl = document.querySelector(".top"), mbtn = $("menu-btn");
  function setMenu(open) {
    topEl.classList.toggle("open", open);
    mbtn.setAttribute("aria-expanded", open ? "true" : "false");
    mbtn.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  }
  mbtn.addEventListener("click", function () { setMenu(!topEl.classList.contains("open")); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && topEl.classList.contains("open")) { setMenu(false); mbtn.focus(); }
  });
  $("skip").addEventListener("click", function () { var m = $("principal"); if (m) setTimeout(function () { m.focus(); }, 0); });

  var root = document.documentElement, tbtn = $("theme-btn");
  var SUN = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>';
  function effective() {
    var t = root.getAttribute("data-theme");
    if (t === "light" || t === "dark") return t;
    return (window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  }
  function paintTheme() {
    var light = effective() === "light";
    tbtn.innerHTML = light ? MOON : SUN;
    tbtn.setAttribute("aria-label", light ? "Cambiar a modo oscuro" : "Cambiar a modo claro");
  }
  paintTheme();
  tbtn.addEventListener("click", function () {
    var next = effective() === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("mt-theme", next); } catch (e) {}
    paintTheme();
  });
  try { matchMedia("(prefers-color-scheme: light)").addEventListener("change", paintTheme); } catch (e) {}
})();
