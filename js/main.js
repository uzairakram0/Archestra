  // === TWEMOJI ===
  if (typeof twemoji !== 'undefined') twemoji.parse(document.body, { folder: 'svg', ext: '.svg' });

  // === THEME ===
  const toggle = document.getElementById('themeToggle');
  const root = document.documentElement;
  const saved = localStorage.getItem('archestra-theme');
  if (saved) root.setAttribute('data-theme', saved);
  else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    root.setAttribute('data-theme', 'dark');
  }
  if (toggle) toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    localStorage.setItem('archestra-theme', next);
  });

  // === FADE-UP ===
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

  // === TRANSFORM SCENE ===
  const stageFrames = document.querySelectorAll('.stage-frame');
  const stageBtns = document.querySelectorAll('.step-btn');
  const captionEl = document.getElementById('transformCaption');

  const captions = {
    1: '<strong>Stage 01 — 2D Floor Plan.</strong> Every project begins with measured, permit-ready plans. Walls, doors, dimensions, and rooms — drawn to scale.',
    2: '<strong>Stage 02 — 3D Wireframe.</strong> The plan lifts into three dimensions. A precise geometric model of every wall, window, roof, and opening.',
    3: '<strong>Stage 03 — 3D Render.</strong> Light, material, and landscape come together. Photoreal visualizations let you walk through the home before it exists.',
    4: '<strong>Stage 04 — Built.</strong> The drawings become a place. Handed to your builder, stamped by council, and made real on the site.'
  };

  let currentStage = 1;
  let autoplayTimer = null;

  function setStage(n) {
    currentStage = n;
    stageFrames.forEach(f => f.classList.toggle('active', parseInt(f.dataset.stage) === n));
    stageBtns.forEach(b => b.classList.toggle('active', parseInt(b.dataset.stageBtn) === n));
    captionEl.style.opacity = '0';
    setTimeout(() => {
      captionEl.innerHTML = captions[n];
      captionEl.style.opacity = '1';
    }, 200);
  }

  stageBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      stopAutoplay();
      setStage(parseInt(btn.dataset.stageBtn));
    });
  });

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => {
      const next = currentStage >= 4 ? 1 : currentStage + 1;
      setStage(next);
    }, 3500);
  }

  function stopAutoplay() {
    if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
  }

  // Start autoplay only when transform section is visible
  const transformSection = document.getElementById('transform');
  const transformObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) startAutoplay();
      else stopAutoplay();
    });
  }, { threshold: 0.3 });
  transformObs.observe(transformSection);

  // === WIZARD ===
  const state = {
    step: 1,
    totalSteps: 4,
    step4Sub: 1,
    data: { projectType: null, services: [], timeline: null, schedDate: null, schedTime: null, name: '', email: '', phone: '', notes: '' }
  };

  const calNow = new Date(); calNow.setHours(0,0,0,0);
  const calState = { year: calNow.getFullYear(), month: calNow.getMonth() };

  const steps = document.querySelectorAll('.wizard-step');
  const dots  = document.querySelectorAll('.wizard-dot');
  const backBtn     = document.getElementById('wizardBack');
  const nextBtn     = document.getElementById('wizardNext');
  const nav         = document.getElementById('wizardNav');
  const successPanel = document.getElementById('wizardSuccess');

  function updateUI() {
    steps.forEach(s => s.classList.toggle('active', parseInt(s.dataset.step) === state.step));
    dots.forEach((d, i) => {
      d.classList.remove('active', 'complete');
      if (i + 1 < state.step) d.classList.add('complete');
      else if (i + 1 === state.step) d.classList.add('active');
    });
    backBtn.disabled = state.step === 1;
    if (state.step === 4) updateStep4();
    nextBtn.textContent = (state.step === state.totalSteps && state.step4Sub === 3) ? 'Submit request' : 'Continue';
    validateStep();
  }

  function validateStep() {
    let valid = false;
    if (state.step === 1) valid = !!state.data.projectType;
    if (state.step === 2) valid = state.data.services.length > 0;
    if (state.step === 3) valid = !!state.data.timeline;
    if (state.step === 4) {
      if (state.step4Sub === 1) valid = !!state.data.schedDate;
      else if (state.step4Sub === 2) valid = !!state.data.schedTime;
      else {
        const name  = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        valid = name.length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      }
    }
    nextBtn.disabled = !valid;
  }

  // --- Estimator ---
  const estAccordion = document.getElementById('estAccordion');
  const estToggle    = document.getElementById('estToggle');
  const estBody      = document.getElementById('estBody');
  const estResult    = document.getElementById('estResult');
  const estSqft      = document.getElementById('estSqft');

  const ctrState = { rooms: 3, baths: 2, kitchens: 1 };
  const ctrMap   = { ctrRooms: 'rooms', ctrBaths: 'baths', ctrKitchens: 'kitchens' };
  const ctrMin   = { rooms: 1, baths: 1, kitchens: 1 };
  const ctrMax   = { rooms: 12, baths: 8, kitchens: 3 };

  estToggle.addEventListener('click', () => {
    estAccordion.classList.toggle('open');
  });

  document.getElementById('estSkip').addEventListener('click', () => {
    estAccordion.classList.remove('open');
    state.data.estimate = null;
  });

  Object.entries(ctrMap).forEach(([id, key]) => {
    document.getElementById(id).addEventListener('click', e => {
      const btn = e.target.closest('.est-cnt-btn');
      if (!btn) return;
      const dir = parseInt(btn.dataset.dir);
      ctrState[key] = Math.min(ctrMax[key], Math.max(ctrMin[key], ctrState[key] + dir));
      document.querySelector('#' + id + ' .est-cnt-val').textContent = ctrState[key];
      calcEstimate();
    });
  });

  estSqft.addEventListener('input', calcEstimate);

  function calcEstimate() {
    const sqft = parseInt(estSqft.value) || 0;
    if (!sqft || sqft < 100) {
      estResult.innerHTML = '<span class="est-placeholder">Enter square footage to see an estimate</span>';
      state.data.estimate = null;
      return;
    }
    const rates = {
      'new-build':    { lo: 210, hi: 355 },
      'addition':     { lo: 170, hi: 280 },
      'renovation':   { lo: 120, hi: 210 },
      'visuals-only': { lo: 5000, hi: 18000, flat: true },
    };
    const r = rates[state.data.projectType] || rates['new-build'];
    let lo, hi;
    if (r.flat) {
      lo = r.lo; hi = r.hi;
    } else {
      lo = sqft * r.lo + ctrBathVal() * 19000 + ctrKitchenVal() * 32000 + Math.max(0, ctrRoomVal() - 2) * 4000;
      hi = sqft * r.hi + ctrBathVal() * 30000 + ctrKitchenVal() * 52000 + Math.max(0, ctrRoomVal() - 2) * 7000;
    }
    function ctrRoomVal()    { return ctrState.rooms; }
    function ctrBathVal()    { return ctrState.baths; }
    function ctrKitchenVal() { return ctrState.kitchens; }
    const fmt = n => n >= 1000000 ? '$' + (n / 1000000).toFixed(1) + 'M' : '$' + Math.round(n / 1000) + 'K';
    estResult.innerHTML = `
      <div class="est-range-wrap">
        <div class="est-range">${fmt(lo)} &ndash; ${fmt(hi)}</div>
        <div class="est-range-note">Rough construction cost estimate &middot; Architectural fees are additional</div>
      </div>`;
    state.data.estimate = { sqft, rooms: ctrState.rooms, baths: ctrState.baths, kitchens: ctrState.kitchens, lo, hi };
  }

  // --- Calendar ---
  function buildCal() {
    const grid  = document.getElementById('calGrid');
    const label = document.getElementById('calMonth');
    if (!grid || !label) return;
    const yr = calState.year, mo = calState.month;
    const mNames = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    label.textContent = mNames[mo] + ' ' + yr;
    grid.innerHTML = '';
    const firstDow  = new Date(yr, mo, 1).getDay();
    const daysInMo  = new Date(yr, mo + 1, 0).getDate();
    for (let i = 0; i < firstDow; i++) grid.appendChild(document.createElement('div'));
    for (let d = 1; d <= daysInMo; d++) {
      const dt  = new Date(yr, mo, d);
      const dow = dt.getDay();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cal-day';
      btn.textContent = d;
      const dateStr = yr + '-' + String(mo+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      if (dt < calNow || dow === 0 || dow === 6) {
        btn.classList.add('disabled');
        btn.disabled = true;
      } else {
        btn.classList.add('available');
        if (dt.getTime() === calNow.getTime()) btn.classList.add('today');
        if (state.data.schedDate === dateStr) btn.classList.add('selected');
        btn.addEventListener('click', function () {
          state.data.schedDate = dateStr;
          buildCal();
          validateStep();
        });
      }
      grid.appendChild(btn);
    }
  }

  document.getElementById('calPrev').addEventListener('click', function () {
    calState.month--; if (calState.month < 0) { calState.month = 11; calState.year--; } buildCal();
  });
  document.getElementById('calNext').addEventListener('click', function () {
    calState.month++; if (calState.month > 11) { calState.month = 0; calState.year++; } buildCal();
  });

  // --- Time slots ---
  const ALL_SLOTS = ['9:00 AM','9:30 AM','10:00 AM','10:30 AM','11:00 AM','11:30 AM',
                     '12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM',
                     '3:00 PM','3:30 PM','4:00 PM','4:30 PM'];
  const UNAVAIL_IDX = new Set([2, 5, 9, 13]);

  function buildTimeSlots() {
    const grid  = document.getElementById('timeGrid');
    const label = document.getElementById('schedDateLabel');
    if (!grid) return;
    if (state.data.schedDate && label) {
      const [yr, mo, d] = state.data.schedDate.split('-').map(Number);
      label.textContent = new Date(yr, mo-1, d).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    }
    grid.innerHTML = '';
    ALL_SLOTS.forEach(function (slot, i) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = slot;
      if (UNAVAIL_IDX.has(i)) {
        btn.className = 'time-slot unavailable';
        btn.disabled = true;
      } else {
        btn.className = 'time-slot' + (state.data.schedTime === slot ? ' selected' : '');
        btn.addEventListener('click', function () {
          state.data.schedTime = slot;
          buildTimeSlots();
          validateStep();
        });
      }
      grid.appendChild(btn);
    });
  }

  // --- Step 4 sub-panel manager ---
  function updateStep4() {
    const pDate = document.getElementById('schedDate');
    const pTime = document.getElementById('schedTime');
    const pInfo = document.getElementById('schedInfo');
    if (!pDate) return;
    pDate.classList.toggle('active', state.step4Sub === 1);
    pTime.classList.toggle('active', state.step4Sub === 2);
    pInfo.classList.toggle('active', state.step4Sub === 3);
    if (state.step4Sub === 1) buildCal();
    if (state.step4Sub === 2) buildTimeSlots();
    if (state.step4Sub === 3) {
      const chosen = document.getElementById('schedChosen');
      if (chosen && state.data.schedDate && state.data.schedTime) {
        const [yr, mo, d] = state.data.schedDate.split('-').map(Number);
        const dateStr = new Date(yr, mo-1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        chosen.innerHTML = '30-min consultation booked: <strong>' + dateStr + ' at ' + state.data.schedTime + '</strong>';
      }
    }
    nextBtn.textContent = state.step4Sub === 3 ? 'Submit request' : 'Continue';
    backBtn.disabled = false;
  }

  document.querySelectorAll('.option-card').forEach(card => {
    card.addEventListener('click', () => {
      const field  = card.dataset.field;
      const value  = card.dataset.value;
      const isMulti = card.dataset.multi === 'true';
      if (isMulti) {
        const arr = state.data[field];
        const idx = arr.indexOf(value);
        if (idx >= 0) { arr.splice(idx, 1); card.classList.remove('selected'); }
        else { arr.push(value); card.classList.add('selected'); }
      } else {
        document.querySelectorAll(`.option-card[data-field="${field}"]`).forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.data[field] = value;
      }
      validateStep();
    });
  });

  ['name', 'email', 'phone', 'notes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { state.data[id] = el.value; validateStep(); });
  });

  nextBtn.addEventListener('click', () => {
    if (nextBtn.disabled) return;
    if (state.step < state.totalSteps) {
      state.step++; updateUI();
    } else if (state.step4Sub < 3) {
      state.step4Sub++; updateStep4(); validateStep();
    } else {
      console.log('Lead submitted:', state.data);
      steps.forEach(s => s.classList.remove('active'));
      nav.style.display = 'none';
      successPanel.classList.add('active');
      dots.forEach(d => { d.classList.remove('active'); d.classList.add('complete'); });
    }
  });

  backBtn.addEventListener('click', () => {
    if (state.step === 4 && state.step4Sub > 1) {
      state.step4Sub--; updateStep4(); validateStep();
    } else if (state.step > 1) {
      if (state.step === 4) state.step4Sub = 1;
      state.step--; updateUI();
    }
  });

  updateUI();

// === PROJECT MODALS ===
(function () {
  document.querySelectorAll('.add-project-card').forEach(function (card) {
    card.addEventListener('click', function () {
      var id = card.dataset.modal;
      var backdrop = document.getElementById(id);
      if (backdrop) backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeModal(backdrop) {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.proj-modal-backdrop').forEach(function (backdrop) {
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop || e.target.closest('[data-close-modal]')) {
        closeModal(backdrop);
      }
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.proj-modal-backdrop.open').forEach(closeModal);
    }
  });

  // === QUOTES MARQUEE ===
  (function () {
    function initMarquee() {
      var inner = document.querySelector('.quotes-inner');
      var wrap = document.querySelector('.quotes-track-wrap');
      if (!inner || !wrap) return;

      var origCards = Array.from(inner.children);
      var origCount = origCards.length;
      origCards.forEach(function (card) {
        var clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        inner.appendChild(clone);
      });

      var pos = 0;
      var baseSpeed = 0.6;
      var dragVel = 0;
      var dragging = false;
      var lastX = 0;
      var halfW = 0;

      function measureHalfW() {
        // offsetLeft difference is reliable across all browsers/environments
        var first = inner.children[0];
        var clone = inner.children[origCount];
        if (!first || !clone) return 0;
        return clone.offsetLeft - first.offsetLeft;
      }

      function tick() {
        // Lazy-measure each frame until we get a non-zero value
        if (!halfW) halfW = measureHalfW();
        if (!dragging) dragVel *= 0.88;
        pos += baseSpeed + dragVel;
        if (halfW > 0) {
          if (pos >= halfW) pos -= halfW;
          if (pos < 0) pos += halfW;
        }
        inner.style.transform = 'translateX(-' + pos + 'px)';
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);

      wrap.addEventListener('mousedown', function (e) {
        dragging = true; lastX = e.clientX; dragVel = 0;
        wrap.style.cursor = 'grabbing';
      });
      document.addEventListener('mousemove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastX;
        pos -= dx; dragVel = -dx * 0.6; lastX = e.clientX;
      });
      document.addEventListener('mouseup', function () {
        dragging = false; wrap.style.cursor = '';
      });
      wrap.addEventListener('touchstart', function (e) {
        dragging = true; lastX = e.touches[0].clientX; dragVel = 0;
      }, { passive: true });
      wrap.addEventListener('touchmove', function (e) {
        if (!dragging) return;
        var dx = e.touches[0].clientX - lastX;
        pos -= dx; dragVel = -dx * 0.6; lastX = e.touches[0].clientX;
      }, { passive: true });
      wrap.addEventListener('touchend', function () { dragging = false; }, { passive: true });
    }

    // Run after full page load so layout is guaranteed to be computed
    if (document.readyState === 'complete') {
      initMarquee();
    } else {
      window.addEventListener('load', initMarquee, { once: true });
    }
  })();
})();

// === WHATSAPP WIDGET ===
(function () {
  // ← Replace with your WhatsApp number (country code + number, no spaces or +)
  // Example: '14155550123' for a US number
  var PHONE = 'YOUR_WHATSAPP_NUMBER';

  var fab     = document.getElementById('waFab');
  var panel   = document.getElementById('waPanel');
  var closeBtn = document.getElementById('waClose');
  var sendBtn = document.getElementById('waSend');
  var nameEl  = document.getElementById('waName');
  var msgEl   = document.getElementById('waMessage');

  if (!fab || !panel) return;

  function openPanel()  { panel.classList.add('open'); nameEl.focus(); }
  function closePanel() { panel.classList.remove('open'); }

  fab.addEventListener('click', function (e) {
    e.stopPropagation();
    panel.classList.contains('open') ? closePanel() : openPanel();
  });
  closeBtn.addEventListener('click', closePanel);

  sendBtn.addEventListener('click', function () {
    var name = nameEl.value.trim();
    var msg  = msgEl.value.trim();
    if (!msg) { msgEl.focus(); return; }

    var text = name ? 'Hi, I\'m ' + name + '. ' + msg : msg;
    window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text), '_blank');

    nameEl.value = '';
    msgEl.value  = '';
    closePanel();
  });

  // Send on Enter inside textarea (Shift+Enter = new line)
  msgEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendBtn.click();
    }
  });

  // Close when clicking outside
  document.addEventListener('click', function (e) {
    if (!document.getElementById('waWidget').contains(e.target)) closePanel();
  });
})();