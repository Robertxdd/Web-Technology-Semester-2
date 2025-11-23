// main.js
document.addEventListener('DOMContentLoaded', () => {
  // -------------------------
  // Config
  // -------------------------
  const API_BASE = 'http://127.0.0.1:8000/api';

  // Tabs & views
  const homeTab = document.getElementById('homeTab');
  const favoritesTab = document.getElementById('favoritesTab');
  const playlistsTab = document.getElementById('playlistsTab');

  const cardsSection = document.querySelector('.cards-section');      // Home stats
  const mainSongsPanel = document.querySelector('.content-columns');  // Home song list

  const favoritesView = document.getElementById('favoritesView');
  const playlistsView = document.getElementById('playlistsView');

  // UI nodes
  const songListContainer = document.getElementById('songsListContainer'); // main list container
  const favoritesSongsList = document.getElementById('favoritesSongsList'); // favorites content container
  const playlistsList = document.getElementById('playlistsList'); // playlists list in sidebar
  const playlistSongsList = document.getElementById('playlistSongsList'); // selected playlist detail

  const songForm = document.getElementById('songForm');
  const createPlaylistForm = document.getElementById('createPlaylistForm');

  const audioElem = document.getElementById('audioPlayer');
  const playBtn = document.querySelector('.play-btn');
  const progressFill = document.querySelector('.progress-fill');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');
  const playerSongTitle = document.getElementById('playerSongTitle');
  const playerSongArtist = document.getElementById('playerSongArtist');

  const statsTab = document.getElementById("statsTab");
  const settingsTab = document.getElementById("settingsTab");

  const statsView = document.getElementById("statsView");
  const settingsView = document.getElementById("settingsView");

  const goToLibraryBtn = document.getElementById('goToLibraryBtn'); // favorites empty CTA

  // State
  let songs = [];
  let currentSongIndex = -1;
  let isPlaying = false;
  let playlists = loadPlaylistsFromStorage(); // simple localStorage playlists

  // -------------------------
  // Helpers
  // -------------------------
  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function parseDurationToSeconds(str) {
    if (!str) return 0;
    if (typeof str === 'number') return str;
    const p = String(str).split(':');
    if (p.length === 1) return parseInt(p[0], 10) || 0;
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }

  function clearActiveTabs() {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  }

  function hideAllViews() {
   cardsSection?.classList.add('hidden');
  mainSongsPanel?.classList.add('hidden');
  favoritesView?.classList.add('hidden');
  playlistsView?.classList.add('hidden');
  statsView?.classList.add('hidden');
  settingsView?.classList.add('hidden');
  }

  // -------------------------
  // SPA view functions
  // -------------------------
  function showHomeView() {
    hideAllViews();
    if (cardsSection) cardsSection.classList.remove('hidden');
    if (mainSongsPanel) mainSongsPanel.classList.remove('hidden');
    clearActiveTabs();
    if (homeTab) homeTab.classList.add('active');
    renderSongs(songs); // show full library
  }

  async function showFavoritesView() {
    hideAllViews();
    if (favoritesView) favoritesView.classList.remove('hidden');
    clearActiveTabs();
    if (favoritesTab) favoritesTab.classList.add('active');

    // Load favorites from API (fresh)
    await loadFavoritesAndRender();
  }

  function showPlaylistsView() {
    hideAllViews();
    if (playlistsView) playlistsView.classList.remove('hidden');
    clearActiveTabs();
    if (playlistsTab) playlistsTab.classList.add('active');
    renderPlaylistsSidebar();
    renderSelectedPlaylistDetail(); // show detail or empty state
  }

  // -------------------------
  // API calls
  // -------------------------
  async function apiGetSongs() {
    const res = await fetch(`${API_BASE}/songs`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch songs');
    return res.json();
  }

  async function apiCreateSong(data) {
    const res = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create song');
    return res.json();
  }

  async function apiDeleteSong(id) {
    const res = await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to delete song');
  }

  // Note: Controller earlier suggested PATCH; using PATCH here.
  async function apiToggleFavorite(id) {
    const res = await fetch(`${API_BASE}/songs/${id}/favorite`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to toggle favorite');
    return res.json();
  }

  async function apiGetFavorites() {
    // If you have a dedicated endpoint /songs/favorites use it; fallback to filtering client-side
    try {
      const res = await fetch(`${API_BASE}/songs/favorites`, { credentials: 'include' });
      if (res.ok) return res.json();
      // otherwise fallback to full list
    } catch (e) {
      // ignore and fall back
    }
    // fallback
    return songs.filter(s => s.favorite === 1 || s.favorite === true || s.favorite === '1');
  }

  // -------------------------
  // Loading data
  // -------------------------
  async function loadSongs() {
    try {
      songs = await apiGetSongs();
      renderSongs(songs);
      if (songs.length > 0 && currentSongIndex < 0) selectSong(0, false);
      updateStatsFromSongs();
    } catch (e) {
      console.error(e);
      songListContainer.innerHTML = '<p>Error loading songs.</p>';
    }
  }

  async function loadFavoritesAndRender() {
    try {
      const favs = await apiGetFavorites();
      // ensure empty state handling on favorites view
      renderFavorites(favs);
    } catch (e) {
      console.error('Failed loading favorites', e);
      favoritesSongsList.innerHTML = '<p>Error loading favorites.</p>';
    }
  }

  // -------------------------
  // Render functions
  // -------------------------
  function renderSongs(list = []) {
    if (!songListContainer) return;
    songListContainer.innerHTML = '';
    if (!list || list.length === 0) {
      songListContainer.innerHTML = '<p class="muted">No songs in your library.</p>';
      return;
    }





    list.forEach((s) => {
      const durationSeconds = parseDurationToSeconds(s.duration);
      const row = document.createElement('div');
      row.className = 'song';

      // Show active status if this exact song is selected in the main songs list
      const idx = songs.findIndex(x => x.id === s.id);
      if (idx === currentSongIndex) row.classList.add('active');
      if (s.favorite) row.classList.add('favorite');

      row.innerHTML = `
        <span class="song-title">${escapeHtml(s.title)}</span>
        <span class="song-artist">${escapeHtml(s.artist)}</span>
        <span class="song-year">${s.year ?? ''}</span>
        <span class="song-genre">${s.genre ?? ''}</span>
        <span class="song-duration">${formatDuration(durationSeconds)}</span>
        <button class="fav material-symbols-outlined" data-id="${s.id}" aria-label="Toggle favorite">${s.favorite ? 'favorite' : 'favorite_border'}</button>
        <button class="remove material-symbols-outlined" data-id="${s.id}" aria-label="Remove">close</button>
      `;

      // Select song unless clicking buttons
      row.addEventListener('click', (e) => {
        if (e.target.closest('.remove') || e.target.closest('.fav')) return;
        // find index in the global songs array and select
        const songIdx = songs.findIndex(x => x.id === s.id);
        if (songIdx >= 0) selectSong(songIdx, true);
      });

      // remove
      row.querySelector('.remove').addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        try {
          await apiDeleteSong(id);
          await loadSongs();
        } catch (err) {
          alert('Could not delete song');
          console.error(err);
        }
      });

      // favorite
      row.querySelector('.fav').addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        try {
          await apiToggleFavorite(id);
          // reload songs and if we are on favorites view also reload favorites
          await loadSongs();
          if (favoritesTab && favoritesTab.classList.contains('active')) await loadFavoritesAndRender();
        } catch (err) {
          alert('Could not toggle favorite');
          console.error(err);
        }
      });


      songListContainer.appendChild(row);
    });
  }

  function renderFavorites(list = []) {
    if (!favoritesSongsList) return;
    favoritesSongsList.innerHTML = '';

    const emptyState = document.getElementById('favoritesEmptyState');
    if (!list || list.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      favoritesSongsList.innerHTML = ''; // clear any residual
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    list.forEach(s => {
      const durationSeconds = parseDurationToSeconds(s.duration);
      const div = document.createElement('div');
      div.className = 'favorite-row';
      div.innerHTML = `
        <div class="fav-left">
          <strong>${escapeHtml(s.title)}</strong> — <span>${escapeHtml(s.artist)}</span>
        </div>
        <div class="fav-right">
          <span>${formatDuration(durationSeconds)}</span>
          <button class="fav-remove material-symbols-outlined" data-id="${s.id}" aria-label="Unfavorite">favorite</button>
        </div>
      `;

      // un-favorite from favorites view
      div.querySelector('.fav-remove').addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = e.currentTarget.dataset.id;
        try {
          await apiToggleFavorite(id);
          await loadFavoritesAndRender();
          await loadSongs(); // keep library in sync
        } catch (err) {
          console.error(err);
          alert('Could not update favorite');
        }
      });

      favoritesSongsList.appendChild(div);
    });
  }

  // -------------------------
  // Player logic
  // -------------------------
  function selectSong(index, autoPlay = true) {
    if (index < 0 || index >= songs.length) return;
    currentSongIndex = index;
    const s = songs[index];

    // highlight correct row in main songs list
    document.querySelectorAll('.song').forEach(el => el.classList.remove('active'));
    const activeRow = Array.from(document.querySelectorAll('.song')).find(row => {
      return row.querySelector('.remove')?.dataset.id == s.id;
    });
    if (activeRow) activeRow.classList.add('active');

    // update player UI
    audioElem.src = s.url || '';
    playerSongTitle.textContent = s.title || 'No song selected';
    playerSongArtist.textContent = s.artist || '—';
    timeCurrent.textContent = '0:00';
    timeTotal.textContent = formatDuration(parseDurationToSeconds(s.duration || 0));
    progressFill.style.width = '0%';

    if (autoPlay) {
      audioElem.play().catch(e => {
        // Autoplay may be blocked by browser; just update icon
        console.warn('autoplay blocked', e);
      });
      playBtn.textContent = 'pause';
      isPlaying = true;
    }
  }

  function togglePlay() {
    if (audioElem.paused) {
      audioElem.play();
      playBtn.textContent = 'pause';
      isPlaying = true;
    } else {
      audioElem.pause();
      playBtn.textContent = 'play_arrow';
      isPlaying = false;
    }
  }

  function nextSong() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    selectSong(currentSongIndex, true);
  }

  function prevSong() {
    if (songs.length === 0) return;
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    selectSong(currentSongIndex, true);
  }

  audioElem.addEventListener('timeupdate', () => {
    const total = audioElem.duration;
    const current = audioElem.currentTime;
    if (!isNaN(total)) {
      progressFill.style.width = `${(current / total) * 100}%`;
      timeCurrent.textContent = formatDuration(Math.floor(current));
      timeTotal.textContent = formatDuration(Math.floor(total));
    }
  });

  audioElem.addEventListener('ended', () => {
    nextSong();
  });

  if (playBtn) playBtn.addEventListener('click', togglePlay);
  // optional prev/next buttons
  document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const label = e.currentTarget.getAttribute('aria-label') || '';
      if (label.toLowerCase().includes('previous')) prevSong();
      if (label.toLowerCase().includes('next')) nextSong();
    });
  });

  // -------------------------
  // Stats
  // -------------------------
  function updateStatsFromSongs() {
    try {
      const totalSongs = songs.length;
      const favs = songs.filter(s => s.favorite === 1 || s.favorite === true || s.favorite === '1').length;
      const totalSeconds = songs.reduce((sum, s) => sum + (parseDurationToSeconds(s.duration) || 0), 0);
      const minutes = Math.floor(totalSeconds / 60);

      const totalSongsEl = document.getElementById('totalSongsCount');
      const totalDurationEl = document.getElementById('totalDuration');
      const favoriteSongsEl = document.getElementById('favoriteSongsCount');

      if (totalSongsEl) totalSongsEl.textContent = totalSongs;
      if (totalDurationEl) totalDurationEl.textContent = minutes + ' min';
      if (favoriteSongsEl) favoriteSongsEl.textContent = favs;

      // stats view mirrors
      const statsTotalSongs = document.getElementById('statsTotalSongs');
      const statsFavoriteSongs = document.getElementById('statsFavoriteSongs');
      const statsTotalDuration = document.getElementById('statsTotalDuration');

      if (statsTotalSongs) statsTotalSongs.textContent = totalSongs;
      if (statsFavoriteSongs) statsFavoriteSongs.textContent = favs;
      if (statsTotalDuration) statsTotalDuration.textContent = minutes + ' min';
    } catch (e) {
      console.error('updateStats error', e);
    }



  }

  // -------------------------
  // Playlist (local storage) simple implementation
  // -------------------------
  function loadPlaylistsFromStorage() {
    try {
      const raw = localStorage.getItem('musix_playlists');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  function savePlaylistsToStorage() {
    try {
      localStorage.setItem('musix_playlists', JSON.stringify(playlists));
    } catch (e) {
      console.error('Could not save playlists', e);
    }
  }

  function renderPlaylistsSidebar() {
    if (!playlistsList) return;
    playlistsList.innerHTML = '';
    if (playlists.length === 0) {
      playlistsList.innerHTML = '<p class="empty-playlists-message">You haven’t created any playlists yet.</p>';
      return;
    }

    playlists.forEach((p, i) => {
      const div = document.createElement('div');
      div.className = 'playlist-item';
      div.innerHTML = `<button class="playlist-select" data-index="${i}">${escapeHtml(p.name)}</button>`;
      playlistsList.appendChild(div);
    });

    // add click listeners
    playlistsList.querySelectorAll('.playlist-select').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.currentTarget.dataset.index);
        const p = playlists[idx];
        renderPlaylistDetail(p);
      });
    });
  }

  function renderSelectedPlaylistDetail() {
    // if there is a selected playlist show it, otherwise show empty message
    const selected = playlists[0];
    if (!selected) {
      if (playlistSongsList) playlistSongsList.innerHTML = '<p class="muted">Select a playlist to see songs.</p>';
      return;
    }
    renderPlaylistDetail(selected);
  }

  function renderPlaylistDetail(playlist) {
    if (!playlistSongsList) return;
    playlistSongsList.innerHTML = '';
    const titleEl = document.querySelector('.playlist-detail-title');
    if (titleEl) titleEl.textContent = playlist.name;
    if (!playlist.songs || playlist.songs.length === 0) {
      playlistSongsList.innerHTML = '<p class="muted">This playlist is empty.</p>';
      return;
    }

    playlist.songs.forEach(id => {
      const s = songs.find(x => x.id == id);
      if (!s) return;
      const div = document.createElement('div');
      div.className = 'playlist-song-row';
      div.innerHTML = `<strong>${escapeHtml(s.title)}</strong> — ${escapeHtml(s.artist)} <span class="song-duration">${formatDuration(parseDurationToSeconds(s.duration))}</span>`;
      playlistSongsList.appendChild(div);
    });
  }

  // create playlist form
  if (createPlaylistForm) {
    createPlaylistForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const f = new FormData(createPlaylistForm);
      const name = f.get('name')?.trim();
      const desc = f.get('description')?.trim();
      if (!name) return alert('Playlist name required');
      playlists.push({ name, description: desc || '', songs: [] });
      savePlaylistsToStorage();
      renderPlaylistsSidebar();
      createPlaylistForm.reset();
      // close modal by changing hash if you rely on hash modal, otherwise keep open
      location.hash = '';
    });
  }

  // -------------------------
  // Add song form
  // -------------------------
  if (songForm) {
    songForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(songForm);
      const data = {
        title: (f.get('title') || '').trim(),
        artist: (f.get('artist') || '').trim(),
        genre: (f.get('genre') || '').trim() || null,
        year: f.get('year') ? Number(f.get('year')) : null,
        duration: f.get('duration') ? Number(f.get('duration')) : null,
        url: (f.get('url') || '').trim(),
      };

      if (!data.title || !data.artist || !data.url) {
        alert('Title, artist and url required');
        return;
      }

      try {
        await apiCreateSong(data);
        songForm.reset();
        await loadSongs();
      } catch (err) {
        alert('Error saving song');
        console.error(err);
      }
    });
  }
  if (statsTab) statsTab.addEventListener("click", (e) => { e.preventDefault(); showStatsView(); });
  if (settingsTab) settingsTab.addEventListener("click", (e) => { e.preventDefault(); showSettingsView(); });


  // -------------------------
  // Favorites empty CTA
  // -------------------------
  if (goToLibraryBtn) {
    goToLibraryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showHomeView();
      // ensure songs are loaded and rendered
      renderSongs(songs);
    });
  }

  // -------------------------
  // Utilities
  // -------------------------
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function showStatsView() {
    hideAllViews();
    statsView.classList.remove("hidden");
    clearActiveTabs();
    statsTab.classList.add("active");
  }

  function showSettingsView() {
    hideAllViews();
    settingsView.classList.remove("hidden");
    clearActiveTabs();
    settingsTab.classList.add("active");
  }

  // -------------------------
  // Event wiring for SPA tabs
  // -------------------------
  if (homeTab) homeTab.addEventListener('click', (e) => { e.preventDefault(); showHomeView(); });
  if (favoritesTab) favoritesTab.addEventListener('click', (e) => { e.preventDefault(); showFavoritesView(); });
  if (playlistsTab) playlistsTab.addEventListener('click', (e) => { e.preventDefault(); showPlaylistsView(); });

  // -------------------------
  // Initial load
  // -------------------------
  (async function init() {
    await loadSongs();
    renderPlaylistsSidebar();
    showHomeView();
  });
}

if (favoritesTab) {
  favoritesTab.addEventListener("click", (e) => {
    e.preventDefault();
    showFavoritesView();
  });
}

if (playlistsTab) {
  playlistsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showPlaylistsView();
  });
}

if (queueTab) {
  queueTab.addEventListener("click", (e) => {
    e.preventDefault();
    showQueueView();
  });
}

if (statsTab) {
  statsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showStatsView();
  });
}

if (settingsTab) {
  settingsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSettingsView();
  });
}

// Botón "Go to library" dentro del empty state de favorites
if (goToLibraryBtn) {
  goToLibraryBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showHomeView();
  });
}

// Al cargar la página, mostramos Home por defecto
showHomeView();

const audioElem = document.getElementById('audioPlayer');

audioElem.addEventListener('timeupdate', () => {
  const total = audioElem.duration;
  const current = audioElem.currentTime;

  if (!isNaN(total)) {
    progressFill.style.width = `${(current / total) * 100}%`;
    timeCurrent.textContent = formatDuration(Math.floor(current));
    timeTotal.textContent = formatDuration(Math.floor(total));
  }
});

audioElem.addEventListener('ended', () => {
  nextSong();
});

async function loadStats() {
  try {
    const res = await fetch("/api/stats");
    const data = await res.json();

    document.getElementById("total-songs").innerText = data.totalSongs;
    document.getElementById("total-duration").innerText = data.totalDuration + " min";
    document.getElementById("favorite-songs").innerText = data.favoriteSongs;
  } catch (e) {
    console.error("Error loading stats:", e);
  }
}

loadStats();

async function loadStats() {
    try {
        const response = await fetch("http://localhost:8000/api/songs"); 
        const songs = await response.json();

        // Total songs
        document.getElementById("totalSongsCount").textContent = songs.length;

        // Total favorites
        const favs = songs.filter(song => song.favorite === 1).length;
        document.getElementById("favoriteSongsCount").textContent = favs;

        // Total duration (sum of seconds)
        const totalSeconds = songs.reduce((sum, s) => sum + (s.duration || 0), 0);
        const minutes = Math.floor(totalSeconds / 60);
        document.getElementById("totalDuration").textContent = minutes + " min";

        // Stats view
        document.getElementById("statsTotalSongs").textContent = songs.length;
        document.getElementById("statsFavoriteSongs").textContent = favs;
        document.getElementById("statsTotalDuration").textContent = minutes + " min";

    } catch (error) {
        console.error("Error loading stats:", error);
    }
}

// Ejecutar al cargar la página
document.addEventListener("DOMContentLoaded", loadStats);