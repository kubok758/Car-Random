var SoundFX = (function() {
  var AudioCtx = window.AudioContext || window.webkitAudioContext;
  var ctx = null;

  function getCtx() {
    if (!ctx && AudioCtx) ctx = new AudioCtx();
    return ctx;
  }

  return {
    tick: function() {
      try {
        var c = getCtx();
        if (!c) return;
        var osc = c.createOscillator();
        var gain = c.createGain();
        osc.connect(gain);
        gain.connect(c.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 400, c.currentTime);
        gain.gain.setValueAtTime(0.08, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.05);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + 0.05);
      } catch(e) {}
    },

    result: function() {
      try {
        var c = getCtx();
        if (!c) return;
        var now = c.currentTime;
        [523.25, 659.25, 783.99, 1046.5].forEach(function(freq, i) {
          var osc = c.createOscillator();
          var gain = c.createGain();
          osc.connect(gain);
          gain.connect(c.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.08);
          gain.gain.setValueAtTime(0, now + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.12, now + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.5);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.5);
        });
      } catch(e) {}
    }
  };
})();
