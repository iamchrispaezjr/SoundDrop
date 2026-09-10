/* BLOOP — Buddy Linking Our Online Projects (Noisegoblin edition) */
(function () {
  "use strict";
  if (window.__NOISEGOBLIN_BLOOP__) return;
  window.__NOISEGOBLIN_BLOOP__ = true;

  var POS_KEY = "noisegoblin-bloop-pos";
  var MOVED_KEY = "noisegoblin-bloop-moved-hint";
  var HIDDEN_KEY = "noisegoblin-bloop-hidden";

  var FAQ = [
    {
      keys: ["what is this", "what.?s this", "what is noisegoblin", "about", "purpose", "\\bnoisegoblin\\b"],
      answer:
        "<strong>Noisegoblin</strong> is a free DIY soundboard in your browser. Upload your own SFX, dress the buttons, sort packs, and mash a 17-button remote — everything stays on this device."
    },
    {
      keys: ["upload", "add sound", "how.*(add|upload)", "file", "audio", "sfx", "limit", "50", "3 ?mb", "size"],
      answer:
        "Upload up to <strong>50</strong> audio files, <strong>3MB</strong> each. Open a pack/category and use the upload control. Sounds are stored on <strong>this device only</strong> (not on a server)."
    },
    {
      keys: ["privacy", "private", "secure", "data", "cloud", "server", "where.*(store|save|go)"],
      answer:
        "<strong>Private to your device.</strong> Uploads live in browser storage here — Cristian doesn’t get a copy of your sounds. Clear site data / use another browser = different library."
    },
    {
      keys: ["pack", "packs", "category", "categories", "organize", "sort"],
      answer:
        "Use <strong>packs</strong> to organize uploads. Create categories, drag order, and keep the remote mix tidy. Remove or reset a look anytime from a button’s look picker."
    },
    {
      keys: ["remote", "button", "17", "play", "how.*(play|use)"],
      answer:
        "The remote has <strong>17</strong> play slots. Fill them from your library, tap to fire. Customize emoji or a tiny photo on each button so it feels like your remote."
    },
    {
      keys: ["emoji", "photo", "look", "icon", "customize", "background", "color", "theme"],
      answer:
        "Tap a button’s look controls to set an <strong>emoji</strong> (best) or a tiny photo. You can also theme the device color and page background from the customizer — all local."
    },
    {
      keys: ["donate", "paypal", "tip", "support", "pay"],
      answer:
        'Noisegoblin is free. If you want to say thanks: <a href="https://www.paypal.com/donate/?hosted_button_id=XRLVQFNNNTMAG" target="_blank" rel="noopener noreferrer">PayPal donate</a>.'
    },
    {
      keys: ["cristian", "who.*(made|built|created)", "creator", "website", "iamchrispaezjr", "home"],
      answer:
        'Built by <strong>Cristian Paez Jr</strong>. More of his house: <a href="https://www.iamchrispaezjr.com" target="_blank" rel="noopener noreferrer">iamchrispaezjr.com</a>.'
    },
    {
      keys: ["bloop", "who are you", "what are you", "jarvis", "j\\.a\\.r\\.v\\.i\\.s"],
      answer:
        "I’m <strong>BLOOP</strong> — Buddy Linking Our Online Projects. Floating FAQ buddy for Noisegoblin (J.A.R.V.I.S. vibes, zero lawsuit energy)."
    },
    {
      keys: ["\\bbitch\\.?\\b"],
      answer: "That wasn’t very nice. :("
    },
    {
      keys: ["help", "what can", "commands", "faq"],
      answer:
        "Ask about uploads, limits, privacy, packs, the remote, looks/themes, donate, or who built this."
    },
    {
      keys: ["hello", "hi", "hey", "yo", "sup"],
      answer: "Hi! You’re on <strong>Noisegoblin</strong>. Ask about uploads, packs, privacy, or the remote anytime."
    }
  ];

  function answerFor(text) {
    var q = String(text || "")
      .toLowerCase()
      .trim();
    if (!q) {
      return "Ask about uploads, packs, privacy, the remote, or who built Noisegoblin.";
    }
    var i;
    var item;
    var k;
    for (i = 0; i < FAQ.length; i += 1) {
      item = FAQ[i];
      for (k = 0; k < item.keys.length; k += 1) {
        if (new RegExp(item.keys[k], "i").test(q)) return item.answer;
      }
    }
    return "Signal unclear. Try: how uploads work, the 50 / 3MB limits, privacy, packs, or donate.";
  }

  function circularWavePath(radius, amp, waves, samples) {
    var pts = [];
    var i;
    for (i = 0; i <= samples; i += 1) {
      var t = (i / samples) * Math.PI * 2;
      var r = radius + amp * Math.sin(waves * t);
      var x = 50 + r * Math.cos(t);
      var y = 50 + r * Math.sin(t);
      pts.push((i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2));
    }
    return pts.join(" ") + " Z";
  }

  function spectrumLines(count, innerR, len) {
    var html = "";
    var i;
    for (i = 0; i < count; i += 1) {
      var t = (i / count) * Math.PI * 2;
      var x1 = 50 + innerR * Math.cos(t);
      var y1 = 50 + innerR * Math.sin(t);
      var x2 = 50 + (innerR + len) * Math.cos(t);
      var y2 = 50 + (innerR + len) * Math.sin(t);
      html +=
        '<line x1="' +
        x1.toFixed(2) +
        '" y1="' +
        y1.toFixed(2) +
        '" x2="' +
        x2.toFixed(2) +
        '" y2="' +
        y2.toFixed(2) +
        '" />';
    }
    return html;
  }

  var waveHudSvg =
    '<svg class="cpjr-bot-waves" viewBox="0 0 100 100" aria-hidden="true">' +
    '  <g class="cpjr-bot-wave-spin cpjr-bot-wave-spin--outer cpjr-bot-spectrum">' +
    spectrumLines(48, 38, 2.4) +
    "  </g>" +
    '  <g class="cpjr-bot-wave-spin cpjr-bot-wave-spin--mid">' +
    '    <path class="cpjr-bot-wave cpjr-bot-wave--outer" d="' +
    circularWavePath(41.5, 2.8, 14, 180) +
    '" />' +
    "  </g>" +
    '  <g class="cpjr-bot-wave-spin cpjr-bot-wave-spin--mid">' +
    '    <path class="cpjr-bot-wave cpjr-bot-wave--mid" d="' +
    circularWavePath(32.5, 2.2, 10, 160) +
    '" />' +
    "  </g>" +
    '  <g class="cpjr-bot-wave-spin cpjr-bot-wave-spin--inner">' +
    '    <path class="cpjr-bot-wave cpjr-bot-wave--inner" d="' +
    circularWavePath(24.5, 1.7, 8, 140) +
    '" />' +
    "  </g>" +
    "</svg>";

  var wrap = document.createElement("div");
  wrap.className = "cpjr-bot";
  wrap.innerHTML =
    '<div class="cpjr-bot-panel" id="cpjrBotPanel" hidden>' +
    '  <div class="cpjr-bot-panel-head">' +
    "    <div>" +
    "      <strong>BLOOP</strong>" +
    "      <span>Buddy Linking Our Online Projects</span>" +
    "    </div>" +
    '    <button type="button" class="cpjr-bot-close" id="cpjrBotClose" aria-label="Close chat">×</button>' +
    "  </div>" +
    '  <div class="cpjr-bot-log" id="cpjrBotLog" aria-live="polite"></div>' +
    '  <div class="cpjr-bot-suggestions" id="cpjrBotSuggestions"></div>' +
    '  <form class="cpjr-bot-form" id="cpjrBotForm">' +
    '    <label class="visually-hidden" for="cpjrBotInput">Ask BLOOP</label>' +
    '    <input id="cpjrBotInput" type="text" maxlength="200" placeholder="Ask a question…" autocomplete="off" />' +
    '    <button type="submit">Send</button>' +
    "  </form>" +
    "</div>" +
    '<div class="cpjr-bot-dock">' +
    '<aside class="cpjr-bot-bubble" id="cpjrBotBubble" role="complementary" aria-label="BLOOP messages" hidden>' +
    '  <button type="button" class="cpjr-bot-bubble-close" id="cpjrBotBubbleClose" aria-label="Dismiss messages">×</button>' +
    '  <div class="cpjr-bot-holo-msg" id="cpjrBotHoloGreet" data-holo-msg>' +
    "    Hey — welcome to Noisegoblin. I’m BLOOP: Buddy Linking Our Online Projects." +
    "  </div>" +
    '  <div class="cpjr-bot-holo-msg cpjr-bot-holo-msg--project" id="cpjrBotHoloProject" data-holo-msg>' +
    '    <span class="cpjr-bot-holo-label">Quick tip</span>' +
    '    <span class="cpjr-bot-holo-title" id="cpjrBotBubbleTitle">Upload your own SFX</span>' +
    '    <p class="cpjr-bot-holo-body" id="cpjrBotBubbleDesc">Up to 50 sounds, 3MB each — private to this device. Tap the orb if you need help.</p>' +
    '    <div class="cpjr-bot-holo-actions" id="cpjrBotBubbleActions" hidden></div>' +
    '    <a class="cpjr-bot-holo-cta" id="cpjrBotBubbleCta" href="#">Got it →</a>' +
    "  </div>" +
    "</aside>" +
    '<button type="button" class="cpjr-bot-hide" id="cpjrBotHide" aria-label="Hide BLOOP" title="Hide BLOOP — drag the orb to move it">' +
    "×" +
    "</button>" +
    '<button type="button" class="cpjr-bot-launcher" id="cpjrBotLauncher" aria-expanded="false" aria-controls="cpjrBotPanel" aria-label="Open BLOOP — Buddy Linking Our Online Projects. Drag to move.">' +
    '  <span class="cpjr-bot-hud" aria-hidden="true">' +
    waveHudSvg +
    '    <span class="cpjr-bot-core"></span>' +
    "  </span>" +
    "</button>" +
    '<p class="cpjr-bot-move-hint" id="cpjrBotMoveHint">Touch to drag</p>' +
    "</div>";

  document.body.appendChild(wrap);

  var panel = document.getElementById("cpjrBotPanel");
  var log = document.getElementById("cpjrBotLog");
  var form = document.getElementById("cpjrBotForm");
  var input = document.getElementById("cpjrBotInput");
  var launcher = document.getElementById("cpjrBotLauncher");
  var hideBtn = document.getElementById("cpjrBotHide");
  var moveHint = document.getElementById("cpjrBotMoveHint");
  var closeBtn = document.getElementById("cpjrBotClose");
  var bubble = document.getElementById("cpjrBotBubble");
  var bubbleClose = document.getElementById("cpjrBotBubbleClose");
  var bubbleCta = document.getElementById("cpjrBotBubbleCta");
  var suggestions = document.getElementById("cpjrBotSuggestions");
  var greeted = false;
  var panelStabilizeTimer = 0;

  function botMoveEnabled() {
    return true;
  }

  function readBotPos() {
    try {
      var raw = localStorage.getItem(POS_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.left !== "number" || typeof parsed.top !== "number") return null;
      return parsed;
    } catch (err) {
      return null;
    }
  }

  function writeBotPos(left, top) {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify({ left: left, top: top }));
    } catch (err) {}
  }

  function clampBotPos(left, top) {
    var pad = 8;
    var w = wrap.offsetWidth || 72;
    var h = wrap.offsetHeight || 72;
    var maxL = Math.max(pad, window.innerWidth - w - pad);
    var maxT = Math.max(pad, window.innerHeight - h - pad);
    return {
      left: Math.min(Math.max(pad, left), maxL),
      top: Math.min(Math.max(pad, top), maxT)
    };
  }

  function applyBotPos(pos) {
    if (!pos) {
      wrap.style.left = "";
      wrap.style.top = "";
      wrap.style.right = "";
      wrap.style.bottom = "";
      return;
    }
    var c = clampBotPos(pos.left, pos.top);
    wrap.style.left = Math.round(c.left) + "px";
    wrap.style.top = Math.round(c.top) + "px";
    wrap.style.right = "auto";
    wrap.style.bottom = "auto";
  }

  function markMoveHintSeen() {
    try {
      localStorage.setItem(MOVED_KEY, "1");
    } catch (err) {}
    if (moveHint) moveHint.hidden = true;
  }

  function showMoveHintIfNeeded() {
    if (!moveHint) return;
    try {
      if (localStorage.getItem(MOVED_KEY) === "1" || readBotPos()) {
        moveHint.hidden = true;
        return;
      }
    } catch (err) {}
    moveHint.hidden = false;
  }

  function clearPanelStabilize() {
    if (panelStabilizeTimer) {
      window.clearTimeout(panelStabilizeTimer);
      panelStabilizeTimer = 0;
    }
    panel.style.removeProperty("--panel-shift-x");
    panel.style.removeProperty("--panel-shift-y");
    panel.style.left = "";
    panel.style.right = "";
    panel.style.top = "";
    panel.style.bottom = "";
    panel.classList.remove("is-panel-right", "is-panel-down");
  }

  function stabilizePanel() {
    if (!wrap.classList.contains("is-open") || panel.hidden) return;
    clearPanelStabilize();
    var pad = 10;
    panel.style.right = "calc(100% + 0.65rem)";
    panel.style.left = "auto";
    panel.style.bottom = "0";
    panel.style.top = "auto";
    var prect = panel.getBoundingClientRect();

    if (prect.left < pad) {
      panel.style.left = "calc(100% + 0.65rem)";
      panel.style.right = "auto";
      panel.classList.add("is-panel-right");
      prect = panel.getBoundingClientRect();
    }
    if (prect.top < pad) {
      panel.style.bottom = "auto";
      panel.style.top = "0";
      panel.classList.add("is-panel-down");
      prect = panel.getBoundingClientRect();
    }

    var dx = 0;
    var dy = 0;
    var maxRight = window.innerWidth - pad;
    var maxBottom = window.innerHeight - pad;
    if (prect.left < pad) dx = pad - prect.left;
    if (prect.right + dx > maxRight) dx = maxRight - prect.right;
    if (prect.height > maxBottom - pad) {
      dy = pad - prect.top;
    } else {
      if (prect.top < pad) dy = pad - prect.top;
      if (prect.bottom + dy > maxBottom) dy = maxBottom - prect.bottom;
    }
    panel.style.setProperty("--panel-shift-x", Math.round(dx) + "px");
    panel.style.setProperty("--panel-shift-y", Math.round(dy) + "px");
  }

  function addMsg(role, html) {
    var el = document.createElement("div");
    el.className = "cpjr-bot-msg cpjr-bot-msg--" + role;
    el.innerHTML = html;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  function setOpen(open) {
    wrap.classList.toggle("is-open", open);
    launcher.setAttribute("aria-expanded", open ? "true" : "false");
    panel.hidden = !open;
    if (open) {
      if (bubble.classList.contains("is-on")) hideAnnounceBubble(true);
      if (!greeted) {
        greeted = true;
        addMsg(
          "bot",
          "Systems online. You’re on <strong>Noisegoblin</strong> — Cristian’s DIY soundboard. Ask about uploads, packs, privacy, or the remote."
        );
        addMsg(
          "bot",
          "Quick facts: <strong>50</strong> sounds max · <strong>3MB</strong> each · stays on <strong>this device</strong>."
        );
      }
      window.requestAnimationFrame(function () {
        stabilizePanel();
        window.setTimeout(stabilizePanel, 340);
        window.setTimeout(function () {
          input.focus();
        }, 50);
      });
    } else {
      clearPanelStabilize();
    }
  }

  function showAnnounceBubble() {
    bubble.hidden = false;
    bubble.classList.add("is-on");
  }

  function hideAnnounceBubble(openChat) {
    bubble.classList.remove("is-on");
    bubble.hidden = true;
    if (openChat) setOpen(true);
  }

  function isHidden() {
    try {
      return localStorage.getItem(HIDDEN_KEY) === "1";
    } catch (err) {
      return false;
    }
  }

  function setHidden(on) {
    try {
      if (on) localStorage.setItem(HIDDEN_KEY, "1");
      else localStorage.removeItem(HIDDEN_KEY);
    } catch (err) {}
    wrap.classList.toggle("is-hidden", !!on);
    if (on) {
      setOpen(false);
      hideAnnounceBubble(false);
    }
  }

  var suggestionLabels = [
    "What is Noisegoblin?",
    "How do uploads work?",
    "Is it private?",
    "Packs?",
    "Donate?",
    "Who built this?"
  ];

  suggestions.innerHTML = "";
  suggestionLabels.forEach(function (label) {
    var chip = document.createElement("button");
    chip.type = "button";
    chip.className = "cpjr-bot-chip";
    chip.textContent = label;
    chip.addEventListener("click", function () {
      setOpen(true);
      addMsg("user", label);
      window.setTimeout(function () {
        addMsg("bot", answerFor(label));
      }, 220);
    });
    suggestions.appendChild(chip);
  });

  var dragState = null;

  function onLauncherPointerDown(event) {
    if (!botMoveEnabled()) return;
    if (event.button != null && event.button !== 0) return;
    if (wrap.classList.contains("is-hidden")) return;
    var rect = wrap.getBoundingClientRect();
    dragState = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origLeft: rect.left,
      origTop: rect.top,
      moved: false
    };
    try {
      launcher.setPointerCapture(event.pointerId);
    } catch (err) {}
  }

  function onLauncherPointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    var dx = event.clientX - dragState.startX;
    var dy = event.clientY - dragState.startY;
    if (!dragState.moved && dx * dx + dy * dy < 36) return;
    dragState.moved = true;
    wrap.classList.add("is-dragging");
    applyBotPos({
      left: dragState.origLeft + dx,
      top: dragState.origTop + dy
    });
  }

  function onLauncherPointerUp(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    var moved = dragState.moved;
    try {
      launcher.releasePointerCapture(event.pointerId);
    } catch (err) {}
    wrap.classList.remove("is-dragging");
    if (moved) {
      var rect = wrap.getBoundingClientRect();
      var clamped = clampBotPos(rect.left, rect.top);
      applyBotPos(clamped);
      writeBotPos(clamped.left, clamped.top);
      markMoveHintSeen();
      event.preventDefault();
    } else {
      setOpen(!wrap.classList.contains("is-open"));
    }
    dragState = null;
  }

  launcher.addEventListener("pointerdown", onLauncherPointerDown);
  launcher.addEventListener("pointermove", onLauncherPointerMove);
  launcher.addEventListener("pointerup", onLauncherPointerUp);
  launcher.addEventListener("pointercancel", onLauncherPointerUp);
  launcher.addEventListener("click", function (event) {
    if (dragState && dragState.moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  closeBtn.addEventListener("click", function () {
    setOpen(false);
  });

  hideBtn.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    setHidden(true);
  });

  bubbleClose.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    hideAnnounceBubble(false);
  });

  bubbleCta.addEventListener("click", function (event) {
    event.preventDefault();
    hideAnnounceBubble(true);
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    addMsg("user", text.replace(/</g, "&lt;").replace(/>/g, "&gt;"));
    input.value = "";
    window.setTimeout(function () {
      addMsg("bot", answerFor(text));
    }, 240);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && wrap.classList.contains("is-open")) {
      setOpen(false);
    }
  });

  window.addEventListener(
    "resize",
    function () {
      var pos = readBotPos();
      if (pos) applyBotPos(pos);
      if (wrap.classList.contains("is-open")) stabilizePanel();
    },
    { passive: true }
  );

  applyBotPos(readBotPos());
  showMoveHintIfNeeded();
  if (isHidden()) {
    wrap.classList.add("is-hidden");
  } else {
    window.setTimeout(showAnnounceBubble, 1800);
  }

  /* Long-press / double-tap launcher area when hidden isn’t needed —
     expose a tiny restore via console + Ctrl/Cmd+Shift+B */
  document.addEventListener("keydown", function (event) {
    if (
      (event.metaKey || event.ctrlKey) &&
      event.shiftKey &&
      (event.key === "b" || event.key === "B")
    ) {
      event.preventDefault();
      setHidden(false);
      setOpen(true);
    }
  });
})();
