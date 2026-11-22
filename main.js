/* ==========================================================================
   ENSI Events — Main Interactive & Animation Engine (main.js)
   Vanilla JS + GSAP 3 & ScrollTrigger | Optimized for Safari, Chrome & Mobile
   ========================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined';
  const hasScrollTrigger = hasGSAP && typeof window.ScrollTrigger !== 'undefined';

  if (hasScrollTrigger) {
    window.gsap.registerPlugin(window.ScrollTrigger);
    window.ScrollTrigger.config({
      ignoreMobileResize: true
    });
  }

  /* ------------------------------------------------------------------------
     1. القائمة المنبثقة (Overlay Menu) وإدارة إمكانية الوصول
     ------------------------------------------------------------------------ */
  function initNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const navOverlay = document.getElementById('nav-overlay');
    if (!menuToggle || !navOverlay) return;

    const navLinks = navOverlay.querySelectorAll('.nav-overlay-links a');
    const navFooter = navOverlay.querySelector('.nav-overlay-footer');

    // تمييز رابط الصفحة الحالية تلقائياً في القائمة والتذييل
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-overlay-links a, .footer-links-list a').forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      const normalizedHref = href.replace('./', '');
      if (normalizedHref === currentPath || (currentPath === '' && normalizedHref === 'index.html')) {
        link.classList.add('is-current');
        link.setAttribute('aria-current', 'page');
      }
    });

    let isOpen = false;

    const setMenuState = (open) => {
      isOpen = open;
      navOverlay.classList.toggle('is-open', open);
      menuToggle.classList.toggle('is-active', open);
      document.documentElement.classList.toggle('menu-open', open);
      document.body.classList.toggle('menu-open', open);

      menuToggle.setAttribute('aria-expanded', String(open));
      navOverlay.setAttribute('aria-hidden', String(!open));

      if (open && hasGSAP && !prefersReducedMotion) {
        window.gsap.killTweensOf([navLinks, navFooter]);
        window.gsap.fromTo(
          navLinks,
          { y: 28, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.65,
            stagger: 0.06,
            ease: 'power3.out',
            delay: 0.12
          }
        );
        if (navFooter) {
          window.gsap.fromTo(
            navFooter,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', delay: 0.35 }
          );
        }
      }

      if (open && closeMenu) {
        setTimeout(() => closeMenu.focus({ preventScroll: true }), 120);
      } else if (!open) {
        menuToggle.focus({ preventScroll: true });
      }
    };

    menuToggle.addEventListener('click', () => setMenuState(!isOpen));

    if (closeMenu) {
      closeMenu.addEventListener('click', () => setMenuState(false));
    }

    // إغلاق القائمة عند الضغط على الخلفية الفارغة
    navOverlay.addEventListener('click', (e) => {
      if (e.target === navOverlay) setMenuState(false);
    });

    // إغلاق القائمة بزر Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) setMenuState(false);
    });

    // إغلاق القائمة عند النقر على أي رابط داخلي
    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (isOpen) setMenuState(false);
      });
    });
  }

  /* ------------------------------------------------------------------------
     2. الشريط العلوي الذكي (Adaptive Header) + شريط التقدم الرفيع
     ------------------------------------------------------------------------ */
  function initAdaptiveHeader() {
    const header = document.getElementById('main-header');
    const progressBar = document.getElementById('scroll-progress');
    if (!header) return;

    const lightSections = Array.from(document.querySelectorAll('[data-theme="light"]'));
    let ticking = false;

    const updateHeaderAndProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset;

      // تفعيل الخلفية الزجاجية بعد بداية التمرير
      header.classList.toggle('is-scrolled', scrollY > 40);

      // فحص ما إذا كان منتصف الشريط العلوي يمر فوق قسم عاجي فاتح
      if (lightSections.length > 0) {
        const probeY = header.offsetHeight * 0.55;
        let onLight = false;

        for (let i = 0; i < lightSections.length; i++) {
          const rect = lightSections[i].getBoundingClientRect();
          if (rect.top <= probeY && rect.bottom >= probeY) {
            onLight = true;
            break;
          }
        }
        header.classList.toggle('header-on-light', onLight);
      }

      // تحديث شريط التقدم الرفيع في أعلى الصفحة
      if (progressBar) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? Math.min(Math.max(scrollY / docHeight, 0), 1) : 0;
        progressBar.style.transform = `scaleX(${progress})`;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderAndProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    updateHeaderAndProgress();
  }

  /* ------------------------------------------------------------------------
     3. محرك حركات GSAP السينمائية (Hero + Scroll Reveals + Parallax)
     ------------------------------------------------------------------------ */
  function initGSAPAnimations() {
    if (!hasGSAP || prefersReducedMotion) return;

    const gsap = window.gsap;

    // أ) دخول واجهة البداية (Hero Choreography)
    const heroItems = document.querySelectorAll('[data-hero-reveal]');
    if (heroItems.length > 0) {
      gsap.from(heroItems, {
        y: 36,
        opacity: 0,
        duration: 1.0,
        stagger: 0.14,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      });
    }

    if (!hasScrollTrigger) return;

    // ب) ظهور العناصر الفردية عند التمرير
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const delay = parseFloat(el.getAttribute('data-delay') || '0');
      gsap.from(el, {
        y: 38,
        opacity: 0,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: el,
          start: 'top 86%',
          once: true
        }
      });
    });

    // ج) ظهور المجموعات والبطاقات بتتابع ناعم (Stagger Groups)
    document.querySelectorAll('[data-stagger]').forEach((group) => {
      const items = group.querySelectorAll('[data-stagger-item]');
      if (items.length === 0) return;

      gsap.from(items, {
        y: 42,
        opacity: 0,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: group,
          start: 'top 84%',
          once: true
        }
      });
    });

    // د) حركة عمق ناعمة للصور والإطارات (Subtle Parallax)
    document.querySelectorAll('[data-parallax]').forEach((media) => {
      const parent = media.parentElement || media;
      gsap.fromTo(
        media,
        { yPercent: -6, scale: 1.08 },
        {
          yPercent: 6,
          scale: 1.08,
          ease: 'none',
          scrollTrigger: {
            trigger: parent,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6
          }
        }
      );
    });

    // إعادة حساب مواقع ScrollTrigger بعد اكتمال تحميل الخطوط والصور
    window.addEventListener('load', () => {
      window.ScrollTrigger.refresh();
    });
  }

  /* ------------------------------------------------------------------------
     4. تأثير الأزرار المغناطيسية (Magnetic Buttons — لأجهزة الماوس فقط)
     ------------------------------------------------------------------------ */
  function initMagneticButtons() {
    if (!hasFinePointer || prefersReducedMotion || !hasGSAP) return;

    const gsap = window.gsap;
    const magnets = document.querySelectorAll('[data-magnetic]');

    magnets.forEach((btn) => {
      const strength = parseFloat(btn.getAttribute('data-magnetic-strength') || '0.28');
      const innerText = btn.querySelector('[data-magnetic-text]');

      const moveX = gsap.quickTo(btn, 'x', { duration: 0.45, ease: 'power3.out' });
      const moveY = gsap.quickTo(btn, 'y', { duration: 0.45, ease: 'power3.out' });

      const textMoveX = innerText
        ? gsap.quickTo(innerText, 'x', { duration: 0.45, ease: 'power3.out' })
        : null;
      const textMoveY = innerText
        ? gsap.quickTo(innerText, 'y', { duration: 0.45, ease: 'power3.out' })
        : null;

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const relX = e.clientX - rect.left - rect.width / 2;
        const relY = e.clientY - rect.top - rect.height / 2;

        moveX(relX * strength);
        moveY(relY * strength);

        if (textMoveX && textMoveY) {
          textMoveX(relX * (strength * 0.45));
          textMoveY(relY * (strength * 0.45));
        }
      });

      btn.addEventListener('mouseleave', () => {
        gsap.to(btn, {
          x: 0,
          y: 0,
          duration: 0.75,
          ease: 'elastic.out(1, 0.4)'
        });

        if (innerText) {
          gsap.to(innerText, {
            x: 0,
            y: 0,
            duration: 0.75,
            ease: 'elastic.out(1, 0.4)'
          });
        }
      });
    });
  }

  /* ------------------------------------------------------------------------
     5. التشغيل عند جاهزية الصفحة
     ------------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAdaptiveHeader();
    initGSAPAnimations();
    initMagneticButtons();
  });
})();
