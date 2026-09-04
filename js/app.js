

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
  const INTRO_SRC = "Hello There!.mp3";

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
      icon: "Ariana Grande Laughing.png",
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
      icon: "Patrick Booing.png",
    },
    {
      id: "airhorn",
      emoji: "📣",
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
      icon: "Sponge.png",
      src: "Fuck My Life.mp3",
    },
    {
      id: "success",
      emoji: "✅",
      label: "Typical",
      src: "Typical Merged.mp3",
      icon: "Squidward Typical.png",
    },
    {
      id: "cheer",
      emoji: "🗑️",
      label: "Stupid",
      src: "Vader - Clumsy & Stupid.mp3",
      icon: "Vader.png",
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
      icon: "Patrick Trombone.png",
    },
    {
      id: "poo",
      emoji: "💩",
      label: "Poo",
      src: "Big Ol' Dump.mp3",
      icon: "Patrick Poo.png",
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
    },
  ];

  function soundById(id) {
    for (let i = 0; i < SOUNDS.length; i++) {
      if (SOUNDS[i].id === id) return SOUNDS[i];
    }
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

  // 17 packs × 17 named slots (names only for empty slots)
  const PACK_SOUNDS = {
    laughs: [
      soundById("laugh"),
      fx("jstar-laugh", "😂", "JStar", "JStar Laughing.mp3", "JStar Laughing.png"),
      fx("sponge-laugh", "🧽", "Sponge", "Sponge Laugh.m4a", "Sponge Laugh.jpg"),
      fx("hyena-laugh", "😆", "Hyena", "Hyena Laugh.mp3", "Hyena Laugh.jpg"),
      fx("emperor", "⚡", "Emperor", "Emperor.mp3", "Emperor.jpg"),
      ph("la-6", "👥", "Crowd Laugh"),
      ph("la-7", "😮‍💨", "Wheeze"),
      ph("la-8", "🤣", "LOL"),
      ph("la-9", "😆", "Cackle"),
      ph("la-10", "🤡", "Clown Laugh"),
      ph("la-11", "📺", "Sitcom Laugh"),
      ph("la-12", "🧒", "Kid Laugh"),
      ph("la-13", "👴", "Old Laugh"),
      ph("la-14", "🎭", "Fake Laugh"),
      ph("la-15", "💨", "Breath Laugh"),
      ph("la-16", "🎤", "Audience Laugh"),
      ph("la-17", "🤪", "Manic Laugh"),
    ],
    memes: [
      soundById("sus"),
      soundById("fuck"),
      ph("me-1", "😐", "Bruh"),
      ph("me-2", "💀", "Oof"),
      ph("me-3", "💥", "Vine Boom"),
      ph("me-4", "😢", "Emotional"),
      ph("me-5", "🥶", "Sheesh"),
      ph("me-6", "💻", "Windows XP"),
      ph("me-9", "🗿", "Stone Face"),
      ph("me-10", "📢", "Announcement"),
      ph("me-11", "🧃", "Juice"),
      ph("me-12", "🫡", "Respect"),
      ph("me-13", "😵", "Brain Rot"),
      ph("me-14", "📱", "Notification"),
      ph("me-15", "🦴", "Bone Crack"),
      ph("me-16", "🎬", "Cut"),
      soundById("imalive"),
    ],
    reactions: [
      soundById("applause"),
      soundById("boo"),
      ph("re-3", "😮", "Wow"),
      ph("re-4", "😲", "Gasp"),
      ph("re-5", "🥹", "Aww"),
      ph("re-6", "😰", "Oh No"),
      ph("re-7", "🙌", "Yes"),
      ph("re-8", "🙅", "No"),
      ph("re-9", "🙄", "Eye Roll"),
      ph("re-10", "🤔", "Hmm"),
      ph("re-11", "😴", "Yawn"),
      ph("re-12", "😬", "Awkward"),
      ph("re-13", "🥳", "Celebrate"),
      ph("re-14", "😤", "Frustrated"),
      ph("re-15", "🫣", "Peek"),
      ph("re-16", "🫡", "Salute"),
      ph("re-17", "💔", "Heartbreak"),
    ],
    funny: [
      soundById("poo"),
      soundById("iturnnow"),
      ph("bi-3", "💰", "Cash"),
      ph("bi-4", "🤡", "Pranks"),
      ph("bi-5", "❌", "Fail"),
      ph("bi-6", "🏆", "Victory"),
      ph("bi-7", "🥁", "Ba Dum Tss"),
      ph("bi-8", "💨", "Whoosh"),
      ph("bi-9", "🎺", "Sad Trombone"),
      ph("bi-10", "🎬", "Action"),
      ph("bi-11", "🪄", "Magic"),
      ph("bi-12", "🪞", "Reveal"),
      ph("bi-13", "⏱️", "Tick Tock"),
      ph("bi-14", "🛎️", "Ding"),
      ph("bi-15", "📉", "Downer"),
      ph("bi-16", "📈", "Stinger"),
      ph("bi-17", "🎞️", "Transition"),
    ],
    stings: [
      soundById("error"),
      ph("st-2", "🥁", "Rimshot"),
      ph("st-3", "🎺", "Sad Trombone"),
      ph("st-4", "🎻", "Suspense"),
      ph("st-5", "🎹", "Piano Hit"),
      ph("st-6", "🔔", "Chime"),
      ph("st-7", "📻", "Radio Sting"),
      ph("st-8", "🎬", "Cue In"),
      ph("st-9", "📉", "Downer"),
      ph("st-10", "📈", "Uplift"),
      ph("st-11", "⚡", "Shock"),
      ph("st-12", "🪞", "Reveal"),
      ph("st-13", "🕰️", "Time Pass"),
      ph("st-14", "🎭", "Drama"),
      ph("st-15", "💨", "Whoosh Hit"),
      ph("st-16", "🛎️", "Ding"),
      ph("st-17", "📼", "Outro"),
    ],
    scifi: [
      ph("sf-1", "⚡", "I'm Alive!"),
      ph("sf-2", "🔫", "Laser"),
      ph("sf-3", "🌌", "Warp"),
      ph("sf-4", "🤖", "Robot"),
      ph("sf-5", "👽", "Alien"),
      ph("sf-6", "✨", "Phaser"),
      ph("sf-7", "📟", "Beep Boop"),
      ph("sf-8", "🚀", "Hyperspace"),
      ph("sf-9", "🛸", "UFO"),
      ph("sf-10", "🛰️", "Satellite"),
      ph("sf-11", "🔮", "Scanner"),
      ph("sf-12", "⚙️", "Mech"),
      ph("sf-13", "💫", "Teleport"),
      ph("sf-14", "🛡️", "Shield"),
      ph("sf-15", "💣", "Plasma"),
      ph("sf-16", "📡", "Signal"),
      ph("sf-17", "🧬", "Clone"),
    ],
    animals: [
      ph("an-1", "🐶", "Bark"),
      ph("an-2", "🐱", "Meow"),
      ph("an-3", "🐔", "Chicken"),
      ph("an-4", "🐮", "Moo"),
      ph("an-5", "🐓", "Rooster"),
      ph("an-6", "🦆", "Quack"),
      ph("an-7", "🐺", "Howl"),
      ph("an-8", "🦗", "Cricket"),
      ph("an-9", "🐴", "Neigh"),
      ph("an-10", "🐷", "Oink"),
      ph("an-11", "🐑", "Baa"),
      ph("an-12", "🦁", "Roar"),
      ph("an-13", "🐘", "Trumpet"),
      ph("an-14", "🐸", "Ribbit"),
      ph("an-15", "🐝", "Buzz"),
      ph("an-16", "🦉", "Hoot"),
      ph("an-17", "🐒", "Chatter"),
    ],
    party: [
      soundById("airhorn"),
      ph("pa-1", "👏", "Applause"),
      ph("pa-3", "💰", "Cash"),
      ph("pa-4", "🍾", "Pop"),
      ph("pa-5", "🎊", "Confetti"),
      ph("pa-6", "🥳", "Cheer"),
      ph("pa-7", "😗", "Whistle"),
      ph("pa-8", "3️⃣", "Countdown"),
      ph("pa-9", "🎂", "Birthday"),
      ph("pa-10", "🎈", "Balloon"),
      ph("pa-11", "🎆", "Firework"),
      ph("pa-12", "🪩", "Disco"),
      ph("pa-13", "🎷", "Jam"),
      ph("pa-14", "🥂", "Toast"),
      ph("pa-15", "🕺", "Dance"),
      ph("pa-16", "🎁", "Surprise"),
      ph("pa-17", "📢", "Hype"),
    ],
    horror: [
      ph("ho-1", "⭐", "Scream"),
      ph("ho-2", "🚪", "Creak"),
      ph("ho-3", "⛈️", "Thunder"),
      ph("ho-4", "👻", "Ghost"),
      ph("ho-5", "😱", "Jumpscare"),
      ph("ho-6", "❤️", "Heartbeat"),
      ph("ho-7", "🐺", "Howl"),
      ph("ho-8", "🗣️", "Whisper"),
      ph("ho-9", "⛓️", "Chains"),
      ph("ho-10", "🩸", "Drip"),
      ph("ho-11", "🪦", "Grave"),
      ph("ho-12", "🕷️", "Crawl"),
      ph("ho-13", "🔦", "Flicker"),
      ph("ho-14", "🪟", "Rattle"),
      ph("ho-15", "🧛", "Hiss"),
      ph("ho-16", "🦇", "Flutter"),
      ph("ho-17", "🌑", "Umbra"),
    ],
    games: [
      ph("ga-1", "🚨", "Emergency"),
      ph("ga-2", "👁️", "Sus"),
      ph("ga-3", "✅", "Typical"),
      ph("ga-4", "⬆️", "Level Up"),
      ph("ga-5", "☠️", "Game Over"),
      ph("ga-6", "🪙", "Coin"),
      ph("ga-7", "🍄", "Power Up"),
      ph("ga-8", "🥊", "Hit"),
      ph("ga-9", "🏁", "Start"),
      ph("ga-10", "💎", "Loot"),
      ph("ga-11", "🛡️", "Block"),
      ph("ga-12", "🏹", "Shot"),
      ph("ga-13", "🧩", "Puzzle"),
      ph("ga-14", "🧨", "Explosion"),
      ph("ga-15", "🕹️", "Select"),
      ph("ga-16", "🥇", "Quest Done"),
      ph("ga-17", "👾", "Boss"),
    ],
    nature: [
      ph("na-1", "🌧️", "Rain"),
      ph("na-2", "💨", "Wind"),
      ph("na-3", "🌊", "Waves"),
      ph("na-4", "🔥", "Campfire"),
      ph("na-5", "🐦", "Birdsong"),
      ph("na-6", "💧", "Creek"),
      ph("na-7", "🍃", "Leaves"),
      ph("na-8", "⚡", "Lightning"),
      ph("na-9", "🌋", "Rumble"),
      ph("na-10", "🧊", "Ice Crack"),
      ph("na-11", "🌵", "Desert"),
      ph("na-12", "🌲", "Forest"),
      ph("na-13", "🪨", "Rockslide"),
      ph("na-14", "🦋", "Flutter"),
      ph("na-15", "🌙", "Night"),
      ph("na-16", "☀️", "Dawn"),
      ph("na-17", "🌈", "After Rain"),
    ],
    cartoons: [
      ph("ca-1", "🏃", "Zip"),
      ph("ca-2", "💫", "Bonk"),
      ph("ca-3", "🌀", "Spin Out"),
      ph("ca-4", "🫠", "Squish"),
      ph("ca-5", "🛎️", "Boing"),
      ph("ca-6", "💨", "Zoom"),
      ph("ca-7", "🧨", "Kaboom"),
      ph("ca-8", "🪄", "Poof"),
      ph("ca-9", "🫠", "Slide"),
      ph("ca-10", "🔔", "Twang"),
      ph("ca-11", "😛", "Raspberry"),
      ph("ca-12", "🪜", "Fall Down"),
      ph("ca-13", "🎈", "Deflate"),
      ph("ca-14", "🧲", "Stretch"),
      ph("ca-15", "🧃", "Gulp"),
      ph("ca-16", "👟", "Squeak Step"),
      ph("ca-17", "🎭", "Take"),
    ],
    alerts: [
      ph("al-1", "🔔", "Ping"),
      ph("al-2", "⏰", "Alarm"),
      ph("al-3", "📢", "Broadcast"),
      ph("al-4", "🚨", "Siren"),
      ph("al-5", "✉️", "Message"),
      ph("al-6", "📞", "Ring"),
      ph("al-7", "⚠️", "Warning"),
      ph("al-8", "✅", "Success"),
      ph("al-9", "❌", "Error"),
      ph("al-10", "🔋", "Low Battery"),
      ph("al-11", "📶", "Connected"),
      ph("al-12", "🔒", "Locked"),
      ph("al-13", "🔓", "Unlocked"),
      ph("al-14", "📥", "Download Done"),
      ph("al-15", "🗓️", "Reminder"),
      ph("al-16", "🧭", "Chime"),
      ph("al-17", "🛰️", "Beacon"),
    ],
    vehicles: [
      ph("ve-1", "🚗", "Engine"),
      ph("ve-2", "🚕", "Horn"),
      ph("ve-3", "🛞", "Skid"),
      ph("ve-4", "🚲", "Bike Bell"),
      ph("ve-5", "🚂", "Train"),
      ph("ve-6", "✈️", "Jet"),
      ph("ve-7", "🚁", "Chopper"),
      ph("ve-8", "🚤", "Boat"),
      ph("ve-9", "🚌", "Bus Door"),
      ph("ve-10", "🚓", "Siren"),
      ph("ve-11", "🛵", "Scooter"),
      ph("ve-12", "🚛", "Truck"),
      ph("ve-13", "🚀", "Launch"),
      ph("ve-14", "🛑", "Brake"),
      ph("ve-15", "⛽", "Fuel Cap"),
      ph("ve-16", "🛠️", "Garage"),
      ph("ve-17", "🏁", "Rev"),
    ],
    fantasy: [
      ph("fa-1", "🪄", "Spell"),
      ph("fa-2", "🐉", "Dragon"),
      ph("fa-3", "⚔️", "Sword"),
      ph("fa-4", "🛡️", "Armor"),
      ph("fa-5", "🏰", "Castle"),
      ph("fa-6", "🧝", "Elf"),
      ph("fa-7", "🧙", "Wizard"),
      ph("fa-8", "💎", "Gem"),
      ph("fa-9", "🏹", "Arrow"),
      ph("fa-10", "🔥", "Fireball"),
      ph("fa-11", "❄️", "Frost"),
      ph("fa-12", "🌪️", "Tornado"),
      ph("fa-13", "📜", "Scroll"),
      ph("fa-14", "🧚", "Fairy"),
      ph("fa-15", "🕳️", "Portal"),
      ph("fa-16", "🗡️", "Clash"),
      ph("fa-17", "👑", "Quest"),
    ],
    retro: [
      ph("rt-1", "🕹️", "8-Bit Jump"),
      ph("rt-2", "👾", "Pixel Hit"),
      ph("rt-3", "📼", "VHS"),
      ph("rt-4", "📺", "Static"),
      ph("rt-5", "💾", "Dial-Up"),
      ph("rt-6", "📟", "Pager"),
      ph("rt-7", "💿", "CD Skip"),
      ph("rt-8", "📷", "Flash"),
      ph("rt-9", "☎️", "Rotary"),
      ph("rt-10", "🖨️", "Printer"),
      ph("rt-11", "🎮", "Insert Coin"),
      ph("rt-12", "🧱", "Block Break"),
      ph("rt-13", "🟩", "Blip"),
      ph("rt-14", "🟥", "Game Select"),
      ph("rt-15", "🟨", "Power On"),
      ph("rt-16", "🟪", "Glitch"),
      ph("rt-17", "🟫", "Continue?"),
    ],
  };

  // Home sounds not yet assigned to a themed pack — used by Mix
  const MIX_LEFTOVER_IDS = [
    "drumroll",
    "scratch",
    "cash",
    "success",
    "cheer",
    "emergency",
    "scream",
  ];

  // Extra royalty-free clips that fill out Mix when leftovers are under 17
  const EXTRA_SFX = [
    { id: "jstar-laugh", emoji: "😂", label: "JStar", src: "JStar Laughing.mp3", icon: "JStar Laughing.png" },
    { id: "sponge-laugh", emoji: "🧽", label: "Sponge", src: "Sponge Laugh.m4a", icon: "Sponge Laugh.jpg" },
    { id: "hyena-laugh", emoji: "😆", label: "Hyena", src: "Hyena Laugh.mp3", icon: "Hyena Laugh.jpg" },
    { id: "emperor", emoji: "⚡", label: "Emperor", src: "Emperor.mp3", icon: "Emperor.jpg" },
    { id: "sfx-alien", emoji: "👽", label: "Alien", src: "sfx/alien.mp3" },
    { id: "sfx-bark", emoji: "🐶", label: "Bark", src: "sfx/bark.mp3" },
    { id: "sfx-beep", emoji: "📟", label: "Beep Boop", src: "sfx/beep-boop.mp3" },
    { id: "sfx-cheer", emoji: "🥳", label: "Cheer", src: "sfx/cheer.mp3" },
    { id: "sfx-chicken", emoji: "🐔", label: "Chicken", src: "sfx/chicken.mp3" },
    { id: "sfx-chuckle", emoji: "😄", label: "Chuckle", src: "sfx/chuckle.mp3" },
    { id: "sfx-coin", emoji: "🪙", label: "Coin", src: "sfx/coin.mp3" },
    { id: "sfx-creak", emoji: "🚪", label: "Creak", src: "sfx/creak.mp3" },
    { id: "sfx-cricket", emoji: "🦗", label: "Cricket", src: "sfx/cricket.mp3" },
    { id: "sfx-crowd", emoji: "👥", label: "Crowd Laugh", src: "sfx/crowd-laugh.mp3" },
    { id: "sfx-fail", emoji: "❌", label: "Fail", src: "sfx/fail.mp3" },
    { id: "sfx-gameover", emoji: "☠️", label: "Game Over", src: "sfx/game-over.mp3" },
    { id: "sfx-ghost", emoji: "👻", label: "Ghost", src: "sfx/ghost.mp3" },
    { id: "sfx-giggle", emoji: "🤭", label: "Giggle", src: "sfx/giggle.mp3" },
    { id: "sfx-heartbeat", emoji: "❤️", label: "Heartbeat", src: "sfx/heartbeat.mp3" },
    { id: "sfx-hit", emoji: "🥊", label: "Hit", src: "sfx/hit.mp3" },
    { id: "sfx-howl", emoji: "🐺", label: "Howl", src: "sfx/howl.mp3" },
    { id: "sfx-hyperspace", emoji: "🚀", label: "Hyperspace", src: "sfx/hyperspace.mp3" },
    { id: "sfx-jumpscare", emoji: "😱", label: "Jumpscare", src: "sfx/jumpscare.mp3" },
    { id: "sfx-laser", emoji: "🔫", label: "Laser", src: "sfx/laser.mp3" },
    { id: "sfx-levelup", emoji: "⬆️", label: "Level Up", src: "sfx/level-up.mp3" },
    { id: "sfx-meow", emoji: "🐱", label: "Meow", src: "sfx/meow.mp3" },
    { id: "sfx-moo", emoji: "🐮", label: "Moo", src: "sfx/moo.mp3" },
    { id: "sfx-horn", emoji: "🎊", label: "Party Horn", src: "sfx/party-horn.mp3" },
    { id: "sfx-phaser", emoji: "✨", label: "Phaser", src: "sfx/phaser.mp3" },
    { id: "sfx-pop", emoji: "🍾", label: "Pop", src: "sfx/pop.mp3" },
    { id: "sfx-powerup", emoji: "🍄", label: "Power Up", src: "sfx/power-up.mp3" },
    { id: "sfx-quack", emoji: "🦆", label: "Quack", src: "sfx/quack.mp3" },
    { id: "sfx-robot", emoji: "🤖", label: "Robot", src: "sfx/robot.mp3" },
    { id: "sfx-rooster", emoji: "🐓", label: "Rooster", src: "sfx/rooster.mp3" },
    { id: "sfx-trombone", emoji: "🎺", label: "Sad Trombone", src: "sfx/sad-trombone.mp3" },
    { id: "sfx-thunder", emoji: "⛈️", label: "Thunder", src: "sfx/thunder.mp3" },
    { id: "sfx-victory", emoji: "🏆", label: "Victory", src: "sfx/victory.mp3" },
    { id: "sfx-warp", emoji: "🌌", label: "Warp", src: "sfx/warp.mp3" },
    { id: "sfx-whistle", emoji: "😗", label: "Whistle", src: "sfx/whistle.mp3" },
    { id: "sfx-whoosh", emoji: "💨", label: "Whoosh", src: "sfx/whoosh.mp3" },
  ];

  const PACK_SIZE = 17;
  const MIX_SESSION_KEY = "noisegoblin-session-mix";
  const HOME_SESSION_KEY = "noisegoblin-home-mix";
  const PICKER_SEEN_KEY = "noisegoblin-picker-seen";
  const PLAY_COUNTS_KEY = "noisegoblin-play-counts";
  const TRENDING_MIN_PLAYS = 50;

  function cloneSound(sound) {
    return {
      id: sound.id,
      emoji: sound.emoji,
      label: sound.label,
      src: sound.src,
      icon: sound.icon,
      placeholder: sound.placeholder,
    };
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

  function mixPool() {
    const pool = [];
    const seen = {};

    function add(sound) {
      if (!sound || !sound.src || seen[sound.id]) return;
      seen[sound.id] = true;
      pool.push(cloneSound(sound));
    }

    MIX_LEFTOVER_IDS.forEach(function (id) {
      add(soundById(id));
    });
    EXTRA_SFX.forEach(add);
    return pool;
  }

  function buildSessionMix(forceNew) {
    if (!forceNew) {
      try {
        const raw = sessionStorage.getItem(MIX_SESSION_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          if (Array.isArray(saved) && saved.length === PACK_SIZE) {
            return withCenteredSeventeenth(saved);
          }
        }
      } catch (err) {
        /* ignore */
      }
    }

    const picked = shuffleList(mixPool()).slice(0, PACK_SIZE);
    while (picked.length < PACK_SIZE) {
      picked.push(cloneSound(SOUNDS[picked.length % SOUNDS.length]));
    }

    try {
      sessionStorage.setItem(MIX_SESSION_KEY, JSON.stringify(picked));
    } catch (err) {
      /* private mode / quota */
    }

    return withCenteredSeventeenth(picked);
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

    SOUNDS.forEach(add);
    EXTRA_SFX.forEach(add);
    return pool;
  }

  function loadHomeMix() {
    try {
      const raw = sessionStorage.getItem(HOME_SESSION_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved) || !saved.length || saved.length > PACK_SIZE) return null;
      return withCenteredSeventeenth(saved.map(cloneSound));
    } catch (err) {
      return null;
    }
  }

  function saveHomeMix(list) {
    const cleaned = list.slice(0, PACK_SIZE).map(cloneSound);
    try {
      sessionStorage.setItem(HOME_SESSION_KEY, JSON.stringify(cleaned));
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

  let customHomeSounds = loadHomeMix();

  function getHomeSounds() {
    if (customHomeSounds && customHomeSounds.length) {
      return customHomeSounds;
    }
    return withCenteredSeventeenth(SOUNDS);
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
    const ranked = hot.concat(filler).slice(0, PACK_SIZE);

    while (ranked.length < PACK_SIZE) {
      ranked.push(cloneSound(SOUNDS[ranked.length % SOUNDS.length]));
    }

    return withCenteredSeventeenth(ranked.slice(0, PACK_SIZE));
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
  const stopBtn = document.getElementById("stopBtn");
  const customizeBtn = document.getElementById("customizeBtn");
  const mixPicker = document.getElementById("mixPicker");
  const mixPickerBackdrop = document.getElementById("mixPickerBackdrop");
  const mixPickerClose = document.getElementById("mixPickerClose");
  const mixPickerGrid = document.getElementById("mixPickerGrid");
  const mixPickerCount = document.getElementById("mixPickerCount");
  const mixPickerClear = document.getElementById("mixPickerClear");
  const mixPickerDefaults = document.getElementById("mixPickerDefaults");
  const mixPickerSurprise = document.getElementById("mixPickerSurprise");
  const mixPickerSave = document.getElementById("mixPickerSave");
  const mixPickerCats = document.getElementById("mixPickerCats");
  const packBookmark = document.getElementById("packBookmark");
  const packTab = document.getElementById("packTab");
  const packsHeaderBtn = document.getElementById("packsHeaderBtn");
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
    if (sound.placeholder || !sound.src) {
      showToast(sound.label + " — coming soon");
      return;
    }
    playSound(sound);

    const plays = recordPlay(sound.id);
    sound.plays = plays;

    // Counts are tracked everywhere; badges only show on Trending after the 50× gate
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
    if (!packId || packId === "all") {
      return getHomeSounds();
    }
    if (packId === "mix") {
      return getSessionMix();
    }
    if (packId === "trending") {
      return getTrendingSounds();
    }
    if (!PACK_SOUNDS[packId]) {
      return getHomeSounds();
    }
    return withCenteredSeventeenth(PACK_SOUNDS[packId].filter(Boolean).slice(0, PACK_SIZE));
  }

  function buildKeypad(packId) {
    const list = soundsForPack(packId || activePack);
    keypadEl.innerHTML = "";

    list.forEach(function (sound, index) {
      const isCenter = list.length === PACK_SIZE && index === PACK_SIZE - 1;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "sound-btn" +
        (isCenter ? " sound-btn--center" : "") +
        (sound.placeholder ? " sound-btn--placeholder" : "");
      btn.setAttribute(
        "aria-label",
        sound.placeholder ? sound.label + " (coming soon)" : "Play " + sound.label
      );
      btn.dataset.id = sound.id;

      const iconHtml = sound.icon
        ? '<img class="sound-btn-emoji-img" src="' +
          sound.icon.replace(/"/g, "") +
          '" alt="">'
        : sound.emoji;

      const countHtml =
        sound.showPlays && (sound.plays || 0) > TRENDING_MIN_PLAYS
          ? '<span class="sound-btn-count">' + (sound.plays || 0) + "</span>"
          : "";

      btn.innerHTML =
        '<span class="sound-btn-emoji" aria-hidden="true">' +
        iconHtml +
        "</span>" +
        '<span class="sound-btn-label">' +
        sound.label +
        "</span>" +
        countHtml;

      btn.addEventListener("click", function () {
        onSoundClick(sound, btn);
      });

      keypadEl.appendChild(btn);
    });
  }

  // ---------------------------------------------------------------------------
  // Share menu
  // ---------------------------------------------------------------------------
  const SHARE_TITLE = "Check out Noisegoblin";
  const SHARE_MESSAGE =
    "Check out Noisegoblin — a free online soundboard remote!";

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

  packTray.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  packTray.querySelectorAll(".pack-chip:not([disabled])").forEach(function (chip) {
    chip.addEventListener("click", function () {
      packTray.querySelectorAll(".pack-chip").forEach(function (other) {
        other.classList.toggle("is-active", other === chip);
      });

      activePack = chip.dataset.pack || "all";
      buildKeypad(activePack);
      updateUtilityActionBtn();

      const label = activePack === "all" ? "All" : chip.textContent.trim();
      const emoji = chip.dataset.emoji || "📑";
      animateDisplay(emoji, label);

      const count = soundsForPack(activePack).length;
      const coming = soundsForPack(activePack).filter(function (s) {
        return s.placeholder;
      }).length;
      if (activePack === "mix") {
        showToast("Mix — tap Randomize for a new set");
      } else if (activePack === "trending") {
        showToast("Trending — counters unlock after 50 plays");
      } else if (activePack === "all" && customHomeSounds) {
        showToast("All — your custom home remote (" + count + ")");
      } else if (coming > 0) {
        showToast(label + " — " + count + " sounds (" + coming + " soon)");
      } else {
        showToast(label + " — " + count + " sounds");
      }
    });
  });

  document.addEventListener("click", function (e) {
    if (packBookmark.classList.contains("is-open") && !isPackControlTarget(e.target)) {
      closePackTray();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && packBookmark.classList.contains("is-open")) {
      closePackTray();
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
    if (forceIntroFromUrl()) return true;
    try {
      const last = Number(localStorage.getItem(INTRO_STORAGE_KEY));
      if (!Number.isFinite(last) || last <= 0) return true;
      return Date.now() - last >= INTRO_COOLDOWN_MS;
    } catch (err) {
      return true;
    }
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
    if (introPlayed || isMuted) return Promise.resolve(false);
    if (!shouldPlayIntro()) return Promise.resolve(false);

    if (!introAudio) {
      introAudio = new Audio(INTRO_SRC);
      introAudio.preload = "auto";
      introAudio.setAttribute("playsinline", "");
      introAudio.load();
    }

    introAudio.volume = getVolume();

    return introAudio
      .play()
      .then(function () {
        introPlayed = true;
        currentAudio = introAudio;
        markIntroPlayed();
        introAudio.addEventListener("ended", function () {
          if (currentAudio === introAudio) {
            currentAudio = null;
          }
        });
        return true;
      })
      .catch(function () {
        return false;
      });
  }

  function initIntroSound() {
    if (!shouldPlayIntro()) return;

    introAudio = new Audio(INTRO_SRC);
    introAudio.preload = "auto";
    introAudio.setAttribute("playsinline", "");
    introAudio.load();

    function stopWaiting() {
      document.removeEventListener("pointerdown", onUnlock, true);
      document.removeEventListener("touchstart", onUnlock, true);
      document.removeEventListener("click", onUnlock, true);
      document.removeEventListener("keydown", onUnlock, true);
      window.removeEventListener("load", tryIntro);
      window.removeEventListener("pageshow", tryIntro);
      document.removeEventListener("visibilitychange", onVisible);
    }

    function tryIntro() {
      return playIntroSound().then(function (played) {
        if (played) stopWaiting();
        return played;
      });
    }

    function onUnlock() {
      tryIntro();
    }

    function onVisible() {
      if (document.visibilityState === "visible") {
        tryIntro();
      }
    }

    tryIntro();
    requestAnimationFrame(function () {
      tryIntro();
    });
    window.addEventListener("load", tryIntro);
    window.addEventListener("pageshow", tryIntro);
    document.addEventListener("visibilitychange", onVisible);
    document.addEventListener("pointerdown", onUnlock, true);
    document.addEventListener("touchstart", onUnlock, true);
    document.addEventListener("click", onUnlock, true);
    document.addEventListener("keydown", onUnlock, true);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------
  buildPresetSwatches();
  buildDevicePresets();
  buildKeypad();
  buildShareMenu();
  initIntroSound();

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

  // ---------------------------------------------------------------------------
  // Customize home remote picker
  // ---------------------------------------------------------------------------
  let pickerSelectedIds = [];
  let pickerCategory = "all";

  function getPackChipMeta() {
    const meta = {};
    packTray.querySelectorAll(".pack-chip[data-pack]").forEach(function (chip) {
      const id = chip.dataset.pack;
      if (!id || id === "all" || id === "mix" || id === "trending") return;
      meta[id] = {
        id: id,
        label: (chip.querySelector(".pack-chip-label") || {}).textContent || id,
        emoji: chip.dataset.emoji || "🎛️",
      };
    });
    return meta;
  }

  function buildPickerPackIndex() {
    const bySound = {};
    const byPack = {};
    const labelToPacks = {};
    const packMeta = getPackChipMeta();

    Object.keys(PACK_SOUNDS).forEach(function (packId) {
      byPack[packId] = {};
      (PACK_SOUNDS[packId] || []).forEach(function (sound) {
        if (!sound) return;
        const labelKey = String(sound.label || "")
          .trim()
          .toLowerCase();
        if (labelKey) {
          if (!labelToPacks[labelKey]) labelToPacks[labelKey] = [];
          if (labelToPacks[labelKey].indexOf(packId) === -1) {
            labelToPacks[labelKey].push(packId);
          }
        }
        if (!sound.src) return;
        byPack[packId][sound.id] = true;
        if (!bySound[sound.id]) bySound[sound.id] = {};
        bySound[sound.id][packId] = true;
      });
    });

    allPlayablePool().forEach(function (sound) {
      if (bySound[sound.id]) return;
      const labelKey = String(sound.label || "")
        .trim()
        .toLowerCase();
      const packs = labelToPacks[labelKey] || [];
      if (!packs.length) {
        bySound[sound.id] = { more: true };
        if (!byPack.more) byPack.more = {};
        byPack.more[sound.id] = true;
        return;
      }
      bySound[sound.id] = {};
      packs.forEach(function (packId) {
        bySound[sound.id][packId] = true;
        if (!byPack[packId]) byPack[packId] = {};
        byPack[packId][sound.id] = true;
      });
    });

    return { bySound: bySound, byPack: byPack, packMeta: packMeta };
  }

  function getPickerCategories(index) {
    const cats = [
      { id: "all", label: "All", emoji: "🎛️" },
      { id: "selected", label: "Selected", emoji: "✅" },
    ];
    const order = Object.keys(index.packMeta);
    order.forEach(function (packId) {
      const ids = index.byPack[packId];
      if (!ids || !Object.keys(ids).length) return;
      cats.push(index.packMeta[packId]);
    });
    if (index.byPack.more && Object.keys(index.byPack.more).length) {
      cats.push({ id: "more", label: "More", emoji: "✨" });
    }
    return cats;
  }

  function filterPoolForPicker(pool, index) {
    if (pickerCategory === "all") return pool;
    if (pickerCategory === "selected") {
      return pool.filter(function (sound) {
        return pickerSelectedIds.indexOf(sound.id) !== -1;
      });
    }
    return pool.filter(function (sound) {
      const packs = index.bySound[sound.id];
      return packs && packs[pickerCategory];
    });
  }

  function buildPickerCats(index) {
    const cats = getPickerCategories(index);
    const valid = {};
    cats.forEach(function (cat) {
      valid[cat.id] = true;
    });
    if (!valid[pickerCategory]) pickerCategory = "all";

    mixPickerCats.innerHTML = "";
    cats.forEach(function (cat) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className =
        "mix-picker-cat" + (cat.id === pickerCategory ? " is-active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", cat.id === pickerCategory ? "true" : "false");
      btn.dataset.cat = cat.id;
      btn.innerHTML =
        '<span class="mix-picker-cat-emoji" aria-hidden="true">' +
        cat.emoji +
        "</span>" +
        "<span>" +
        cat.label +
        "</span>";
      btn.addEventListener("click", function () {
        if (pickerCategory === cat.id) return;
        pickerCategory = cat.id;
        buildPickerCats(index);
        buildPickerGrid(index);
      });
      mixPickerCats.appendChild(btn);
    });
  }

  function setAllPackActive() {
    activePack = "all";
    packTray.querySelectorAll(".pack-chip").forEach(function (chip) {
      chip.classList.toggle("is-active", chip.dataset.pack === "all");
    });
    buildKeypad("all");
    updateUtilityActionBtn();
  }

  function updateUtilityActionBtn() {
    const icon = customizeBtn.querySelector(".utility-icon");
    const label = customizeBtn.querySelector(".utility-label");
    if (activePack === "mix") {
      if (icon) icon.textContent = "🎲";
      if (label) label.textContent = "Randomize";
      customizeBtn.setAttribute("aria-label", "Randomize Mix sounds");
      customizeBtn.setAttribute("aria-expanded", "false");
      customizeBtn.removeAttribute("aria-controls");
      if (mixPicker.classList.contains("is-open")) {
        closeMixPicker();
      }
    } else {
      if (icon) icon.textContent = "🎛️";
      if (label) label.textContent = "Customize";
      customizeBtn.setAttribute("aria-label", "Customize home remote");
      customizeBtn.setAttribute("aria-controls", "mixPicker");
    }
  }

  function updatePickerCount() {
    mixPickerCount.textContent = pickerSelectedIds.length + " / " + PACK_SIZE;
    mixPickerSave.disabled = pickerSelectedIds.length === 0;
  }

  function syncPickerSelectionUI() {
    mixPickerGrid.querySelectorAll(".mix-pick").forEach(function (btn) {
      const on = pickerSelectedIds.indexOf(btn.dataset.id) !== -1;
      btn.classList.toggle("is-selected", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    updatePickerCount();
  }

  function buildPickerGrid(index) {
    const packIndex = index || buildPickerPackIndex();
    const pool = filterPoolForPicker(allPlayablePool(), packIndex);
    mixPickerGrid.innerHTML = "";

    if (!pool.length) {
      const empty = document.createElement("p");
      empty.className = "mix-picker-empty";
      empty.textContent =
        pickerCategory === "selected"
          ? "No sounds selected yet"
          : "No sounds in this category yet";
      mixPickerGrid.appendChild(empty);
      syncPickerSelectionUI();
      return;
    }

    pool.forEach(function (sound) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "mix-pick";
      btn.dataset.id = sound.id;
      btn.setAttribute("aria-pressed", "false");

      const iconHtml = sound.icon
        ? '<img class="mix-pick-emoji-img" src="' +
          sound.icon.replace(/"/g, "") +
          '" alt="">'
        : sound.emoji;

      btn.innerHTML =
        '<span class="mix-pick-emoji" aria-hidden="true">' +
        iconHtml +
        "</span>" +
        '<span class="mix-pick-label">' +
        sound.label +
        "</span>";

      btn.addEventListener("click", function () {
        const idx = pickerSelectedIds.indexOf(sound.id);
        if (idx !== -1) {
          pickerSelectedIds.splice(idx, 1);
        } else if (pickerSelectedIds.length >= PACK_SIZE) {
          showToast("Max " + PACK_SIZE + " sounds");
          return;
        } else {
          pickerSelectedIds.push(sound.id);
        }
        syncPickerSelectionUI();
        if (pickerCategory === "selected") {
          buildPickerGrid(packIndex);
        }
      });

      mixPickerGrid.appendChild(btn);
    });

    syncPickerSelectionUI();
  }

  function openMixPicker() {
    const current = customHomeSounds || [];
    pickerSelectedIds = current.map(function (s) {
      return s.id;
    });
    pickerCategory = "all";
    const index = buildPickerPackIndex();
    buildPickerCats(index);
    buildPickerGrid(index);
    mixPicker.hidden = false;
    mixPickerBackdrop.hidden = false;
    requestAnimationFrame(function () {
      mixPicker.classList.add("is-open");
      mixPickerBackdrop.classList.add("is-open");
    });
    customizeBtn.setAttribute("aria-expanded", "true");
    try {
      sessionStorage.setItem(PICKER_SEEN_KEY, "1");
    } catch (err) {
      /* ignore */
    }
  }

  function closeMixPicker() {
    mixPicker.classList.remove("is-open");
    mixPickerBackdrop.classList.remove("is-open");
    customizeBtn.setAttribute("aria-expanded", "false");
    mixPicker.addEventListener(
      "transitionend",
      function onEnd() {
        mixPicker.hidden = true;
        mixPickerBackdrop.hidden = true;
        mixPicker.removeEventListener("transitionend", onEnd);
      },
      { once: true }
    );
  }

  function soundsFromSelectedIds(ids) {
    const pool = allPlayablePool();
    const byId = {};
    pool.forEach(function (s) {
      byId[s.id] = s;
    });
    return ids
      .map(function (id) {
        return byId[id];
      })
      .filter(Boolean);
  }

  customizeBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    if (activePack === "mix") {
      rerollSessionMix();
      buildKeypad("mix");
      animateDisplay("🎲", "Mix");
      showToast("Mix reshuffled");
      return;
    }
    if (mixPicker.classList.contains("is-open")) {
      closeMixPicker();
    } else {
      openMixPicker();
    }
  });

  mixPickerClose.addEventListener("click", closeMixPicker);
  mixPickerBackdrop.addEventListener("click", closeMixPicker);

  mixPickerClear.addEventListener("click", function () {
    pickerSelectedIds = [];
    if (pickerCategory === "selected") {
      buildPickerGrid();
    } else {
      syncPickerSelectionUI();
    }
  });

  mixPickerDefaults.addEventListener("click", function () {
    clearHomeMix();
    setAllPackActive();
    closeMixPicker();
    showToast("Home remote reset to All defaults");
    animateDisplay("🎛️", "All");
  });

  mixPickerSurprise.addEventListener("click", function () {
    const surprise = shuffleList(allPlayablePool()).slice(0, PACK_SIZE);
    saveHomeMix(surprise);
    setAllPackActive();
    closeMixPicker();
    showToast("Surprise remote ready for this session");
    animateDisplay("🎲", "Custom Mix");
  });

  mixPickerSave.addEventListener("click", function () {
    if (!pickerSelectedIds.length) return;
    const picked = soundsFromSelectedIds(pickerSelectedIds);
    if (!picked.length) return;
    saveHomeMix(picked);
    setAllPackActive();
    closeMixPicker();
    showToast("Saved " + picked.length + " sounds to home remote");
    animateDisplay("🎛️", "Custom");
  });

  mixPicker.addEventListener("click", function (e) {
    e.stopPropagation();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && mixPicker.classList.contains("is-open")) {
      closeMixPicker();
    }
  });

  try {
    if (!sessionStorage.getItem(PICKER_SEEN_KEY)) {
      setTimeout(openMixPicker, 900);
    }
  } catch (err) {
    setTimeout(openMixPicker, 900);
  }

  updateUtilityActionBtn();

  const copyrightPop = document.getElementById("copyrightPop");
  const copyrightPopClose = document.getElementById("copyrightPopClose");

  function hideCopyrightPop() {
    copyrightPop.classList.remove("is-open");
    copyrightPop.addEventListener(
      "transitionend",
      function onEnd() {
        copyrightPop.hidden = true;
        copyrightPop.removeEventListener("transitionend", onEnd);
      },
      { once: true }
    );
  }

  copyrightPopClose.addEventListener("click", hideCopyrightPop);

  copyrightPop.hidden = false;
  setTimeout(function () {
    copyrightPop.classList.add("is-open");
  }, 500);
})();
