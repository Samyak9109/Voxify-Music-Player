// ─── State ───────────────────────────────────────────────────────────────────
let currentSong = new Audio();
let songs = [];
let currFolder = "";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateSongInfo(track) {
  // Title: strip .mp3, decode URI, replace underscores/dashes
  const title = decodeURIComponent(track)
    .replace(/\.mp3$/i, "")
    .replaceAll("_", " ")
    .replaceAll("-", " ");

  document.getElementById("songinfoTitle").textContent = title;
  document.getElementById("songinfoArtist").textContent = currFolder
    .split("/")
    .pop()
    .replaceAll("_", " ")
    .replaceAll("(", "")
    .replaceAll(")", "");

  // Album art — try cover.jpg from the current folder
  const art = document.getElementById("songinfoArt");
  art.style.backgroundImage = `url('/songs/${currFolder}/cover.jpg')`;
  art.style.backgroundSize = "cover";
  art.style.backgroundPosition = "center";
}

function updateSeekbar(percent) {
  document.getElementById("seekbarFill").style.width = percent + "%";
  document.querySelector(".circle").style.left = percent + "%";
}

// ─── Core: fetch song list from a folder ─────────────────────────────────────
async function getSongs(folder) {
  currFolder = folder;
  try {
    const res = await fetch(`/songs/${folder}/`);
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    // Grab every anchor that ends with .mp3
    songs = Array.from(div.getElementsByTagName("a"))
      .filter((a) => a.href.endsWith(".mp3"))
      .map((a) => decodeURIComponent(a.href.split(`/${folder}/`)[1]));
  } catch (err) {
    console.warn("Could not fetch songs from server — using empty list.", err);
    songs = [];
  }

  renderSongList();
  return songs;
}

// ─── Render song list in the sidebar ─────────────────────────────────────────
function renderSongList() {
  const ul = document.querySelector("#libraryList");
  ul.innerHTML = "";

  if (songs.length === 0) {
    ul.innerHTML = `<li style="color:#b3b3b3;padding:12px;font-size:13px;">No songs found.</li>`;
    return;
  }

  songs.forEach((song, index) => {
    const displayName = song.replace(/\.mp3$/i, "").replaceAll("%20", " ");
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

  // Highlight active song in list
  document.querySelectorAll("#libraryList li").forEach((li, i) => {
    const isActive = songs[i] === track;
    li.style.background = isActive ? "#282828" : "";
    li.style.borderColor = isActive ? "#1ed760" : "white";
  });
}

// ─── Render playlist cards ────────────────────────────────────────────────────
async function displayAlbums() {
  try {
    const res = await fetch(`/songs/`);
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;

    // Get all folder links (directories end with /)
    const folders = Array.from(div.getElementsByTagName("a"))
      .filter((a) => a.href.includes("/songs/") && a.href.endsWith("/"))
      .map((a) => {
        const parts = a.href.split("/songs/")[1].split("/");
        return parts[0]; // folder name
      })
      .filter((f) => f && f !== "");

    const container = document.getElementById("cardContainer");
    container.innerHTML = ""; // Clear static card

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

      // Clicking the card loads that folder
      card.addEventListener("click", async () => {
        await getSongs(folder);
        if (songs.length > 0) playMusic(songs[0]);
      });

      // The green play button also triggers the same action
      card.querySelector(".play").addEventListener("click", async (e) => {
        e.stopPropagation();
        await getSongs(folder);
        if (songs.length > 0) playMusic(songs[0]);
      });

      container.appendChild(card);
    }

    // Fallback: if server directory listing isn't available, show the static card
    if (folders.length === 0) addFallbackCard(container);
  } catch (err) {
    console.warn("Could not auto-discover albums:", err);
    // Keep the existing static card from HTML as fallback
  }
}

function addFallbackCard(container) {
  container.innerHTML = `
    <div class="card" id="fallbackCard">
      <div class="play">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  // 1. Try to discover and render album cards
  await displayAlbums();

  // 2. Load default playlist into sidebar (won't autoplay)
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

  // ── Time update → seekbar + clock ──
  currentSong.addEventListener("timeupdate", () => {
    const current = currentSong.currentTime;
    const total = currentSong.duration;
    if (!isNaN(total) && total > 0) {
      const percent = (current / total) * 100;
      updateSeekbar(percent);
      document.getElementById("songtime").textContent =
        `${secondsToMinutesSeconds(current)} / ${secondsToMinutesSeconds(total)}`;
    }
  });

  // ── Auto-advance to next song ──
  currentSong.addEventListener("ended", () => {
    const idx = songs.indexOf(decodeURIComponent(
      currentSong.src.split("/").pop()
    ));
    if (idx + 1 < songs.length) {
      playMusic(songs[idx + 1]);
    } else {
      // Last song — reset play button
      document.getElementById("play").src = "img/play.svg";
    }
  });

  // ── Seekbar click ──
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
    const volImg = document.querySelector(".volume > img");
    volImg.src = vol === 0 ? "img/mute.svg" : "img/volume.svg";
  });

  // ── Volume icon mute toggle ──
  document.querySelector(".volume > img").addEventListener("click", (e) => {
    const volSlider = document.getElementById("volumeRange");
    if (e.target.src.includes("volume.svg")) {
      e.target.src = "img/mute.svg";
      currentSong.volume = 0;
      volSlider.value = 0;
    } else {
      e.target.src = "img/volume.svg";
      currentSong.volume = 0.7;
      volSlider.value = 70;
    }
  });

  // ── Hamburger (mobile) — open sidebar ──
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

  // ── Close sidebar when clicking outside it on mobile ──
  document.querySelector(".right").addEventListener("click", () => {
    if (window.innerWidth <= 680) {
      document.querySelector(".left").style.cssText = "display: none !important;";
    }
  });
}

main();