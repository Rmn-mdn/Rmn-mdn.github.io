/* Animations de la page Mondrian. JavaScript sans bibliothèque.
   Chaque fonction est indépendante : si l'une échoue, la page reste lisible.
   Si le visiteur a demandé de réduire les animations, aucune n'est lancée. */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* 1. Accueil : déclenche la « peinture » des cellules juste après le premier affichage. */
  function buildHero() {
    var mond = document.getElementById('mond');
    if (!mond) return;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { mond.classList.add('is-built'); });
    });
  }

  /* 2. Révélation au défilement : marque les éléments, puis les fait apparaître quand ils entrent à l'écran. */
  function revealOnScroll() {
    if (!hasIO) return;
    var targets = document.querySelectorAll(
      'section:not(.hero) h2, #portrait p, .expertise li, .job, .earlier, .more, .formation, .contact-text, #contact .cta'
    );
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });

    targets.forEach(function (el) {
      /* Décalage selon la position parmi ses voisins (max 5) pour un effet en cascade. */
      var index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--d', Math.min(index, 5));
      el.setAttribute('data-reveal', '');
      observer.observe(el);
    });
  }

  /* 3. Navigation : la section visible devient le lien actif. */
  function trackActiveSection() {
    if (!hasIO) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('.top nav a[href^="#"]'));
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = map[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' }); /* zone fine au milieu de l'écran */

    Object.keys(map).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) observer.observe(section);
    });
  }

  /* 4. Barre de progression de lecture. */
  function readingProgress() {
    var bar = document.querySelector('.progress');
    if (!bar) return;
    var ticking = false;
    function update() {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
      bar.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* 5. Composition réactive : les colonnes de l'accueil se déplacent légèrement avec la souris.
        Réservé aux appareils avec souris et aux écrans larges. Le mouvement est lissé (interpolation). */
  function pointerComposition() {
    var hero = document.querySelector('.hero');
    var mond = document.getElementById('mond');
    if (!hero || !mond) return;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!fine) return;

    var current = 0, target = 0, running = false;

    function frame() {
      current += (target - current) * 0.08;               /* se rapproche de la cible à chaque image */
      if (Math.abs(target - current) < 0.001) current = target;
      mond.style.setProperty('--dx', current.toFixed(3));
      if (current !== target) { requestAnimationFrame(frame); } else { running = false; }
    }
    function start() { if (!running) { running = true; requestAnimationFrame(frame); } }

    hero.addEventListener('mousemove', function (e) {
      if (window.innerWidth <= 760) return;
      var rect = hero.getBoundingClientRect();
      target = ((e.clientX - rect.left) / rect.width) * 2 - 1;  /* -1 (gauche) à 1 (droite) */
      start();
    });
    hero.addEventListener('mouseleave', function () { target = 0; start(); });
  }

  /* 6. Chiffres Journal du Coin : comptage de la valeur de départ à la valeur finale.
        Sans JavaScript, les valeurs finales restent affichées dans le HTML. */
  function countUpMetrics() {
    var list = document.getElementById('metrics');
    if (!list || !hasIO) return;

    var items = Array.prototype.slice.call(list.querySelectorAll('li'));
    var thin = ' '; /* espace fine insécable pour les milliers */

    function fmt(v, mode) {
      v = Math.round(v);
      if (mode === 'k0' && v >= 1000) return Math.round(v / 1000) + 'k';
      if (mode === 'k1' && v >= 1000) return (Math.round(v / 100) / 10).toString().replace('.', ',') + 'k';
      return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, thin);
    }

    items.forEach(function (li) {
      li.querySelector('.n').textContent = fmt(Number(li.getAttribute('data-from')), li.getAttribute('data-fmt'));
    });
    list.classList.add('is-ready');

    function run(li, delay) {
      var from = Number(li.getAttribute('data-from'));
      var to = Number(li.getAttribute('data-to'));
      var mode = li.getAttribute('data-fmt');
      var n = li.querySelector('.n');
      var duration = 1800;
      setTimeout(function () {
        li.classList.add('is-on');
        var start = null;
        function step(ts) {
          if (start === null) start = ts;
          var p = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - p, 3);            /* ralentit vers la fin */
          n.textContent = fmt(from + (to - from) * eased, mode);
          if (p < 1) { requestAnimationFrame(step); } else { n.textContent = fmt(to, mode); }
        }
        requestAnimationFrame(step);
      }, delay);
    }

    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        items.forEach(function (li, i) { run(li, i * 90); });
        observer.disconnect();
      }
    }, { threshold: 0.3 });
    observer.observe(list);
  }

  /* 7. Contact : assemble l'adresse e-mail côté navigateur (pas écrite en clair dans le HTML),
        affiche un bouton « Écrire un e-mail » et l'adresse en texte à copier. */
  function contactMail() {
    var cta = document.getElementById('mail-cta');
    var txt = document.getElementById('mail-text');
    if (!cta || !txt) return;
    var address = ['fait.mesdon', 'gmail.com'].join('@');
    cta.href = 'mailto:' + address;
    cta.hidden = false;
    txt.textContent = address;
    txt.hidden = false;
  }

  /* 8. Compétences (cellule rouge) : une compétence ouverte à la fois.
        Un clic ouvre l'entrée choisie. L'enchaînement automatique repose sur l'animation CSS du filet jaune :
        quand elle se termine (événement animationend), on ouvre l'entrée suivante. */
  function skillsReel() {
    var reel = document.getElementById('reel');
    if (!reel) return;
    var items = Array.prototype.slice.call(reel.children);

    function show(index) {
      items.forEach(function (li, i) {
        var on = i === index;
        li.classList.toggle('is-active', on);
        li.querySelector('button').setAttribute('aria-expanded', on ? 'true' : 'false');
      });
    }

    reel.addEventListener('click', function (e) {
      var button = e.target.closest('button');
      if (button) show(items.indexOf(button.parentNode));
    });

    if (reduce) return; /* pas d'enchaînement automatique si le visiteur a demandé de réduire les animations */
    reel.addEventListener('animationend', function (e) {
      if (e.animationName !== 'reel-fill') return;
      show((items.indexOf(e.target) + 1) % items.length);
    });
  }

  /* Navigation active et progression restent utiles même sans animation ; le reste est coupé si "réduire les animations". */
  trackActiveSection();
  readingProgress();
  contactMail();
  skillsReel();
  if (reduce) return;
  buildHero();
  revealOnScroll();
  pointerComposition();
  countUpMetrics();
})();
