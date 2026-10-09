// Sur iOS le player Dailymotion n'autoplay pas : il affiche son bouton "EN DIRECT" et
// attend un tap. iOS n'autorise l'autoplay sans geste que s'il est MUET. On force donc
// la lecture en muet (play() sur <video> + clic sur le bouton play du player, avec
// quelques tentatives le temps que le player se monte), puis on essaie de remettre le
// son : si iOS refuse et met en pause, on repasse en muet (l'utilisateur réactive le
// son avec le bouton volume).
export const FORCE_PLAY_JS = `
  (function() {
    var tries = 0;
    var t = setInterval(function() {
      tries++;
      try {
        var vids = document.querySelectorAll('video');
        var playing = false;
        vids.forEach(function(v) { if (!v.paused) playing = true; });
        if (playing) {
          clearInterval(t);
          if (window.__hideUi) window.__hideUi();
          vids.forEach(function(v) {
            v.muted = false;
            setTimeout(function() {
              if (v.paused) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); }
            }, 400);
          });
          return;
        }
        if (tries > 12) { clearInterval(t); return; }
        vids.forEach(function(v) { v.muted = true; var p = v.play(); if (p && p.catch) p.catch(function(){}); });
        var btn = document.querySelector('button[aria-label*="lay" i], [class*="play" i][role="button"], button[class*="play" i]');
        if (btn) btn.click();
      } catch (e) {}
    }, 600);
    // Remonte l'état réel de la vidéo à l'app (lecture, muet) pour synchroniser les
    // boutons natifs et savoir quand masquer le bouton play.
    setInterval(function() {
      try {
        var vids = document.querySelectorAll('video');
        var playing = false, muted = true;
        vids.forEach(function(v) { if (!v.paused) { playing = true; muted = v.muted; } });
        window.ReactNativeWebView.postMessage(JSON.stringify({ playing: playing, muted: muted, hasVideo: vids.length > 0 }));
      } catch (e) {}
    }, 1000);
  })();
  true;
`;
