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
  window.addEventListener('scroll', () => {
    updateScrollProgress();
    updateBackToTop();
    updateNavScroll();
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
        
        <div class="quick-chat-bar stagger-up" style="animation-delay:0.6s; max-width:800px; margin: 40px auto 0; background:rgba(255, 255, 255, 0.03); border:1px solid rgba(255, 255, 255, 0.1); border-radius:12px; padding:16px; display:flex; align-items:center; gap:16px; box-shadow:0 8px 32px rgba(0, 0, 0, 0.2); backdrop-filter:blur(10px);">
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
            <input type="text" id="quickChatInput" placeholder="e.g., What is the true meaning of Dharma?" style="width:100%; background:rgba(255, 255, 255, 0.05); border:1px solid rgba(255, 255, 255, 0.1); border-radius:99px; padding:0.85rem 3.5rem 0.85rem 1.5rem; font-size:0.95rem; color:var(--ink); outline:none;" onkeydown="if(event.key==='Enter') window.__quickChat()">
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

    <section class="block reveal">
      <div class="container">
        <div class="stats" id="statsStrip">
          <div class="stat"><div class="n" data-count="50" data-suffix="+">0</div><div class="l">Lessons</div></div>
          <div class="stat"><div class="n" data-count="12" data-suffix="">0</div><div class="l">Courses</div></div>
          <div class="stat"><div class="n" data-count="1000" data-suffix="+">0</div><div class="l">Students</div></div>
          <div class="stat"><div class="n" data-count="4" data-suffix=".8 ★">0</div><div class="l">Rating</div></div>
        </div>
      </div>
    </section>

    <section class="block">
      <div class="container">
        <div class="head reveal">
          <div><h2>Ask ShastraBot</h2><p>AI-powered Q&A grounded in scripture</p></div>
        </div>
        <div class="chat glass reveal-scale" id="chatBox">
          <div class="chat-head" style="justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="dot"></span>
              <h4>ShastraBot</h4>
            </div>
            <div style="display:flex; align-items:center; gap:16px;">
              <div class="teach-toggle" onclick="window.__toggleChatMode()">
                <span id="chatModeLabel">Learn Mode</span>
                <div class="switch ${state.chatMode === 'teach' ? 'on' : ''}" id="chatSwitch" role="switch" aria-checked="${state.chatMode === 'teach'}" tabindex="0"></div>
              </div>
              <button onclick="window.__openFullChatbot()" class="btn sm primary"><span class="btn-label">Open Full Chatbot ↗</span></button>
            </div>
          </div>
          <div class="chat-body" id="chatBody">
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
          <div class="chat-input">
            <input id="chatInput" placeholder="Ask about the scriptures..." autocomplete="off"
              onkeydown="if(event.key==='Enter')window.__sendChat()">
            <button class="btn primary" id="chatSendBtn" onclick="window.__sendChat()" aria-label="Send message"><span class="btn-label">Ask</span><div class="btn-spinner"></div></button>
          </div>
        </div>
      </div>
    </section>
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
        const chatBox = el('chatBox');
        if (chatBox) {
          const y = chatBox.getBoundingClientRect().top + window.scrollY - 100; // offset for sticky nav
          window.scrollTo({ top: y, behavior: 'smooth' });
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

    // Stats counter observer
    const statsEl = el('statsStrip');
    if (statsEl) counterObserver.observe(statsEl);

    // Chatbot
    renderChat();

    // Featured carousel
    try {
      const data = await api('/api/courses');
      const courses = data.courses || [];
      const container = el('homeCarousel');
      if (!container) return;

      const colorMap = { Foundation: 'indigo', Wisdom: 'amber', Mindset: 'sky', Practice: 'emerald', Purpose: 'rose', Culture: 'violet' };

      container.innerHTML = `<div class="carousel-track">${courses.map(c => `
        <div class="card" onclick="location.hash='#/course/${c.id}'">
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
      const data = await api('/api/courses');
      allCourses = data.courses || [];
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
      <div class="card reveal" onclick="location.hash='#/course/${c.id}'">
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
      const data = await api(`/api/course/${courseId}`);
      const c = data.course;
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
  function renderChat() {
    const body = el('chatBody');
    const empty = el('chatEmpty');
    if (!body) return;
    if (state.chat.length === 0) {
      if (empty) empty.classList.remove('hide');
      return;
    }
    if (empty) empty.classList.add('hide');
    body.innerHTML = state.chat.map(m => `<div class="bubble ${m.role}">${m.text}</div>`).join('');
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
      const chatApiBase = cfg.API_BASE;
      const res = await fetch(chatApiBase + '/api/website/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: state.chat.slice(0, -1).map(m => ({ role: m.role, content: m.text }))
        }),
      });
      const data = await res.json();
      state.chat.push({ role: 'bot', text: data.reply || 'No response received.' });

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
              <button onclick="window.__openFullChatbot('&query=${encodeURIComponent(msg)}&history=${encodeURIComponent(JSON.stringify(state.chat))}')" class="btn primary"><span class="btn-label">Open Full Chatbot ↗</span></button>
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

  // Expose global openFullChatbot for the modal
  window.__openFullChatbot = function(queryStr = '') {
    let modal = document.getElementById('chatbotModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'chatbotModal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
      modal.style.zIndex = '9999';
      modal.style.display = 'flex';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      modal.style.backdropFilter = 'blur(10px)';
      modal.style.padding = '24px';
      modal.style.boxSizing = 'border-box';
      modal.style.opacity = '0';
      modal.style.transition = 'opacity 0.3s ease';
      
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '✕';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '24px';
      closeBtn.style.right = '24px';
      closeBtn.style.background = 'rgba(255,255,255,0.1)';
      closeBtn.style.border = '1px solid rgba(255,255,255,0.2)';
      closeBtn.style.color = 'white';
      closeBtn.style.fontSize = '24px';
      closeBtn.style.width = '48px';
      closeBtn.style.height = '48px';
      closeBtn.style.borderRadius = '50%';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.zIndex = '10000';
      closeBtn.style.display = 'flex';
      closeBtn.style.justifyContent = 'center';
      closeBtn.style.alignItems = 'center';
      closeBtn.onclick = () => {
        modal.style.opacity = '0';
        setTimeout(() => document.body.removeChild(modal), 300);
      };
      
      const iframe = document.createElement('iframe');
      iframe.src = (window.VEDYAM.CHATBOT_URL || '/chatbot') + '?from=website' + queryStr;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.maxWidth = '1200px';
      iframe.style.borderRadius = '16px';
      iframe.style.border = '1px solid rgba(255,255,255,0.1)';
      iframe.style.boxShadow = '0 24px 64px rgba(0,0,0,0.5)';
      iframe.style.background = '#111';
      
      modal.appendChild(closeBtn);
      modal.appendChild(iframe);
      document.body.appendChild(modal);
      
      requestAnimationFrame(() => {
        modal.style.opacity = '1';
      });
    }
  };
})();
