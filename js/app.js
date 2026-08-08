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
      src: "https://assets.mixkit.co/active_storage/sfx/2895/2895-preview.mp3",
    },
    {
      id: "applause",
      emoji: "👏",
      label: "Applause",
      src: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    },
    {
      id: "boo",
      emoji: "👎",
      label: "Boo",
      src: "https://assets.mixkit.co/active_storage/sfx/946/946-preview.mp3",
    },
    {
      id: "airhorn",
      emoji: "📯",
      label: "Air Horn",
      src: "https://assets.mixkit.co/active_storage/sfx/1641/1641-preview.mp3",
    },
    {
      id: "drumroll",
      emoji: "🥁",
      label: "Drum Roll",
      src: "https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3",
    },
    {
      id: "scratch",
      emoji: "📀",
      label: "Scratch",
      src: "https://assets.mixkit.co/active_storage/sfx/212/212-preview.mp3",
    },
    {
      id: "cash",
      emoji: "💰",
      label: "Cash",
      src: "https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3",
    },
    {
      id: "error",
      emoji: "🚫",
      label: "Wrong",
      src: "https://assets.mixkit.co/active_storage/sfx/948/948-preview.mp3",
    },
    {
      id: "success",
      emoji: "✅",
      label: "Correct",
      src: "https://assets.mixkit.co/active_storage/sfx/942/942-preview.mp3",
    },
    {
      id: "cheer",
      emoji: "🎉",
      label: "Cheer",
      src: "https://assets.mixkit.co/active_storage/sfx/2236/2236-preview.mp3",
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
  const volumeBtn = document.getElementById("volumeBtn");
  const volumeSlider = document.getElementById("volumeSlider");
  const stopBtn = document.getElementById("stopBtn");

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

  function animateDisplay(emoji, label) {
    displayEmoji.textContent = emoji;
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
    animateDisplay(sound.emoji, sound.label);
    playSound(sound);
  }

  function buildKeypad() {
    SOUNDS.forEach(function (sound) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "sound-btn";
      btn.setAttribute("aria-label", "Play " + sound.label);
      btn.dataset.id = sound.id;

      btn.innerHTML =
        '<span class="sound-btn-emoji" aria-hidden="true">' +
        sound.emoji +
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
  // Hamburger menu
  // ---------------------------------------------------------------------------
  function openMenu() {
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
    toggleMenu();
  });

  document.addEventListener("click", function (e) {
    if (
      dropdownMenu.classList.contains("is-open") &&
      !dropdownMenu.contains(e.target) &&
      e.target !== menuToggle
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
  // Init
  // ---------------------------------------------------------------------------
  buildPresetSwatches();
  buildKeypad();

  const savedBg = loadSavedBackground();
  if (savedBg) {
    applyBackground(savedBg, true);
  } else {
    applyBackground(DEFAULT_BACKGROUND, true);
  }
})();

