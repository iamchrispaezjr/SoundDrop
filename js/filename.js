/**
 * SFX Remote — Soundboard Application
 * Pure vanilla JS: sound playback, display animation, hamburger menu
 */

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Sound definitions — Mixkit royalty-free CDN (replace URLs as needed)
  // ---------------------------------------------------------------------------
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
  // Audio state — stop previous sound before playing next (no overlap)
  // ---------------------------------------------------------------------------
  let currentAudio = null;
  let isMuted = false;
  let animationTimer = null;

  /** Returns master volume (0–1) respecting mute toggle */
  function getVolume() {
    if (isMuted) return 0;
    return Number(volumeSlider.value) / 100;
  }

  /** Stop any currently playing sound */
  function stopCurrentSound() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
  }

  /** Play a sound by its config object */
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

  // ---------------------------------------------------------------------------
  // Display animation (~700ms bounce + glow)
  // ---------------------------------------------------------------------------
  function animateDisplay(emoji, label) {
    displayEmoji.textContent = emoji;
    displayEmoji.setAttribute("aria-label", label);
    displayLabel.textContent = label;

    // Restart animation by removing and re-adding class
    displayScreen.classList.remove("is-animating");
    void displayScreen.offsetWidth; // force reflow
    displayScreen.classList.add("is-animating");

    clearTimeout(animationTimer);
    animationTimer = setTimeout(function () {
      displayScreen.classList.remove("is-animating");
    }, 700);
  }

  // ---------------------------------------------------------------------------
  // Button press feedback
  // ---------------------------------------------------------------------------
  function flashButton(btn) {
    btn.classList.add("is-pressed");
    setTimeout(function () {
      btn.classList.remove("is-pressed");
    }, 150);
  }

  /** Handle sound button click */
  function onSoundClick(sound, btn) {
    flashButton(btn);
    animateDisplay(sound.emoji, sound.label);
    playSound(sound);
  }

  // ---------------------------------------------------------------------------
  // Build keypad buttons from SOUNDS array
  // ---------------------------------------------------------------------------
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
  // Hamburger menu — open/close with outside-click dismiss
  // ---------------------------------------------------------------------------
  function openMenu() {
    dropdownMenu.hidden = false;
    // Allow one frame for display:block before adding open class
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

  // Close menu when clicking outside
  document.addEventListener("click", function (e) {
    if (
      dropdownMenu.classList.contains("is-open") &&
      !dropdownMenu.contains(e.target) &&
      e.target !== menuToggle
    ) {
      closeMenu();
    }
  });

  // Close menu when a link is selected
  dropdownMenu.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      closeMenu();
    });
  });

  // Close on Escape key
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dropdownMenu.classList.contains("is-open")) {
      closeMenu();
    }
  });

  // ---------------------------------------------------------------------------
  // Utility controls — volume & stop-all
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
    // Un-mute when user adjusts slider
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
  buildKeypad();
})();
