# 🎵 Voxify — Web Music Player

A Spotify-inspired web music player built with vanilla HTML, CSS, and JavaScript. Stream your local music library directly in the browser with a clean, modern UI.

---

## 📸 Preview

> A sleek dark-themed player with playlist cards, a sidebar song library, and a full-featured playbar — all running locally with no backend required.

---

## 🚀 Features

- 🎵 **Play local MP3 files** from organized folder-based playlists
- 📂 **Auto-discovers playlists** — just drop a folder under `/songs/` and it appears as a card
- ❤️ **Like songs** — heart turns red, liked songs persist across sessions via `localStorage`
- 💜 **Liked Songs playlist** — dedicated card that loads all your saved tracks
- ⏭️ **Previous / Next / Auto-advance** — seamless track navigation
- 🔊 **Volume control** with mute toggle
- ⏩ **Seekbar** — click anywhere to jump to that position
- 🎨 **Album art** pulled automatically from each playlist's `cover.jpg`
- 📱 **Responsive** — hamburger menu on mobile, sidebar hides on small screens
- 🧹 **Smart song name cleaning** — strips download artifacts like `Ytmp3.gg_YouTube_` prefixes

---

## 📁 Folder Structure

```
project/
├── index.html
├── favicon.ico
├── img/
│   ├── logo.png
│   ├── home.svg
│   ├── search.svg
│   ├── playlist.svg
│   ├── music.svg
│   ├── play.svg
│   ├── pause.svg
│   ├── prevsong.svg
│   ├── nextsong.svg
│   ├── volume.svg
│   ├── mute.svg
│   └── hamburger.svg
├── css/
│   ├── style.css
│   └── utility.css
├── js/
│   └── script.js
└── songs/
    ├── Playlist_Name/
    │   ├── cover.jpg        ← playlist thumbnail
    │   ├── song1.mp3
    │   └── song2.mp3
    └── Another_Playlist/
        ├── cover.jpg
        └── song1.mp3
```

---

## 🛠️ Setup & Running Locally

This project requires a **local server** because it fetches song lists via directory listing. Opening `index.html` directly in a browser (`file://`) will **not** work.

### Option 1 — VS Code Live Server (Recommended)

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Right-click `index.html` → **Open with Live Server**
3. Done — opens at `http://127.0.0.1:5500`

### Option 2 — Python HTTP Server

```bash
# Python 3
cd project/
python -m http.server 3000

# Then open http://localhost:3000
```

### Option 3 — Node.js

```bash
npx serve .
```

---

## 🎵 Adding Playlists

1. Create a new folder inside `/songs/` — use underscores instead of spaces:
   ```
   songs/
   └── Chill_Vibes/
       ├── cover.jpg     ← 300×300px recommended
       ├── track1.mp3
       └── track2.mp3
   ```
2. Refresh the page — the card appears automatically in the grid.

> **Tip:** Folder names use underscores (`_`) internally but display with spaces on the UI. 

---

## 💡 How It Works

| Feature | Implementation |
|---|---|
| Playlist discovery | `fetch('/songs/')` parses server's directory listing for folder links |
| Song list | `fetch('/songs/FolderName/')` parses directory listing for `.mp3` links |
| Liked songs | Stored as `folder/filename` keys in `localStorage` |
| Song name cleanup | Regex strips `Ytmp3.gg_YouTube_` prefixes and `_009_128k` quality suffixes |
| Seekbar | `timeupdate` event syncs fill width + circle position |
| Album art | Each folder's `cover.jpg` shown on cards and in the playbar |

---

## ⚠️ Known Limitations

- Requires a local server with **directory listing enabled** (VS Code Live Server and Python's `http.server` both support this by default)
- No shuffle or repeat mode (yet)
- No search functionality (yet)
- Audio format support depends on the browser — MP3 is universally supported

---

## 🧰 Tech Stack

- **HTML5** — semantic structure
- **CSS3** — Grid, Flexbox, CSS variables, responsive media queries
- **Vanilla JavaScript (ES6+)** — async/await, fetch API, localStorage
- **Google Fonts** — Roboto + Lato

---

## 📄 License

This project is for personal/educational use. Music files are not included — bring your own MP3s.