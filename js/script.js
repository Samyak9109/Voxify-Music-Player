// ─── State ───────────────────────────────────────────────────────────────────
let currentSong = new Audio();
let songs = [];
let currFolder = "";
let likedSongs = JSON.parse(localStorage.getItem("voxify-liked") || "[]");

// ─── Helpers ─────────────────────────────────────────────────────────────────
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function cleanSongName(raw) {
  return decodeURIComponent(raw)
    .replace(/\.mp3$/i, "")           // remove .mp3
    .replace(/Ytmp3\.gg_YouTube_/i, "") // remove "Ytmp3.gg_YouTube_"
    .replace(/_\d{3}_\d+k$/i, "")     // remove trailing _009_128k etc
    .replace(/[-_]/g, " ")            // underscores/dashes → spaces
    .replace(/\s+/g, " ")             // collapse multiple spaces
    .trim();
}

// ─── Liked Songs ─────────────────────────────────────────────────────────────
function saveLiked() {
  localStorage.setItem("voxify-liked", JSON.stringify(likedSongs));
}

function isLiked(key) {
  return likedSongs.includes(key);
}

function toggleLike(key) {
  if (!key || key === "—") return;
  if (isLiked(key)) {
    likedSongs = likedSongs.filter((s) => s !== key);
  } else {
    likedSongs.push(key);
  }
  saveLiked();
  updateLikeButton(key);
  updateLikedCardCount();
}

function updateLikedCardCount() {
  const el = document.getElementById("likedCount");
  if (el) {
    el.textContent = `${likedSongs.length} liked song${likedSongs.length !== 1 ? "s" : ""}`;
  }
}

function updateLikeButton(track) {
  const btn = document.querySelector(".songinfo-like");
  if (!btn) return;

  const key = `${currFolder}/${decodeURIComponent(track)}`;
  const liked = isLiked(key);

  // Set the SVG once (no more innerHTML swapping)
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke-width="2" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`;

  // Toggle class — CSS handles the color
  if (liked) {
    btn.classList.add("liked");
  } else {
    btn.classList.remove("liked");
  }

  btn.title = liked ? "Remove from Liked Songs" : "Save to Liked Songs";
  btn.style.transform = "scale(1.3)";
  setTimeout(() => (btn.style.transform = "scale(1)"), 150);
}

// ─── Song Info (bottom bar) ───────────────────────────────────────────────────
function updateSongInfo(track) {
  const title = cleanSongName(track);  // ← use cleaner instead of manual replace

  document.getElementById("songinfoTitle").textContent = title;
  document.getElementById("songinfoArtist").textContent = currFolder
    .split("/").pop()
    .replaceAll("_", " ")
    .replaceAll("(", "")
    .replaceAll(")", "");

  const art = document.getElementById("songinfoArt");
  art.style.backgroundImage = `url('/songs/${currFolder}/cover.jpg')`;
  art.style.backgroundSize = "cover";
  art.style.backgroundPosition = "center";

  updateLikeButton(track);
}

function updateSeekbar(percent) {
  document.getElementById("seekbarFill").style.width = percent + "%";
  document.querySelector(".circle").style.left = percent + "%";
}

// ─── Fetch songs from folder ──────────────────────────────────────────────────
async function getSongs(folder) {
  currFolder = folder;
  try {
    const res = await fetch(`/songs/${folder}/`);
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    songs = Array.from(div.getElementsByTagName("a"))
      .filter((a) => a.href.endsWith(".mp3"))
      .map((a) => decodeURIComponent(a.href.split(`/${folder}/`)[1]));
  } catch (err) {
    console.warn("Could not fetch songs:", err);
    songs = [];
  }

  renderSongList();
  return songs;
}

// ─── Render sidebar song list ─────────────────────────────────────────────────
function renderSongList() {
  const ul = document.querySelector("#libraryList");
  ul.innerHTML = "";

  if (songs.length === 0) {
    ul.innerHTML = `<li style="color:#b3b3b3;padding:12px;font-size:13px;">No songs found.</li>`;
    return;
  }

  songs.forEach((song) => {
    const displayName = cleanSongName(song);  // ← cleaned name
    const li = document.createElement("li");
    li.innerHTML = `
      <img class="invert" width="34" src="img/music.svg" alt="music">
      <div class="info">
        <div>${displayName}</div>
        <div style="color:#b3b3b3;font-size:11px;">${currFolder.replaceAll("_", " ")}</div>
      </div>
      <div class="playnow">
        <img class="invert" src="img/play.svg" alt="play" width="16">
      </div>`;

    li.addEventListener("click", () => playMusic(song));
    ul.appendChild(li);
  });
}

// ─── Play a track ─────────────────────────────────────────────────────────────
function playMusic(track, autoPlay = true) {
  currentSong.src = `/songs/${currFolder}/` + encodeURIComponent(track);

  updateSongInfo(track);
  updateSeekbar(0);
  document.getElementById("songtime").textContent = "00:00 / 00:00";

  if (autoPlay) {
    currentSong.play().catch((e) => console.warn("Playback error:", e));
    document.getElementById("play").src = "img/pause.svg";
  }

  // Highlight active song in sidebar
  document.querySelectorAll("#libraryList li").forEach((li, i) => {
    const isActive = songs[i] === track;
    li.style.background = isActive ? "#282828" : "";
    li.style.borderColor = isActive ? "#1ed760" : "white";
  });
}

// ─── Liked Songs Playlist ────────────────────────────────────────────────────
function loadLikedPlaylist() {
  if (likedSongs.length === 0) {
    alert("You haven't liked any songs yet! Hit the ❤️ while a song plays.");
    return;
  }

  const ul = document.querySelector("#libraryList");
  ul.innerHTML = "";

  likedSongs.forEach((key) => {
    const parts = key.split("/");
    const folder = parts[0];
    const file = parts.slice(1).join("/");
    const displayName = cleanSongName(file);

    const li = document.createElement("li");
    li.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#1ed760" style="flex-shrink:0">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
      <div class="info">
        <div>${displayName}</div>
        <div style="color:#b3b3b3;font-size:11px;">${folder.replaceAll("_", " ")}</div>
      </div>
      <div class="playnow">
        <img class="invert" src="img/play.svg" alt="play" width="16">
      </div>`;

    li.addEventListener("click", () => {
      currFolder = folder;
      songs = likedSongs.map((k) => k.split("/").slice(1).join("/"));
      playMusic(file);
    });

    ul.appendChild(li);
  });

  // Autoplay first liked song
  const first = likedSongs[0].split("/");
  currFolder = first[0];
  songs = likedSongs.map((k) => k.split("/").slice(1).join("/"));
  playMusic(first.slice(1).join("/"));
}

// ─── Discover & render playlist cards ────────────────────────────────────────
async function displayAlbums() {
  try {
    const res = await fetch(`/songs/`);
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    const folders = Array.from(div.getElementsByTagName("a"))
      .filter((a) => a.href.includes("/songs/") && a.href.endsWith("/"))
      .map((a) => a.href.split("/songs/")[1].replace("/", ""))
      .filter((f) => f && f !== "");

    const container = document.getElementById("cardContainer");
    container.innerHTML = "";

    // Regular playlist cards
    for (const folder of folders) {
      const displayName = folder
        .replaceAll("_", " ")
        .replace(/\(.*?\)/g, "")
        .trim();

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="play">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
        </div>
        <img src="/songs/${folder}/cover.jpg"
             onerror="this.src='img/music.svg';this.style.padding='30px';this.style.background='#282828'"
             alt="${displayName}">
        <h2>${displayName}</h2>
        <p>Click to play this playlist</p>`;

      card.addEventListener("click", async () => {
        await getSongs(folder);
        if (songs.length > 0) playMusic(songs[0]);
      });

      card.querySelector(".play").addEventListener("click", async (e) => {
        e.stopPropagation();
        await getSongs(folder);
        if (songs.length > 0) playMusic(songs[0]);
      });

      container.appendChild(card);
    }

    // ── Liked Songs card ──
    const likedCard = document.createElement("div");
    likedCard.className = "card";
    likedCard.innerHTML = `
      <div class="play">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>
      <div style="
        width:100%; aspect-ratio:1; border-radius:5px; margin-bottom:12px;
        background: linear-gradient(135deg, #450af5, #c4efd9);
        display:flex; align-items:center; justify-content:center;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="#fff">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <h2>Liked Songs</h2>
      <p id="likedCount">${likedSongs.length} liked song${likedSongs.length !== 1 ? "s" : ""}</p>`;

    likedCard.addEventListener("click", loadLikedPlaylist);
    container.appendChild(likedCard);

    if (folders.length === 0) addFallbackCard(container);
  } catch (err) {
    console.warn("Could not auto-discover albums:", err);
  }
}

function addFallbackCard(container) {
  container.innerHTML = `
    <div class="card" id="fallbackCard">
      <div class="play">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5" stroke-linejoin="round"/>
        </svg>
      </div>
      <img src="songs/Bright_(mood)/cover.jpg" alt="Happy Hits">
      <h2>Happy Hits</h2>
      <p>Upbeat tracks to brighten your day.</p>
    </div>`;

  document.getElementById("fallbackCard").addEventListener("click", async () => {
    await getSongs("Bright_(mood)");
    if (songs.length > 0) playMusic(songs[0]);
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await displayAlbums();
  await getSongs("Bright_(mood)");

  // ── Play / Pause ──
  document.getElementById("play").addEventListener("click", () => {
    if (!currentSong.src) return;
    if (currentSong.paused) {
      currentSong.play();
      document.getElementById("play").src = "img/pause.svg";
    } else {
      currentSong.pause();
      document.getElementById("play").src = "img/play.svg";
    }
  });

  // ── Time update ──
  currentSong.addEventListener("timeupdate", () => {
    const current = currentSong.currentTime;
    const total = currentSong.duration;
    if (!isNaN(total) && total > 0) {
      updateSeekbar((current / total) * 100);
      document.getElementById("songtime").textContent =
        `${secondsToMinutesSeconds(current)} / ${secondsToMinutesSeconds(total)}`;
    }
  });

  // ── Auto next ──
  currentSong.addEventListener("ended", () => {
    const filename = decodeURIComponent(currentSong.src.split("/").pop());
    const idx = songs.indexOf(filename);
    if (idx + 1 < songs.length) {
      playMusic(songs[idx + 1]);
    } else {
      document.getElementById("play").src = "img/play.svg";
    }
  });

  // ── Seekbar ──
  document.getElementById("seekbar").addEventListener("click", (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    updateSeekbar(percent);
    if (!isNaN(currentSong.duration))
      currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  // ── Previous ──
  document.getElementById("previous").addEventListener("click", () => {
    const filename = decodeURIComponent(currentSong.src.split("/").pop());
    const idx = songs.indexOf(filename);
    if (idx > 0) playMusic(songs[idx - 1]);
  });

  // ── Next ──
  document.getElementById("next").addEventListener("click", () => {
    const filename = decodeURIComponent(currentSong.src.split("/").pop());
    const idx = songs.indexOf(filename);
    if (idx + 1 < songs.length) playMusic(songs[idx + 1]);
  });

  // ── Volume slider ──
  document.getElementById("volumeRange").addEventListener("input", (e) => {
    const vol = parseInt(e.target.value) / 100;
    currentSong.volume = vol;
    document.querySelector(".volume > img").src =
      vol === 0 ? "img/mute.svg" : "img/volume.svg";
  });

  // ── Mute toggle ──
  document.querySelector(".volume > img").addEventListener("click", (e) => {
    const slider = document.getElementById("volumeRange");
    if (e.target.src.includes("volume.svg")) {
      e.target.src = "img/mute.svg";
      currentSong.volume = 0;
      slider.value = 0;
    } else {
      e.target.src = "img/volume.svg";
      currentSong.volume = 0.7;
      slider.value = 70;
    }
  });

  // ── Like button ──
  document.querySelector(".songinfo-like").addEventListener("click", () => {
    const filename = decodeURIComponent(currentSong.src.split("/").pop());
    if (!filename) return;
    const key = `${currFolder}/${filename}`;
    toggleLike(key);
  });

  // ── Hamburger (mobile) ──
  document.querySelector(".hamburger").addEventListener("click", () => {
    const left = document.querySelector(".left");
    left.style.cssText = `
      display: flex !important;
      position: fixed;
      top: 0; left: 0;
      height: 100vh;
      width: 75vw;
      max-width: 300px;
      z-index: 100;
      background: #121212;`;
  });

  // ── Close sidebar on mobile ──
  document.querySelector(".right").addEventListener("click", () => {
    if (window.innerWidth <= 680) {
      document.querySelector(".left").style.cssText = "display: none !important;";
    }
  });
}

main();