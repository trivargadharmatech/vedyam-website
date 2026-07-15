/* ═══════════════════════════════════════════════════════════════════
   Vedyam — app.js
   Professional-grade Vanilla JS SPA
   ═══════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';
  const cfg = window.VEDYAM;

  /* ─── State ─── */
  const state = {
    token: localStorage.getItem('token'),
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    theme: localStorage.getItem('theme') || 'dark',
    chat: [],
    chatMode: 'learn', // 'learn' or 'teach'
    carouselScrollId: null,
  };

  /* ─── Helpers ─── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const el = document.getElementById.bind(document);

  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
    const res = await fetch(`${cfg.API_BASE}${path}`, { ...opts, headers });
    if (res.status === 401) { logout(); throw new Error('Unauthorized'); }
    return res.json();
  }

  /* ─── Hardcoded Course Fallback ───
     Shown only when the backend is offline / unreachable.
     The moment a real backend responds with courses, these are ignored. */
  const HARDCODED_COURSES = [
    {
      id: 'hc-1', title: 'Carnatic Classical Singing', category: 'Culture',
      level: 'Beginner & Intermediate', summary: 'Individual mentoring · Open for all age groups',
      description: 'Learn the foundations and finer techniques of Carnatic classical vocal music through one-on-one mentoring, progressing from beginner to intermediate levels at your own pace.',
      lessons: ['Swara & Sruti fundamentals', 'Varnams', 'Geethams', 'Kritis — beginner ragas', 'Kritis — intermediate ragas', 'Manodharma basics'],
      meta: { mode: 'Individual mentoring', age: 'All age groups' },
      thumbnail: 'assets/images/courses/carnatic.png'
    },
    {
      id: 'hc-2', title: 'Pattachitra Painting', category: 'Culture',
      level: 'Beginner & Intermediate', summary: 'Group mentoring · Minimum age 9 years',
      description: 'Explore the traditional Odia scroll-painting art form of Pattachitra in a group setting, covering natural pigments, motifs, and mythological storytelling through art.',
      lessons: ['Materials & natural pigments', 'Line work & borders', 'Traditional motifs', 'Mythological compositions', 'Intermediate scroll work'],
      meta: { mode: 'Group mentoring', age: 'Min age 9 years' },
      thumbnail: 'assets/images/courses/pattachitra.png'
    },
    {
      id: 'hc-3', title: 'Drawing Class', category: 'Culture',
      level: 'Basics to Advanced', summary: 'Comprehensive course including exam preparation',
      description: 'A comprehensive drawing course covering everything from the basics to advanced technique, including structured preparation for elementary and intermediate drawing examinations.',
      lessons: ['Basic strokes & shading', 'Geometrical & object drawing', 'Memory drawing', 'Nature drawing', 'Elementary exam prep', 'Intermediate exam prep'],
      meta: { mode: '—', age: 'All age groups' },
      thumbnail: 'assets/images/courses/drawing.png'
    },
    {
      id: 'hc-4', title: 'Kathak Dance', category: 'Culture',
      level: 'Beginner', summary: 'Open for all age groups',
      description: 'An introduction to Kathak, the classical dance form of North India, covering footwork, hand gestures, expressions, and foundational compositions.',
      lessons: ['Basic stance & footwork (Tatkar)', 'Hastak & hand gestures', 'Chakkars', 'Simple compositions', 'Abhinaya basics'],
      meta: { mode: '—', age: 'All age groups' },
      thumbnail: 'assets/images/courses/kathak.png'
    },
    {
      id: 'hc-5', title: "Bharatiya Ganitam: Lilavati", category: 'Wisdom',
      level: 'All levels', summary: "Mathematical concepts from Bhaskaracharya's Lilavati grantha",
      description: "Part of the Bharatiya Ganitam series, this course teaches classical Indian mathematical concepts drawn directly from Bhaskaracharya's Lilavati grantha.",
      lessons: ['Introduction to Lilavati', 'Number systems & operations', 'Arithmetic problems in verse', 'Geometry from Lilavati', 'Applied problem solving'],
      meta: { mode: '—', age: '—' },
      thumbnail: 'assets/images/courses/ganitam.png'
    },
    {
      id: 'hc-6', title: 'Hindustani Classical Singing', category: 'Culture',
      level: 'All levels', summary: 'Structured vocal training in the Hindustani tradition',
      description: 'Structured training in Hindustani classical vocal music, covering ragas, taals, and the discipline of riyaz.',
      lessons: ['Swara & alankar', 'Introduction to raga', 'Taal & laya', 'Khyal basics', 'Bandish practice'],
      meta: { mode: '—', age: '—' },
      thumbnail: 'assets/images/courses/hindustani.png'
    },
    {
      id: 'hc-7', title: 'Bansuri Classes', category: 'Culture',
      level: 'All levels', summary: 'Learn the Indian bamboo flute',
      description: 'Learn to play the Bansuri, the traditional Indian bamboo flute, from basic breath control and fingering to melodic phrases.',
      lessons: ['Holding & breath control', 'Basic fingering', 'Sur sadhana', 'Simple melodies', 'Raga-based phrases'],
      meta: { mode: '—', age: '—' },
      thumbnail: 'assets/images/courses/bansuri.png'
    },
    {
      id: 'hc-8', title: 'Casio Classes', category: 'Culture',
      level: 'All levels', summary: 'Keyboard (Casio) lessons for beginners onward',
      description: 'Learn to play the keyboard (Casio), covering note reading, hand coordination, and playing popular and classical pieces.',
      lessons: ['Keyboard basics & posture', 'Note reading', 'Scales & chords', 'Simple songs', 'Two-hand coordination'],
      meta: { mode: '—', age: '—' },
      thumbnail: 'assets/images/courses/casio.png'
    },
    {
      id: 'hc-9', title: 'Samskrita Vedyam', category: 'Foundation',
      level: 'Beginner', summary: 'Devanagari basics to speaking skills in Samskritam',
      description: 'A structured journey into Sanskrit — beginning with the Devanagari script and building up to practical speaking skills in Samskritam.',
      lessons: ['Devanagari script basics', 'Reading & writing practice', 'Basic vocabulary', 'Simple sentence construction', 'Conversational Samskritam'],
      meta: { mode: '—', age: '—' },
      thumbnail: 'assets/images/courses/samskrita.png'
    }
  ];

  /* Try the live backend first; silently fall back to the hardcoded list
     the instant the backend is unreachable or returns nothing. */
  async function fetchCourses() {
    try {
      const data = await api('/api/courses');
      if (data && Array.isArray(data.courses) && data.courses.length) return data.courses;
      return HARDCODED_COURSES;
    } catch (e) {
      return HARDCODED_COURSES;
    }
  }

  async function fetchCourseById(id) {
    try {
      const data = await api(`/api/course/${id}`);
      if (data && data.course) return data.course;
    } catch (e) { /* fall through to hardcoded */ }
    return HARDCODED_COURSES.find(c => String(c.id) === String(id)) || null;
  }

  function toast(msg, type = 'ok') {
    const c = el('toasts');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; setTimeout(() => t.remove(), 300); }, 3000);
  }

  function logout() {
    state.token = null; state.user = null;
    localStorage.removeItem('token'); localStorage.removeItem('user');
    route();
  }

  /* ─── Theme ─── */
  function applyTheme() {
    document.body.classList.toggle('light-mode', state.theme === 'light');
  }
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.theme);
    applyTheme();
  }
  applyTheme();

  /* ─── Nav ─── */
  function renderNav() {
    const links = el('navLinks');
    const right = el('navRight');
    const hash = location.hash || '#/';

    const navItems = [
      { href: '#/', label: 'Home' },
      { href: '#/courses', label: 'Courses' },
      { href: '#/bot', label: 'Ask ShastraBot' },
    ];
    if (state.user) {
      navItems.push({ href: '#/profile', label: 'Profile' });
      if (state.user.role === 'instructor' || state.user.role === 'superadmin') {
        navItems.push({ href: '#/teach', label: 'Teach' });
      }
      if (state.user.role === 'superadmin') {
        navItems.push({ href: '#/admin', label: 'Admin' });
      }
    }

    links.innerHTML = navItems.map(n =>
      `<a href="${n.href}" class="${hash === n.href ? 'active' : ''}">${n.label}</a>`
    ).join('');

    let rightHtml = `<button class="btn sm subtle" onclick="window.__toggleTheme()" aria-label="Toggle theme">${state.theme === 'dark' ? '☀️' : '🌙'}</button>`;

    if (state.user) {
      rightHtml += `
        <span class="chip-role">${state.user.role}</span>
        <div class="avatar" title="${state.user.name}" onclick="location.hash='#/profile'">${state.user.name[0].toUpperCase()}</div>
        <button class="btn sm ghost" onclick="window.__logout()">Logout</button>`;
    } else {
      rightHtml += `<a href="#/login" class="btn sm primary"><span class="btn-label">Sign In</span></a>`;
    }
    right.innerHTML = rightHtml;

    // Mobile drawer
    const drawer = el('mobileDrawer');
    let drawerHtml = navItems.map(n =>
      `<a href="${n.href}" class="${hash === n.href ? 'active' : ''}" onclick="window.__closeMobileMenu()">${n.label}</a>`
    ).join('');
    drawerHtml += '<div class="drawer-actions">';
    drawerHtml += `<button class="btn sm ghost block" onclick="window.__toggleTheme(); window.__closeMobileMenu()">${state.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>`;
    if (state.user) {
      drawerHtml += `<button class="btn sm ghost block" onclick="window.__logout(); window.__closeMobileMenu()">Logout</button>`;
    } else {
      drawerHtml += `<a href="#/login" class="btn sm primary block" onclick="window.__closeMobileMenu()"><span class="btn-label">Sign In</span></a>`;
    }
    drawerHtml += '</div>';
    drawer.innerHTML = drawerHtml;
  }

  /* ─── Mobile Menu ─── */
  function openMobileMenu() {
    el('mobileDrawer').classList.add('open');
    el('mobileOverlay').classList.add('open');
    el('hamburger').classList.add('open');
    el('hamburger').setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileMenu() {
    el('mobileDrawer').classList.remove('open');
    el('mobileOverlay').classList.remove('open');
    el('hamburger').classList.remove('open');
    el('hamburger').setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  el('hamburger').addEventListener('click', () => {
    const isOpen = el('mobileDrawer').classList.contains('open');
    isOpen ? closeMobileMenu() : openMobileMenu();
  });
  el('mobileOverlay').addEventListener('click', closeMobileMenu);

  /* ─── Scroll Progress ─── */
  function updateScrollProgress() {
    const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
    el('scrollProgress').style.width = scrolled + '%';
  }

  /* ─── Back-to-top ─── */
  function updateBackToTop() {
    const btn = el('backToTop');
    if (!btn) return;
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }
  el('backToTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ─── Scroll-aware Nav ─── */
  function updateNavScroll() {
    const nav = el('mainNav');
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  /* ─── Combined Scroll Handler ─── */
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(() => {
        updateScrollProgress();
        updateBackToTop();
        updateNavScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }, { passive: true });

  /* ─── Intersection Observer for Scroll Animations ─── */
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target); // Only animate once
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

  function observeRevealElements() {
    $$('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
      revealObserver.observe(el);
    });
  }

  /* ─── Counter Animation ─── */
  function animateCounters() {
    $$('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const duration = 2000;
      const start = performance.now();

      function step(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased) + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounters();
        counterObserver.disconnect();
      }
    });
  }, { threshold: 0.3 });

  /* ─── 3D Card Tilt ─── */
  function init3DTilt() {
    $$('.card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / centerY * -6;
        const rotateY = (x - centerX) / centerX * 6;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ─── Typewriter Effect for Hero ─── */
  function typewriterEffect(element, text, speed = 50) {
    return new Promise(resolve => {
      let i = 0;
      element.textContent = '';
      const cursor = document.createElement('span');
      cursor.className = 'typewriter-cursor';
      element.appendChild(cursor);

      function type() {
        if (i < text.length) {
          element.insertBefore(document.createTextNode(text[i]), cursor);
          i++;
          setTimeout(type, speed);
        } else {
          // Keep cursor blinking for a moment then remove
          setTimeout(() => {
            if (cursor.parentNode) cursor.remove();
            resolve();
          }, 2000);
        }
      }
      type();
    });
  }

  /* ─── Carousel ─── */
  function initCarousel(container) {
    // Clean up previous carousel animation if any
    if (state.carouselScrollId) {
      cancelAnimationFrame(state.carouselScrollId);
      state.carouselScrollId = null;
    }

    if (!container) return;
    const track = container.querySelector('.carousel-track');
    if (!track) return;
    const cards = [...track.children];
    if (cards.length === 0) return;

    const cardW = 320 + 24; // width + gap
    let autoDir = 1;
    let paused = false;
    let isDragging = false;
    let startX, scrollLeft;

    function updateCenter() {
      const center = container.scrollLeft + container.clientWidth / 2;
      cards.forEach(c => {
        const cardCenter = c.offsetLeft + c.offsetWidth / 2;
        c.classList.toggle('center', Math.abs(center - cardCenter) < cardW / 2);
      });
    }

    function autoScroll() {
      if (!paused && !isDragging) {
        container.scrollLeft += autoDir * 0.5;
        if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 2) autoDir = -1;
        if (container.scrollLeft <= 2) autoDir = 1;
      }
      updateCenter();
      state.carouselScrollId = requestAnimationFrame(autoScroll);
    }

    container.addEventListener('mouseenter', () => { paused = true; });
    container.addEventListener('mouseleave', () => { paused = false; });

    // Drag support
    container.addEventListener('mousedown', (e) => {
      isDragging = true; startX = e.pageX - container.offsetLeft; scrollLeft = container.scrollLeft;
      container.style.cursor = 'grabbing';
    });
    container.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const x = e.pageX - container.offsetLeft;
      container.scrollLeft = scrollLeft - (x - startX);
    });
    const stopDrag = () => { isDragging = false; container.style.cursor = 'grab'; };
    container.addEventListener('mouseup', stopDrag);
    container.addEventListener('mouseleave', stopDrag);

    // Touch support
    container.addEventListener('touchstart', (e) => {
      paused = true; isDragging = true;
      startX = e.touches[0].pageX - container.offsetLeft; scrollLeft = container.scrollLeft;
    }, { passive: true });
    container.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const x = e.touches[0].pageX - container.offsetLeft;
      container.scrollLeft = scrollLeft - (x - startX);
    }, { passive: true });
    container.addEventListener('touchend', () => { isDragging = false; setTimeout(() => { paused = false; }, 3000); });

    // Start centered
    container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    updateCenter();
    state.carouselScrollId = requestAnimationFrame(autoScroll);
  }

  /* ─── Form Validation ─── */
  function validateField(input, rules = {}) {
    const field = input.closest('.field');
    const errorEl = field?.querySelector('.field-error');
    let errorMsg = '';

    const val = input.value.trim();

    if (rules.required && !val) {
      errorMsg = rules.requiredMsg || 'This field is required';
    } else if (rules.minLength && val.length < rules.minLength) {
      errorMsg = `Must be at least ${rules.minLength} characters`;
    } else if (rules.email && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      errorMsg = 'Please enter a valid email address';
    } else if (rules.match) {
      const otherVal = document.querySelector(rules.match)?.value;
      if (val !== otherVal) errorMsg = 'Passwords do not match';
    }

    if (errorMsg) {
      field?.classList.add('has-error');
      if (errorEl) errorEl.textContent = errorMsg;
      return false;
    } else {
      field?.classList.remove('has-error');
      if (errorEl) errorEl.textContent = '';
      return true;
    }
  }

  /* ─── Set Loading State on Buttons ─── */
  function setButtonLoading(btn, loading) {
    if (loading) {
      btn.classList.add('loading');
      btn.disabled = true;
    } else {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     PAGES / VIEWS
     ═══════════════════════════════════════════════════════════════════ */

  window.__quickChat = () => {
    const input = document.getElementById('quickChatInput');
    if(input && input.value.trim()) {
      window.location.href = `${cfg.CHATBOT_URL || '#/'}?from=website&query=${encodeURIComponent(input.value.trim())}`;
    } else {
      window.location.href = `${cfg.CHATBOT_URL || '#/'}?from=website`;
    }
  };

  /* ─── HOME ─── */
  function pageHome() {
    return `
    <section class="hero">

      <div class="container">
        <div class="eyebrow stagger-up" style="animation-delay:0.1s">
          <span>🔥</span> <span>Wisdom Rediscovered</span>
        </div>
        <h1 class="stagger-up" style="animation-delay:0.2s">
          Learn the Wisdom<br>of <span class="accent" id="heroAccent">Sanātana Dharma</span>
        </h1>
        <p class="lede stagger-up" style="animation-delay:0.35s">
          Vedyam turns timeless Indian wisdom into structured, practical learning for modern life. Explore courses on the Gita, Vedas, Upanishads, and more.
        </p>
        <div class="row wrap stagger-up" style="justify-content:center; gap:16px; margin-top:32px; animation-delay:0.5s">
          <a href="#/courses" class="btn primary glow"><span class="btn-label">Explore Courses</span></a>
          <a href="${cfg.SIMULATOR_URL || '#/'}" class="btn ghost" target="_blank" rel="noopener"><span class="btn-label">Try Learning Mode ↗</span></a>
        </div>
        
        <div class="quick-chat-bar stagger-up glass" style="animation-delay:0.6s; max-width:800px; margin: 40px auto 0; border-radius:12px; padding:16px; display:flex; align-items:center; gap:16px;">
          <div style="display:flex; align-items:center; gap:12px; flex-shrink:0;">
            <div style="color:var(--gold);">
              <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></svg>
            </div>
            <div style="text-align:left;">
              <h3 style="font-size:1.1rem; margin-bottom:0; color:var(--ink);">Ask ShastraBot</h3>
              <p style="color:var(--ink-2); font-size:0.8rem; margin:0;">Get instant answers from ancient wisdom</p>
            </div>
          </div>
          <div style="flex:1; position:relative; display:flex; align-items:center;">
            <input type="text" id="quickChatInput" placeholder="e.g., What is the true meaning of Dharma?" style="width:100%; background:var(--panel-bg); border:1px solid var(--panel-border); border-radius:99px; padding:0.85rem 3.5rem 0.85rem 1.5rem; font-size:0.95rem; color:var(--ink); outline:none;" onkeydown="if(event.key==='Enter') window.__quickChat()">
            <button onclick="window.__quickChat()" style="position:absolute; right:6px; background:var(--gold); border:none; width:36px; height:36px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#000; transition: transform 0.2s ease;">
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="container">
        <div class="head reveal">
          <div><h2>Featured Paths</h2><p>Curated journeys into ancient wisdom</p></div>
          <a href="#/courses" class="btn sm ghost"><span class="btn-label">View All</span></a>
        </div>
      </div>
      <div class="carousel-wrapper" style="margin-top: 16px;">
        <div class="carousel-container" id="homeCarousel"></div>
      </div>
    </section>

    <section class="block" id="inlineChatSection">
      <div class="container">
        <div class="head reveal">
          <div><h2>Ask ShastraBot</h2><p>AI-powered Q&A grounded in scripture</p></div>
        </div>
        <!-- INLINE TEASER (Clicking anywhere opens the modal) -->
        <div class="chat glass reveal-scale" style="position:relative; cursor:pointer;" onclick="window.__toggleChatWidget()">
          <!-- Transparent overlay to intercept clicks -->
          <div style="position:absolute; top:0; left:0; right:0; bottom:0; z-index:5;"></div>
          
          <div class="chat-head" style="justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="dot"></span>
              <h4>ShastraBot</h4>
            </div>
            <div style="display:flex; align-items:center; gap:16px;">
              <a href="${cfg.CHATBOT_URL || '#/'}?from=website" class="btn sm primary" style="position:relative; z-index:10;"><span class="btn-label">Open Full Chatbot ↗</span></a>
            </div>
          </div>
          <div class="chat-body" style="pointer-events:none;">
            <div class="chat-empty">
              <p style="font-size:2rem; margin-bottom:8px">🙏</p>
              <p>Ask anything about Hindu scriptures, philosophy, or history.</p>
              <p style="color:var(--brand); margin-top:12px; font-weight:600;">Click to start chatting...</p>
            </div>
          </div>
          <div class="chat-input" style="pointer-events:none;">
            <input placeholder="Ask about the scriptures..." readonly>
            <button class="btn primary"><span class="btn-label">Ask</span></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Chat Modal Overlay -->
    <div class="chat-widget-modal" id="chatWidgetModal">
      <div class="chat-widget-backdrop" onclick="window.__toggleChatWidget()"></div>
      <div class="chat glass chat-widget-content" id="chatBox">
        <div class="chat-head" style="justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 12px 20px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="dot"></span>
            <h4>ShastraBot</h4>
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <div class="teach-toggle" onclick="window.__toggleChatMode()">
              <span id="chatModeLabel">Learn Mode</span>
              <div class="switch ${state.chatMode === 'teach' ? 'on' : ''}" id="chatSwitch" role="switch" aria-checked="${state.chatMode === 'teach'}" tabindex="0"></div>
            </div>
            <button class="btn sm primary" onclick="window.__openFullChatbot()"><span class="btn-label">Open Full Chatbot ↗</span></button>
            <button class="btn ghost sm" onclick="window.__toggleChatWidget()" aria-label="Close Chat" style="padding:4px 8px; font-size:1.2rem; border-radius:50%; min-width:32px; min-height:32px; display:flex; align-items:center; justify-content:center;">✕</button>
          </div>
        </div>
        <div class="chat-body" id="chatBody" style="flex:1; max-height:none;">
          <div class="chat-empty" id="chatEmpty">
            <p style="font-size:2rem; margin-bottom:8px">🙏</p>
            <p>Ask anything about Hindu scriptures, philosophy, or history.</p>
          </div>
        </div>
        <div class="chips" id="chatChips">
          <button class="chip" onclick="window.__askChat('What is Dharma?')">What is Dharma?</button>
          <button class="chip" onclick="window.__askChat('Tell me about Karma')">Tell me about Karma</button>
          <button class="chip" onclick="window.__askChat('Who is Lord Krishna?')">Who is Lord Krishna?</button>
        </div>
        <div class="chat-input" style="padding-bottom: max(16px, env(safe-area-inset-bottom));">
          <input id="chatInput" placeholder="Ask about the scriptures..." autocomplete="off"
            onkeydown="if(event.key==='Enter')window.__sendChat()">
          <button class="btn primary" id="chatSendBtn" onclick="window.__sendChat()" aria-label="Send message"><span class="btn-label">Ask</span><div class="btn-spinner"></div></button>
        </div>
      </div>
    </div>
    `;
  }

  /* ─── COURSES ─── */
  function pageCourses() {
    return `
    <section class="block">
      <div class="container">
        <div class="head reveal">
          <div><h2>All Courses</h2><p>Browse our full library of structured learning paths</p></div>
        </div>
        <div class="search glass reveal" style="animation-delay:0.1s">
          <span>🔍</span>
          <input id="courseSearch" placeholder="Search courses…" oninput="window.__filterCourses()" autocomplete="off">
        </div>
        <div class="filters reveal" id="courseFilters" style="animation-delay:0.2s"></div>
        <div class="grid" id="courseGrid"></div>
        <div id="courseEmpty" class="empty hide"><div class="ico">📭</div><p>No courses match your search.</p></div>
        <div class="spin" id="courseSpinner"></div>
      </div>
    </section>`;
  }

  /* ─── COURSE DETAIL ─── */
  function pageCourseDetail(slug) {
    return `
    <section class="block">
      <div class="container detail" id="detailWrap">
        <div class="spin" id="detailSpinner"></div>
      </div>
    </section>`;
  }

  /* ─── LOGIN / REGISTER ─── */
  function pageLogin() {
    return `
    <section class="block" style="display:flex; align-items:center; justify-content:center; min-height: 70vh;">
      <div class="auth glass" id="authCard">
        <h2 id="authTitle" class="stagger-up" style="animation-delay:0.1s">Welcome Back</h2>
        <p class="sub stagger-up" style="animation-delay:0.2s" id="authSub">Sign in to continue your journey</p>
        <div id="authError" class="hide" style="background:var(--bad-tint); color:#ff8a8a; padding:12px; border-radius:var(--r); margin-bottom:16px; font-size:0.9rem; text-align:center; border: 1px solid rgba(239,68,68,0.3);"></div>
        <form id="authForm" onsubmit="return window.__handleAuth(event)" class="stagger-up" style="animation-delay:0.3s">
          <div id="authFields"></div>
          <button type="submit" class="btn primary block" id="authSubmit" style="margin-top:12px">
            <span class="btn-label" id="authBtnLabel">Sign In</span>
            <div class="btn-spinner"></div>
          </button>
        </form>
        <div class="switch-link stagger-up" style="animation-delay:0.4s" id="authSwitch"></div>
        <div class="demo-creds stagger-up" style="animation-delay:0.5s">
          <div class="lab">Quick Demo Login</div>
          <div class="row3">
            <button class="btn sm ghost" onclick="window.__demoLogin('student','student')">Student</button>
            <button class="btn sm ghost" onclick="window.__demoLogin('teacher','teacher')">Teacher</button>
            <button class="btn sm ghost" onclick="window.__demoLogin('admin','admin')">Admin</button>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ─── PROFILE ─── */
  function pageProfile() {
    if (!state.user) return `<section class="block"><div class="container notice"><h3>Not Signed In</h3><p>Please <a href="#/login" style="color:var(--brand)">sign in</a> to view your profile.</p></div></section>`;  
    return `
    <section class="block">
      <div class="container" style="max-width:700px;">
        <div class="head reveal"><div><h2>Your Profile</h2><p>Track your learning progress</p></div></div>
        <div class="glass reveal" style="border-radius:var(--r-lg); padding:30px; margin-bottom:30px;">
          <div class="row" style="gap:20px; margin-bottom:24px">
            <div class="avatar" style="width:56px; height:56px; font-size:1.5rem">${state.user.name[0].toUpperCase()}</div>
            <div>
              <h3 style="font-size:1.3rem">${state.user.name}</h3>
              <span class="chip-role">${state.user.role}</span>
            </div>
          </div>
        </div>
        <h3 class="reveal" style="margin-bottom:16px">Enrolled Courses</h3>
        <div id="enrolledList"><div class="spin"></div></div>
      </div>
    </section>`;
  }

  /* ─── TEACH ─── */
  function pageTeach() {
    if (!state.user || (state.user.role !== 'instructor' && state.user.role !== 'superadmin')) {
      return `<section class="block"><div class="container notice"><h3>Access Denied</h3><p>Only teachers and admins can create courses.</p></div></section>`;
    }
    return `
    <section class="block">
      <div class="container" style="max-width:700px;">
        <div class="head reveal"><div><h2>Propose a Course</h2><p>Share your knowledge with the community</p></div></div>
        <div class="glass reveal" style="border-radius:var(--r-lg); padding:30px;">
          <form id="teachForm" onsubmit="return window.__submitCourse(event)">
            <div class="field">
              <label>Course Title</label>
              <input id="courseTitle" placeholder="e.g. Introduction to Vedanta" required>
              <div class="field-error"></div>
            </div>
            <div class="field">
              <label>Summary</label>
              <input id="courseSummary" placeholder="One-line summary" required>
              <div class="field-error"></div>
            </div>
            <div class="field">
              <label>Description</label>
              <textarea id="courseDesc" placeholder="What will students learn?" required></textarea>
              <div class="field-error"></div>
            </div>
            <div class="field">
              <label>Category</label>
              <select id="courseCat">
                <option value="Foundation">Foundation</option>
                <option value="Wisdom">Wisdom</option>
                <option value="Mindset">Mindset</option>
                <option value="Practice">Practice</option>
                <option value="Purpose">Purpose</option>
                <option value="Culture">Culture</option>
              </select>
            </div>
            <div class="field">
              <label>Level</label>
              <div class="seg" id="diffSeg">
                <div class="opt active" data-val="Foundation" onclick="window.__setDiff(this)">Foundation</div>
                <div class="opt" data-val="Intermediate" onclick="window.__setDiff(this)">Intermediate</div>
                <div class="opt" data-val="Advanced" onclick="window.__setDiff(this)">Advanced</div>
              </div>
            </div>
            <div class="field">
              <label>Lessons (one per line)</label>
              <textarea id="courseLessons" placeholder="Lesson 1\nLesson 2\nLesson 3"></textarea>
            </div>
            <button type="submit" class="btn primary block" id="teachSubmitBtn" style="margin-top:8px">
              <span class="btn-label">Submit for Review</span>
              <div class="btn-spinner"></div>
            </button>
          </form>
        </div>
      </div>
    </section>`;
  }

  /* ─── ADMIN ─── */
  function pageAdmin() {
    if (!state.user || state.user.role !== 'superadmin') {
      return `<section class="block"><div class="container notice"><h3>Access Denied</h3><p>Admin access required.</p></div></section>`;
    }
    return `
    <section class="block">
      <div class="container" style="max-width:800px;">
        <div class="head reveal"><div><h2>Review Queue</h2><p>Approve or reject proposed courses</p></div></div>
        <div class="queue" id="adminQueue"><div class="spin"></div></div>
      </div>
    </section>`;
  }

  /* ─── 404 ─── */
  function page404() {
    return `
    <section class="block" style="min-height:70vh; display:flex; align-items:center; justify-content:center">
      <div class="container center">
        <div style="font-size:6rem; margin-bottom:16px; opacity:0.6">🕉️</div>
        <h1 style="font-size:3rem; margin-bottom:12px">404</h1>
        <p class="muted" style="font-size:1.2rem; margin-bottom:32px">This path has not been revealed yet.</p>
        <a href="#/" class="btn primary"><span class="btn-label">Return Home</span></a>
      </div>
    </section>`;
  }

  /* ═══════════════════════════════════════════════════════════════════
     ROUTER
     ═══════════════════════════════════════════════════════════════════ */
  function route() {
    // Cancel any carousel animation from previous page
    if (state.carouselScrollId) {
      cancelAnimationFrame(state.carouselScrollId);
      state.carouselScrollId = null;
    }
    if (state.placeholderInterval) {
      clearTimeout(state.placeholderInterval);
      state.placeholderInterval = null;
    }

    const hash = (location.hash || '#/').slice(1);
    const app = el('app');
    renderNav();
    closeMobileMenu();
    window.scrollTo(0, 0);

    // Match routes
    if (hash === '/' || hash === '') {
      app.innerHTML = pageHome();
      afterHome();
    } else if (hash === '/bot') {
      app.innerHTML = pageHome();
      afterHome();
      setTimeout(() => {
        const section = el('inlineChatSection');
        if (section) {
          const y = section.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
          setTimeout(() => {
             window.__toggleChatWidget();
          }, 600); // Wait for smooth scroll
        }
      }, 100);
    } else if (hash === '/courses') {
      app.innerHTML = pageCourses();
      afterCourses();
    } else if (hash.startsWith('/course/')) {
      const slug = hash.split('/course/')[1];
      app.innerHTML = pageCourseDetail(slug);
      afterCourseDetail(slug);
    } else if (hash === '/login') {
      if (state.user) { location.hash = '#/'; return; }
      app.innerHTML = pageLogin();
      afterLogin();
    } else if (hash === '/profile') {
      app.innerHTML = pageProfile();
      afterProfile();
    } else if (hash === '/teach') {
      app.innerHTML = pageTeach();
    } else if (hash === '/admin') {
      app.innerHTML = pageAdmin();
      afterAdmin();
    } else {
      app.innerHTML = page404();
    }

    // Initialize scroll animations for this page
    observeRevealElements();
  }

  /* ═══════════════════════════════════════════════════════════════════
     AFTER-RENDER HOOKS
     ═══════════════════════════════════════════════════════════════════ */

  /* ─── Typing Animation for Quick Chat ─── */
  function initPlaceholderAnimation() {
    const input = document.getElementById('quickChatInput');
    if (!input) return;

    const suggestions = [
      "What is the true meaning of Dharma?",
      "Tell me about Karma",
      "Who is Lord Krishna?",
      "Explain the concept of Moksha",
      "What are the four Vedas?"
    ];

    let currentIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingSpeed = 100;
    
    if (state.placeholderInterval) clearTimeout(state.placeholderInterval);

    function type() {
      if(!document.getElementById('quickChatInput')) return;
      
      const currentText = suggestions[currentIdx];
      
      if (isDeleting) {
        input.placeholder = "e.g., " + currentText.substring(0, charIdx - 1);
        charIdx--;
        typingSpeed = 30; // Delete faster
      } else {
        input.placeholder = "e.g., " + currentText.substring(0, charIdx + 1);
        charIdx++;
        typingSpeed = 70; // Type normally
      }

      if (!isDeleting && charIdx === currentText.length) {
        typingSpeed = 2500; // Pause at the end
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        currentIdx = (currentIdx + 1) % suggestions.length;
        typingSpeed = 500; // Pause before typing next
      }

      state.placeholderInterval = setTimeout(type, typingSpeed);
    }
    
    // Start animation slightly after load
    state.placeholderInterval = setTimeout(type, 1500);
  }

  /* ─── After Home ─── */
  async function afterHome() {
    initPlaceholderAnimation();

    // Chatbot
    renderChat();

    // Featured carousel
    try {
      const courses = await fetchCourses();
      const container = el('homeCarousel');
      if (!container) return;

      const colorMap = { Foundation: 'indigo', Wisdom: 'amber', Mindset: 'sky', Practice: 'emerald', Purpose: 'rose', Culture: 'violet' };

      container.innerHTML = `<div class="carousel-track">${courses.map(c => `
        <div class="card" onclick="location.hash='#/course/${c.id}'" ${c.thumbnail ? `style="background-image: linear-gradient(to bottom, var(--overlay-top) 0%, var(--overlay-bot) 100%), url('${c.thumbnail}'); background-size: cover; background-position: center;"` : ''}>
          <div class="tag"><span class="d ${colorMap[c.category] || 'indigo'}"></span>${c.category}</div>
          <h3>${c.title}</h3>
          <p>${(c.summary || c.description || '').slice(0, 80)}…</p>
          <div class="meta"><span>${c.level}</span><span>${c.lessons?.length || 0} lessons</span></div>
        </div>`).join('')}</div>`;

      initCarousel(container);
      init3DTilt();
    } catch (e) {
      const container = el('homeCarousel');
      if (container) container.innerHTML = '<div class="notice"><h3>Backend Offline</h3><p>Start the backend: <code>python server.py</code></p></div>';
    }
  }

  /* ─── After Courses ─── */
  let allCourses = [];
  let activeFilter = 'all';
  async function afterCourses() {
    const spinner = el('courseSpinner');
    try {
      allCourses = await fetchCourses();
      if (spinner) spinner.remove();

      // Filters
      const cats = [...new Set(allCourses.map(c => c.category))];
      const filtersEl = el('courseFilters');
      if (filtersEl) {
        filtersEl.innerHTML = `<button class="f active" onclick="window.__filterCat('all',this)">All</button>` +
          cats.map(c => `<button class="f" onclick="window.__filterCat('${c}',this)">${c[0].toUpperCase() + c.slice(1)}</button>`).join('');
      }

      renderCourseGrid(allCourses);
      observeRevealElements();
    } catch (e) {
      if (spinner) spinner.remove();
      el('courseGrid').innerHTML = '<div class="notice"><h3>Backend Offline</h3><p>Start the backend: <code>python server.py</code></p></div>';
    }
  }

  function renderCourseGrid(courses) {
    const grid = el('courseGrid');
    const empty = el('courseEmpty');
    const colorMap = { Foundation: 'indigo', Wisdom: 'amber', Mindset: 'sky', Practice: 'emerald', Purpose: 'rose', Culture: 'violet' };

    if (courses.length === 0) {
      grid.innerHTML = '';
      empty?.classList.remove('hide');
      return;
    }
    empty?.classList.add('hide');
    grid.innerHTML = courses.map(c => `
      <div class="card reveal" onclick="location.hash='#/course/${c.id}'" ${c.thumbnail ? `style="background-image: linear-gradient(to bottom, var(--overlay-top) 0%, var(--overlay-bot) 100%), url('${c.thumbnail}'); background-size: cover; background-position: center;"` : ''}>
        <div class="tag"><span class="d ${colorMap[c.category] || 'indigo'}"></span>${c.category}</div>
        <h3>${c.title}</h3>
        <p>${(c.summary || c.description || '').slice(0, 100)}…</p>
        <div class="meta"><span>${c.level}</span><span>${c.lessons?.length || 0} lessons</span></div>
      </div>`).join('');

    observeRevealElements();
    init3DTilt();
  }

  /* ─── After Course Detail ─── */
  async function afterCourseDetail(courseId) {
    const wrap = el('detailWrap');
    try {
      const c = await fetchCourseById(courseId);
      if (!c) { wrap.innerHTML = '<div class="notice"><h3>Course Not Found</h3></div>'; return; }
      const colorMap = { Foundation: 'indigo', Wisdom: 'amber', Mindset: 'sky', Practice: 'emerald', Purpose: 'rose', Culture: 'violet' };
      const col = colorMap[c.category] || c.accent || 'indigo';

      // Check enrollment
      let enrolled = false;
      let progress = 0;
      if (state.user) {
        try {
          const ep = await api('/api/my-learning');
          const myEnroll = (ep.learning || []).find(l => l.id === c.id);
          enrolled = !!myEnroll;
          progress = myEnroll?.progress || 0;
        } catch {}
      }

      wrap.innerHTML = `
        <a href="#/courses" class="btn sm subtle stagger-up" style="animation-delay:0.1s; margin-bottom:20px"><span class="btn-label">← Back to Courses</span></a>
        <div class="cover ${col} stagger-up" style="animation-delay:0.15s"><h2>${c.title}</h2></div>
        <div class="row sp wrap stagger-up" style="animation-delay:0.2s; margin-bottom:20px">
          <div class="row" style="gap:8px"><span class="chip-role">${c.category}</span><span class="badge proposed">${c.level}</span></div>
          ${!enrolled && state.user && state.user.role === 'user' ? `<button class="btn primary" id="enrollBtn" onclick="window.__enroll(${c.id})"><span class="btn-label">Enroll Now</span><div class="btn-spinner"></div></button>` : ''}
          ${!state.user ? `<a href="#/login" class="btn primary"><span class="btn-label">Sign in to Enroll</span></a>` : ''}
        </div>
        ${enrolled ? `<div style="margin-bottom:20px" class="stagger-up" style="animation-delay:0.25s"><div class="row sp" style="margin-bottom:8px"><span style="font-size:0.9rem">Progress</span><span style="font-size:0.9rem; color:var(--gold)">${progress}%</span></div><div class="bar"><i style="width:${progress}%"></i></div></div>` : ''}
        <p class="stagger-up" style="animation-delay:0.3s; margin-bottom:24px; font-size:1.05rem; line-height:1.7">${c.description}</p>
        <h3 class="stagger-up" style="animation-delay:0.35s; margin-bottom:16px">Lessons</h3>
        <ol class="lessons stagger-up" style="animation-delay:0.4s">
          ${(c.lessons || []).map((l, i) => `<li><span class="num">${i + 1}</span><span>${l}</span></li>`).join('')}
        </ol>
      `;
    } catch (e) {
      wrap.innerHTML = '<div class="notice"><h3>Error Loading Course</h3><p>Check backend connection.</p></div>';
    }
  }

  /* ─── After Login ─── */
  let authMode = 'login';
  function afterLogin() { renderAuthForm(); }

  function renderAuthForm() {
    const isLogin = authMode === 'login';
    const title = el('authTitle');
    const sub = el('authSub');
    const fields = el('authFields');
    const sw = el('authSwitch');
    const label = el('authBtnLabel');
    const err = el('authError');
    err.classList.add('hide');

    if (title) title.textContent = isLogin ? 'Welcome Back' : 'Create Account';
    if (sub) sub.textContent = isLogin ? 'Sign in to continue your journey' : 'Join the learning community';
    if (label) label.textContent = isLogin ? 'Sign In' : 'Create Account';

    let fieldsHtml = `
      <div class="field">
        <label>Email</label>
        <input id="authEmail" type="email" placeholder="Enter your email" required autocomplete="email">
        <div class="field-error"></div>
      </div>
      <div class="field">
        <label>Password</label>
        <input id="authPass" type="password" placeholder="Enter your password" required autocomplete="${isLogin ? 'current-password' : 'new-password'}">
        <div class="field-error"></div>
      </div>`;

    if (!isLogin) {
      fieldsHtml = `
      <div class="field">
        <label>Name</label>
        <input id="authName" placeholder="Enter your name" required autocomplete="name">
        <div class="field-error"></div>
      </div>` + fieldsHtml + `
      <div class="field">
        <label>Confirm Password</label>
        <input id="authPass2" type="password" placeholder="Confirm your password" required autocomplete="new-password">
        <div class="field-error"></div>
      </div>
      <div class="field">
        <label>Role</label>
        <div class="seg" id="roleSeg">
          <div class="opt active" data-val="user">Learner</div>
          <div class="opt" data-val="instructor">Teacher</div>
        </div>
      </div>`;
    }

    fieldsHtml += `
      <div style="margin: 20px 0; text-align: center; color: var(--text-secondary);">OR</div>
      <button type="button" class="btn" onclick="window.__googleLogin()" style="width:100%; background:white; color:black; display:flex; align-items:center; justify-content:center; gap:10px;">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Sign in with Google
      </button>
    `;

    if (fields) fields.innerHTML = fieldsHtml;
    if (sw) sw.innerHTML = isLogin
      ? `Don't have an account? <a href="javascript:void(0)" onclick="window.__switchAuth()">Sign Up</a>`
      : `Already have an account? <a href="javascript:void(0)" onclick="window.__switchAuth()">Sign In</a>`;

    // Wire up role segment clicks if present
    setTimeout(() => {
      $$('#roleSeg .opt').forEach(o => o.addEventListener('click', function() {
        $$('#roleSeg .opt').forEach(x => x.classList.remove('active'));
        this.classList.add('active');
      }));
    }, 0);
  }

  /* ─── After Profile ─── */
  async function afterProfile() {
    if (!state.user) return;
    const list = el('enrolledList');
    try {
      const data = await api('/api/enrolled');
      const courses = data.courses || [];
      if (courses.length === 0) {
        list.innerHTML = '<div class="empty"><div class="ico">📚</div><p>You haven\'t enrolled in any courses yet.</p><a href="#/courses" class="btn primary sm" style="margin-top:16px"><span class="btn-label">Browse Courses</span></a></div>';
      } else {
        list.innerHTML = courses.map(c => `
          <div class="glass reveal" style="border-radius:var(--r); padding:20px; margin-bottom:12px; cursor:pointer" onclick="location.hash='#/course/${c.slug}'">
            <div class="row sp">
              <h4>${c.title}</h4>
              <span style="color:var(--gold); font-weight:600">${c.progress || 0}%</span>
            </div>
            <div class="bar" style="margin-top:10px"><i style="width:${c.progress || 0}%"></i></div>
          </div>`).join('');
        observeRevealElements();
      }
    } catch {
      list.innerHTML = '<div class="notice"><h3>Error</h3><p>Could not load enrollments.</p></div>';
    }
  }

  /* ─── After Admin ─── */
  async function afterAdmin() {
    const queue = el('adminQueue');
    try {
      const data = await api('/api/admin/courses');
      const courses = data.courses || [];
      if (courses.length === 0) {
        queue.innerHTML = '<div class="empty"><div class="ico">✅</div><p>No pending reviews.</p></div>';
      } else {
        queue.innerHTML = courses.map(c => `
          <div class="qrow reveal">
            <div class="qtop">
              <div>
                <h3>${c.title}</h3>
                <p style="color:var(--ink-3); margin-top:4px">${c.description?.slice(0, 80)}…</p>
                <div class="row" style="gap:8px; margin-top:8px">
                  <span class="badge ${c.status}">${c.status}</span>
                  <span style="color:var(--ink-3); font-size:0.85rem">by ${c.author || 'unknown'}</span>
                </div>
              </div>
              ${c.status === 'proposed' ? `
              <div class="row" style="gap:8px">
                <button class="btn sm ok" onclick="window.__reviewCourse(${c.id},'approved')"><span class="btn-label">Approve</span></button>
                <button class="btn sm bad" onclick="window.__reviewCourse(${c.id},'rejected')"><span class="btn-label">Reject</span></button>
              </div>` : ''}
            </div>
          </div>`).join('');
        observeRevealElements();
      }
    } catch {
      queue.innerHTML = '<div class="notice"><h3>Error</h3><p>Could not load review queue.</p></div>';
    }
  }

  /* ═══════════════════════════════════════════════════════════════════
     CHATBOT
     ═══════════════════════════════════════════════════════════════════ */
  function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function renderChat() {
    const body = el('chatBody');
    const empty = el('chatEmpty');
    if (!body) return;
    if (state.chat.length === 0) {
      if (empty) empty.classList.remove('hide');
      return;
    }
    if (empty) empty.classList.add('hide');
    body.innerHTML = state.chat.map((m, i) => {
      const isBot = m.role === 'bot';
      // Render markdown for bot messages
      const contentHtml = (isBot && window.marked) ? window.marked.parse(m.text) : escapeHtml(m.text);
      
      const copyBtn = isBot ? `<button class="copy-btn" onclick="window.__copyMsg(${i})" title="Copy text" style="position:absolute; bottom:8px; right:8px; background:rgba(0,0,0,0.1); border-radius:6px; padding:4px 6px; border:none; color:inherit; opacity:0.7; cursor:pointer; display:flex; align-items:center; transition:0.2s;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></button>` : '';

      return `<div class="bubble ${m.role}">
                <div class="bubble-content markdown-body">${contentHtml}</div>
                ${copyBtn}
              </div>`;
    }).join('');
    body.scrollTop = body.scrollHeight;
  }

  async function sendChat(text) {
    const input = el('chatInput');
    const btn = el('chatSendBtn');
    const msg = text || input?.value?.trim();
    if (!msg) return;
    if (input) input.value = '';

    state.chat.push({ role: 'user', text: msg });
    renderChat();
    setButtonLoading(btn, true);

    try {
      const res = await fetch(cfg.API_BASE + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: state.chat.slice(0, -1).map(m => ({ role: m.role, content: m.text }))
        }),
      });
      const data = await res.json();
      state.chat.push({ role: 'bot', text: data.response || 'No response received.' });

      const userQueries = state.chat.filter(m => m.role === 'user').length;
      if (!window.__continueChatInTab && userQueries >= 3) {
        const chatBox = el('chatBox');
        const existing = chatBox?.querySelector('.chat-popup-overlay');
        if (!existing) {
          const popup = document.createElement('div');
          popup.className = 'chat-popup-overlay';
          popup.innerHTML = `
            <div class="chat-popup-content">
              <p style="font-size:2.5rem; margin-bottom:12px">🕉️</p>
              <h3 style="margin-bottom:8px">Dive Deeper with ShastraBot</h3>
              <p style="color:var(--ink-2); margin-bottom:20px; max-width:300px">You've asked a few questions. Do you want to continue in the full immersive chatbot experience?</p>
              <a href="${cfg.CHATBOT_URL || '#/'}?from=website&query=${encodeURIComponent(msg)}&history=${encodeURIComponent(JSON.stringify(state.chat))}" class="btn primary"><span class="btn-label">Open Full Chatbot ↗</span></a>
              <button class="btn ghost sm" style="margin-top:12px" onclick="this.closest('.chat-popup-overlay').remove(); window.__continueChatInTab = true;"><span class="btn-label">Continue Here</span></button>
            </div>`;
          chatBox?.appendChild(popup);
        }
      }
    } catch {
      state.chat.push({ role: 'bot', text: '⚠️ Could not reach the backend. Make sure the server is running.' });
    }
    renderChat();
    setButtonLoading(btn, false);
  }

  /* ═══════════════════════════════════════════════════════════════════
     GLOBAL ACTION HANDLERS
     ═══════════════════════════════════════════════════════════════════ */
  window.__toggleTheme = toggleTheme;
  window.__logout = logout;
  window.__closeMobileMenu = closeMobileMenu;
  window.__sendChat = () => sendChat();
  window.__askChat = (q) => sendChat(q);
  window.__toggleChatMode = () => {
    state.chatMode = state.chatMode === 'learn' ? 'teach' : 'learn';
    const sw = el('chatSwitch');
    const label = el('chatModeLabel');
    if (sw) { sw.classList.toggle('on', state.chatMode === 'teach'); sw.setAttribute('aria-checked', state.chatMode === 'teach'); }
    if (label) label.textContent = state.chatMode === 'teach' ? 'Teach Mode' : 'Learn Mode';
  };

  window.__toggleChatWidget = () => {
    const modal = el('chatWidgetModal');
    if (modal) {
      modal.classList.toggle('active');
      document.body.classList.toggle('chat-open', modal.classList.contains('active'));
    }
  };

  window.__openFullChatbot = () => {
    let url = `${cfg.CHATBOT_URL || '#/'}?from=website`;
    if (state.chat.length > 0) {
      url += `&history=${encodeURIComponent(JSON.stringify(state.chat))}`;
    }
    window.location.href = url;
  };

  window.__copyMsg = (idx) => {
    const msg = state.chat[idx];
    if (msg && msg.text) {
      navigator.clipboard.writeText(msg.text).then(() => {
        toast('Copied to clipboard!');
      }).catch(err => {
        toast('Failed to copy', 'bad');
      });
    }
  };

  window.__filterCourses = () => {
    const q = (el('courseSearch')?.value || '').toLowerCase();
    let filtered = allCourses;
    if (activeFilter !== 'all') filtered = filtered.filter(c => c.category === activeFilter);
    if (q) filtered = filtered.filter(c => c.title.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q));
    renderCourseGrid(filtered);
  };

  window.__filterCat = (cat, btn) => {
    activeFilter = cat;
    $$('.filters .f').forEach(f => f.classList.remove('active'));
    btn.classList.add('active');
    window.__filterCourses();
  };

  window.__handleAuth = async (e) => {
    e.preventDefault();
    const btn = el('authSubmit');
    const err = el('authError');
    const email = el('authEmail')?.value?.trim().toLowerCase();
    const pass = el('authPass')?.value?.trim();

    // Validate
    let valid = true;
    valid = validateField(el('authEmail'), { required: true, email: true }) && valid;
    valid = validateField(el('authPass'), { required: true, minLength: 6 }) && valid;

    if (authMode === 'register') {
      valid = validateField(el('authName'), { required: true, requiredMsg: 'Name is required' }) && valid;
      valid = validateField(el('authPass2'), { required: true, match: '#authPass' }) && valid;
    }

    if (!valid) return false;

    setButtonLoading(btn, true);
    err.classList.add('hide');

    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = { email, password: pass };
      if (authMode === 'register') {
        body.name = el('authName')?.value?.trim() || '';
        body.role = $('#roleSeg .opt.active')?.dataset.val || 'user';
      }
      const data = await api(endpoint, { method: 'POST', body: JSON.stringify(body) });

      if (data.error) {
        err.textContent = data.error;
        err.classList.remove('hide');
        setButtonLoading(btn, false);
        return false;
      }

      state.token = data.token;
      state.user = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast(`Welcome, ${data.user.name}!`);
      location.hash = '#/';
    } catch (e) {
      err.textContent = 'Connection error. Is the backend running?';
      err.classList.remove('hide');
    }
    setButtonLoading(btn, false);
    return false;
  };

  window.__switchAuth = () => {
    authMode = authMode === 'login' ? 'register' : 'login';
    renderAuthForm();
  };

  window.__demoLogin = async (u, p) => {
    window.__switchAuth(); // ensure we are on login screen
    if (authMode !== 'login') window.__switchAuth();
    const emailInput = el('authEmail');
    const passInput = el('authPass');
    if (emailInput) emailInput.value = `${u}@vedyam.org`;
    if (passInput) passInput.value = p;
    // Trigger the form submit
    const form = el('authForm');
    if (form) form.dispatchEvent(new Event('submit', { cancelable: true }));
  };

  window.__enroll = async (courseId) => {
    const btn = el('enrollBtn');
    if (!state.user) { location.hash = '#/login'; return; }
    setButtonLoading(btn, true);
    try {
      await api(`/api/course/${courseId}/enroll`, { method: 'POST' });
      toast('Successfully enrolled!');
      route(); // Refresh
    } catch {
      toast('Enrollment failed', 'bad');
    }
    setButtonLoading(btn, false);
  };

  window.__setDiff = (el) => {
    $$('#diffSeg .opt').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
  };

  window.__submitCourse = async (e) => {
    e.preventDefault();
    const btn = el('teachSubmitBtn');
    const title = el('courseTitle')?.value?.trim();
    const summary = el('courseSummary')?.value?.trim();
    const desc = el('courseDesc')?.value?.trim();
    const cat = el('courseCat')?.value;
    const level = $('#diffSeg .opt.active')?.dataset.val || 'Foundation';
    const lessonsRaw = el('courseLessons')?.value || '';

    // Validate
    let valid = true;
    valid = validateField(el('courseTitle'), { required: true }) && valid;
    valid = validateField(el('courseSummary'), { required: true }) && valid;
    valid = validateField(el('courseDesc'), { required: true, minLength: 20 }) && valid;
    if (!valid) return false;

    setButtonLoading(btn, true);
    try {
      const data = await api('/api/courses', {
        method: 'POST',
        body: JSON.stringify({ title, summary, description: desc, category: cat, level: level, lessons: lessonsRaw })
      });
      if (data.error) { toast(data.error, 'bad'); }
      else { toast('Course submitted for review!'); location.hash = '#/courses'; }
    } catch {
      toast('Submission failed', 'bad');
    }
    setButtonLoading(btn, false);
    return false;
  };

  window.__reviewCourse = async (id, status) => {
    try {
      await api(`/api/course/${id}/review`, { method: 'POST', body: JSON.stringify({ action: status === 'approved' ? 'approve' : 'reject' }) });
      toast(`Course ${status}!`);
      afterAdmin();
    } catch {
      toast('Review action failed', 'bad');
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════════════════ */

  // Splash screen
  setTimeout(() => {
    const splash = el('splash-screen');
    if (splash) splash.classList.add('hidden');
  }, 1500);

  // Route
  window.addEventListener('hashchange', route);
  route();

  // Keyboard support for switch toggle
  document.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('switch') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      e.target.click();
    }
  });
})();


window.__googleLogin = function() {
    const email = prompt('Enter your Gmail address to sign in with Google:');
    if (!email) return;
    
    const err = document.getElementById('authError');
    if (err) err.classList.add('hide');
    const label = document.getElementById('authBtnLabel');
    if (label) label.textContent = 'Sending OTP...';
    
    fetch(window.VEDYAM.API_BASE + '/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    }).then(r => r.json()).then(data => {
        if (data.error) {
            if (err) { err.textContent = data.error; err.classList.remove('hide'); }
            if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
            return;
        }
        
        const otp = prompt('OTP sent to ' + email + '!\nPlease check your inbox and enter the 6-digit code:');
        if (!otp) {
            if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
            return;
        }
        
        if (label) label.textContent = 'Verifying...';
        fetch(window.VEDYAM.API_BASE + '/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, code: otp })
        }).then(r => r.json()).then(verifyData => {
            if (verifyData.error) {
                if (err) { err.textContent = verifyData.error; err.classList.remove('hide'); }
                if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
                return;
            }
            
            localStorage.setItem('vedyam_token', verifyData.token);
            window.state.user = verifyData.user;
            window.location.hash = '#/profile';
        }).catch(e => {
            if (err) { err.textContent = 'Verification failed.'; err.classList.remove('hide'); }
            if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
        });
        
    }).catch(e => {
        if (err) { err.textContent = 'Failed to request OTP. Is backend running?'; err.classList.remove('hide'); }
        if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
    });
};
