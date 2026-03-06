(function() {
  'use strict';

  var STRIP_LEN = 30;
  var DURATIONS = [2.0, 2.6, 3.2]; // seconds per reel

  var spinning = false;
  var totalSpins = parseInt(localStorage.getItem('cr_total_spins') || '0', 10);

  function el(id) { return document.getElementById(id); }
  function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  var spinBtn, resultCard, resultName, resultGen, counterValue;
  var reelWindows = [], reelStrips = [];
  var slotPanel;
  var allBrands, allModels, allGens;

  function cacheValues() {
    var b = {}, m = {}, g = {};
    CAR_DATABASE.forEach(function(c) { b[c.brand] = 1; m[c.model] = 1; g[c.gen] = 1; });
    allBrands = Object.keys(b);
    allModels = Object.keys(m);
    allGens   = Object.keys(g);
  }

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }

  function makeItem(text, isFinal) {
    var d = document.createElement('div');
    d.className = 'reel-item' + (isFinal ? ' final' : '');
    d.textContent = text;
    return d;
  }

  // Build a strip for one reel
  function buildStrip(idx, finalVal, pool) {
    var strip = reelStrips[idx];
    strip.innerHTML = '';
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';
    strip.classList.remove('stopping');

    // random items
    for (var i = 0; i < STRIP_LEN; i++) {
      strip.appendChild(makeItem(rand(pool), false));
    }
    // final item
    strip.appendChild(makeItem(finalVal, true));
  }

  function getItemHeight() {
    // measure rendered height of a reel-item
    var item = reelStrips[0].querySelector('.reel-item');
    return item ? item.offsetHeight : 56;
  }

  function spinReels() {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    spinBtn.classList.add('spinning');
    resultCard.classList.remove('visible');
    slotPanel.classList.add('glow');

    // Press light ring
    var ring = document.createElement('span');
    ring.className = 'press-ring';
    spinBtn.appendChild(ring);
    setTimeout(function() { ring.remove(); }, 500);

    var car = rand(CAR_DATABASE);
    var fields = [car.brand, car.model, car.gen];
    var pools  = [allBrands, allModels, allGens];

    // build strips
    for (var r = 0; r < 3; r++) {
      buildStrip(r, fields[r], pools[r]);
      reelWindows[r].classList.add('spinning');
      reelWindows[r].classList.remove('stopped');
    }

    // force reflow
    reelStrips[0].offsetHeight;

    var itemH = getItemHeight();
    var targetY = STRIP_LEN * itemH;

    // tick sounds during spin
    var tickInterval = setInterval(function() { SoundFX.tick(); }, 80);

    for (var r2 = 0; r2 < 3; r2++) {
      var dur = DURATIONS[r2];
      reelStrips[r2].style.transition = 'transform ' + dur + 's cubic-bezier(0.12, 0.8, 0.18, 1)';
      reelStrips[r2].style.transform  = 'translateY(-' + targetY + 'px)';

      // mark each reel as stopped when its transition ends
      (function(ri, d) {
        setTimeout(function() {
          reelWindows[ri].classList.remove('spinning');
          reelWindows[ri].classList.add('stopped');
          SoundFX.tick();
        }, d * 1000);
      })(r2, dur);
    }

    // after longest reel finishes
    var totalMs = DURATIONS[2] * 1000 + 50;
    setTimeout(function() {
      clearInterval(tickInterval);
      spinning = false;
      spinBtn.disabled = false;
      spinBtn.classList.remove('spinning');
      slotPanel.classList.remove('glow');
      SoundFX.result();
      showResult(car);
    }, totalMs);
  }

  function showResult(car) {
    var fullName = car.brand + ' ' + car.model;
    resultName.textContent = fullName;
    resultGen.textContent = car.gen;

    var photoLink = resultCard.querySelector('.photo-btn');
    if (photoLink) {
      photoLink.href = 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(fullName + ' ' + car.gen);
    }

    resultCard.classList.add('visible');

    totalSpins++;
    localStorage.setItem('cr_total_spins', totalSpins.toString());
    counterValue.textContent = totalSpins;
  }

  function initParticles() {
    var canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var pts = [];
    var count = Math.min(40, Math.floor(window.innerWidth / 30));

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    for (var i = 0; i < count; i++) {
      pts.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.3,
        dx: (Math.random() - 0.5) * 0.15,
        dy: (Math.random() - 0.5) * 0.15,
        o: Math.random() * 0.25 + 0.05
      });
    }

    (function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(function(p) {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(180,210,255,' + p.o + ')';
        ctx.fill();
      });
      requestAnimationFrame(draw);
    })();
  }

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    deferredPrompt = e;
    var b = document.getElementById('install-banner');
    if (b) b.classList.remove('hidden');
  });

  function initInstall() {
    var ac = document.getElementById('install-accept');
    var di = document.getElementById('install-dismiss');
    var ba = document.getElementById('install-banner');
    if (ac) ac.addEventListener('click', function() {
      if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(function() { deferredPrompt = null; }); }
      if (ba) ba.classList.add('hidden');
    });
    if (di && ba) di.addEventListener('click', function() { ba.classList.add('hidden'); });
  }

  function initWallpaper() {
    var toggle = el('wp-toggle');
    var modal = el('wp-modal');
    var closeBtn = el('wp-close');
    var bgWp = el('bg-wallpaper');
    var options = document.querySelectorAll('.wp-option');
    var saved = localStorage.getItem('cr_wallpaper') || 'none';

    function apply(wp) {
      if (wp === 'none') {
        bgWp.style.backgroundImage = '';
        bgWp.classList.remove('active');
      } else {
        bgWp.style.backgroundImage = 'url(' + wp + ')';
        bgWp.classList.add('active');
      }
      localStorage.setItem('cr_wallpaper', wp);
      options.forEach(function(o) {
        o.classList.toggle('active', o.getAttribute('data-wp') === wp);
      });
    }

    apply(saved);

    if (toggle) toggle.addEventListener('click', function() { modal.classList.add('open'); });
    if (closeBtn) closeBtn.addEventListener('click', function() { modal.classList.remove('open'); });
    if (modal) modal.addEventListener('click', function(e) { if (e.target === modal) modal.classList.remove('open'); });

    options.forEach(function(btn) {
      btn.addEventListener('click', function() {
        apply(btn.getAttribute('data-wp'));
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function() {
    cacheValues();

    spinBtn       = el('spin-btn');
    resultCard    = el('result-card');
    resultName    = el('result-name');
    resultGen     = el('result-gen');
    counterValue  = el('counter-value');
    slotPanel     = document.querySelector('.slot-panel');

    for (var i = 0; i < 3; i++) {
      reelWindows.push(el('reel-' + i));
      reelStrips.push(el('reel-strip-' + i));
    }

    counterValue.textContent = totalSpins;

    var countEl = el('car-count');
    if (countEl) countEl.textContent = CAR_DATABASE.length + ' \u0430\u0432\u0442\u043E\u043C\u043E\u0431\u0438\u043B\u0435\u0439 \u0432 \u0431\u0430\u0437\u0435';

    // initial display
    var pools = [allBrands, allModels, allGens];
    for (var r = 0; r < 3; r++) {
      buildStrip(r, rand(pools[r]), pools[r]);
    }

    spinBtn.addEventListener('click', spinReels);
    initParticles();
    initInstall();
    initWallpaper();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(function() {});
    }
  });

})();
