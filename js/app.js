

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
  const DEVICE_STORAGE_KEY = "sounddrop-device";
  const MAX_STORAGE_BYTES = 2.5 * 1024 * 1024; // ~2.5 MB base64 limit for localStorage
  const DEFAULT_DEVICE_COLOR = "#1c1c22";

  const DEVICE_PRESETS = [
    { label: "Graphite", value: "#1c1c22" },
    { label: "Baby blue", value: "#89CFF0" },
    { label: "Navy", value: "#1a2744" },
    { label: "Plum", value: "#2a1840" },
    { label: "Forest", value: "#16301c" },
    { label: "Crimson", value: "#4a1c22" },
    { label: "Sand", value: "#c4b49a" },
    { label: "Ivory", value: "#e8e8ec" },
  ];
  const INTRO_STORAGE_KEY = "sounddrop-intro-at";
  const INTRO_COOLDOWN_MS = 3 * 60 * 60 * 1000;
  const INTRO_SRC = ""; // upload-only tool — no built-in intro sting

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

  const SOUNDS = [];

  function soundById(id) {
    return null;
  }

  function ph(id, emoji, label) {
    return { id: id, emoji: emoji, label: label, placeholder: true };
  }

  function fx(id, emoji, label, src, icon) {
    const sound = { id: id, emoji: emoji, label: label, src: src };
    if (icon) sound.icon = icon;
    return sound;
  }

  // Built-in catalogs removed — categories organize local uploads only
  const PACK_SOUNDS = {};
  const MIX_LEFTOVER_IDS = [];
  const EXTRA_SFX = [];
  const ORGANIZER_PACKS = [
    { id: "laughs", label: "Laughs", emoji: "😂" },
    { id: "memes", label: "Memes", emoji: "📱" },
    { id: "reactions", label: "Reactions", emoji: "👏" },
    { id: "funny", label: "Funny", emoji: "🤪" },
    { id: "stings", label: "Stings", emoji: "🎼" },
    { id: "scifi", label: "Sci-Fi", emoji: "🛸" },
    { id: "animals", label: "Animals", emoji: "🐶" },
    { id: "party", label: "Party", emoji: "🎉" },
    { id: "horror", label: "Horror", emoji: "👻" },
    { id: "games", label: "Games", emoji: "🎮" },
    { id: "nature", label: "Nature", emoji: "🌿" },
    { id: "cartoons", label: "Cartoons", emoji: "📺" },
    { id: "alerts", label: "Alerts", emoji: "🔔" },
    { id: "vehicles", label: "Vehicles", emoji: "🚗" },
    { id: "fantasy", label: "Fantasy", emoji: "🧙" },
    { id: "retro", label: "Retro", emoji: "🕹️" },
  ];
  const CUSTOM_CATS_KEY = "noisegoblin-custom-categories";
  const CUSTOM_CATS_MAX = 12;
  const VISIBLE_PACKS_KEY = "noisegoblin-visible-packs";
  const PINNED_PACKS = ["all", "mix", "trending"];
  let packRemoveMode = false;

  function loadVisiblePackIds() {
    try {
      const raw = localStorage.getItem(VISIBLE_PACKS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(function (id) {
            return ORGANIZER_PACKS.some(function (p) {
              return p.id === id;
            });
          });
        }
      }
    } catch (err) {
      /* ignore */
    }
    return ORGANIZER_PACKS.map(function (p) {
      return p.id;
    });
  }

  function saveVisiblePackIds(ids) {
    try {
      localStorage.setItem(VISIBLE_PACKS_KEY, JSON.stringify(ids || []));
    } catch (err) {
      /* ignore */
    }
  }

  let visiblePackIds = loadVisiblePackIds();

  function loadCustomCategories() {
    try {
      const raw = localStorage.getItem(CUSTOM_CATS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (cat) {
          return cat && cat.id && cat.label;
        })
        .map(function (cat) {
          return {
            id: String(cat.id),
            label: String(cat.label).slice(0, 18),
            emoji: cat.emoji || "📁",
          };
        });
    } catch (err) {
      return [];
    }
  }

  function saveCustomCategories(list) {
    try {
      localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(list || []));
    } catch (err) {
      /* ignore */
    }
  }

  function getAllOrganizerPacks() {
    return ORGANIZER_PACKS.concat(loadCustomCategories());
  }

  function isOrganizerPack(packId) {
    return getAllOrganizerPacks().some(function (p) {
      return p.id === packId;
    });
  }

  function slugifyCategoryLabel(label) {
    const cleaned = String(label || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return "user-" + (cleaned || "category");
  }

  function ensureCustomCategory(label, emoji) {
    const trimmed = String(label || "").trim().slice(0, 18);
    if (!trimmed) return null;

    const existing = getAllOrganizerPacks();
    for (let i = 0; i < existing.length; i++) {
      if (existing[i].label.toLowerCase() === trimmed.toLowerCase()) {
        return existing[i];
      }
    }

    const cats = loadCustomCategories();
    if (cats.length >= CUSTOM_CATS_MAX) {
      showToast("Max " + CUSTOM_CATS_MAX + " custom categories");
      return null;
    }

    const used = {};
    existing.forEach(function (p) {
      used[p.id] = true;
    });
    let id = slugifyCategoryLabel(trimmed);
    const base = id;
    let n = 2;
    while (used[id]) {
      id = base + "-" + n;
      n += 1;
    }

    const pickedEmoji = firstGrapheme(emoji) || "📁";
    const cat = { id: id, label: trimmed, emoji: pickedEmoji };
    cats.push(cat);
    saveCustomCategories(cats);
    syncUserCategoryChips();
    return cat;
  }

  function isCustomCategoryId(packId) {
    return loadCustomCategories().some(function (cat) {
      return cat.id === packId;
    });
  }

  function deleteCustomCategory(packId) {
    if (!packId || !isCustomCategoryId(packId)) return false;
    const next = loadCustomCategories().filter(function (cat) {
      return cat.id !== packId;
    });
    saveCustomCategories(next);
    customSoundsCache.forEach(function (sound) {
      if (sound.category === packId) {
        setCustomSoundCategory(sound.id, "");
      }
    });
    syncUserCategoryChips();
    if (activePack === packId) {
      setAllPackActive();
    }
    return true;
  }

  function customsInCategory(packId) {
    return customSoundsCache.filter(function (sound) {
      return sound.category === packId;
    });
  }

  const PACK_SIZE = 17;
  const MIX_SESSION_KEY = "noisegoblin-session-mix";
  const HOME_SESSION_KEY = "noisegoblin-home-mix";
  const PLAY_COUNTS_KEY = "noisegoblin-play-counts";
  const PACK_ORDER_KEY = "noisegoblin-pack-orders";
  const TRENDING_MIN_PLAYS = 50;
  const CUSTOM_DB_NAME = "noisegoblin-custom-sfx";
  const CUSTOM_STORE = "sounds";
  const CUSTOM_MAX_COUNT = 50;
  const CUSTOM_MAX_BYTES = 3 * 1024 * 1024;
  const CUSTOM_ICON_MAX_BYTES = 250 * 1024;
  const CUSTOM_ICON_SIZE = 96;
  const CUSTOM_EMOJIS = [
    "🎵", "🔊", "😂", "🔥", "👻", "🐶", "🚀", "🎮", "💩", "👏",
  ];

  let customSoundsCache = [];

  function cloneSound(sound) {
    return {
      id: sound.id,
      emoji: sound.emoji,
      label: sound.label,
      src: sound.src,
      icon: sound.icon,
      placeholder: sound.placeholder,
      custom: !!sound.custom,
      category: sound.category || "",
      uploadSlot: !!sound.uploadSlot,
      plays: sound.plays,
      showPlays: sound.showPlays,
    };
  }

  function serializeSound(sound) {
    const copy = {
      id: sound.id,
      emoji: sound.emoji,
      label: sound.label,
      placeholder: sound.placeholder,
      custom: !!sound.custom,
      category: sound.category || "",
    };
    // Don't stash photo data URLs in sessionStorage — reload from IndexedDB
    if (!sound.custom && sound.icon) copy.icon = sound.icon;
    if (!sound.custom) copy.src = sound.src;
    return copy;
  }

  function withCenteredSeventeenth(list) {
    return list.map(function (sound, index) {
      const copy = cloneSound(sound);
      copy.center = list.length === PACK_SIZE && index === PACK_SIZE - 1;
      return copy;
    });
  }

  function shuffleList(items) {
    const list = items.slice();
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = list[i];
      list[i] = list[j];
      list[j] = tmp;
    }
    return list;
  }

  function openCustomDb() {
    return new Promise(function (resolve, reject) {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB unavailable"));
        return;
      }
      const req = indexedDB.open(CUSTOM_DB_NAME, 1);
      req.onupgradeneeded = function () {
        const db = req.result;
        if (!db.objectStoreNames.contains(CUSTOM_STORE)) {
          db.createObjectStore(CUSTOM_STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
      req.onerror = function () {
        reject(req.error || new Error("IndexedDB open failed"));
      };
    });
  }

  function labelFromFilename(name) {
    const base = String(name || "Custom")
      .replace(/\.[^.]+$/, "")
      .replace(/[_-]+/g, " ")
      .trim();
    const cleaned = base || "Custom";
    return cleaned.length > 18 ? cleaned.slice(0, 18).trim() : cleaned;
  }

  function hydrateCustomRecord(record) {
    const url = URL.createObjectURL(record.blob);
    return {
      id: record.id,
      emoji: record.emoji || "🎵",
      label: record.label || "Custom",
      src: url,
      icon: record.icon || "",
      custom: true,
      category: record.category || "",
      _objectUrl: url,
      _blob: record.blob,
      _mime: record.mime || "audio/mpeg",
      _createdAt: record.createdAt || Date.now(),
    };
  }

  function revokeCustomSound(sound) {
    if (sound && sound._objectUrl) {
      try {
        URL.revokeObjectURL(sound._objectUrl);
      } catch (err) {
        /* ignore */
      }
    }
  }

  function loadCustomSounds() {
    return openCustomDb()
      .then(function (db) {
        return new Promise(function (resolve, reject) {
          const tx = db.transaction(CUSTOM_STORE, "readonly");
          const store = tx.objectStore(CUSTOM_STORE);
          const req = store.getAll();
          req.onsuccess = function () {
            resolve(req.result || []);
          };
          req.onerror = function () {
            reject(req.error);
          };
        });
      })
      .then(function (records) {
        customSoundsCache.forEach(revokeCustomSound);
        customSoundsCache = records
          .sort(function (a, b) {
            return (a.createdAt || 0) - (b.createdAt || 0);
          })
          .map(hydrateCustomRecord);
        return customSoundsCache;
      })
      .catch(function () {
        customSoundsCache = [];
        return customSoundsCache;
      });
  }

  function saveCustomSoundRecord(record) {
    return openCustomDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(CUSTOM_STORE, "readwrite");
        tx.objectStore(CUSTOM_STORE).put(record);
        tx.oncomplete = function () {
          resolve(record);
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  function persistCustomSound(sound) {
    if (!sound || !sound.custom || !sound._blob) {
      return Promise.reject(new Error("Missing custom sound data"));
    }
    return saveCustomSoundRecord({
      id: sound.id,
      label: sound.label,
      emoji: sound.emoji || "🎵",
      icon: sound.icon || "",
      mime: sound._mime || "audio/mpeg",
      blob: sound._blob,
      createdAt: sound._createdAt || Date.now(),
      category: sound.category || "",
    });
  }

  function setCustomSoundCategory(id, category) {
    const sound = findCustomSound(id);
    if (!sound) return Promise.resolve(null);
    sound.category = category || "";
    return persistCustomSound(sound).then(function () {
      return sound;
    });
  }

  function firstGrapheme(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    try {
      if (typeof Intl !== "undefined" && Intl.Segmenter) {
        const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
        const first = seg.segment(text)[Symbol.iterator]().next().value;
        return first && first.segment ? first.segment : text.slice(0, 2);
      }
    } catch (err) {
      /* fall through */
    }
    const chars = Array.from(text);
    return chars[0] || "";
  }

  function setCustomSoundEmoji(id, emoji) {
    const sound = findCustomSound(id);
    const picked = firstGrapheme(emoji);
    if (!sound || !picked) return Promise.resolve(null);
    sound.emoji = picked;
    sound.icon = "";
    return persistCustomSound(sound).then(function () {
      refreshStoredCustomCopies(id);
      return sound;
    });
  }

  function setCustomSoundIcon(id, dataUrl) {
    const sound = findCustomSound(id);
    if (!sound || !dataUrl) return Promise.resolve(null);
    sound.icon = dataUrl;
    if (!sound.emoji) sound.emoji = "🎵";
    return persistCustomSound(sound).then(function () {
      refreshStoredCustomCopies(id);
      return sound;
    });
  }

  function shrinkImageFile(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) {
        reject(new Error("Not an image"));
        return;
      }
      if (file.size > CUSTOM_ICON_MAX_BYTES) {
        reject(new Error("Photo too large"));
        return;
      }
      const reader = new FileReader();
      reader.onerror = function () {
        reject(new Error("Read failed"));
      };
      reader.onload = function () {
        const img = new Image();
        img.onload = function () {
          const canvas = document.createElement("canvas");
          const scale = Math.min(
            1,
            CUSTOM_ICON_SIZE / Math.max(img.width || 1, img.height || 1)
          );
          const w = Math.max(1, Math.round((img.width || 1) * scale));
          const h = Math.max(1, Math.round((img.height || 1) * scale));
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Canvas unavailable"));
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          try {
            resolve(canvas.toDataURL("image/jpeg", 0.72));
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = function () {
          reject(new Error("Image failed"));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function refreshStoredCustomCopies(id) {
    const live = findCustomSound(id);
    if (!live) return;

    function patchList(list) {
      if (!list || !list.length) return list;
      return list.map(function (item) {
        if (item && item.id === id) return cloneSound(live);
        return item;
      });
    }

    if (customHomeSounds) {
      customHomeSounds = patchList(customHomeSounds);
      try {
        sessionStorage.setItem(
          HOME_SESSION_KEY,
          JSON.stringify(customHomeSounds.map(serializeSound))
        );
      } catch (err) {
        /* ignore */
      }
    }
    if (sessionMix) {
      sessionMix = patchList(sessionMix);
      try {
        sessionStorage.setItem(
          MIX_SESSION_KEY,
          JSON.stringify(
            sessionMix
              .filter(function (s) {
                return s && s.src && !s.placeholder;
              })
              .map(serializeSound)
          )
        );
      } catch (err) {
        /* ignore */
      }
    }
  }

  function randomCustomEmoji() {
    return CUSTOM_EMOJIS[Math.floor(Math.random() * CUSTOM_EMOJIS.length)] || "🎵";
  }

  function deleteCustomSoundRecord(id) {
    return openCustomDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        const tx = db.transaction(CUSTOM_STORE, "readwrite");
        tx.objectStore(CUSTOM_STORE).delete(id);
        tx.oncomplete = function () {
          resolve();
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  function findCustomSound(id) {
    for (let i = 0; i < customSoundsCache.length; i++) {
      if (customSoundsCache[i].id === id) return customSoundsCache[i];
    }
    return null;
  }

  function resolveStoredSound(sound) {
    if (!sound) return null;
    if (sound.custom || String(sound.id || "").indexOf("custom-") === 0) {
      const live = findCustomSound(sound.id);
      return live ? cloneSound(live) : null;
    }
    // Upload-only tool: ignore legacy built-in catalog entries
    return null;
  }

  function realBoard(list) {
    const filled = (list || [])
      .filter(function (s) {
        return s && s.src && !s.placeholder;
      })
      .slice(0, PACK_SIZE)
      .map(cloneSound);
    if (!filled.length) return [];
    if (filled.length < PACK_SIZE) return filled;
    return withCenteredSeventeenth(filled);
  }

  function syncHomeFromLibrary() {
    if (!customSoundsCache.length) {
      clearHomeMix();
      return null;
    }
    return saveHomeMix(customSoundsCache.slice(0, PACK_SIZE));
  }

  function buildSessionMix(forceNew) {
    if (!forceNew) {
      try {
        const raw = sessionStorage.getItem(MIX_SESSION_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved) && saved.length) {
            const resolved = saved.map(resolveStoredSound).filter(Boolean);
            if (resolved.length) {
              return realBoard(resolved);
            }
          }
        }
      } catch (err) {
        /* ignore */
      }
    }

    const pool = allPlayablePool();
    if (!pool.length) {
      return [];
    }

    const picked = shuffleList(pool).slice(0, PACK_SIZE);
    try {
      sessionStorage.setItem(
        MIX_SESSION_KEY,
        JSON.stringify(picked.map(serializeSound))
      );
    } catch (err) {
      /* private mode / quota */
    }

    return realBoard(picked);
  }

  let sessionMix = null;

  function getSessionMix() {
    if (!sessionMix) {
      sessionMix = buildSessionMix(false);
    }
    return sessionMix;
  }

  function rerollSessionMix() {
    sessionMix = buildSessionMix(true);
    return sessionMix;
  }

  function allPlayablePool() {
    const pool = [];
    const seen = {};

    function add(sound) {
      if (!sound || !sound.src || seen[sound.id]) return;
      seen[sound.id] = true;
      pool.push(cloneSound(sound));
    }

    customSoundsCache.forEach(add);
    return pool;
  }

  function loadHomeMix() {
    try {
      const raw = sessionStorage.getItem(HOME_SESSION_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.length || saved.length > PACK_SIZE) return null;
      const resolved = saved.map(resolveStoredSound).filter(Boolean);
      if (!resolved.length) return null;
      return withCenteredSeventeenth(resolved);
    } catch (err) {
      return null;
    }
  }

  function saveHomeMix(list) {
    const cleaned = list.slice(0, PACK_SIZE).map(cloneSound);
    try {
      sessionStorage.setItem(
        HOME_SESSION_KEY,
        JSON.stringify(cleaned.map(serializeSound))
      );
    } catch (err) {
      /* ignore */
    }
    customHomeSounds = withCenteredSeventeenth(cleaned);
    return customHomeSounds;
  }

  function clearHomeMix() {
    try {
      sessionStorage.removeItem(HOME_SESSION_KEY);
    } catch (err) {
      /* ignore */
    }
    customHomeSounds = null;
  }

  let customHomeSounds = null;
  let packOrderOverrides = loadPackOrders();

  function loadPackOrders() {
    try {
      const raw = sessionStorage.getItem(PACK_ORDER_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function savePackOrders() {
    try {
      sessionStorage.setItem(PACK_ORDER_KEY, JSON.stringify(packOrderOverrides));
    } catch (err) {
      /* ignore */
    }
  }

  function applyPackOrder(packId, list) {
    const order = packOrderOverrides[packId];
    if (!order || !order.length || !list || !list.length) return list || [];
    const byId = {};
    list.forEach(function (sound) {
      if (sound && sound.id) byId[sound.id] = sound;
    });
    const ordered = [];
    order.forEach(function (id) {
      if (byId[id]) {
        ordered.push(byId[id]);
        delete byId[id];
      }
    });
    Object.keys(byId).forEach(function (id) {
      ordered.push(byId[id]);
    });
    return ordered;
  }

  function getHomeSounds() {
    if (customHomeSounds && customHomeSounds.length) {
      return realBoard(customHomeSounds);
    }
    if (customSoundsCache.length) {
      return realBoard(customSoundsCache.slice(0, PACK_SIZE));
    }
    return [];
  }

  function loadPlayCounts() {
    try {
      const raw = localStorage.getItem(PLAY_COUNTS_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function recordPlay(soundId) {
    const counts = loadPlayCounts();
    counts[soundId] = (counts[soundId] || 0) + 1;
    try {
      localStorage.setItem(PLAY_COUNTS_KEY, JSON.stringify(counts));
    } catch (err) {
      /* ignore quota / private mode */
    }
    return counts[soundId];
  }

  function getTrendingSounds() {
    const counts = loadPlayCounts();
    const pool = allPlayablePool();

    const hot = [];
    const rest = [];

    pool.forEach(function (sound) {
      const plays = counts[sound.id] || 0;
      const copy = cloneSound(sound);
      copy.plays = plays;
      copy.showPlays = plays > TRENDING_MIN_PLAYS;
      if (plays > TRENDING_MIN_PLAYS) {
        hot.push(copy);
      } else {
        rest.push(copy);
      }
    });

    hot.sort(function (a, b) {
      const diff = b.plays - a.plays;
      if (diff !== 0) return diff;
      return a.label.localeCompare(b.label);
    });

    // Keep a normal mix underneath until sounds clear the 50× gate
    const filler = shuffleList(rest);
    return realBoard(hot.concat(filler));
  }

  let activePack = "all";

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
  const themeToggleBtn = document.getElementById("themeToggleBtn");
  const themePanel = document.getElementById("themePanel");
  const themePanelClose = document.getElementById("themePanelClose");
  const themePresetColors = document.getElementById("themePresetColors");
  const themeColorPicker = document.getElementById("themeColorPicker");
  const themeResetBtn = document.getElementById("themeResetBtn");
  const sfxDevice = document.getElementById("sfxDevice");
  const toast = document.getElementById("toast");

  const keypadEl = document.getElementById("keypad");
  const displayScreen = document.getElementById("displayScreen");
  const displayEmoji = document.getElementById("displayEmoji");
  const displayLabel = document.getElementById("displayLabel");
  const shareToggle = document.getElementById("shareToggle");
  const shareDropdown = document.getElementById("shareDropdown");
  const shareList = document.getElementById("shareList");
  const volumeBtn = document.getElementById("volumeBtn");
  const volumeSlider = document.getElementById("volumeSlider");
  const customizeBtn = document.getElementById("customizeBtn");
  const mineBtn = document.getElementById("mineBtn");
  const mixEmojiPicker = document.getElementById("mixEmojiPicker");
  const lookPickerBackdrop = document.getElementById("lookPickerBackdrop");
  const mixEmojiPickerClose = document.getElementById("mixEmojiPickerClose");
  const mixEmojiPickerTitle = document.getElementById("mixEmojiPickerTitle");
  const mixEmojiPreview = document.getElementById("mixEmojiPreview");
  const mixEmojiInput = document.getElementById("mixEmojiInput");
  const mixEmojiApply = document.getElementById("mixEmojiApply");
  const mixEmojiPhotoBtn = document.getElementById("mixEmojiPhotoBtn");
  const mixEmojiPhotoInput = document.getElementById("mixEmojiPhotoInput");
  const mixEmojiResetBtn = document.getElementById("mixEmojiResetBtn");
  const mixEmojiRemoveBtn = document.getElementById("mixEmojiRemoveBtn");
  const mineFileInput = document.getElementById("mineFileInput");
  let emojiPickerSoundId = null;
  const packBookmark = document.getElementById("packBookmark");
  const packTab = document.getElementById("packTab");
  const packsHeaderBtn = document.getElementById("packsHeaderBtn");
  const packTray = document.getElementById("packTray");
  const packList = document.getElementById("packList");

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
    closeThemePanel();
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
    if (!themePanel.classList.contains("is-open")) {
      bgPanelBackdrop.classList.remove("is-open");
    }
    bgToggleBtn.classList.remove("is-active");
    bgToggleBtn.setAttribute("aria-expanded", "false");

    bgPanel.addEventListener(
      "transitionend",
      function onEnd() {
        bgPanel.hidden = true;
        if (!themePanel.classList.contains("is-open")) {
          bgPanelBackdrop.hidden = true;
        }
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

  bgPanelBackdrop.addEventListener("click", function () {
    closeBgPanel();
    closeThemePanel();
  });

  bgChoosePhotoBtn.addEventListener("click", function () {
    bgFileInput.click();
  });

  bgFileInput.addEventListener("change", handleFileSelect);

  bgColorPicker.addEventListener("input", handleColorPickerChange);

  bgResetBtn.addEventListener("click", function () {
    resetBackground();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (bgPanel.classList.contains("is-open")) closeBgPanel();
    if (themePanel.classList.contains("is-open")) closeThemePanel();
  });

  // Prevent panel clicks from closing via backdrop
  bgPanel.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  // ---------------------------------------------------------------------------
  // Soundboard (device) color — separate from background
  // ---------------------------------------------------------------------------
  function clampByte(n) {
    return Math.max(0, Math.min(255, Math.round(n)));
  }

  function hexToRgb(hex) {
    const raw = String(hex || "").replace("#", "");
    const full = raw.length === 3 ? raw.split("").map(function (c) { return c + c; }).join("") : raw;
    if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return (
      "#" +
      [r, g, b]
        .map(function (v) {
          const h = clampByte(v).toString(16);
          return h.length === 1 ? "0" + h : h;
        })
        .join("")
    );
  }

  function mixHex(hex, other, amount) {
    const a = hexToRgb(hex);
    const b = hexToRgb(other);
    if (!a || !b) return hex;
    return rgbToHex(
      a.r + (b.r - a.r) * amount,
      a.g + (b.g - a.g) * amount,
      a.b + (b.b - a.b) * amount
    );
  }

  function isLightHex(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000 > 150;
  }

  function normalizeDeviceColor(value) {
    const rgb = hexToRgb(value);
    if (!rgb) return null;
    return rgbToHex(rgb.r, rgb.g, rgb.b);
  }

  function applyDeviceColor(hex, skipSave) {
    const color = normalizeDeviceColor(hex) || DEFAULT_DEVICE_COLOR;
    const light = isLightHex(color);
    const vars = {
      "--device-body": color,
      "--device-body-light": mixHex(color, "#ffffff", light ? 0.18 : 0.14),
      "--device-body-dark": mixHex(color, "#000000", light ? 0.12 : 0.22),
      "--device-border": light ? mixHex(color, "#000000", 0.28) : mixHex(color, "#ffffff", 0.16),
      "--btn-face": light ? mixHex(color, "#000000", 0.08) : mixHex(color, "#ffffff", 0.12),
      "--btn-face-hover": light ? mixHex(color, "#ffffff", 0.12) : mixHex(color, "#ffffff", 0.2),
      "--btn-face-active": light ? mixHex(color, "#000000", 0.16) : mixHex(color, "#000000", 0.12),
      "--btn-text": light ? "#141418" : "#e8e8ec",
      "--btn-label": light ? "#3d3d48" : "#9898a8",
    };

    Object.keys(vars).forEach(function (name) {
      sfxDevice.style.setProperty(name, vars[name]);
    });

    themeColorPicker.value = color;
    document.querySelectorAll(".theme-preset-swatch").forEach(function (swatch) {
      swatch.classList.toggle("is-selected", swatch.dataset.value === color);
    });

    if (!skipSave) {
      try {
        localStorage.setItem(DEVICE_STORAGE_KEY, color);
      } catch (err) {
        /* ignore */
      }
    }
  }

  function resetDeviceColor() {
    try {
      localStorage.removeItem(DEVICE_STORAGE_KEY);
    } catch (err) {
      /* ignore */
    }
    [
      "--device-body",
      "--device-body-light",
      "--device-body-dark",
      "--device-border",
      "--btn-face",
      "--btn-face-hover",
      "--btn-face-active",
      "--btn-text",
      "--btn-label",
    ].forEach(function (name) {
      sfxDevice.style.removeProperty(name);
    });
    themeColorPicker.value = DEFAULT_DEVICE_COLOR;
    document.querySelectorAll(".theme-preset-swatch").forEach(function (swatch) {
      swatch.classList.toggle("is-selected", swatch.dataset.value === DEFAULT_DEVICE_COLOR);
    });
    showToast("Soundboard color reset to default");
  }

  function buildDevicePresets() {
    DEVICE_PRESETS.forEach(function (preset) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bg-preset-swatch theme-preset-swatch";
      btn.style.background = preset.value;
      btn.dataset.value = preset.value;
      btn.setAttribute("aria-label", "Soundboard color " + preset.label);
      btn.title = preset.label;
      btn.addEventListener("click", function () {
        applyDeviceColor(preset.value);
      });
      themePresetColors.appendChild(btn);
    });
  }

  function openThemePanel() {
    closeBgPanel();
    themePanel.hidden = false;
    bgPanelBackdrop.hidden = false;
    requestAnimationFrame(function () {
      themePanel.classList.add("is-open");
      bgPanelBackdrop.classList.add("is-open");
    });
    themeToggleBtn.classList.add("is-active");
    themeToggleBtn.setAttribute("aria-expanded", "true");
    themePanelClose.focus();
  }

  function closeThemePanel() {
    if (!themePanel.classList.contains("is-open") && themePanel.hidden) return;
    themePanel.classList.remove("is-open");
    themeToggleBtn.classList.remove("is-active");
    themeToggleBtn.setAttribute("aria-expanded", "false");

    if (!bgPanel.classList.contains("is-open")) {
      bgPanelBackdrop.classList.remove("is-open");
    }

    themePanel.addEventListener(
      "transitionend",
      function onEnd() {
        themePanel.hidden = true;
        if (!bgPanel.classList.contains("is-open")) {
          bgPanelBackdrop.hidden = true;
        }
        themePanel.removeEventListener("transitionend", onEnd);
      },
      { once: true }
    );

    themeToggleBtn.focus();
  }

  themeToggleBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (themePanel.classList.contains("is-open")) {
      closeThemePanel();
    } else {
      openThemePanel();
    }
  });

  themePanelClose.addEventListener("click", closeThemePanel);

  themePanel.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  themeColorPicker.addEventListener("input", function () {
    applyDeviceColor(themeColorPicker.value);
  });

  themeResetBtn.addEventListener("click", resetDeviceColor);

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

  function playableSound(sound) {
    if (!sound) return null;
    if (sound.custom || String(sound.id || "").indexOf("custom-") === 0) {
      const live = findCustomSound(sound.id);
      if (live && live.src) return live;
    }
    return sound.src ? sound : null;
  }

  function playSound(sound) {
    stopCurrentSound();
    const play = playableSound(sound);
    if (!play || !play.src) {
      console.warn("Audio playback failed: missing source");
      return;
    }

    const audio = new Audio(play.src);
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
        '" alt="" draggable="false">';
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
    const play = playableSound(sound) || sound;
    if (play.uploadSlot || (play.placeholder && !play.src)) {
      animateDisplay("⬆️", "Upload");
      if (mineFileInput) mineFileInput.click();
      return;
    }
    if (play.placeholder || !play.src) {
      showToast((play.label || "Sound") + " — empty slot");
      return;
    }
    animateDisplay(play.emoji, play.label, play.icon);
    playSound(play);

    const plays = recordPlay(play.id);
    play.plays = plays;
    if (sound) sound.plays = plays;

    if (activePack === "trending" && plays > TRENDING_MIN_PLAYS) {
      let countEl = btn.querySelector(".sound-btn-count");
      if (!countEl) {
        countEl = document.createElement("span");
        countEl.className = "sound-btn-count";
        btn.appendChild(countEl);
      }
      countEl.textContent = String(plays);
    }
  }

  function soundsForPack(packId) {
    if (packId === "mix") {
      return getSessionMix();
    }

    let list;
    if (packId === "trending") {
      list = getTrendingSounds();
    } else if (packId === "mine") {
      list = realBoard(customSoundsCache.slice(0, PACK_SIZE));
    } else if (isOrganizerPack(packId)) {
      list = realBoard(customsInCategory(packId).slice(0, PACK_SIZE));
    } else {
      list = getHomeSounds();
    }

    const playable = (list || []).filter(function (s) {
      return s && s.src && !s.placeholder;
    });
    return realBoard(applyPackOrder(packId, playable));
  }

  function buildKeypad(packId) {
    const pack = packId || activePack;
    const list = soundsForPack(pack).filter(function (s) {
      return s && s.src && !s.placeholder;
    });
    keypadEl.innerHTML = "";
    updateKeypadHint(pack, list.length);

    if (!list.length) {
      const empty = document.createElement("div");
      empty.className = "keypad-empty";
      const isCat = isOrganizerPack(pack);
      const title =
        pack === "mix"
          ? "Mix needs uploads"
          : pack === "trending"
            ? "Trending needs uploads"
            : isCat
              ? "No sounds in this category"
              : "Your remote is empty";
      const note = isCat
        ? "Upload while this category is open (max 50 sounds, 3MB each)"
        : "Upload up to 50 audio files (3MB each) — stored only on this device";
      empty.innerHTML =
        '<p class="keypad-empty-title">' +
        title +
        "</p>" +
        '<p class="keypad-empty-note">' +
        note +
        "</p>" +
        '<button type="button" class="keypad-empty-btn" id="keypadUploadBtn">Upload SFX</button>';
      keypadEl.appendChild(empty);
      const up = document.getElementById("keypadUploadBtn");
      if (up && mineFileInput) {
        up.addEventListener("click", function () {
          mineFileInput.click();
        });
      }
      return;
    }

    const canReorder = pack !== "mix";

    list.forEach(function (sound, index) {
      const isCenter = list.length === PACK_SIZE && index === PACK_SIZE - 1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "sound-btn" +
        (isCenter ? " sound-btn--center" : "") +
        (canReorder ? " sound-btn--draggable" : "");
      btn.setAttribute("aria-label", "Play " + sound.label);
      btn.dataset.id = sound.id;
      btn.dataset.index = String(index);

      const iconHtml = sound.icon
        ? '<img class="sound-btn-emoji-img" src="' +
          sound.icon.replace(/"/g, "") +
          '" alt="" draggable="false">'
        : sound.emoji;

      btn.innerHTML =
        '<span class="sound-btn-emoji" aria-hidden="true">' +
        iconHtml +
        "</span>" +
        '<span class="sound-btn-label">' +
        sound.label +
        "</span>" +
        (sound.showPlays && (sound.plays || 0) > TRENDING_MIN_PLAYS
          ? '<span class="sound-btn-count">' + (sound.plays || 0) + "</span>"
          : "") +
        (sound.custom
          ? '<span class="sound-btn-look" role="button" tabindex="0" aria-label="Edit look for ' +
            String(sound.label).replace(/"/g, "") +
            '">✏️</span>'
          : "");

      let suppressClick = false;
      const lookBtn = btn.querySelector(".sound-btn-look");
      if (lookBtn) {
        function openLook(e) {
          e.preventDefault();
          e.stopPropagation();
          const live = findCustomSound(sound.id) || sound;
          openEmojiPicker(live);
        }
        lookBtn.addEventListener("click", openLook);
        lookBtn.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") openLook(e);
        });
      }
      btn.addEventListener("click", function (e) {
        if (e.target.closest && e.target.closest(".sound-btn-look")) return;
        if (suppressClick) {
          suppressClick = false;
          return;
        }
        onSoundClick(sound, btn);
      });

      if (canReorder) {
        bindKeypadDrag(btn, sound, list, pack, function () {
          suppressClick = true;
        });
      }

      keypadEl.appendChild(btn);
    });
  }

  const keypadHint = document.getElementById("keypadHint");

  function updateKeypadHint(pack, count) {
    if (!keypadHint) return;
    const show = pack !== "mix" && count > 1;
    keypadHint.hidden = !show;
  }

  let keypadDrag = null;

  function clearKeypadDropHints() {
    keypadEl.querySelectorAll(".sound-btn.is-drop-target").forEach(function (el) {
      el.classList.remove("is-drop-target");
    });
  }

  function endKeypadDrag() {
    if (!keypadDrag) return;
    const state = keypadDrag;
    keypadDrag = null;
    clearKeypadDropHints();
    if (state.ghost && state.ghost.parentNode) {
      state.ghost.parentNode.removeChild(state.ghost);
    }
    if (state.btn) state.btn.classList.remove("is-dragging");
    document.body.classList.remove("is-keypad-dragging");
  }

  function elementFromPointKeypad(x, y) {
    const ghost = keypadDrag && keypadDrag.ghost;
    if (ghost) ghost.style.visibility = "hidden";
    const el = document.elementFromPoint(x, y);
    if (ghost) ghost.style.visibility = "visible";
    return el;
  }

  function persistKeypadOrder(pack, ordered) {
    if (pack === "mix") return;
    if (pack === "all") {
      saveHomeMix(ordered);
      return;
    }
    packOrderOverrides[pack] = ordered.map(function (sound) {
      return sound.id;
    });
    savePackOrders();
  }

  function snapKeypadReorder(pack, fromId, toId) {
    const current = soundsForPack(pack)
      .filter(function (s) {
        return s && s.src && !s.placeholder;
      })
      .map(cloneSound);
    const from = current.findIndex(function (s) {
      return s.id === fromId;
    });
    const to = current.findIndex(function (s) {
      return s.id === toId;
    });
    if (from < 0 || to < 0 || from === to) return false;
    const moved = current.splice(from, 1)[0];
    current.splice(to, 0, moved);
    persistKeypadOrder(pack, current);
    buildKeypad(pack);
    keypadEl.querySelectorAll(".sound-btn").forEach(function (btn) {
      btn.classList.add("is-snapping");
    });
    window.setTimeout(function () {
      keypadEl.querySelectorAll(".sound-btn.is-snapping").forEach(function (btn) {
        btn.classList.remove("is-snapping");
      });
    }, 220);
    return true;
  }

  function bindKeypadDrag(btn, sound, list, pack, onDragged) {
    function onPointerMove(e) {
      if (!keypadDrag || keypadDrag.id !== sound.id) return;
      if (keypadDrag.pointerId != null && e.pointerId !== keypadDrag.pointerId) return;
      e.preventDefault();
      const dx = e.clientX - keypadDrag.startX;
      const dy = e.clientY - keypadDrag.startY;
      if (!keypadDrag.moved && dx * dx + dy * dy > 36) {
        keypadDrag.moved = true;
        const rect = btn.getBoundingClientRect();
        const ghost = btn.cloneNode(true);
        ghost.classList.add("sound-btn-ghost");
        ghost.style.width = rect.width + "px";
        ghost.style.height = rect.height + "px";
        ghost.style.left = e.clientX - keypadDrag.offsetX + "px";
        ghost.style.top = e.clientY - keypadDrag.offsetY + "px";
        document.body.appendChild(ghost);
        keypadDrag.ghost = ghost;
        btn.classList.add("is-dragging");
        document.body.classList.add("is-keypad-dragging");
      }
      if (!keypadDrag.moved) return;
      if (keypadDrag.ghost) {
        keypadDrag.ghost.style.left = e.clientX - keypadDrag.offsetX + "px";
        keypadDrag.ghost.style.top = e.clientY - keypadDrag.offsetY + "px";
      }
      clearKeypadDropHints();
      const under = elementFromPointKeypad(e.clientX, e.clientY);
      const overBtn = under && under.closest ? under.closest(".sound-btn") : null;
      if (overBtn && overBtn !== btn && overBtn.dataset.id) {
        overBtn.classList.add("is-drop-target");
      }
    }

    function onPointerUp(e) {
      if (!keypadDrag || keypadDrag.id !== sound.id) return;
      if (keypadDrag.pointerId != null && e.pointerId !== keypadDrag.pointerId) return;
      const didMove = keypadDrag.moved;
      const under = elementFromPointKeypad(e.clientX, e.clientY);
      const overBtn = under && under.closest ? under.closest(".sound-btn") : null;
      const toId = overBtn && overBtn !== btn ? overBtn.dataset.id : null;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      endKeypadDrag();
      if (!didMove) return;
      if (onDragged) onDragged();
      if (toId) {
        snapKeypadReorder(pack, sound.id, toId);
      }
    }

    function onPointerCancel() {
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("pointercancel", onPointerCancel);
      endKeypadDrag();
    }

    btn.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (keypadDrag) return;
      if (e.target.closest && e.target.closest(".sound-btn-look")) return;

      const rect = btn.getBoundingClientRect();
      keypadDrag = {
        id: sound.id,
        btn: btn,
        ghost: null,
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        offsetX: e.clientX - rect.left,
        offsetY: e.clientY - rect.top,
        moved: false,
      };

      document.addEventListener("pointermove", onPointerMove, { passive: false });
      document.addEventListener("pointerup", onPointerUp);
      document.addEventListener("pointercancel", onPointerCancel);
    });
  }

  // ---------------------------------------------------------------------------
  // Share menu
  // ---------------------------------------------------------------------------
  const SHARE_TITLE = "Check out Soundgoblin";
  const SHARE_MESSAGE =
    "Check out Soundgoblin — a private soundboard tool. Upload your own SFX, organize them, and play on your device!";

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

  function closeMenu() {
    /* hamburger menu removed */
  }

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

  // ---------------------------------------------------------------------------
  // Sound pack bookmark (placeholder)
  // ---------------------------------------------------------------------------
  function setPackControlsOpen(isOpen) {
    const label = isOpen ? "Close more SFX packs" : "Open more SFX packs";
    const expanded = isOpen ? "true" : "false";
    packTab.setAttribute("aria-expanded", expanded);
    packTab.setAttribute("aria-label", label);
    if (packsHeaderBtn) {
      packsHeaderBtn.setAttribute("aria-expanded", expanded);
      packsHeaderBtn.setAttribute("aria-label", label);
      packsHeaderBtn.classList.toggle("is-active", isOpen);
    }
  }

  function openPackTray() {
    closeMenu();
    closeShareMenu();
    packTray.hidden = false;
    requestAnimationFrame(function () {
      packBookmark.classList.add("is-open");
    });
    setPackControlsOpen(true);
  }

  function closePackTray() {
    packBookmark.classList.remove("is-open");
    setPackControlsOpen(false);

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

  function isPackControlTarget(target) {
    return (
      packBookmark.contains(target) ||
      (packsHeaderBtn && packsHeaderBtn.contains(target))
    );
  }

  packTab.addEventListener("click", function (e) {
    e.stopPropagation();
    togglePackTray();
  });

  if (packsHeaderBtn) {
    packsHeaderBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      togglePackTray();
    });
  }

  function selectPack(packId, options) {
    const opts = options || {};
    const next = packId || "all";
    activePack = next;

    packTray.querySelectorAll(".pack-chip").forEach(function (chip) {
      chip.classList.toggle("is-active", chip.dataset.pack === next);
    });

    buildKeypad(activePack);
    updateUtilityActionBtn();

    if (!opts.announce) return;

    const chip = packTray.querySelector('.pack-chip[data-pack="' + next + '"]');
    const label = chip && chip.querySelector(".pack-chip-label");
    const labelText = label ? label.textContent.trim() : next;
    const emoji = (chip && chip.dataset.emoji) || "📑";
    animateDisplay(emoji, labelText);

    const playable = soundsForPack(activePack).filter(function (s) {
      return s && s.src && !s.placeholder;
    }).length;
    if (activePack === "all") {
      showToast("All — your remote (" + playable + " sounds)");
    } else if (activePack === "mix") {
      showToast("Mix — tap Randomize for a new set from your uploads");
    } else if (activePack === "trending") {
      showToast("Trending — counters unlock after 50 plays");
    } else if (playable === 0) {
      showToast(labelText + " is empty — upload while here to fill it");
    } else {
      showToast(labelText + " — " + playable + " sounds");
    }
  }

  const CATEGORY_EMOJI_CHOICES = [
    "📁",
    "🎵",
    "😂",
    "🔥",
    "🎮",
    "🎬",
    "🎤",
    "🎧",
    "💥",
    "✨",
    "🐸",
    "👻",
    "🚀",
    "⚽",
    "🍕",
    "☕",
    "💡",
    "🎯",
    "📣",
    "🪄",
    "📺",
    "🔔",
    "🐶",
    "🎉",
  ];

  function closePackAddMenu() {
    const menu = document.getElementById("packAddMenu");
    const backdrop = document.getElementById("packAddBackdrop");
    if (menu && menu.parentNode) menu.parentNode.removeChild(menu);
    if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

  function setPackRemoveMode(on) {
    packRemoveMode = !!on;
    if (packList) {
      packList.classList.toggle("is-removing", packRemoveMode);
    }
    packTray.querySelectorAll(".pack-chip[data-removable='1']").forEach(function (chip) {
      chip.classList.toggle("is-wiggling", packRemoveMode);
    });
    const removeBtn = document.getElementById("packRemoveBtn");
    if (removeBtn) {
      removeBtn.textContent = packRemoveMode ? "Done" : "Remove";
      removeBtn.setAttribute("aria-pressed", packRemoveMode ? "true" : "false");
      removeBtn.classList.toggle("is-active", packRemoveMode);
    }
    if (packRemoveMode) closePackAddMenu();
  }

  function createCategoryFromLabel(typed, emoji) {
    const created = ensureCustomCategory(typed, emoji);
    if (!created) return null;
    closePackAddMenu();
    syncPackTrayChips();
    selectPack(created.id, { announce: true });
    showToast('Added "' + created.label + '"');
    return created;
  }

  function openPackAddMenu() {
    closePackAddMenu();
    setPackRemoveMode(false);

    let selectedEmoji = "🎵";

    const backdrop = document.createElement("div");
    backdrop.id = "packAddBackdrop";
    backdrop.className = "pack-add-backdrop";
    backdrop.addEventListener("click", function () {
      closePackAddMenu();
    });

    const menu = document.createElement("div");
    menu.id = "packAddMenu";
    menu.className = "pack-add-popout";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-modal", "true");
    menu.setAttribute("aria-labelledby", "packAddTitle");
    menu.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    const head = document.createElement("div");
    head.className = "pack-add-popout-head";

    const title = document.createElement("h2");
    title.id = "packAddTitle";
    title.className = "pack-add-popout-title";
    title.textContent = "Add category";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "pack-add-popout-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = '<span aria-hidden="true">&times;</span>';
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closePackAddMenu();
    });

    head.appendChild(title);
    head.appendChild(closeBtn);

    const body = document.createElement("div");
    body.className = "pack-add-popout-body";

    const label = document.createElement("label");
    label.className = "pack-add-menu-label";
    label.setAttribute("for", "packAddInput");
    label.textContent = "Category name";

    const input = document.createElement("input");
    input.type = "text";
    input.id = "packAddInput";
    input.className = "pack-add-popout-input";
    input.maxLength = 18;
    input.placeholder = "e.g. Podcast, Clips, Intros…";
    input.autocomplete = "off";
    input.spellcheck = false;

    const iconLabel = document.createElement("p");
    iconLabel.className = "pack-add-menu-label";
    iconLabel.textContent = "Icon";

    const emojiGrid = document.createElement("div");
    emojiGrid.className = "pack-add-emoji-grid";
    emojiGrid.setAttribute("role", "listbox");
    emojiGrid.setAttribute("aria-label", "Category emoji");

    const actions = document.createElement("div");
    actions.className = "pack-add-popout-actions";

    const emojiPickBtn = document.createElement("button");
    emojiPickBtn.type = "button";
    emojiPickBtn.className = "pack-add-emoji-pick";
    emojiPickBtn.setAttribute("aria-label", "Selected category emoji");
    emojiPickBtn.textContent = selectedEmoji;

    const createBtn = document.createElement("button");
    createBtn.type = "button";
    createBtn.className = "pack-add-menu-create";
    createBtn.textContent = "Create";

    function syncEmojiSelection() {
      emojiPickBtn.textContent = selectedEmoji;
      emojiGrid.querySelectorAll(".pack-add-emoji-opt").forEach(function (btn) {
        const on = btn.dataset.emoji === selectedEmoji;
        btn.classList.toggle("is-selected", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });
    }

    CATEGORY_EMOJI_CHOICES.forEach(function (emoji) {
      const opt = document.createElement("button");
      opt.type = "button";
      opt.className = "pack-add-emoji-opt";
      opt.dataset.emoji = emoji;
      opt.setAttribute("role", "option");
      opt.setAttribute("aria-label", "Use " + emoji);
      opt.textContent = emoji;
      opt.addEventListener("click", function (e) {
        e.stopPropagation();
        selectedEmoji = emoji;
        syncEmojiSelection();
      });
      emojiGrid.appendChild(opt);
    });

    function submit() {
      const typed = String(input.value || "").trim();
      if (!typed) {
        showToast("Type a category name first");
        input.focus();
        return;
      }
      createCategoryFromLabel(typed, selectedEmoji);
    }

    createBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      submit();
    });
    emojiPickBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      emojiGrid.scrollIntoView({ block: "nearest" });
    });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        closePackAddMenu();
      }
    });

    actions.appendChild(emojiPickBtn);
    actions.appendChild(createBtn);

    body.appendChild(label);
    body.appendChild(input);
    body.appendChild(iconLabel);
    body.appendChild(emojiGrid);
    body.appendChild(actions);

    menu.appendChild(head);
    menu.appendChild(body);

    document.body.appendChild(backdrop);
    document.body.appendChild(menu);
    syncEmojiSelection();

    requestAnimationFrame(function () {
      backdrop.classList.add("is-open");
      menu.classList.add("is-open");
      input.focus();
    });
  }

  function removePackChip(packId) {
    if (!packId || PINNED_PACKS.indexOf(packId) !== -1) return;

    if (isCustomCategoryId(packId)) {
      const cat = loadCustomCategories().find(function (c) {
        return c.id === packId;
      });
      const label = cat ? cat.label : packId;
      const ok = window.confirm(
        'Delete category "' + label + '"? Sounds in it become Unsorted.'
      );
      if (!ok) return;
      deleteCustomCategory(packId);
    } else {
      visiblePackIds = visiblePackIds.filter(function (id) {
        return id !== packId;
      });
      saveVisiblePackIds(visiblePackIds);
      if (activePack === packId) {
        selectPack("all");
      }
    }
    syncPackTrayChips();
    showToast("Category removed");
  }

  function makePackChip(opts) {
    const btn = document.createElement("button");
    btn.className =
      "pack-chip" + (opts.packId === activePack ? " is-active" : "");
    btn.type = "button";
    btn.dataset.pack = opts.packId;
    btn.dataset.emoji = opts.emoji || "📁";
    if (opts.pinned) btn.dataset.pinned = "1";
    if (opts.removable) btn.dataset.removable = "1";
    if (opts.userCat) btn.dataset.userCat = "1";
    if (packRemoveMode && opts.removable) btn.classList.add("is-wiggling");
    btn.innerHTML =
      '<span class="pack-chip-emoji" aria-hidden="true">' +
      (opts.emoji || "📁") +
      "</span>" +
      '<span class="pack-chip-label">' +
      opts.label +
      "</span>";
    return btn;
  }

  function syncPackTrayChips() {
    if (!packList) return;
    closePackAddMenu();

    const pinned = {};
    PINNED_PACKS.forEach(function (id) {
      pinned[id] = true;
    });

    Array.prototype.slice.call(packList.children).forEach(function (el) {
      if (el.id === "packAddMenu") return;
      const pack = el.dataset && el.dataset.pack;
      if (!pack || pinned[pack]) return;
      el.remove();
    });

    const addBtnExisting = document.getElementById("packAddBtn");
    const removeBtnExisting = document.getElementById("packRemoveBtn");
    if (addBtnExisting) addBtnExisting.remove();
    if (removeBtnExisting) removeBtnExisting.remove();

    ORGANIZER_PACKS.forEach(function (pack) {
      if (visiblePackIds.indexOf(pack.id) === -1) return;
      packList.appendChild(
        makePackChip({
          packId: pack.id,
          label: pack.label,
          emoji: pack.emoji,
          removable: true,
        })
      );
    });

    loadCustomCategories().forEach(function (cat) {
      packList.appendChild(
        makePackChip({
          packId: cat.id,
          label: cat.label,
          emoji: cat.emoji || "📁",
          removable: true,
          userCat: true,
        })
      );
    });

    const addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.id = "packAddBtn";
    addBtn.className = "pack-chip pack-chip--add";
    addBtn.setAttribute("aria-label", "Add a category");
    addBtn.setAttribute("aria-haspopup", "menu");
    addBtn.textContent = "Add";
    addBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const existing = document.getElementById("packAddMenu");
      if (existing) {
        closePackAddMenu();
        return;
      }
      openPackAddMenu();
    });
    packList.appendChild(addBtn);

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.id = "packRemoveBtn";
    removeBtn.className =
      "pack-chip pack-chip--remove" + (packRemoveMode ? " is-active" : "");
    removeBtn.setAttribute("aria-label", "Remove a category");
    removeBtn.setAttribute("aria-pressed", packRemoveMode ? "true" : "false");
    removeBtn.textContent = packRemoveMode ? "Done" : "Remove";
    removeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setPackRemoveMode(!packRemoveMode);
      if (packRemoveMode) {
        showToast("Tap a wiggling category to remove it");
      }
    });
    packList.appendChild(removeBtn);

    packList.querySelectorAll(".pack-chip[data-pack]").forEach(function (chip) {
      chip.classList.toggle("is-active", chip.dataset.pack === activePack);
    });
  }

  function syncUserCategoryChips() {
    syncPackTrayChips();
  }

  packTray.addEventListener("click", function (e) {
    e.stopPropagation();
    if (e.target.closest("#packAddBtn") || e.target.closest("#packRemoveBtn")) {
      return;
    }
    if (e.target.closest("#packAddMenu")) return;

    const chip = e.target.closest(".pack-chip");
    if (!chip || chip.disabled || !packTray.contains(chip)) return;
    if (chip.id === "packAddBtn" || chip.id === "packRemoveBtn") return;

    const packId = chip.dataset.pack;
    if (!packId) return;

    if (packRemoveMode && chip.dataset.removable === "1") {
      removePackChip(packId);
      return;
    }

    if (packRemoveMode) return;
    selectPack(packId, { announce: true });
  });

  syncPackTrayChips();

  document.addEventListener("click", function (e) {
    if (document.getElementById("packAddMenu")) return;
    if (packBookmark.classList.contains("is-open") && !isPackControlTarget(e.target)) {
      setPackRemoveMode(false);
      closePackTray();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (document.getElementById("packAddMenu")) {
        closePackAddMenu();
        return;
      }
      if (packRemoveMode) {
        setPackRemoveMode(false);
        return;
      }
      if (packBookmark.classList.contains("is-open")) {
        closePackTray();
      }
    }
  });

  // ---------------------------------------------------------------------------
  // One-time intro sting (once per visitor, again after 3 hours)
  // ---------------------------------------------------------------------------
  function forceIntroFromUrl() {
    try {
      return new URLSearchParams(window.location.search).get("intro") === "1";
    } catch (err) {
      return false;
    }
  }

  function shouldPlayIntro() {
    return false;
  }

  function markIntroPlayed() {
    try {
      localStorage.setItem(INTRO_STORAGE_KEY, String(Date.now()));
    } catch (err) {
      /* ignore quota / private mode */
    }
  }

  let introAudio = null;
  let introPlayed = false;

  function playIntroSound() {
    return Promise.resolve(false);
  }

  function initIntroSound() {
    /* upload-only tool — no built-in intro */
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  buildPresetSwatches();
  buildDevicePresets();
  buildShareMenu();
  initIntroSound();

  loadCustomSounds().then(function () {
    customHomeSounds = loadHomeMix();
    if (!customHomeSounds || !customHomeSounds.length) {
      syncHomeFromLibrary();
    }
    buildKeypad();
    updateUtilityActionBtn();
  });

  try {
    const savedDevice = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (savedDevice) {
      applyDeviceColor(savedDevice, true);
    }
  } catch (err) {
    /* ignore */
  }

  const savedBg = loadSavedBackground();
  if (savedBg) {
    applyBackground(savedBg, true);
  } else {
    applyBackground(DEFAULT_BACKGROUND, true);
  }

  function setAllPackActive() {
    selectPack("all");
  }

  function updateUtilityActionBtn() {
    /* Randomize is always available */
  }

  function updateEmojiPreview(sound) {
    if (!mixEmojiPreview || !sound) return;
    if (sound.icon) {
      mixEmojiPreview.innerHTML =
        '<img class="mix-emoji-preview-img" src="' +
        String(sound.icon).replace(/"/g, "") +
        '" alt="">';
    } else {
      mixEmojiPreview.textContent = sound.emoji || "🎵";
    }
  }

  function applyEmojiFromInput() {
    const sound = findCustomSound(emojiPickerSoundId);
    if (!sound || !mixEmojiInput) return;
    const picked = firstGrapheme(mixEmojiInput.value);
    if (!picked) {
      showToast("Paste or type an emoji first");
      mixEmojiInput.focus();
      return;
    }
    setCustomSoundEmoji(sound.id, picked)
      .then(function () {
        showToast(sound.label + " → " + picked);
        closeEmojiPicker();
        buildKeypad(activePack);
        animateDisplay(picked, sound.label);
      })
      .catch(function () {
        showToast("Couldn't update emoji");
      });
  }

  function closeEmojiPicker() {
    emojiPickerSoundId = null;
    if (mixEmojiPicker) {
      mixEmojiPicker.hidden = true;
      mixEmojiPicker.classList.remove("is-open");
    }
    if (lookPickerBackdrop) {
      lookPickerBackdrop.hidden = true;
      lookPickerBackdrop.classList.remove("is-open");
    }
    if (mixEmojiInput) mixEmojiInput.value = "";
  }

  function openEmojiPicker(sound) {
    if (!mixEmojiPicker || !sound || !sound.custom) return;
    emojiPickerSoundId = sound.id;
    if (mixEmojiPickerTitle) {
      mixEmojiPickerTitle.textContent = "Look for " + sound.label;
    }
    updateEmojiPreview(sound);
    if (mixEmojiInput) {
      mixEmojiInput.value = sound.icon ? "" : sound.emoji || "";
    }
    if (lookPickerBackdrop) {
      lookPickerBackdrop.hidden = false;
      lookPickerBackdrop.classList.add("is-open");
    }
    mixEmojiPicker.hidden = false;
    requestAnimationFrame(function () {
      mixEmojiPicker.classList.add("is-open");
      if (mixEmojiInput) {
        mixEmojiInput.focus();
        mixEmojiInput.select();
      }
    });
  }

  customizeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (activePack !== "mix") {
      selectPack("mix");
    }
    rerollSessionMix();
    buildKeypad("mix");
    showToast("New mix from your uploads");
    animateDisplay("🎲", "Mix");
  });

  if (mineBtn) {
    mineBtn.addEventListener("click", function () {
      if (mineFileInput) mineFileInput.click();
    });
  }

  if (lookPickerBackdrop) {
    lookPickerBackdrop.addEventListener("click", closeEmojiPicker);
  }
  if (mixEmojiPickerClose) {
    mixEmojiPickerClose.addEventListener("click", function (e) {
      e.stopPropagation();
      closeEmojiPicker();
    });
  }
  if (mixEmojiPicker) {
    mixEmojiPicker.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }
  if (mixEmojiApply) {
    mixEmojiApply.addEventListener("click", function (e) {
      e.stopPropagation();
      applyEmojiFromInput();
    });
  }
  if (mixEmojiInput) {
    mixEmojiInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        applyEmojiFromInput();
      }
    });
    mixEmojiInput.addEventListener("input", function () {
      const sound = findCustomSound(emojiPickerSoundId);
      const picked = firstGrapheme(mixEmojiInput.value);
      if (mixEmojiPreview) {
        if (picked) {
          mixEmojiPreview.textContent = picked;
        } else if (sound) {
          updateEmojiPreview(sound);
        }
      }
    });
  }
  if (mixEmojiPhotoBtn && mixEmojiPhotoInput) {
    mixEmojiPhotoBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      mixEmojiPhotoInput.click();
    });
    mixEmojiPhotoInput.addEventListener("change", function () {
      const file = mixEmojiPhotoInput.files && mixEmojiPhotoInput.files[0];
      mixEmojiPhotoInput.value = "";
      const sound = findCustomSound(emojiPickerSoundId);
      if (!file || !sound) return;
      shrinkImageFile(file)
        .then(function (dataUrl) {
          return setCustomSoundIcon(sound.id, dataUrl).then(function () {
            return dataUrl;
          });
        })
        .then(function (dataUrl) {
          showToast(sound.label + " photo set");
          closeEmojiPicker();
          buildKeypad(activePack);
          animateDisplay(sound.emoji || "🎵", sound.label, dataUrl);
        })
        .catch(function (err) {
          if (err && err.message === "Photo too large") {
            showToast("Photo must be under 250KB — emoji is lighter");
          } else {
            showToast("Couldn't use that photo");
          }
        });
    });
  }

  if (mixEmojiResetBtn) {
    mixEmojiResetBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const sound = findCustomSound(emojiPickerSoundId);
      if (!sound) return;
      const nextEmoji = sound.emoji || randomCustomEmoji();
      setCustomSoundEmoji(sound.id, nextEmoji)
        .then(function () {
          showToast(sound.label + " look reset");
          closeEmojiPicker();
          buildKeypad(activePack);
          animateDisplay(nextEmoji, sound.label);
        })
        .catch(function () {
          showToast("Couldn't reset look");
        });
    });
  }

  if (mixEmojiRemoveBtn) {
    mixEmojiRemoveBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      const sound = findCustomSound(emojiPickerSoundId);
      if (!sound) return;
      const ok = window.confirm(
        'Remove "' + sound.label + '" from this device?'
      );
      if (!ok) return;
      removeCustomSound(sound.id);
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mixEmojiPicker && mixEmojiPicker.classList.contains("is-open")) {
      closeEmojiPicker();
    }
  });

  function removeCustomSound(id) {
    deleteCustomSoundRecord(id)
      .then(function () {
        const existing = findCustomSound(id);
        revokeCustomSound(existing);
        customSoundsCache = customSoundsCache.filter(function (s) {
          return s.id !== id;
        });
        syncHomeFromLibrary();
        sessionMix = null;
        if (emojiPickerSoundId === id) closeEmojiPicker();
        buildKeypad(activePack);
        showToast("Removed sound");
      })
      .catch(function () {
        showToast("Couldn't remove that sound");
      });
  }

  function addCustomFiles(fileList) {
    const files = Array.prototype.slice.call(fileList || []);
    if (!files.length) return;

    let remaining = CUSTOM_MAX_COUNT - customSoundsCache.length;
    if (remaining <= 0) {
      showToast("Max " + CUSTOM_MAX_COUNT + " sounds");
      return;
    }

    const queue = files.slice(0, remaining);
    let added = 0;

    function next(i) {
      if (i >= queue.length) {
        if (added) {
          syncHomeFromLibrary();
          sessionMix = null;
          buildKeypad(activePack);
          showToast(
            "Added " +
              added +
              " sound" +
              (added === 1 ? "" : "s") +
              (isOrganizerPack(activePack) ? " to " + activePack : "")
          );
          animateDisplay("⬆️", "Uploaded");
        }
        return;
      }

      const file = queue[i];
      if (!file || (file.type && file.type.indexOf("audio/") !== 0 && !/\.(mp3|m4a|wav|ogg|aac|mpeg)$/i.test(file.name))) {
        next(i + 1);
        return;
      }
      if (file.size > CUSTOM_MAX_BYTES) {
        showToast(file.name + " is over 3MB");
        next(i + 1);
        return;
      }

      const record = {
        id: "custom-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
        label: labelFromFilename(file.name),
        emoji: randomCustomEmoji(),
        mime: file.type || "audio/mpeg",
        blob: file,
        createdAt: Date.now(),
        category: isOrganizerPack(activePack) ? activePack : "",
      };

      saveCustomSoundRecord(record)
        .then(function () {
          customSoundsCache.push(hydrateCustomRecord(record));
          added += 1;
          next(i + 1);
        })
        .catch(function () {
          showToast("Couldn't save " + file.name);
          next(i + 1);
        });
    }

    next(0);
  }

  if (mineFileInput) {
    mineFileInput.addEventListener("change", function () {
      addCustomFiles(mineFileInput.files);
      mineFileInput.value = "";
    });
  }

  updateUtilityActionBtn();

  // ---------------------------------------------------------------------------
  // Welcome announcement
  // ---------------------------------------------------------------------------
  const WELCOME_SESSION_KEY = "noisegoblin-welcome-dismissed";
  const welcomePop = document.getElementById("welcomePop");
  const welcomePopClose = document.getElementById("welcomePopClose");

  function hideWelcomePop() {
    if (!welcomePop) return;
    try {
      sessionStorage.setItem(WELCOME_SESSION_KEY, "1");
    } catch (err) {
      /* ignore */
    }
    welcomePop.classList.remove("is-open");
    welcomePop.addEventListener(
      "transitionend",
      function onEnd() {
        welcomePop.hidden = true;
        welcomePop.removeEventListener("transitionend", onEnd);
      },
      { once: true }
    );
  }

  if (welcomePop && welcomePopClose) {
    welcomePopClose.addEventListener("click", hideWelcomePop);
    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(WELCOME_SESSION_KEY) === "1";
    } catch (err) {
      dismissed = false;
    }
    if (!dismissed) {
      welcomePop.hidden = false;
      setTimeout(function () {
        welcomePop.classList.add("is-open");
      }, 500);
    }
  }
})();
