document.addEventListener('DOMContentLoaded', () => {
  const songList = document.querySelector('.songs-list');
  const songForm = document.getElementById('songForm');

  const playBtn = document.querySelector('.play-btn');
  const progressFill = document.querySelector('.progress-fill');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');

  const API_BASE = 'http://127.0.0.1:8000/api';

  let songs = [];
  let currentSongIndex = 0;
  let isPlaying = false;
  let progressInterval = null;

const homeTab = document.querySelector('.nav-link'); // first nav item "Home"

homeTab.addEventListener("click", (e) => {
  e.preventDefault();
  renderSongs(songs);
});


  // FAVORITES TAB
favoritesTab.addEventListener("click", (e) => {
  e.preventDefault();

  const favs = songs.filter(s =>
    s.favorite === true ||
    s.favorite === 1 ||
    s.favorite === "1"
  );

  renderSongs(favs);
});

  // -------------------------------------------------
  // SEARCH FILTER
  // -------------------------------------------------
  const searchInput = document.querySelector('.search-input');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim().toLowerCase();

      if (q === '') {
        renderSongs();
        return;
      }

      const filtered = songs.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        (s.genre && s.genre.toLowerCase().includes(q))
      );

      renderSongs(filtered);
    });
  }

  // -------------------------------------------------
  // LOAD SONGS
  // -------------------------------------------------
  async function loadSongs() {
    const res = await fetch(`${API_BASE}/songs`, {
      credentials: 'include'
    });

    if (!res.ok) {
      songList.innerHTML = '<p>Error loading songs.</p>';
      return;
    }

    songs = await res.json();
    renderSongs();

    if (songs.length > 0) selectSong(0, false);
  }

  // -------------------------------------------------
  // CREATE SONG
  // -------------------------------------------------
  async function createSong(data) {
    const res = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error();
    return res.json();
  }

  // -------------------------------------------------
  // DELETE SONG
  // -------------------------------------------------
  async function deleteSong(id) {
    const res = await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) throw new Error();
  }

  // -------------------------------------------------
  // TOGGLE FAVORITE
  // -------------------------------------------------
  async function toggleFavorite(id) {
    await fetch(`${API_BASE}/songs/${id}/favorite`, {
      method: 'PUT',
      credentials: 'include',
      headers: { "Content-Type": "application/json" }
    });
  }

  // -------------------------------------------------
  // RENDER SONG LIST
  // -------------------------------------------------
  function renderSongs(list = songs) {
    songList.innerHTML = '';

    list.forEach((s, index) => {
      const durationSeconds =
        typeof s.duration === 'number'
          ? s.duration
          : parseDurationToSeconds(s.duration);

      const row = document.createElement('div');
      row.classList.add('song');

      if (songs.indexOf(s) === currentSongIndex) {
        row.classList.add('active');
      }

      if (s.favorite) row.classList.add('favorite');

      row.innerHTML = `
        <span>${s.title}</span>
        <span>${s.artist}</span>
        <span>${s.year ?? ''}</span>
        <span>${s.genre ?? ''}</span>
        <span>${formatDuration(durationSeconds)}</span>

   <button class="fav material-symbols-outlined">
  ${s.favorite ? 'favorite' : 'favorite_border'}
</button>


        <button class="remove material-symbols-outlined">close</button>
      `;

      // Select song
      row.addEventListener('click', (e) => {
        if (e.target.closest('.remove')) return;
        if (e.target.closest('.fav')) return;
        selectSong(songs.indexOf(s));
      });

      // Remove song
      row.querySelector('.remove').addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteSong(s.id);
        await loadSongs();
      });

      // FAVORITE BUTTON
      row.querySelector('.fav').addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleFavorite(s.id);
        await loadSongs();
      });

      songList.appendChild(row);
    });
  }

  // -------------------------------------------------
  // SELECT SONG
  // -------------------------------------------------
  function selectSong(index, autoPlay = true) {
    currentSongIndex = index;

    document.querySelectorAll('.song').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    const s = songs[index];
    const dur =
      typeof s.duration === 'number'
        ? s.duration
        : parseDurationToSeconds(s.duration);

    timeTotal.textContent = formatDuration(dur || 0);
    timeCurrent.textContent = '0:00';
    progressFill.style.width = '0%';

    if (autoPlay) {
      if (isPlaying) stopPlayback();
      togglePlay();
    }
  }

  // -------------------------------------------------
  // PLAYER
  // -------------------------------------------------
  function togglePlay() {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'pause' : 'play_arrow';
    isPlaying ? startProgress() : stopPlayback();
  }

  function startProgress() {
    stopPlayback();

    const s = songs[currentSongIndex];
    let total =
      typeof s.duration === 'number'
        ? s.duration
        : parseDurationToSeconds(s.duration);

    if (!total) total = 180;

    let elapsed = 0;

    progressInterval = setInterval(() => {
      elapsed++;
      if (elapsed > total) {
        nextSong();
        return;
      }
      progressFill.style.width = `${(elapsed / total) * 100}%`;
      timeCurrent.textContent = formatDuration(elapsed);
    }, 1000);
  }

  function stopPlayback() {
    clearInterval(progressInterval);
    progressInterval = null;
  }

  function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    selectSong(currentSongIndex);
  }

  // -------------------------------------------------
  // HELPERS
  // -------------------------------------------------
  function formatDuration(sec) {
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function parseDurationToSeconds(str) {
    if (!str) return 0;
    const p = str.split(':');
    return (parseInt(p[0], 10) || 0) * 60 + (parseInt(p[1], 10) || 0);
  }

  // -------------------------------------------------
  // ADD SONG FORM
  // -------------------------------------------------
  if (songForm) {
    songForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const f = new FormData(songForm);
      const data = {
        title: f.get('title').trim(),
        artist: f.get('artist').trim(),
        genre: f.get('genre')?.trim() || null,
        year: f.get('year') ? Number(f.get('year')) : null,
        duration: f.get('duration') ? Number(f.get('duration')) : null,
      };

      if (!data.title || !data.artist) {
        alert('Title/artist required');
        return;
      }

      try {
        await createSong(data);
        songForm.reset();
        await loadSongs();
      } catch {
        alert('Error saving song');
      }
    });
  }

  if (playBtn) playBtn.addEventListener('click', togglePlay);

  loadSongs();
});
// ============= SPA NAVIGATION (Home / Favorites / Playlists / Queue / Stats / Settings) =============

// Tabs (sidebar)
const homeTab       = document.getElementById("homeTab");
const favoritesTab  = document.getElementById("favoritesTab");
const playlistsTab  = document.getElementById("playlistsTab");
const queueTab      = document.getElementById("queueTab");
const statsTab      = document.getElementById("statsTab");
const settingsTab   = document.getElementById("settingsTab");

// Views (pantallas dentro del content-area)
const cardsSection   = document.querySelector(".cards-section");      // Home stats
const mainSongsPanel = document.querySelector(".content-columns");   // Home song list

const favoritesView  = document.getElementById("favoritesView");
const playlistsView  = document.getElementById("playlistsView");
const queueView      = document.getElementById("queueView");
const statsView      = document.getElementById("statsView");
const settingsView   = document.getElementById("settingsView");

// Botón "Go to library" del estado vacío de favorites (si existe)
const goToLibraryBtn = document.getElementById("goToLibraryBtn");

// Función para limpiar la pestaña activa del sidebar
function clearActiveTabs() {
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => link.classList.remove("active"));
}

// Ocultar TODAS las vistas excepto el header/player
function hideAllViews() {
  if (cardsSection)    cardsSection.classList.add("hidden");
  if (mainSongsPanel)  mainSongsPanel.classList.add("hidden");
  if (favoritesView)   favoritesView.classList.add("hidden");
  if (playlistsView)   playlistsView.classList.add("hidden");
  if (queueView)       queueView.classList.add("hidden");
  if (statsView)       statsView.classList.add("hidden");
  if (settingsView)    settingsView.classList.add("hidden");
}

// Mostrar Home (vista principal: tarjetas + lista canciones)
function showHomeView() {
  hideAllViews();
  if (cardsSection)    cardsSection.classList.remove("hidden");
  if (mainSongsPanel)  mainSongsPanel.classList.remove("hidden");
  clearActiveTabs();
  if (homeTab)         homeTab.classList.add("active");
}

// Mostrar Favorites
function showFavoritesView() {
  hideAllViews();
  if (favoritesView) favoritesView.classList.remove("hidden");
  clearActiveTabs();
  if (favoritesTab) favoritesTab.classList.add("active");

  // Aquí luego puedes llamar a renderFavorites() si pintas solo las favoritas
}

// Mostrar Playlists
function showPlaylistsView() {
  hideAllViews();
  if (playlistsView) playlistsView.classList.remove("hidden");
  clearActiveTabs();
  if (playlistsTab) playlistsTab.classList.add("active");
}

// Mostrar Queue
function showQueueView() {
  hideAllViews();
  if (queueView) queueView.classList.remove("hidden");
  clearActiveTabs();
  if (queueTab) queueTab.classList.add("active");
}

// Mostrar Stats
function showStatsView() {
  hideAllViews();
  if (statsView) statsView.classList.remove("hidden");
  clearActiveTabs();
  if (statsTab) statsTab.classList.add("active");
}

// Mostrar Settings
function showSettingsView() {
  hideAllViews();
  if (settingsView) settingsView.classList.remove("hidden");
  clearActiveTabs();
  if (settingsTab) settingsTab.classList.add("active");
}

// ====== EVENTOS DE LOS TABS ======

if (homeTab) {
  homeTab.addEventListener("click", (e) => {
    e.preventDefault();
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
