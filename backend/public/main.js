document.addEventListener("DOMContentLoaded", () => {

const API_BASE = "http://127.0.0.1:8000/api";

const homeTab = document.getElementById("homeTab");
const favoritesTab = document.getElementById("favoritesTab");
const playlistsTab = document.getElementById("playlistsTab");
const settingsTab = document.getElementById("settingsTab");

const cardsSection = document.querySelector(".cards-section");
const mainSongsPanel = document.querySelector(".content-columns");

const favoritesView = document.getElementById("favoritesView");
const playlistsView = document.getElementById("playlistsView");
const settingsView = document.getElementById("settingsView");

const songListContainer = document.getElementById("songsListContainer");
const favoritesSongsList = document.getElementById("favoritesSongsList");
const playlistsList = document.getElementById("playlistsList");
const playlistSongsList = document.getElementById("playlistSongsList");

const songForm = document.getElementById("songForm");
const createPlaylistForm = document.getElementById("createPlaylistForm");

const audioElem = document.getElementById("audioPlayer");
const playBtn = document.querySelector(".play-btn");
const playIcon = playBtn ? playBtn.querySelector(".material-symbols-outlined") : null;

const progressFill = document.getElementById("progressFill");
const timeCurrent = document.getElementById("timeCurrent");
const timeTotal = document.getElementById("timeTotal");
const playerSongTitle = document.getElementById("playerSongTitle");
const playerSongArtist = document.getElementById("playerSongArtist");

const statsTab = document.getElementById("statsTab");
const statsView = document.getElementById("statsView");

const goToLibraryBtn = document.getElementById("goToLibraryBtn");
const themeChips = document.querySelectorAll(".theme-chip");
const logoutButton = document.getElementById("logoutButton");

let songs = [];
let playlists = [];
let currentSongIndex = -1;
let isPlaying = false;
let selectedPlaylistId = null;
let userRole = "user";

/* ============================================================
   UTILITY
============================================================ */

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function parseDurationToSeconds(str) {
  if (!str) return 0;
  if (typeof str === "number") return str;
  const p = String(str).split(":");
  if (p.length === 1) return parseInt(p[0], 10) || 0;
  return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
}

function formatDuration(sec) {
  const m = Math.floor(sec / 60);
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ============================================================
   API
============================================================ */

async function apiGetSongs() {
  return (await fetch(`${API_BASE}/songs`, { credentials: "include" })).json();
}

async function apiCreateSong(data) {
  return (await fetch(`${API_BASE}/songs`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })).json();
}

async function apiDeleteSong(id) {
  await fetch(`${API_BASE}/songs/${id}`, {
    method: "DELETE",
    credentials: "include"
  });
}

async function apiToggleFavorite(id) {
  return (await fetch(`${API_BASE}/songs/${id}/favorite`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" }
  })).json();
}

async function apiGetFavorites() {
  const res = await fetch(`${API_BASE}/songs/favorites`, { credentials: "include" });
  return res.ok ? res.json() : songs.filter(s => s.favorite);
}

async function apiGetPlaylists() {
  return (await fetch(`${API_BASE}/playlists`, { credentials: "include" })).json();
}

async function apiGetPlaylist(id) {
  return (await fetch(`${API_BASE}/playlists/${id}`, { credentials: "include" })).json();
}

async function apiCreatePlaylist(data) {
  return (await fetch(`${API_BASE}/playlists`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })).json();
}

async function apiAddSongToPlaylist(playlistId, songId) {
  return await fetch(`${API_BASE}/playlists/${playlistId}/add-song`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ song_id: songId })
  });
}

async function apiDeletePlaylist(id) {
  await fetch(`${API_BASE}/playlists/${id}`, {
    method: "DELETE",
    credentials: "include"
  });
}

async function loadUserRole() {
  try {
    const res = await fetch(`${API_BASE}/user/role`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      userRole = data.role || "user";
    }
  } catch {}
}

/* ============================================================
   LOADERS
============================================================ */

async function loadSongs() {
  songs = await apiGetSongs();
  updateStats();
  renderSongs(songs);
}

async function loadPlaylists() {
  playlists = await apiGetPlaylists();
}

/* ============================================================
   RENDER SONG LIST
============================================================ */

function renderSongs(list = []) {
  songListContainer.innerHTML = "";

  if (!list.length) {
    songListContainer.innerHTML = "<p class='muted'>No songs in your library.</p>";
    return;
  }

  list.forEach(s => {
    const durationSeconds = parseDurationToSeconds(s.duration);
    const row = document.createElement("div");
    row.className = "song";

    if (songs[currentSongIndex]?.id === s.id) row.classList.add("active");
    if (s.favorite) row.classList.add("favorite");

    const editButton = userRole === "admin"
      ? `<button class="edit material-symbols-outlined" data-id="${s.id}">edit</button>`
      : "";

    row.innerHTML = `
      <span class="song-title">${escapeHtml(s.title)}</span>
      <span class="song-artist">${escapeHtml(s.artist)}</span>
      <span class="song-year">${s.year ?? ""}</span>
      <span class="song-genre">${s.genre ?? ""}</span>
      <span class="song-duration">${formatDuration(durationSeconds)}</span>
      <button class="fav material-symbols-outlined" data-id="${s.id}">
        ${s.favorite ? "favorite" : "favorite_border"}
      </button>
      ${editButton}
      <button class="remove material-symbols-outlined" data-id="${s.id}">close</button>
    `;

    row.addEventListener("click", e => {
      if (e.target.closest(".fav") || e.target.closest(".remove")) return;
      const index = songs.findIndex(x => x.id === s.id);
      if (index >= 0) selectSong(index, true);
    });

    row.querySelector(".remove").onclick = async e => {
      e.stopPropagation();
      await apiDeleteSong(s.id);
      await loadSongs();
    };

    row.querySelector(".fav").onclick = async e => {
      e.stopPropagation();
      await apiToggleFavorite(s.id);
      await loadSongs();
    };

    songListContainer.appendChild(row);
  });
}

/* ============================================================
   PLAYER
============================================================ */

function selectSong(index, autoplay = true) {
  currentSongIndex = index;
  const s = songs[index];

  audioElem.src = s.url || "";
  playerSongTitle.textContent = s.title;
  playerSongArtist.textContent = s.artist;

  timeCurrent.textContent = "0:00";
  timeTotal.textContent = formatDuration(parseDurationToSeconds(s.duration));

  progressFill.style.width = "0%";

  if (autoplay) {
    audioElem.play().catch(() => {});
    if (playIcon) playIcon.textContent = "pause";
    isPlaying = true;
  }
}

audioElem.addEventListener("timeupdate", () => {
  const total = audioElem.duration;
  const cur = audioElem.currentTime;
  if (!isNaN(total)) {
    progressFill.style.width = `${(cur / total) * 100}%`;
    timeCurrent.textContent = formatDuration(Math.floor(cur));
    timeTotal.textContent = formatDuration(Math.floor(total));
  }
});

/* ============================================================
   FAVORITES
============================================================ */

function renderFavorites(list) {
  favoritesSongsList.innerHTML = "";

  const empty = document.getElementById("favoritesEmptyState");
  if (!list.length) {
    empty.style.display = "block";
    return;
  }

  empty.style.display = "none";

  list.forEach(s => {
    const row = document.createElement("div");
    row.className = "favorite-row";

    row.innerHTML = `
      <div class="fav-left">
        <strong>${escapeHtml(s.title)}</strong> — ${escapeHtml(s.artist)}
      </div>
      <div class="fav-right">
        ${formatDuration(parseDurationToSeconds(s.duration))}
        <button class="fav-remove material-symbols-outlined" data-id="${s.id}">favorite</button>
      </div>
    `;

    row.querySelector(".fav-remove").onclick = async () => {
      await apiToggleFavorite(s.id);
      renderFavorites(songs.filter(x => x.favorite));
      await loadSongs();
    };

    favoritesSongsList.appendChild(row);
  });
}

/* ============================================================
   PLAYLISTS
============================================================ */

async function openPlaylist(id) {
  selectedPlaylistId = id;
  const playlist = await apiGetPlaylist(id);
  renderPlaylistDetail(playlist);
}

function renderPlaylistDetail(playlist) {
  playlistSongsList.innerHTML = "";

  document.querySelector(".playlist-detail-title").textContent = playlist.name;
  document.querySelector(".playlist-detail-text").textContent = playlist.description || "";

  if (!playlist.songs.length) {
    playlistSongsList.innerHTML = "<p class='muted'>This playlist is empty.</p>";
    return;
  }

  playlist.songs.forEach(id => {
    const s = songs.find(x => x.id === id);
    if (!s) return;

    const row = document.createElement("div");
    row.className = "playlist-song-row";
    row.innerHTML = `
      <strong>${escapeHtml(s.title)}</strong> — ${escapeHtml(s.artist)}
      <span class="song-duration">${formatDuration(parseDurationToSeconds(s.duration))}</span>
    `;
    playlistSongsList.appendChild(row);
  });
}

document.getElementById("addSongToPlaylistBtn").onclick = () => {
  if (!selectedPlaylistId) return alert("Select a playlist first.");
  location.hash = "addToPlaylistModal";
  loadSongPickerModal();
};

function loadSongPickerModal() {
  const box = document.getElementById("playlistSelectList");
  box.innerHTML = "";

  const playlist = playlists.find(p => p.id == selectedPlaylistId);
  const existing = playlist ? playlist.songs : [];

  songs
    .filter(s => !existing.includes(s.id))
    .forEach(s => {
      const div = document.createElement("div");
      div.className = "playlist-card";

      div.innerHTML = `
        <div class="playlist-card-main">
          <p class="playlist-card-title">${escapeHtml(s.title)}</p>
          <p class="playlist-card-desc">${escapeHtml(s.artist)}</p>
        </div>
        <button class="primary-btn secondary add-to-playlist" data-id="${s.id}">Add</button>
      `;

      div.querySelector("button").onclick = async () => {
        await apiAddSongToPlaylist(selectedPlaylistId, s.id);
        location.hash = "";
        await renderPlaylistsSidebar();
        await openPlaylist(selectedPlaylistId);
      };

      box.appendChild(div);
    });
}

document.getElementById("deletePlaylistBtn").onclick = async () => {
  if (!selectedPlaylistId) return;
  await apiDeletePlaylist(selectedPlaylistId);

  selectedPlaylistId = null;
  document.querySelector(".playlist-detail-title").textContent = "Select a playlist";
  document.querySelector(".playlist-detail-text").textContent =
    "Choose one of your playlists on the left to see its songs here.";
  playlistSongsList.innerHTML = "";

  await renderPlaylistsSidebar();
};

async function renderPlaylistsSidebar() {
  playlistsList.innerHTML = "";
  await loadPlaylists();

  if (!playlists.length) {
    playlistsList.innerHTML = "<p class='empty-playlists-message'>You haven’t created any playlists yet.</p>";
    return;
  }

  playlists.forEach(p => {
    const div = document.createElement("div");
    div.className = "playlist-item";
    div.innerHTML = `<button class="playlist-select" data-id="${p.id}">${escapeHtml(p.name)}</button>`;
    playlistsList.appendChild(div);
  });

  playlistsList.querySelectorAll(".playlist-select").forEach(btn => {
    btn.onclick = async e => {
      const id = e.target.dataset.id;
      await openPlaylist(id);
    };
  });
}

/* ============================================================
   VIEWS
============================================================ */

function hideAllViews() {
  cardsSection.classList.add("hidden");
  mainSongsPanel.classList.add("hidden");
  favoritesView.classList.add("hidden");
  playlistsView.classList.add("hidden");
  settingsView.classList.add("hidden");
}

function clearActiveTabs() {
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
}

function showHomeView() {
  hideAllViews();
  cardsSection.classList.remove("hidden");
  mainSongsPanel.classList.remove("hidden");
  clearActiveTabs();
  homeTab.classList.add("active");
  renderSongs(songs);
}

async function showFavoritesView() {
  hideAllViews();
  favoritesView.classList.remove("hidden");
  clearActiveTabs();
  favoritesTab.classList.add("active");
  await loadSongs();
  renderFavorites(songs.filter(s => s.favorite));
}

function showPlaylistsView() {
  hideAllViews();
  playlistsView.classList.remove("hidden");
  clearActiveTabs();
  playlistsTab.classList.add("active");
  renderPlaylistsSidebar();
}

function showSettingsView() {
  hideAllViews();
  settingsView.classList.remove("hidden");
  clearActiveTabs();
  settingsTab.classList.add("active");
}

function showStatsView() {
  hideAllViews();
  statsView.classList.remove("hidden");
  clearActiveTabs();
  statsTab.classList.add("active");
}

/* ============================================================
   STATS
============================================================ */

function updateStats() {
  const totalSongs = songs.length;
  const totalFavorites = songs.filter(s => s.favorite).length;
  const totalSeconds = songs.reduce((sum, s) => sum + parseDurationToSeconds(s.duration), 0);
  const minutes = Math.floor(totalSeconds / 60);

  document.getElementById("totalSongsCount").textContent = totalSongs;
  document.getElementById("favoriteSongsCount").textContent = totalFavorites;
  document.getElementById("totalDuration").textContent = `${minutes} min`;

  document.getElementById("statsTotalSongs").textContent = totalSongs;
  document.getElementById("statsFavoriteSongs").textContent = totalFavorites;
  document.getElementById("statsTotalDuration").textContent = `${minutes} min`;
}

/* ============================================================
   FORMS
============================================================ */

if (songForm) {
  songForm.onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(songForm);

    const data = {
      title: (f.get("title") || "").trim(),
      artist: (f.get("artist") || "").trim(),
      genre: (f.get("genre") || "").trim() || null,
      year: f.get("year") ? Number(f.get("year")) : null,
      duration: f.get("duration") ? Number(f.get("duration")) : null,
      url: (f.get("url") || "").trim()
    };

    if (!data.title || !data.artist || !data.url) {
      alert("Title, artist and url required");
      return;
    }

    await apiCreateSong(data);
    songForm.reset();
    await loadSongs();
  };
}

if (createPlaylistForm) {
  createPlaylistForm.onsubmit = async e => {
    e.preventDefault();
    const f = new FormData(createPlaylistForm);

    const name = f.get("name")?.trim();
    const description = f.get("description")?.trim() || "";

    if (!name) {
      alert("Playlist name required");
      return;
    }

    await apiCreatePlaylist({ name, description });
    createPlaylistForm.reset();
    location.hash = "";
    await renderPlaylistsSidebar();
  };
}


homeTab.onclick = e => { e.preventDefault(); showHomeView(); };
favoritesTab.onclick = e => { e.preventDefault(); showFavoritesView(); };
playlistsTab.onclick = e => { e.preventDefault(); showPlaylistsView(); };
settingsTab.onclick = e => { e.preventDefault(); showSettingsView(); };

if (statsTab) statsTab.onclick = e => { e.preventDefault(); showStatsView(); };

if (goToLibraryBtn) goToLibraryBtn.onclick = e => { e.preventDefault(); showHomeView(); };

if (logoutButton) logoutButton.onclick = () => window.location.href = "/logout";


(async function init() {
  await loadUserRole();
  await loadSongs();
  await renderPlaylistsSidebar();
  showHomeView();
})();

});
