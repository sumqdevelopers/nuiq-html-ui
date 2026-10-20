/* ==========================================================================
   NuIQ – Shared script
   Every feature checks for its own markup first, so this file can be loaded
   on any page and only runs what that page uses.
   ========================================================================== */
(function () {
  'use strict';

  // Footer year
  function initYear() {
    var el = document.getElementById('yr');
    if (el) el.textContent = new Date().getFullYear();
  }

  // Desktop "More" dropdown (hover handled in CSS; click/keyboard handled here)
  function initDropdown() {
    var dropdown = document.querySelector('.dd');
    if (!dropdown) return;
    var button = dropdown.querySelector('button');

    function setOpen(open) {
      dropdown.classList.toggle('open', open);
      button.setAttribute('aria-expanded', open);
    }

    button.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!dropdown.classList.contains('open'));
    });
    document.addEventListener('click', function () {
      setOpen(false);
    });
  }

  // Mobile menu (+ optional "More" sub-menu)
  function initMobileMenu() {
    var burger = document.querySelector('.burger');
    if (!burger) return;

    function setOpen(open) {
      document.body.classList.toggle('menu-open', open);
      burger.setAttribute('aria-expanded', open);
    }

    burger.addEventListener('click', function () {
      setOpen(!document.body.classList.contains('menu-open'));
    });
    document.querySelectorAll('.mobile-nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });

    var moreToggle = document.querySelector('.more-toggle');
    var moreSub = document.querySelector('.mobile-nav .sub');
    if (moreToggle && moreSub) {
      moreToggle.addEventListener('click', function () {
        var open = moreSub.classList.toggle('open');
        moreToggle.setAttribute('aria-expanded', open);
      });
    }
  }

  // Scroll reveal + count-up numbers
  function countUp(el, target, format, duration) {
    var start = null;
    function step(now) {
      if (!start) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = format(Math.floor(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || reduceMotion) {
      revealEls.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add('in');

        var pct = el.querySelector('[data-pct]');
        if (pct) {
          countUp(pct, +pct.dataset.pct, function (v) { return v + '%'; }, 1500);
        }

        var counter = el.querySelector('.counter');
        if (counter) {
          countUp(counter, +counter.dataset.target, function (v) { return v.toLocaleString('en-US'); }, 2500);
        }

        observer.unobserve(el);
      });
    }, { threshold: 0.15 });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  // Accordion – one item open at a time
  function initAccordion() {
    var items = document.querySelectorAll('.acc');
    if (!items.length) return;

    function setOpen(item, open) {
      var body = item.querySelector('.body');
      item.classList.toggle('open', open);
      item.querySelector('button').setAttribute('aria-expanded', open);
      body.style.maxHeight = open ? body.scrollHeight + 'px' : '0';
    }

    items.forEach(function (item) {
      if (item.classList.contains('open')) setOpen(item, true);
      item.querySelector('button').addEventListener('click', function () {
        var willOpen = !item.classList.contains('open');
        items.forEach(function (other) { setOpen(other, false); });
        if (willOpen) setOpen(item, true);
      });
    });

    window.addEventListener('resize', function () {
      document.querySelectorAll('.acc.open .body').forEach(function (body) {
        body.style.maxHeight = body.scrollHeight + 'px';
      });
    });
  }

  // Back-to-top button
  function initBackToTop() {
    var button = document.querySelector('.totop');
    if (!button) return;

    window.addEventListener('scroll', function () {
      button.classList.toggle('show', window.scrollY > 300);
    }, { passive: true });
    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Contact form: client-side validation only.
  // This static copy has no backend, so it does NOT send the message anywhere.
  // On a valid submit it offers to open the visitor's email app with the details filled in.
  function initContactForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var notice = document.getElementById('notice');

    function check(input) {
      var wrap = input.closest('.f') || input.closest('.consent');
      var value = input.value.trim();
      var ok = true;

      if (input.type === 'checkbox') ok = input.checked;
      else if (input.required && !value) ok = false;
      else if (input.type === 'email' && value) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      else if (input.id === 'phone' && value) ok = /^[0-9+()\-.\s]{7,20}$/.test(value);

      if (wrap) wrap.classList.toggle('invalid', !ok);
      return ok;
    }

    ['name', 'email', 'phone'].forEach(function (id) {
      document.getElementById(id).addEventListener('blur', function () {
        check(this);
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var fields = [form.Name, form.Phone, form.Email, form.smsConsent];
      var valid = fields.map(check).every(Boolean);
      if (!valid) {
        notice.classList.remove('show');
        var firstInvalid = form.querySelector('.invalid input, .invalid textarea');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var body =
        'Name: ' + form.Name.value +
        '\nPhone: ' + form.Phone.value +
        '\nEmail: ' + form.Email.value +
        '\nOrganization: ' + form.Organization.value +
        '\nEHR / EMR: ' + form.EHR.value +
        '\n\n' + form.Message.value;
      var href = 'mailto:sales@nuiq.com' +
        '?subject=' + encodeURIComponent('Contact form – ' + form.Name.value) +
        '&body=' + encodeURIComponent(body);

      notice.innerHTML = 'This static copy of the page isn’t connected to a form backend, so your message has <b>not</b> been sent. ' +
        '<a href="' + href + '">Open it in your email app</a> to send it to sales@nuiq.com.';
      notice.classList.add('show');
    });
  }

  // Event image preview (lightbox)
  function initLightbox() {
    var lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    var image = lightbox.querySelector('img');
    var closeBtn = lightbox.querySelector('button');
    var lastFocus = null;

    function open(thumb) {
      var source = thumb.querySelector('img');
      lastFocus = document.activeElement;
      image.src = source.src;
      image.alt = source.alt;
      lightbox.classList.add('open');
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove('open');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var thumb = e.target.closest('.event-thumb');
      if (thumb) open(thumb);
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target !== image) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lightbox.classList.contains('open')) close();
    });
  }

  // Login / Sign Up forms: client-side validation only.
  // These pages are not connected to the NuIQ account system, so nothing is
  // sent anywhere and password fields are cleared on every submit.
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[0-9+()\-.\s]{7,20}$/;

  function initAuthForm(formId, rules, passwordIds, successMessage) {
    var form = document.getElementById(formId);
    if (!form) return;
    var notice = document.getElementById('authNotice');

    function check(id) {
      var input = document.getElementById(id);
      var ok = rules[id](input.value);
      input.closest('.auth-field').classList.toggle('invalid', !ok);
      return ok;
    }

    function showNotice(message) {
      notice.textContent = message;
      notice.classList.add('show');
    }

    // Once a field has been flagged, re-check it as the visitor types
    form.addEventListener('input', function (e) {
      var field = e.target.closest('.auth-field');
      if (field && field.classList.contains('invalid')) check(e.target.id);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valid = Object.keys(rules).map(check).every(Boolean);
      passwordIds.forEach(function (id) { document.getElementById(id).value = ''; });

      if (!valid) {
        notice.classList.remove('show');
        return;
      }
      showNotice(successMessage);
    });

    var forgot = form.querySelector('.auth-forgot');
    if (forgot) {
      forgot.addEventListener('click', function (e) {
        e.preventDefault();
        showNotice('Password reset isn’t connected on this page yet.');
      });
    }
  }

  function initLoginForm() {
    initAuthForm('loginForm', {
      email: function (v) { return EMAIL_RE.test(v.trim()); },
      pw: function (v) { return v !== ''; }
    }, ['pw'], 'This page isn’t connected to the NuIQ account system yet, so nothing was sent and you have not been signed in.');
  }

  function initSignupForm() {
    initAuthForm('signupForm', {
      name: function (v) { return v.trim().length > 1; },
      email: function (v) { return EMAIL_RE.test(v.trim()); },
      phone: function (v) { return v.trim() === '' || PHONE_RE.test(v.trim()); },
      pw: function (v) { return v.length >= 8; },
      pw2: function (v) { return v !== '' && v === document.getElementById('pw').value; }
    }, ['pw', 'pw2'], 'This page isn’t connected to the NuIQ account system yet, so no account was created and nothing was sent.');
  }

  initYear();
  initDropdown();
  initMobileMenu();
  initReveal();
  initAccordion();
  initBackToTop();
  initContactForm();
  initLightbox();
  initLoginForm();
  initSignupForm();
})();
