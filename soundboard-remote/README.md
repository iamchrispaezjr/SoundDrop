# SFX Remote — Soundboard

A single-page web soundboard styled like a TV remote / calculator hybrid. Dark, tactile, and fully responsive.

## Quick start

Open `index.html` in a browser, or serve locally:

```bash
cd ~/Projects/soundboard-remote
python3 -m http.server 8080
```

Then visit [http://localhost:8080](http://localhost:8080).

## Features

- **10 sound effects** with emoji buttons and LCD display animation
- **Hamburger menu** (top-right) with links to About, Studio, Store, Members, Donate, and Contact
- **Volume slider** + mute toggle
- **Stop All** button to halt playback
- Monophonic playback (new sound stops the previous one)
- Pure HTML, CSS, and vanilla JavaScript — no build step

## Sound sources

Sounds are loaded from [Mixkit](https://mixkit.co/free-sound-effects/) (royalty-free). Replace URLs in `js/app.js` → `SOUNDS` array to swap in your own `.mp3` files.

## File structure

```
soundboard-remote/
├── index.html
├── css/styles.css
├── js/app.js
└── README.md
```
