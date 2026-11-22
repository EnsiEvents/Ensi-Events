/* ==========================================================================
   ENSI Events — Main Interactive & Animation Engine (main.js)
   Vanilla JS + GSAP 3 & ScrollTrigger + Interactive Silk & Gold Dust Canvas
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
     1. خلفية الواجهة التفاعلية (موجات حريرية ذهبية + جزيئات ضوئية + تفاعل الماوس)
     ------------------------------------------------------------------------ */
  function initHeroCanvas() {
    const canvas = document.getElementById('hero-canvas');
    const heroSection = document.getElementById('top');
    if (!canvas || !heroSection) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animationId = null;
    let isVisible = true;
    let time = 0;

    // حالة مؤشر الماوس مع تنعيم الحركة (Lerp)
    const mouse = {
      targetX: 0.5,
      targetY: 0.5,
      x: 0.5,
      y: 0.5,
      targetActive: 0,
      active: 0
    };

    // إعدادات الخطوط الحريرية الذهبية والزمردية
    const ribbons = [
      { yRatio: 0.34, amp: 34, freq: 0.0022, speed: 0.0065, phase: 0.2, width: 1.35, color: 'rgba(251, 243, 181, 0.24)' },
      { yRatio: 0.44, amp: 46, freq: 0.0018, speed: 0.0052, phase: 1.7, width: 1.05, color: 'rgba(184, 154, 96, 0.28)' },
      { yRatio: 0.54, amp: 38, freq: 0.0025, speed: 0.0072, phase: 3.1, width: 1.55, color: 'rgba(251, 243, 181, 0.20)' },
      { yRatio: 0.64, amp: 52, freq: 0.0016, speed: 0.0046, phase: 4.5, width: 0.95, color: 'rgba(228, 219, 204, 0.16)' },
      { yRatio: 0.72, amp: 30, freq: 0.0028, speed: 0.0060, phase: 5.4, width: 1.15, color: 'rgba(184, 154, 96, 0.22)' }
    ];

    // الجزيئات الضوئية الذهبية الهادئة
    let particles = [];

    const createParticles = () => {
      const count = width < 768 ? 28 : 48;
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.8 + 0.6,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * 0.26 + 0.08),
        alpha: Math.random() * 0.45 + 0.15,
        twinkleSpeed: Math.random() * 0.02 + 0.008,
        twinklePhase: Math.random() * Math.PI * 2,
        warm: Math.random() > 0.35
      }));
    };

    const resize = () => {
      const rect = heroSection.getBoundingClientRect();
      const newWidth = Math.max(rect.width, 320);
      const newHeight = Math.max(rect.height, 480);
      const widthChanged = Math.abs(newWidth - width) > 2;

      width = newWidth;
      height = newHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particles.length === 0 || widthChanged) {
        createParticles();
      }
    };

    const drawFrame = () => {
      ctx.clearRect(0, 0, width, height);

      // تنعيم حركة المؤشر
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;
      mouse.active += (mouse.targetActive - mouse.active) * 0.05;

      const mousePxX = mouse.x * width;
      const mousePxY = mouse.y * height;

      // 1. وهج محيطي ناعم يتبع الماوس على الكمبيوتر
      if (hasFinePointer && mouse.active > 0.01) {
        const glowRadius = Math.min(width, height) * 0.38;
        const glow = ctx.createRadialGradient(mousePxX, mousePxY, 0, mousePxX, mousePxY, glowRadius);
        glow.addColorStop(0, `rgba(251, 243, 181, ${(0.085 * mouse.active).toFixed(4)})`);
        glow.addColorStop(0.5, `rgba(184, 154, 96, ${(0.035 * mouse.active).toFixed(4)})`);
        glow.addColorStop(1, 'rgba(6, 35, 29, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. رسم الموجات الحريرية الذهبية المتدفقة
      const step = width < 768 ? 16 : 12;
      ribbons.forEach((ribbon, idx) => {
        const baseY = height * ribbon.yRatio;
        const grad = ctx.createLinearGradient(0, baseY, width, baseY);
        grad.addColorStop(0, 'rgba(251, 243, 181, 0)');
        grad.addColorStop(0.18, ribbon.color);
        grad.addColorStop(0.5, ribbon.color);
        grad.addColorStop(0.82, ribbon.color);
        grad.addColorStop(1, 'rgba(251, 243, 181, 0)');

        ctx.beginPath();
        ctx.lineWidth = ribbon.width;
        ctx.strokeStyle = grad;

        for (let x = 0; x <= width + step; x += step) {
          const wave1 = Math.sin(x * ribbon.freq + time * ribbon.speed * 60 + ribbon.phase) * ribbon.amp;
          const wave2 = Math.cos(x * ribbon.freq * 0.55 - time * ribbon.speed * 35 + idx) * (ribbon.amp * 0.42);
          let y = baseY + wave1 + wave2;

          // انحناء حريري ناعم استجابةً للماوس
          if (hasFinePointer && mouse.active > 0.01) {
            const dx = x - mousePxX;
            const dy = y - mousePxY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const influenceRadius = 240;
            if (dist < influenceRadius) {
              const force = (1 - dist / influenceRadius) * mouse.active;
              const smoothForce = force * force;
              y += (mousePxY - y) * smoothForce * 0.28 + Math.sin(dx * 0.015) * smoothForce * 16;
            }
          }

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      // 3. رسم الجزيئات الضوئية الذهبية
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.twinklePhase += p.twinkleSpeed;

          // تفاعل لطيف للجزيئات القريبة من المؤشر
          if (hasFinePointer && mouse.active > 0.05) {
            const dx = p.x - mousePxX;
            const dy = p.y - mousePxY;
            const distSq = dx * dx + dy * dy;
            if (distSq < 22500 && distSq > 1) {
              const dist = Math.sqrt(distSq);
              const push = (1 - dist / 150) * 0.35 * mouse.active;
              p.x += (dx / dist) * push;
              p.y += (dy / dist) * push;
            }
          }

          // إعادة تدوير الجزيء بهدوء عند خروجه من الشاشة
          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }

        const twinkle = 0.55 + 0.45 * Math.sin(p.twinklePhase);
        const finalAlpha = Math.min(p.alpha * twinkle, 0.85);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.warm
          ? `rgba(251, 243, 181, ${finalAlpha.toFixed(3)})`
          : `rgba(184, 154, 96, ${finalAlpha.toFixed(3)})`;
        ctx.fill();
      }
    };

    const loop = () => {
      if (!isVisible || document.hidden) {
        animationId = null;
        return;
      }
      time += 0.016;
      drawFrame();
      animationId = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (prefersReducedMotion) {
        drawFrame();
        return;
      }
      if (!animationId && isVisible && !document.hidden) {
        animationId = window.requestAnimationFrame(loop);
      }
    };

    const stop = () => {
      if (animationId) {
        window.cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    // تفاعل الماوس داخل الواجهة الرئيسية فقط
    if (hasFinePointer && !prefersReducedMotion) {
      heroSection.addEventListener('mousemove', (e) => {
        const rect = heroSection.getBoundingClientRect();
        mouse.targetX = (e.clientX - rect.left) / rect.width;
        mouse.targetY = (e.clientY - rect.top) / rect.height;
        mouse.targetActive = 1;
      }, { passive: true });

      heroSection.addEventListener('mouseleave', () => {
        mouse.targetActive = 0;
      });
    }

    // إيقاف تلقائي عند تجاوز الواجهة للحفاظ على الأداء والبطارية
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0].isIntersecting;
          if (isVisible) start();
          else stop();
        },
        { threshold: 0.02 }
      );
      observer.observe(heroSection);
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop();
      else if (isVisible) start();
    });

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        if (prefersReducedMotion) drawFrame();
      }, 150);
    }, { passive: true });

    resize();
    start();
  }

  /* ------------------------------------------------------------------------
     2. القائمة المنبثقة (Overlay Menu) وإدارة إمكانية الوصول
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
          { y: 26, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.055,
            ease: 'power3.out',
            delay: 0.1
          }
        );
        if (navFooter) {
          window.gsap.fromTo(
            navFooter,
            { y: 14, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out', delay: 0.3 }
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

    navOverlay.addEventListener('click', (e) => {
      if (e.target === navOverlay) setMenuState(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) setMenuState(false);
    });

    navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        if (isOpen) setMenuState(false);
      });
    });
  }

  /* ------------------------------------------------------------------------
     3. الشريط العلوي الذكي (Adaptive Header) + شريط التقدم الرفيع
     ------------------------------------------------------------------------ */
  function initAdaptiveHeader() {
    const header = document.getElementById('main-header');
    const progressBar = document.getElementById('scroll-progress');
    if (!header) return;

    const lightSections = Array.from(document.querySelectorAll('[data-theme="light"]'));
    let ticking = false;

    const updateHeaderAndProgress = () => {
      const scrollY = window.scrollY || window.pageYOffset;

      header.classList.toggle('is-scrolled', scrollY > 36);

      // فحص ملامسة القسم الرملي الفاتح لحافة الشريط العلوي
      if (lightSections.length > 0) {
        const probeY = header.offsetHeight + 10;
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
    window.addEventListener('load', updateHeaderAndProgress);
    updateHeaderAndProgress();
  }

  /* ------------------------------------------------------------------------
     4. محرك حركات GSAP السينمائية (Hero + Scroll Reveals + Parallax)
     ------------------------------------------------------------------------ */
  function initGSAPAnimations() {
    if (!hasGSAP || prefersReducedMotion) return;

    const gsap = window.gsap;

    // أ) دخول واجهة البداية
    const heroItems = document.querySelectorAll('[data-hero-reveal]');
    if (heroItems.length > 0) {
      gsap.from(heroItems, {
        y: 32,
        opacity: 0,
        duration: 0.95,
        stagger: 0.13,
        ease: 'power3.out',
        clearProps: 'transform,opacity'
      });
    }

    if (!hasScrollTrigger) return;

    // ب) ظهور العناصر الفردية عند التمرير
    document.querySelectorAll('[data-reveal]').forEach((el) => {
      const delay = parseFloat(el.getAttribute('data-delay') || '0');
      gsap.from(el, {
        y: 34,
        opacity: 0,
        duration: 0.85,
        delay,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: el,
          start: 'top 87%',
          once: true
        }
      });
    });

    // ج) ظهور المجموعات والبطاقات بتتابع ناعم
    document.querySelectorAll('[data-stagger]').forEach((group) => {
      const items = group.querySelectorAll('[data-stagger-item]');
      if (items.length === 0) return;

      gsap.from(items, {
        y: 36,
        opacity: 0,
        duration: 0.8,
        stagger: 0.11,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
        scrollTrigger: {
          trigger: group,
          start: 'top 85%',
          once: true
        }
      });
    });

    // د) حركة عمق ناعمة للصور والإطارات
    document.querySelectorAll('[data-parallax]').forEach((media) => {
      const parent = media.parentElement || media;
      gsap.fromTo(
        media,
        { yPercent: -5, scale: 1.07 },
        {
          yPercent: 5,
          scale: 1.07,
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

    window.addEventListener('load', () => {
      window.ScrollTrigger.refresh();
    });
  }

  /* ------------------------------------------------------------------------
     5. تأثير الأزرار المغناطيسية (لأجهزة الماوس فقط)
     ------------------------------------------------------------------------ */
  function initMagneticButtons() {
    if (!hasFinePointer || prefersReducedMotion || !hasGSAP) return;

    const gsap = window.gsap;
    const magnets = document.querySelectorAll('[data-magnetic]');

    magnets.forEach((btn) => {
      const strength = parseFloat(btn.getAttribute('data-magnetic-strength') || '0.26');
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
          textMoveX(relX * (strength * 0.42));
          textMoveY(relY * (strength * 0.42));
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
     6. انعكاس ضوئي ناعم يتبع الماوس داخل البطاقات (Card Spotlight)
     ------------------------------------------------------------------------ */
  function initCardSpotlights() {
    if (!hasFinePointer || prefersReducedMotion) return;

    const cards = document.querySelectorAll('[data-spotlight]');
    cards.forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
        card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
      }, { passive: true });
    });
  }

  /* ------------------------------------------------------------------------
     7. التشغيل عند جاهزية الصفحة
     ------------------------------------------------------------------------ */
  document.addEventListener('DOMContentLoaded', () => {
    initHeroCanvas();
    initNavigation();
    initAdaptiveHeader();
    initGSAPAnimations();
    initMagneticButtons();
    initCardSpotlights();
  });
})();
