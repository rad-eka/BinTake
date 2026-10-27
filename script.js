// ---- Sticky nav shadow ----
const nav = document.getElementById('nav');
if (nav) {
  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ---- Mobile menu ----
const navToggle = document.getElementById('navToggle');
const mobileMenu = document.getElementById('mobileMenu');
if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
  });
  mobileMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Open menu');
    });
  });
}

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- Scroll reveal ----
// Elements are visible by default in CSS. Only arm the fade-in effect
// once we know we can observe and reveal them again — this way a
// slow observer, a missed threshold, or a disabled script can never
// leave content permanently hidden.
const revealEls = document.querySelectorAll('.reveal');
const statNums = document.querySelectorAll('.stat__num[data-count]');
if ('IntersectionObserver' in window && !reduceMotion) {
  revealEls.forEach(el => el.classList.add('reveal-armed'));

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('is-visible'), i * 35);
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });
  revealEls.forEach(el => revealObserver.observe(el));

  // Safety net: force-reveal anything the observer hasn't caught
  // within a couple of seconds (e.g. very short or unusual viewports).
  setTimeout(() => {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }, 2500);

  // ---- Route animation ----
  const route = document.getElementById('route');
  if (route) {
    const routeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          route.classList.add('is-visible');
          routeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    routeObserver.observe(route);
  }

  // ---- Count-up stats ----
  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const isDecimal = target % 1 !== 0;
      if (reduceMotion) {
        el.textContent = target + suffix;
      } else {
        let start = null;
        const dur = 1400;
        const step = (ts) => {
          if (!start) start = ts;
          const progress = Math.min((ts - start) / dur, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          const val = target * eased;
          el.textContent = (isDecimal ? val.toFixed(1) : Math.round(val)) + suffix;
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
      countObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  statNums.forEach(el => countObserver.observe(el));

  // Safety net: make sure every stat has its final number even if
  // the observer never caught it (e.g. it was never scrolled past
  // in a way that crossed the threshold).
  setTimeout(() => {
    statNums.forEach(el => {
      if (el.textContent === '0') {
        el.textContent = el.dataset.count + (el.dataset.suffix || '');
      }
    });
  }, 3000);
} else {
  revealEls.forEach(el => el.classList.add('is-visible'));
  statNums.forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
}

// ---- Cursor spotlight on hero panel ----
const heroPanel = document.querySelector('.hero__panel, .svc-illus');
if (heroPanel && !reduceMotion && window.matchMedia('(hover: hover)').matches) {
  heroPanel.addEventListener('mousemove', (e) => {
    const rect = heroPanel.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    heroPanel.style.setProperty('--sx', x + '%');
    heroPanel.style.setProperty('--sy', y + '%');
  });
}

// ---- Tilt effect on cards ----
if (!reduceMotion && window.matchMedia('(hover: hover)').matches) {
  document.querySelectorAll('.tilt').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ---- FAQ accordion ----
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-item__q');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('is-open');
    item.parentElement.querySelectorAll('.faq-item').forEach(i => i.classList.remove('is-open'));
    if (!isOpen) item.classList.add('is-open');
  });
});

// ---- Marquee duplication for seamless loop ----
document.querySelectorAll('.marquee__track').forEach(track => {
  track.innerHTML += track.innerHTML;
});

// ---- Footer year ----
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Book a Service form ----
// Homepage: name + phone + address + service select -> hands off to that
// service's own #book form, prefilled, via sessionStorage.
// Service pages: name + phone + address -> this IS the booking step, so a
// valid submit shows an inline confirmation instead of navigating away.
const BOOKING_STORAGE_KEY = 'binTakerBooking';
const bookForm = document.getElementById('bookForm');
if (bookForm) {
  const nameInput = document.getElementById('bookName');
  const phoneInput = document.getElementById('bookPhone');
  const addressInput = document.getElementById('bookAddress');
  const serviceSelect = document.getElementById('serviceSelect'); // homepage only
  const errorEl = document.getElementById('bookFormError');
  const successEl = document.getElementById('bookSuccess');

  // Prefill from a previous step (e.g. after choosing a service on the homepage)
  try {
    const saved = JSON.parse(sessionStorage.getItem(BOOKING_STORAGE_KEY) || 'null');
    if (saved) {
      if (nameInput && saved.name) nameInput.value = saved.name;
      if (phoneInput && saved.phone) phoneInput.value = saved.phone;
      if (addressInput && saved.address) addressInput.value = saved.address;
    }
  } catch (err) {
    // Ignore unreadable/corrupt storage and just start with a blank form.
  }

  bookForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!bookForm.checkValidity()) {
      bookForm.reportValidity();
      if (errorEl) errorEl.hidden = false;
      return;
    }
    if (errorEl) errorEl.hidden = true;

    const details = {
      name: nameInput ? nameInput.value.trim() : '',
      phone: phoneInput ? phoneInput.value.trim() : '',
      address: addressInput ? addressInput.value.trim() : ''
    };

    if (serviceSelect) {
      // Homepage form: stash the details and jump to that service's booking form.
      try { sessionStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(details)); } catch (err) {}
      window.location.href = serviceSelect.value + '#book';
      return;
    }

    // Service-page form: this is the final booking step.
    try { sessionStorage.removeItem(BOOKING_STORAGE_KEY); } catch (err) {}
    if (successEl) {
      const nameSpan = document.getElementById('bookSuccessName');
      const phoneSpan = document.getElementById('bookSuccessPhone');
      if (nameSpan) nameSpan.textContent = details.name;
      if (phoneSpan) phoneSpan.textContent = details.phone;
      bookForm.hidden = true;
      successEl.hidden = false;
      successEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    } else {
      alert('Thanks! This is a prototype, so no request was actually sent — in the full app, our team would be notified now.');
    }
  });
}
