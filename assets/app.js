/* ==========================================================================
   Dr. Ersin Gündeğer — Shared Interactive Application Logic
   i18n (TR/EN + URL param), Theme, Mobile Drawer, Filters, Live R&D Sandbox
   ========================================================================== */

(function () {
  'use strict';

  /* ── 1. LANGUAGE DETECTION & SWITCHING ── */
  function detectInitialLang() {
    try {
      var params = new URLSearchParams(window.location.search);
      var qLang = params.get('lang');
      if (qLang === 'en' || qLang === 'tr') return qLang;
      var saved = localStorage.getItem('lang');
      if (saved === 'en' || saved === 'tr') return saved;
    } catch (e) { /* ignore */ }
    var navLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    return navLang.indexOf('tr') === 0 ? 'tr' : 'en';
  }

  var currentLang = detectInitialLang();

  function setLang(lang, updateUrl) {
    if (lang !== 'en' && lang !== 'tr') lang = 'en';
    currentLang = lang;
    document.documentElement.lang = lang;
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }

    if (updateUrl && window.history && window.history.replaceState) {
      try {
        var url = new URL(window.location.href);
        url.searchParams.set('lang', lang);
        window.history.replaceState({}, '', url.toString());
      } catch (e) { /* ignore */ }
    }

    var btnEn = document.getElementById('btn-en');
    var btnTr = document.getElementById('btn-tr');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    if (btnTr) btnTr.classList.toggle('active', lang === 'tr');

    var titleEl = document.querySelector('title[data-en][data-tr]');
    if (titleEl) {
      document.title = titleEl.getAttribute('data-' + lang) || document.title;
    }

    document.querySelectorAll('[data-en][data-tr]').forEach(function (el) {
      if (el.tagName === 'TITLE') return;
      var val = el.getAttribute('data-' + lang);
      if (val == null) return;
      if (val.indexOf('<') !== -1) {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    });

    document.querySelectorAll('[data-placeholder-en][data-placeholder-tr]').forEach(function (el) {
      var ph = el.getAttribute('data-placeholder-' + lang);
      if (ph != null) el.placeholder = ph;
    });

    /* Propagate active lang to internal page links (index.html <-> speaking.html) */
    document.querySelectorAll('a[data-keep-lang]').forEach(function (a) {
      var base = a.getAttribute('data-base-href') || a.getAttribute('href');
      if (!a.getAttribute('data-base-href')) a.setAttribute('data-base-href', base);
      var parts = base.split('#');
      var path = parts[0];
      var hash = parts[1] ? '#' + parts[1] : '';
      var sep = path.indexOf('?') === -1 ? '?' : '&';
      a.setAttribute('href', path + sep + 'lang=' + lang + hash);
    });

    window.dispatchEvent(new CustomEvent('site:langchange', { detail: { lang: lang } }));
  }

  window.setLang = function (lang) { setLang(lang, true); };
  window.getSiteLang = function () { return currentLang; };

  /* ── 2. THEME & FONT SCALE ── */
  function setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.textContent = theme === 'dark' ? '☀' : '☾';
      btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    }
  }

  var fontScale = 1;
  try { fontScale = parseFloat(localStorage.getItem('fontScale')) || 1; } catch (e) { fontScale = 1; }

  function applyFontScale() {
    fontScale = Math.min(1.25, Math.max(0.88, Math.round(fontScale * 100) / 100));
    document.documentElement.style.fontSize = (16 * fontScale) + 'px';
    try { localStorage.setItem('fontScale', String(fontScale)); } catch (e) { /* ignore */ }
  }

  /* ── 3. MOBILE NAVIGATION DRAWER ── */
  function initMobileNav() {
    var toggle = document.getElementById('mobile-toggle');
    var drawer = document.getElementById('mobile-drawer');
    if (!toggle || !drawer) return;

    function setOpen(open) {
      drawer.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '☰';
    }

    toggle.addEventListener('click', function () {
      setOpen(!drawer.classList.contains('open'));
    });

    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) setOpen(false);
    });
  }

  /* ── 4. CONSULTING ACCORDION, FILTERS & PRE-FILL CTA ── */
  function initConsulting() {
    document.querySelectorAll('.srv-head').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.srv-item');
        if (!item) return;
        var wasOpen = item.classList.contains('open');
        document.querySelectorAll('.srv-item.open').forEach(function (el) {
          el.classList.remove('open');
          var h = el.querySelector('.srv-head');
          if (h) h.setAttribute('aria-expanded', 'false');
        });
        if (!wasOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    /* Filter bar for Consulting Services */
    document.querySelectorAll('[data-srv-filter]').forEach(function (fBtn) {
      fBtn.addEventListener('click', function () {
        var cat = fBtn.getAttribute('data-srv-filter');
        document.querySelectorAll('[data-srv-filter]').forEach(function (b) {
          b.classList.toggle('active', b === fBtn);
        });
        document.querySelectorAll('.srv-item').forEach(function (item) {
          var itemCat = item.getAttribute('data-cat') || '';
          var match = cat === 'all' || itemCat.indexOf(cat) !== -1;
          item.hidden = !match;
        });
      });
    });

    /* Pre-fill Inquiry Composer from any [data-inquire] button */
    document.querySelectorAll('[data-inquire]').forEach(function (cta) {
      cta.addEventListener('click', function (e) {
        var topic = cta.getAttribute('data-inquire');
        var contactSec = document.getElementById('contact');
        var topicSel = document.getElementById('inq-topic');
        if (contactSec && topicSel) {
          e.preventDefault();
          for (var i = 0; i < topicSel.options.length; i++) {
            if (topicSel.options[i].value === topic) {
              topicSel.selectedIndex = i;
              break;
            }
          }
          contactSec.scrollIntoView({ behavior: 'smooth' });
          setTimeout(function () {
            var nameInput = document.getElementById('inq-name');
            if (nameInput) nameInput.focus({ preventScroll: true });
          }, 550);
        }
      });
    });
  }

  /* ── 5. INTERACTIVE LAB SHOWCASE FILTERS ── */
  function initLabFilters() {
    document.querySelectorAll('[data-lab-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-lab-filter');
        document.querySelectorAll('[data-lab-filter]').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        document.querySelectorAll('.lab-card').forEach(function (card) {
          var c = card.getAttribute('data-lab-cat') || '';
          card.hidden = !(cat === 'all' || c.indexOf(cat) !== -1);
          if (cat !== 'all') {
            card.classList.remove('featured');
          } else if (card.hasAttribute('data-default-featured')) {
            card.classList.add('featured');
          }
        });
      });
    });
  }

  /* ── 6. LIVE SCIENTIFIC METHODOLOGY SANDBOX (DoE RSM + CADD Pocket) ── */
  function initSandbox() {
    var shell = document.getElementById('sandbox');
    if (!shell) return;

    /* Tabs */
    var tabs = shell.querySelectorAll('[data-sb-tab]');
    var panes = shell.querySelectorAll('.sb-pane');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-sb-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        panes.forEach(function (p) { p.classList.toggle('active', p.id === 'sb-' + target); });
        if (target === 'doe') drawDoe();
        if (target === 'cadd') drawCadd();
      });
    });

    /* --- PANE A: DoE Response Surface Methodology (RSM) --- */
    var doeCanvas = document.getElementById('doe-canvas');
    var phSlider = document.getElementById('doe-ph');
    var tempSlider = document.getElementById('doe-temp');
    var optBtn = document.getElementById('doe-opt-btn');

    function evalRsm(ph, temp) {
      /* Coded variables around optimal sweet spot (pH 7.05, Temp 32.6 C) */
      var x1 = (ph - 7.05) / 0.45;
      var x2 = (temp - 32.6) / 2.8;
      var titer = 4.85 - 0.68 * x1 * x1 - 0.54 * x2 * x2 - 0.24 * x1 * x2 + 0.08 * x1 - 0.06 * x2;
      titer = Math.max(1.1, Math.min(4.95, titer));
      /* Glycan similarity peaks slightly cooler & neutral pH */
      var glycan = 96.4 - 4.1 * (x1 + 0.12) * (x1 + 0.12) - 3.6 * (x2 + 0.18) * (x2 + 0.18);
      glycan = Math.max(72.0, Math.min(97.2, glycan));
      var d1 = Math.max(0, Math.min(1, (titer - 1.5) / 3.35));
      var d2 = Math.max(0, Math.min(1, (glycan - 78.0) / 18.4));
      var desir = Math.sqrt(d1 * d2);
      return { titer: titer, glycan: glycan, desir: desir };
    }

    function drawDoe() {
      if (!doeCanvas || !phSlider || !tempSlider) return;
      var rect = doeCanvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = Math.max(300, Math.floor(rect.width));
      var H = 270;
      doeCanvas.width = W * dpr;
      doeCanvas.height = H * dpr;
      var ctx = doeCanvas.getContext('2d');
      ctx.scale(dpr, dpr);

      var padL = 48, padR = 18, padT = 18, padB = 34;
      var pw = W - padL - padR;
      var phH = H - padT - padB;

      ctx.fillStyle = '#080f1d';
      ctx.fillRect(0, 0, W, H);

      /* Heatmap grid */
      var cols = 56, rows = 38;
      var cw = pw / cols, ch = phH / rows;
      for (var r = 0; r < rows; r++) {
        var tVal = 37.0 - (r / (rows - 1)) * (37.0 - 28.0);
        for (var c = 0; c < cols; c++) {
          var pVal = 6.2 + (c / (cols - 1)) * (7.8 - 6.2);
          var d = evalRsm(pVal, tVal).desir;
          /* Interpolate deep navy -> biopharma teal -> warm amber peak */
          var red, grn, blu;
          if (d < 0.6) {
            var k = d / 0.6;
            red = Math.round(12 + k * 24);
            grn = Math.round(26 + k * 128);
            blu = Math.round(52 + k * 88);
          } else {
            var k2 = (d - 0.6) / 0.4;
            red = Math.round(36 + k2 * 209);
            grn = Math.round(154 + k2 * 12);
            blu = Math.round(140 - k2 * 82);
          }
          ctx.fillStyle = 'rgb(' + red + ',' + grn + ',' + blu + ')';
          ctx.fillRect(padL + c * cw, padT + r * ch, cw + 0.8, ch + 0.8);
        }
      }

      /* Iso-desirability rings around optimum */
      var optX = padL + ((7.01 - 6.2) / 1.6) * pw;
      var optY = padT + ((37.0 - 32.3) / 9.0) * phH;
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1;
      [0.18, 0.34, 0.52, 0.72].forEach(function (rad) {
        ctx.beginPath();
        ctx.ellipse(optX, optY, pw * rad * 0.52, phH * rad * 0.55, -0.22, 0, Math.PI * 2);
        ctx.stroke();
      });

      /* CCD Design Points (Factorial + Axial + Center) */
      var ccdPts = [
        [6.55, 30.0], [7.45, 30.0], [6.55, 35.0], [7.45, 35.0],
        [6.36, 32.5], [7.64, 32.5], [7.0, 29.0], [7.0, 36.0], [7.0, 32.5]
      ];
      ccdPts.forEach(function (pt) {
        var x = padL + ((pt[0] - 6.2) / 1.6) * pw;
        var y = padT + ((37.0 - pt[1]) / 9.0) * phH;
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.fill();
      });

      /* Current operating point crosshair */
      var curPh = parseFloat(phSlider.value);
      var curT = parseFloat(tempSlider.value);
      var cx = padL + ((curPh - 6.2) / 1.6) * pw;
      var cy = padT + ((37.0 - curT) / 9.0) * phH;

      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, padT); ctx.lineTo(cx, padT + phH);
      ctx.moveTo(padL, cy); ctx.lineTo(padL + pw, cy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#080f1d';
      ctx.stroke();

      /* Axes labels */
      ctx.fillStyle = '#9fb0d0';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('pH 6.2', padL + 18, H - 10);
      ctx.fillText(currentLang === 'tr' ? 'Biyoreaktör pH →' : 'Bioreactor pH →', padL + pw / 2, H - 10);
      ctx.fillText('pH 7.8', padL + pw - 18, H - 10);

      ctx.save();
      ctx.translate(15, padT + phH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(currentLang === 'tr' ? 'Sıcaklık (°C)' : 'Temp (°C)', 0, 0);
      ctx.restore();

      /* Update KPI readouts */
      var res = evalRsm(curPh, curT);
      var elPh = document.getElementById('val-ph');
      var elT = document.getElementById('val-temp');
      var elTiter = document.getElementById('kpi-titer');
      var elGly = document.getElementById('kpi-glycan');
      var elDes = document.getElementById('kpi-desir');
      if (elPh) elPh.textContent = curPh.toFixed(2);
      if (elT) elT.textContent = curT.toFixed(1) + ' °C';
      if (elTiter) elTiter.textContent = res.titer.toFixed(2) + ' g/L';
      if (elGly) elGly.textContent = res.glycan.toFixed(1) + '%';
      if (elDes) {
        elDes.textContent = res.desir.toFixed(2);
        elDes.style.color = res.desir >= 0.85 ? '#34d399' : (res.desir >= 0.6 ? '#f59e42' : '#f87171');
      }
    }

    if (phSlider && tempSlider) {
      phSlider.addEventListener('input', drawDoe);
      tempSlider.addEventListener('input', drawDoe);
    }

    if (doeCanvas && phSlider && tempSlider) {
      doeCanvas.addEventListener('click', function (e) {
        var r = doeCanvas.getBoundingClientRect();
        var padL = 48, padR = 18, padT = 18, padB = 34;
        var pw = r.width - padL - padR;
        var phH = 270 - padT - padB;
        var x = Math.max(0, Math.min(pw, e.clientX - r.left - padL));
        var y = Math.max(0, Math.min(phH, e.clientY - r.top - padT));
        phSlider.value = (6.2 + (x / pw) * 1.6).toFixed(2);
        tempSlider.value = (37.0 - (y / phH) * 9.0).toFixed(1);
        drawDoe();
      });
    }

    if (optBtn && phSlider && tempSlider) {
      optBtn.addEventListener('click', function () {
        phSlider.value = '7.01';
        tempSlider.value = '32.3';
        drawDoe();
      });
    }

    /* --- PANE B: Structure-Based CADD & ADMET Triage --- */
    var caddCanvas = document.getElementById('cadd-canvas');
    var activeLig = 'lead';
    var ligands = {
      hit: {
        dg: '-7.4 kcal/mol', ki: '3.80 µM', rmsd: '2.1 Å',
        sol: 62, perm: 74, herg: 54, stab: 58,
        bonds: [[0, 1], [2, 3]], color: '#58a6ff',
        verdictTr: 'Sanal tarama hit adayı: orta afinite, hERG ve metabolik stabilite optimizasyonu gerekli.',
        verdictEn: 'Virtual screening hit: moderate affinity; requires hERG and metabolic stability lead optimization.'
      },
      lead: {
        dg: '-10.2 kcal/mol', ki: '0.032 µM', rmsd: '0.9 Å',
        sol: 86, perm: 89, herg: 94, stab: 91,
        bonds: [[0, 0], [1, 1], [2, 2], [3, 3]], color: '#f59e42',
        verdictTr: 'Optimize Öncü (DFT + 100 ns MD doğrulamalı): 4 kararlı H-bağı, düşük RMSD ve temiz ADMET profili.',
        verdictEn: 'Optimized Lead (DFT + 100 ns MD validated): 4 stable H-bonds, sub-Å RMSD, clean ADMET profile.'
      },
      decoy: {
        dg: '-5.8 kcal/mol', ki: '56.4 µM', rmsd: '4.6 Å',
        sol: 38, perm: 45, herg: 32, stab: 29,
        bonds: [[1, 2]], color: '#f87171',
        verdictTr: 'Yanlış pozitif (Sterik çakışma): Statik docking skoru yanıltıcı; MD simülasyonunda cepten ayrılıyor.',
        verdictEn: 'False positive (Steric clash): Misleading static score; drifts out of binding pocket during MD.'
      }
    };

    function drawCadd() {
      if (!caddCanvas) return;
      var rect = caddCanvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var W = Math.max(300, Math.floor(rect.width));
      var H = 270;
      caddCanvas.width = W * dpr;
      caddCanvas.height = H * dpr;
      var ctx = caddCanvas.getContext('2d');
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#080f1d';
      ctx.fillRect(0, 0, W, H);

      var cx = W / 2, cy = H / 2;
      var lig = ligands[activeLig];

      /* Binding cavity surface contour */
      var grad = ctx.createRadialGradient(cx, cy, 18, cx, cy, 118);
      grad.addColorStop(0, 'rgba(52, 211, 153, 0.14)');
      grad.addColorStop(0.7, 'rgba(28, 56, 98, 0.22)');
      grad.addColorStop(1, 'rgba(8, 15, 29, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 132, 92, -0.12, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(88, 166, 255, 0.34)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 116, 78, -0.12, 0, Math.PI * 2);
      ctx.stroke();

      /* Pocket residues */
      var residues = [
        { name: 'ASP-189', x: cx - 92, y: cy - 38 },
        { name: 'SER-195', x: cx + 88, y: cy - 42 },
        { name: 'HIS-57',  x: cx - 86, y: cy + 46 },
        { name: 'TRP-215', x: cx + 92, y: cy + 42 }
      ];

      var shiftX = activeLig === 'decoy' ? 22 : 0;
      var shiftY = activeLig === 'decoy' ? -14 : 0;
      var atoms = [
        { x: cx - 34 + shiftX, y: cy - 10 + shiftY },
        { x: cx + 28 + shiftX, y: cy - 14 + shiftY },
        { x: cx - 20 + shiftX, y: cy + 20 + shiftY },
        { x: cx + 34 + shiftX, y: cy + 18 + shiftY }
      ];

      /* Dashed H-bonds */
      ctx.strokeStyle = lig.color;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      lig.bonds.forEach(function (pair) {
        var r = residues[pair[0]];
        var a = atoms[pair[1]];
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(a.x, a.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      /* Draw residue nodes */
      residues.forEach(function (r) {
        ctx.beginPath();
        ctx.arc(r.x, r.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#34d399';
        ctx.fill();
        ctx.fillStyle = '#9fb0d0';
        ctx.font = '10.5px "JetBrains Mono", monospace';
        ctx.textAlign = r.x < cx ? 'right' : 'left';
        ctx.fillText(r.name, r.x + (r.x < cx ? -10 : 10), r.y + 4);
      });

      /* Ligand scaffold bonds */
      ctx.strokeStyle = lig.color;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(atoms[0].x, atoms[0].y);
      ctx.lineTo(atoms[1].x, atoms[1].y);
      ctx.lineTo(atoms[3].x, atoms[3].y);
      ctx.lineTo(atoms[2].x, atoms[2].y);
      ctx.closePath();
      ctx.stroke();

      atoms.forEach(function (a) {
        ctx.beginPath();
        ctx.arc(a.x, a.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = lig.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#080f1d';
        ctx.stroke();
      });

      /* Update CADD readouts */
      var elDg = document.getElementById('kpi-dg');
      var elKi = document.getElementById('kpi-ki');
      var elRmsd = document.getElementById('kpi-rmsd');
      var elVerd = document.getElementById('cadd-verdict');
      if (elDg) elDg.textContent = lig.dg;
      if (elKi) elKi.textContent = lig.ki;
      if (elRmsd) {
        elRmsd.textContent = lig.rmsd;
        elRmsd.style.color = activeLig === 'lead' ? '#34d399' : (activeLig === 'hit' ? '#58a6ff' : '#f87171');
      }
      if (elVerd) elVerd.textContent = currentLang === 'tr' ? lig.verdictTr : lig.verdictEn;

      [['sol', lig.sol], ['perm', lig.perm], ['herg', lig.herg], ['stab', lig.stab]].forEach(function (row) {
        var bar = document.getElementById('bar-' + row[0]);
        var pct = document.getElementById('pct-' + row[0]);
        if (bar) {
          bar.style.width = row[1] + '%';
          bar.style.backgroundColor = row[1] >= 80 ? '#34d399' : (row[1] >= 55 ? '#f59e42' : '#f87171');
        }
        if (pct) pct.textContent = row[1] + '%';
      });
    }

    document.querySelectorAll('[data-lig]').forEach(function (b) {
      b.addEventListener('click', function () {
        activeLig = b.getAttribute('data-lig');
        document.querySelectorAll('[data-lig]').forEach(function (x) { x.classList.toggle('active', x === b); });
        drawCadd();
      });
    });

    window.addEventListener('resize', function () { drawDoe(); drawCadd(); });
    window.addEventListener('site:langchange', function () { drawDoe(); drawCadd(); });
    drawDoe();
    drawCadd();
  }

  /* ── 7. UNIFIED INQUIRY COMPOSER (Consulting + Speaking) ── */
  function initComposer() {
    var form = document.getElementById('inquiry-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (document.getElementById('inq-name').value || '').trim();
      var org = (document.getElementById('inq-org').value || '').trim();
      var email = (document.getElementById('inq-email').value || '').trim();
      var topic = (document.getElementById('inq-topic').value || '').trim();
      var modeEl = document.getElementById('inq-mode');
      var mode = modeEl ? (modeEl.value || '').trim() : '';
      var msg = (document.getElementById('inq-msg').value || '').trim();

      if (!name || !email || !msg) {
        alert(currentLang === 'tr'
          ? 'Lütfen Ad, E-posta ve Mesaj alanlarını doldurun.'
          : 'Please complete Name, Email, and Message fields.');
        return;
      }

      var subject = (form.getAttribute('data-subject-prefix') || 'Scientific Inquiry') + ': ' + (topic || 'General');
      var body =
        'Ad / Name: ' + name + '\n' +
        (org ? 'Kurum / Organization: ' + org + '\n' : '') +
        'Yanıt E-postası / Reply-to: ' + email + '\n' +
        (topic ? 'Konu / Area: ' + topic + '\n' : '') +
        (mode ? 'Format / Model: ' + mode + '\n' : '') +
        '\nMesaj / Details:\n' + msg;

      var gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=egundeger%40gmail.com&su=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      var mailtoUrl = 'mailto:egundeger@gmail.com?subject=' +
        encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      var previewBox = document.getElementById('composer-preview');
      var previewText = document.getElementById('composer-text');
      var gmailBtn = document.getElementById('composer-gmail');
      var mailtoBtn = document.getElementById('composer-mailto');

      if (previewText) previewText.textContent = body;
      if (gmailBtn) gmailBtn.href = gmailUrl;
      if (mailtoBtn) mailtoBtn.href = mailtoUrl;
      if (previewBox) {
        previewBox.classList.add('show');
        previewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });

    var copyBtn = document.getElementById('composer-copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = (document.getElementById('composer-text').textContent || '');
        if (!text) return;
        var doneLabel = currentLang === 'tr' ? 'Kopyalandı ✓' : 'Copied ✓';
        var origLabel = currentLang === 'tr' ? 'Metni Kopyala' : 'Copy Text';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(function () {
            copyBtn.textContent = doneLabel;
            setTimeout(function () { copyBtn.textContent = origLabel; }, 2200);
          });
        }
      });
    }
  }

  /* ── 8. SCROLL REVEAL ── */
  function initReveal() {
    var els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ── BOOTSTRAP ON DOM READY ── */
  document.addEventListener('DOMContentLoaded', function () {
    var savedTheme = 'dark';
    try { savedTheme = localStorage.getItem('theme') || 'dark'; } catch (e) { savedTheme = 'dark'; }
    setTheme(savedTheme);
    applyFontScale();
    setLang(currentLang, false);

    var themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', function () {
        var cur = document.documentElement.getAttribute('data-theme') || 'dark';
        setTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }

    var incBtn = document.getElementById('font-inc');
    var decBtn = document.getElementById('font-dec');
    if (incBtn) incBtn.addEventListener('click', function () { fontScale += 0.08; applyFontScale(); });
    if (decBtn) decBtn.addEventListener('click', function () { fontScale -= 0.08; applyFontScale(); });

    initMobileNav();
    initConsulting();
    initLabFilters();
    initSandbox();
    initComposer();
    initReveal();
  });
})();
