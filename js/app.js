

/**
 * SFX Remote — Soundboard Application
 * Pure vanilla JS: sound playback, display animation, menu, background customizer
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Default background — change only this to set the site owner's default
  // type: "gradient" | "color" | "image"
  // For image defaults, set value to a URL string (e.g. "https://example.com/bg.jpg")
  // ---------------------------------------------------------------------------
  const DEFAULT_BACKGROUND = {
    type: "gradient",
    value:
      "linear-gradient(160deg, #0a0a0c 0%, #141418 45%, #1a1a22 100%)",
  };

  const STORAGE_KEY = "sounddrop-bg";
  const MAX_STORAGE_BYTES = 2.5 * 1024 * 1024; // ~2.5 MB base64 limit for localStorage

  // Preset options for the customizer panel
  const PRESET_COLORS = [
    { label: "Midnight", value: "#0a0a0c" },
    { label: "Charcoal", value: "#141418" },
    { label: "Slate", value: "#1a1a22" },
    { label: "Navy", value: "#0d1117" },
    { label: "Plum", value: "#1a1024" },
  ];

  const PRESET_GRADIENTS = [
    {
      label: "Default",
      value: DEFAULT_BACKGROUND.value,
      isDefault: true,
    },
    {
      label: "Deep blue",
      value: "linear-gradient(160deg, #0a0a14 0%, #121828 50%, #1a2040 100%)",
    },
    {
      label: "Purple haze",
      value: "linear-gradient(160deg, #0c0814 0%, #1a1028 50%, #281840 100%)",
    },
    {
      label: "Warm dark",
      value: "linear-gradient(160deg, #100c0a 0%, #1a1410 50%, #221a14 100%)",
    },
    {
      label: "Forest",
      value: "linear-gradient(160deg, #080c0a 0%, #0e1810 50%, #142018 100%)",
    },
    {
      label: "Sunset",
      value: "linear-gradient(160deg, #140810 0%, #201020 50%, #281828 100%)",
    },
  ];

  const SOUNDS = [
    {
      id: "laugh",
      emoji: "😂",
      label: "Laugh",
      src: "LMAO.mp3",
    },
    {
      id: "applause",
      emoji: "👏",
      label: "Applause",
      src: "Nickelodean Clapping.mp3",
    },
    {
      id: "boo",
      emoji: "👎",
      label: "Boo",
      src: "Patrick - Boo.mp3",
    },
    {
      id: "airhorn",
      emoji: "📯",
      label: "Airhorn",
      src: "Airhorn.mp3",
    },
    {
      id: "drumroll",
      emoji: "🥁",
      label: "Rimshot",
      src: "Rimshot.mp3",
    },
    {
      id: "scratch",
      emoji: "📀",
      label: "Scratch",
      src: "Record Scratch.mp3",
    },
    {
      id: "cash",
      emoji: "💰",
      label: "Cash",
      src: "cash.mp3",
    },
    {
      id: "error",
      emoji: "🚫",
      label: "FML",
      src: "Fuck My Life.mp3",
    },
    {
      id: "success",
      emoji: "✅",
      label: "Typical",
      src: "Typical.mp3",
    },
    {
      id: "cheer",
      emoji: "🗑️",
      label: "Moron",
      src: "Vader - Clumsy & Stupid.mp3",
    },
    {
      id: "emergency",
      emoji: "🚨",
      label: "Emergency",
      src: "Emergency Meeting.mp3",
    },
    {
      id: "sus",
      emoji: "👁️",
      label: "Sus",
      src: "Sus.mp3",
    },
    {
      id: "scream",
      emoji: "⭐",
      label: "Scream",
      src: "P Scream.mp3",
    },
    {
      id: "poo",
      emoji: "💩",
      label: "Poo",
      src: "Big Ol' Dump.mp3",
    },
    {
      id: "iturnnow",
      emoji: "🛞",
      label: "I Turn Now",
      src: "I Turn Now.mp3",
    },
    {
      id: "fuck",
      emoji: "🤬",
      label: "Fuck",
      src: "FAHH SFX.mp3",
    },
    {
      id: "imalive",
      emoji: "⚡",
      label: "I'm Alive!",
      src: "I'm ALIVE!.mp3",
      icon: "Aegon 2.png",
      center: true,
    },
  ];
  

  // ---------------------------------------------------------------------------
  // DOM references
  // ---------------------------------------------------------------------------
  const pageBg = document.getElementById("pageBg");
  const bgToggleBtn = document.getElementById("bgToggleBtn");
  const bgPanel = document.getElementById("bgPanel");
  const bgPanelBackdrop = document.getElementById("bgPanelBackdrop");
  const bgPanelClose = document.getElementById("bgPanelClose");
  const bgPresetColors = document.getElementById("bgPresetColors");
  const bgPresetGradients = document.getElementById("bgPresetGradients");
  const bgColorPicker = document.getElementById("bgColorPicker");
  const bgFileInput = document.getElementById("bgFileInput");
  const bgChoosePhotoBtn = document.getElementById("bgChoosePhotoBtn");
  const bgResetBtn = document.getElementById("bgResetBtn");
  const toast = document.getElementById("toast");

  const keypadEl = document.getElementById("keypad");
  const displayScreen = document.getElementById("displayScreen");
  const displayEmoji = document.getElementById("displayEmoji");
  const displayLabel = document.getElementById("displayLabel");
  const menuToggle = document.getElementById("menuToggle");
  const dropdownMenu = document.getElementById("dropdownMenu");
  const shareToggle = document.getElementById("shareToggle");
  const shareDropdown = document.getElementById("shareDropdown");
  const shareList = document.getElementById("shareList");
  const volumeBtn = document.getElementById("volumeBtn");
  const volumeSlider = document.getElementById("volumeSlider");
  const stopBtn = document.getElementById("stopBtn");
  const packBookmark = document.getElementById("packBookmark");
  const packTab = document.getElementById("packTab");
  const packTray = document.getElementById("packTray");

  // ---------------------------------------------------------------------------
  // Toast helper
  // ---------------------------------------------------------------------------
  let toastTimer = null;

  function showToast(message, duration) {
    duration = duration || 3500;
    toast.textContent = message;
    toast.hidden = false;
    toast.classList.add("is-visible");

    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-visible");
      setTimeout(function () {
        toast.hidden = true;
      }, 280);
    }, duration);
  }

  // ---------------------------------------------------------------------------
  // Background system
  // ---------------------------------------------------------------------------
  let currentBgSelection = null;
  let imageProbe = null;

  function normalizeBackground(bg) {
    if (!bg || !bg.type || !bg.value) return null;
    if (bg.type !== "gradient" && bg.type !== "color" && bg.type !== "image") {
      return null;
    }
    return { type: bg.type, value: bg.value };
  }

  function applyBackground(bg, skipSave) {
    const normalized = normalizeBackground(bg) || DEFAULT_BACKGROUND;
    currentBgSelection = normalized;

    pageBg.classList.remove("is-photo");
    pageBg.style.backgroundColor = "";
    pageBg.style.backgroundImage = "";

    if (normalized.type === "color") {
      pageBg.style.backgroundColor = normalized.value;
      pageBg.style.backgroundImage = "none";
    } else if (normalized.type === "gradient") {
      pageBg.style.backgroundColor = "var(--bg-deep)";
      pageBg.style.backgroundImage = normalized.value;
    } else if (normalized.type === "image") {
      pageBg.classList.add("is-photo");
      pageBg.style.backgroundColor = "#0a0a0c";
      pageBg.style.backgroundImage = "url(\"" + normalized.value.replace(/"/g, "%22") + "\")";
      validateImageBackground(normalized.value, !!skipSave);
    }

    updatePresetSelection(normalized);
  }

  /** Probe image URLs/data URLs; fall back if invalid */
  function validateImageBackground(src, fromStorage) {
    if (imageProbe) {
      imageProbe.onload = null;
      imageProbe.onerror = null;
    }

    imageProbe = new Image();
    imageProbe.onload = function () {
      imageProbe = null;
    };
    imageProbe.onerror = function () {
      imageProbe = null;
      if (fromStorage) {
        clearSavedBackground();
      }
      showToast("Image failed to load — using default");
      applyBackground(DEFAULT_BACKGROUND, true);
    };
    imageProbe.src = src;
  }

  function saveBackground(bg) {
    try {
      const payload = JSON.stringify(bg);
      if (payload.length > MAX_STORAGE_BYTES) {
        showToast("Photo is too large — please choose a smaller image");
        return false;
      }
      localStorage.setItem(STORAGE_KEY, payload);
      return true;
    } catch (err) {
      showToast("Photo is too large — please choose a smaller image");
      return false;
    }
  }

  function loadSavedBackground() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return normalizeBackground(JSON.parse(raw));
    } catch (err) {
      clearSavedBackground();
      return null;
    }
  }

  function clearSavedBackground() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
  }

  function resetBackground() {
    clearSavedBackground();
    applyBackground(DEFAULT_BACKGROUND, true);
    showToast("Background reset to default");
  }

  function updatePresetSelection(bg) {
    document.querySelectorAll(".bg-preset-swatch").forEach(function (swatch) {
      const matchType = swatch.dataset.type;
      const matchValue = swatch.dataset.value;
      const isSelected =
        bg.type === matchType &&
        (bg.type === "image" ? false : bg.value === matchValue);
      swatch.classList.toggle("is-selected", isSelected);
    });
  }

  function buildPresetSwatches() {
    PRESET_COLORS.forEach(function (preset) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bg-preset-swatch";
      btn.style.background = preset.value;
      btn.dataset.type = "color";
      btn.dataset.value = preset.value;
      btn.setAttribute("aria-label", "Background color " + preset.label);
      btn.title = preset.label;

      btn.addEventListener("click", function () {
        const bg = { type: "color", value: preset.value };
        applyBackground(bg);
        saveBackground(bg);
        bgColorPicker.value = preset.value;
      });

      bgPresetColors.appendChild(btn);
    });

    PRESET_GRADIENTS.forEach(function (preset) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bg-preset-swatch";
      btn.style.background = preset.value;
      btn.dataset.type = "gradient";
      btn.dataset.value = preset.value;
      btn.setAttribute("aria-label", "Background gradient " + preset.label);
      btn.title = preset.label;

      btn.addEventListener("click", function () {
        const bg = { type: "gradient", value: preset.value };
        applyBackground(bg);
        saveBackground(bg);
      });

      bgPresetGradients.appendChild(btn);
    });
  }

  function handleColorPickerChange() {
    const bg = { type: "color", value: bgColorPicker.value };
    applyBackground(bg);
    saveBackground(bg);
  }

  function handleFileSelect(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file");
      return;
    }

    const reader = new FileReader();

    reader.onload = function () {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") return;

      // Check size before applying
      if (dataUrl.length > MAX_STORAGE_BYTES) {
        showToast("Photo is too large — please choose a smaller image");
        return;
      }

      const bg = { type: "image", value: dataUrl };

      // Validate image loads before saving
      const img = new Image();
      img.onload = function () {
        applyBackground(bg);
        if (!saveBackground(bg)) {
          applyBackground(DEFAULT_BACKGROUND, true);
        }
        closeBgPanel();
      };
      img.onerror = function () {
        showToast("Image failed to load — using default");
        applyBackground(DEFAULT_BACKGROUND, true);
      };
      img.src = dataUrl;
    };

    reader.onerror = function () {
      showToast("Could not read the selected photo");
    };

    reader.readAsDataURL(file);
  }

  // ---------------------------------------------------------------------------
  // Background panel open/close
  // ---------------------------------------------------------------------------
  function openBgPanel() {
    bgPanel.hidden = false;
    bgPanelBackdrop.hidden = false;
    requestAnimationFrame(function () {
      bgPanel.classList.add("is-open");
      bgPanelBackdrop.classList.add("is-open");
    });
    bgToggleBtn.classList.add("is-active");
    bgToggleBtn.setAttribute("aria-expanded", "true");
    bgPanelClose.focus();
  }

  function closeBgPanel() {
    bgPanel.classList.remove("is-open");
    bgPanelBackdrop.classList.remove("is-open");
    bgToggleBtn.classList.remove("is-active");
    bgToggleBtn.setAttribute("aria-expanded", "false");

    bgPanel.addEventListener(
      "transitionend",
      function onEnd() {
        bgPanel.hidden = true;
        bgPanelBackdrop.hidden = true;
        bgPanel.removeEventListener("transitionend", onEnd);
      },
      { once: true }
    );

    bgToggleBtn.focus();
  }

  function toggleBgPanel() {
    if (bgPanel.classList.contains("is-open")) {
      closeBgPanel();
    } else {
      openBgPanel();
    }
  }

  bgToggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    toggleBgPanel();
  });

  bgPanelClose.addEventListener("click", closeBgPanel);

  bgPanelBackdrop.addEventListener("click", closeBgPanel);

  bgChoosePhotoBtn.addEventListener("click", function () {
    bgFileInput.click();
  });

  bgFileInput.addEventListener("change", handleFileSelect);

  bgColorPicker.addEventListener("input", handleColorPickerChange);

  bgResetBtn.addEventListener("click", function () {
    resetBackground();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && bgPanel.classList.contains("is-open")) {
      closeBgPanel();
    }
  });

  // Prevent panel clicks from closing via backdrop
  bgPanel.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  // ---------------------------------------------------------------------------
  // Audio state
  // ---------------------------------------------------------------------------
  let currentAudio = null;
  let isMuted = false;
  let animationTimer = null;

  function getVolume() {
    if (isMuted) return 0;
    return Number(volumeSlider.value) / 100;
  }

  function stopCurrentSound() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  }

  function playSound(sound) {
    stopCurrentSound();

    const audio = new Audio(sound.src);
    audio.volume = getVolume();
    currentAudio = audio;

    audio.play().catch(function (err) {
      console.warn("Audio playback failed:", err.message);
    });

    audio.addEventListener("ended", function () {
      if (currentAudio === audio) {
        currentAudio = null;
      }
    });
  }

  function animateDisplay(emoji, label, iconSrc) {
    if (iconSrc) {
      displayEmoji.innerHTML =
        '<img class="display-emoji-img" src="' +
        iconSrc.replace(/"/g, "") +
        '" alt="">';
    } else {
      displayEmoji.textContent = emoji;
    }
    displayEmoji.setAttribute("aria-label", label);
    displayLabel.textContent = label;

    displayScreen.classList.remove("is-animating");
    void displayScreen.offsetWidth;
    displayScreen.classList.add("is-animating");

    clearTimeout(animationTimer);
    animationTimer = setTimeout(function () {
      displayScreen.classList.remove("is-animating");
    }, 700);
  }

  function flashButton(btn) {
    btn.classList.add("is-pressed");
    setTimeout(function () {
      btn.classList.remove("is-pressed");
    }, 150);
  }

  function onSoundClick(sound, btn) {
    flashButton(btn);
    animateDisplay(sound.emoji, sound.label, sound.icon);
    playSound(sound);
  }

  function buildKeypad() {
    SOUNDS.forEach(function (sound) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sound-btn" + (sound.center ? " sound-btn--center" : "");
      btn.setAttribute("aria-label", "Play " + sound.label);
      btn.dataset.id = sound.id;

      const iconHtml = sound.icon
        ? '<img class="sound-btn-emoji-img" src="' +
          sound.icon.replace(/"/g, "") +
          '" alt="">'
        : sound.emoji;

      btn.innerHTML =
        '<span class="sound-btn-emoji" aria-hidden="true">' +
        iconHtml +
        "</span>" +
        '<span class="sound-btn-label">' +
        sound.label +
        "</span>";

      btn.addEventListener("click", function () {
        onSoundClick(sound, btn);
      });

      keypadEl.appendChild(btn);
    });
  }

  // ---------------------------------------------------------------------------
  // Share menu
  // ---------------------------------------------------------------------------
  const SHARE_TITLE = "Check out SFX Remote";
  const SHARE_MESSAGE =
    "Check out SFX Remote — a fun soundboard remote!";

  const SHARE_ICONS = {
    facebook:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    linkedin:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 114.127 0 2.063 2.063 0 01-2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    twitter:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    whatsapp:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
    messenger:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/></svg>',
  };

  function getPageUrl() {
    return window.location.href.split("#")[0];
  }

  function isMobileDevice() {
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  }

  function canNativeShare() {
    return typeof navigator.share === "function" && isMobileDevice();
  }

  function openShareMenu() {
    closeMenu();
    shareDropdown.hidden = false;
    requestAnimationFrame(function () {
      shareDropdown.classList.add("is-open");
    });
    shareToggle.classList.add("is-active");
    shareToggle.setAttribute("aria-expanded", "true");
  }

  function closeShareMenu() {
    shareDropdown.classList.remove("is-open");
    shareToggle.classList.remove("is-active");
    shareToggle.setAttribute("aria-expanded", "false");

    shareDropdown.addEventListener(
      "transitionend",
      function onEnd() {
        shareDropdown.hidden = true;
        shareDropdown.removeEventListener("transitionend", onEnd);
      },
      { once: true }
    );
  }

  function toggleShareMenu() {
    if (shareDropdown.classList.contains("is-open")) {
      closeShareMenu();
    } else {
      openShareMenu();
    }
  }

  function openExternalUrl(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleMessengerShare(pageUrl) {
    const encodedUrl = encodeURIComponent(pageUrl);
    const messengerUrl = "fb-messenger://share/?link=" + encodedUrl;
    const fallbackUrl =
      "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl;

    if (isMobileDevice()) {
      window.location.href = messengerUrl;
      setTimeout(function () {
        openExternalUrl(fallbackUrl);
      }, 600);
    } else {
      openExternalUrl(fallbackUrl);
    }
  }

  function createShareRow(option) {
    const li = document.createElement("li");
    const row = document.createElement("a");
    row.className = "share-row";
    row.href = option.href || "#";
    row.setAttribute("role", "menuitem");

    if (option.external) {
      row.target = "_blank";
      row.rel = "noopener noreferrer";
    }

    row.innerHTML =
      '<span class="share-icon-badge ' +
      option.badgeClass +
      '">' +
      SHARE_ICONS[option.iconKey] +
      "</span>" +
      '<span class="share-row-label">' +
      option.label +
      "</span>" +
      '<span class="share-row-arrow" aria-hidden="true">↗</span>';

    if (option.action === "messenger") {
      row.addEventListener("click", function (e) {
        e.preventDefault();
        handleMessengerShare(getPageUrl());
        closeShareMenu();
      });
    } else {
      row.addEventListener("click", function () {
        closeShareMenu();
      });
    }

    li.appendChild(row);
    return li;
  }

  function buildShareMenu() {
    const pageUrl = getPageUrl();
    const encodedUrl = encodeURIComponent(pageUrl);
    const encodedText = encodeURIComponent(SHARE_MESSAGE);
    const whatsappText = encodeURIComponent(SHARE_MESSAGE + " " + pageUrl);

    const options = [
      {
        label: "Share on Facebook",
        badgeClass: "share-icon-badge--facebook",
        iconKey: "facebook",
        href:
          "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl,
        external: true,
      },
      {
        label: "Share on LinkedIn",
        badgeClass: "share-icon-badge--linkedin",
        iconKey: "linkedin",
        href:
          "https://www.linkedin.com/sharing/share-offsite/?url=" +
          encodedUrl,
        external: true,
      },
      {
        label: "Share on Twitter",
        badgeClass: "share-icon-badge--twitter",
        iconKey: "twitter",
        href:
          "https://twitter.com/intent/tweet?url=" +
          encodedUrl +
          "&text=" +
          encodedText,
        external: true,
      },
      {
        label: "Share via WhatsApp",
        badgeClass: "share-icon-badge--whatsapp",
        iconKey: "whatsapp",
        href: "https://wa.me/?text=" + whatsappText,
        external: true,
      },
      {
        label: "Share via Messenger",
        badgeClass: "share-icon-badge--messenger",
        iconKey: "messenger",
        action: "messenger",
      },
    ];

    shareList.innerHTML = "";
    options.forEach(function (option) {
      shareList.appendChild(createShareRow(option));
    });
  }

  shareToggle.addEventListener("click", function (e) {
    e.stopPropagation();

    if (shareDropdown.classList.contains("is-open")) {
      closeShareMenu();
      return;
    }

    if (canNativeShare()) {
      navigator
        .share({
          title: SHARE_TITLE,
          text: SHARE_MESSAGE,
          url: getPageUrl(),
        })
        .catch(function (err) {
          if (err && err.name === "AbortError") return;
          openShareMenu();
        });
      return;
    }

    openShareMenu();
  });

  document.addEventListener("click", function (e) {
    if (
      shareDropdown.classList.contains("is-open") &&
      !shareDropdown.contains(e.target) &&
      !shareToggle.contains(e.target)
    ) {
      closeShareMenu();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && shareDropdown.classList.contains("is-open")) {
      closeShareMenu();
    }
  });

  // ---------------------------------------------------------------------------
  // Hamburger menu
  // ---------------------------------------------------------------------------
  function openMenu() {
    closeShareMenu();
    dropdownMenu.hidden = false;
    requestAnimationFrame(function () {
      dropdownMenu.classList.add("is-open");
    });
    menuToggle.classList.add("is-active");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
  }

  function closeMenu() {
    dropdownMenu.classList.remove("is-open");
    menuToggle.classList.remove("is-active");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");

    dropdownMenu.addEventListener(
      "transitionend",
      function onEnd() {
        dropdownMenu.hidden = true;
        dropdownMenu.removeEventListener("transitionend", onEnd);
      },
      { once: true }
    );
  }

  function toggleMenu() {
    if (dropdownMenu.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  menuToggle.addEventListener("click", function (e) {
    e.stopPropagation();
    closeShareMenu();
    toggleMenu();
  });

  document.addEventListener("click", function (e) {
    if (
      dropdownMenu.classList.contains("is-open") &&
      !dropdownMenu.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      closeMenu();
    }
  });

  dropdownMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      closeMenu();
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dropdownMenu.classList.contains("is-open")) {
      closeMenu();
    }
  });

  // ---------------------------------------------------------------------------
  // Utility controls
  // ---------------------------------------------------------------------------
  volumeBtn.addEventListener("click", function () {
    isMuted = !isMuted;
    volumeBtn.classList.toggle("is-muted", isMuted);
    volumeBtn.setAttribute("aria-pressed", String(!isMuted));

    if (currentAudio) {
      currentAudio.volume = getVolume();
    }
  });

  volumeSlider.addEventListener("input", function () {
    if (currentAudio) {
      currentAudio.volume = getVolume();
    }
    if (isMuted && volumeSlider.value > 0) {
      isMuted = false;
      volumeBtn.classList.remove("is-muted");
      volumeBtn.setAttribute("aria-pressed", "true");
    }
  });

  stopBtn.addEventListener("click", function () {
    stopCurrentSound();
    flashButton(stopBtn);
    displayEmoji.textContent = "⏹";
    displayLabel.textContent = "Stopped";
    displayScreen.classList.remove("is-animating");
  });

  // ---------------------------------------------------------------------------
  // Sound pack bookmark (placeholder)
  // ---------------------------------------------------------------------------
  function openPackTray() {
    closeMenu();
    closeShareMenu();
    packTray.hidden = false;
    requestAnimationFrame(function () {
      packBookmark.classList.add("is-open");
    });
    packTab.setAttribute("aria-expanded", "true");
    packTab.setAttribute("aria-label", "Close sound packs");
  }

  function closePackTray() {
    packBookmark.classList.remove("is-open");
    packTab.setAttribute("aria-expanded", "false");
    packTab.setAttribute("aria-label", "Open sound packs");

    packTray.addEventListener(
      "transitionend",
      function onEnd() {
        if (!packBookmark.classList.contains("is-open")) {
          packTray.hidden = true;
        }
        packTray.removeEventListener("transitionend", onEnd);
      },
      { once: true }
    );
  }

  function togglePackTray() {
    if (packBookmark.classList.contains("is-open")) {
      closePackTray();
    } else {
      openPackTray();
    }
  }

  packTab.addEventListener("click", function (e) {
    e.stopPropagation();
    togglePackTray();
  });

  packTray.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  packTray.querySelectorAll(".pack-chip:not([disabled])").forEach(function (chip) {
    chip.addEventListener("click", function () {
      packTray.querySelectorAll(".pack-chip").forEach(function (other) {
        other.classList.toggle("is-active", other === chip);
      });

      const label = chip.dataset.pack === "all" ? "All packs" : chip.textContent.trim();
      const emoji = chip.dataset.emoji || "📑";
      animateDisplay(emoji, label);
      showToast(label + " — placeholder");
    });
  });

  document.addEventListener("click", function (e) {
    if (
      packBookmark.classList.contains("is-open") &&
      !packBookmark.contains(e.target)
    ) {
      closePackTray();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && packBookmark.classList.contains("is-open")) {
      closePackTray();
    }
  });

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  buildPresetSwatches();
  buildKeypad();
  buildShareMenu();

  const savedBg = loadSavedBackground();
  if (savedBg) {
    applyBackground(savedBg, true);
  } else {
    applyBackground(DEFAULT_BACKGROUND, true);
  }
})();
