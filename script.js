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

  // Contact form: validates, then sends through the app's contact API (same as the old site):
  // POST /api/generateToken.php for a token, then POST /api/sendContactEmail.php.
  // Success goes to /thanks/, which carries the ad conversion tags.
  // If the API can't be reached, the visitor is offered their email app instead.
  function postForm(url, data) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: new URLSearchParams(data).toString(),
      credentials: 'same-origin'
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

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

      var data = {
        name: form.Name.value.trim(),
        email: form.Email.value.trim(),
        phone: form.Phone.value.trim(),
        company: form.Organization.value.trim(),
        ehr: form.EHR.value.trim(),
        message: form.Message.value.trim()
      };
      var button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      button.textContent = 'Sending…';
      notice.classList.remove('show');

      postForm('/api/generateToken.php', {})
        .then(function (res) {
          data.token = res.token;
          return postForm('/api/sendContactEmail.php', data);
        })
        .then(function (res) {
          if (res.success) {
            window.location.href = '/thanks/';
            return;
          }
          notice.textContent = res.error_message || 'Your message couldn’t be sent. Please try again.';
          notice.classList.add('show');
        })
        .catch(function () {
          showEmailFallback(data);
        })
        .then(function () {
          button.disabled = false;
          button.textContent = 'Submit';
        });
    });

    function showEmailFallback(data) {
      var body =
        'Name: ' + data.name +
        '\nPhone: ' + data.phone +
        '\nEmail: ' + data.email +
        '\nOrganization: ' + data.company +
        '\nEHR / EMR: ' + data.ehr +
        '\n\n' + data.message;
      var href = 'mailto:sales@nuiq.com' +
        '?subject=' + encodeURIComponent('Contact form – ' + data.name) +
        '&body=' + encodeURIComponent(body);

      notice.innerHTML = 'Sorry, we couldn’t send your message just now. ' +
        '<a href="' + href + '">Send it from your email app</a> to sales@nuiq.com instead.';
      notice.classList.add('show');
    }
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

  // Privacy Policy / Terms of Service tabs, driven by ?tab= so footer links open the right one
  function initLegalTabs() {
    var tabs = document.querySelectorAll('.legal-tab');
    if (!tabs.length) return;
    var titles = {
      'privacy-policy': 'Privacy Policy | NuIQ',
      'terms-of-service': 'Terms of Service | NuIQ'
    };

    function show(key, updateUrl) {
      if (!titles[key]) key = 'privacy-policy';
      tabs.forEach(function (tab) {
        var on = tab.dataset.tab === key;
        tab.setAttribute('aria-selected', on);
        document.getElementById(tab.dataset.tab).hidden = !on;
      });
      document.title = titles[key];
      if (updateUrl) history.replaceState(null, '', '?tab=' + key);
    }

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.preventDefault();
        show(tab.dataset.tab, true);
      });
    });
    show(new URLSearchParams(location.search).get('tab'), false);
  }

  initYear();
  initDropdown();
  initMobileMenu();
  initReveal();
  initAccordion();
  initBackToTop();
  initContactForm();
  initLightbox();
  initLegalTabs();
})();
