// main.js
document.addEventListener('DOMContentLoaded', () => {

  const API_BASE = 'http://127.0.0.1:8000/api';

  const homeTab = document.getElementById('homeTab');
  const favoritesTab = document.getElementById('favoritesTab');
  const playlistsTab = document.getElementById('playlistsTab');
  const settingsTab = document.getElementById('settingsTab');

  const cardsSection = document.querySelector('.cards-section');
  const mainSongsPanel = document.querySelector('.content-columns');
  const openCreatePlaylistBtn = document.getElementById('openCreatePlaylistBtn');


  const favoritesView = document.getElementById('favoritesView');
  const playlistsView = document.getElementById('playlistsView');
  const settingsView = document.getElementById('settingsView');

  const songListContainer = document.getElementById('songsListContainer');
  const favoritesSongsList = document.getElementById('favoritesSongsList');
  const playlistsList = document.getElementById('playlistsList');
  const playlistSongsList = document.getElementById('playlistSongsList');

  const songForm = document.getElementById('songForm');
  const createPlaylistForm = document.getElementById('createPlaylistForm');

  const audioElem = document.getElementById('audioPlayer');
  const playBtn = document.querySelector('.play-btn');
  const playIcon = playBtn ? playBtn.querySelector('.material-symbols-outlined') : null;
  const progressFill = document.querySelector('.progress-fill');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');
  const playerSongTitle = document.getElementById('playerSongTitle');
  const playerSongArtist = document.getElementById('playerSongArtist');

  const statsTab = document.getElementById("statsTab");
  const statsView = document.getElementById("statsView");

  const goToLibraryBtn = document.getElementById('goToLibraryBtn');
  const themeChips = document.querySelectorAll('.theme-chip');
  const logoutButton = document.getElementById('logoutButton');

  let songs = [];
  let currentSongIndex = -1;
  let isPlaying = false;
  let playlists = [];
  let userRole = 'user';

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

  function applyTheme(theme) {
    const body = document.body;
    if (!body) return;
    const normalized = theme === 'light' ? 'light' : 'dark';
    if (normalized === 'light') {
      body.classList.add('theme-light');
      body.classList.remove('theme-dark');
    } else {
      body.classList.add('theme-dark');
      body.classList.remove('theme-light');
    }
    themeChips.forEach((chip) => {
      const label = chip.textContent.trim().toLowerCase();
      const isLightChip = label === 'light';
      chip.classList.toggle('active',
        (normalized === 'light' && isLightChip) ||
        (normalized === 'dark' && !isLightChip)
      );
    });
    localStorage.setItem('musix-theme', normalized);
  }

  function clearActiveTabs() {
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  }

  function hideAllViews() {
    cardsSection?.classList.add('hidden');
    mainSongsPanel?.classList.add('hidden');
    favoritesView?.classList.add('hidden');
    playlistsView?.classList.add('hidden');
    settingsView?.classList.add('hidden');
  }

  function showHomeView() {
    hideAllViews();
    cardsSection.classList.remove('hidden');
    mainSongsPanel.classList.remove('hidden');
    clearActiveTabs();
    homeTab.classList.add('active');
    renderSongs(songs);
  }

  async function apiGetSongs() {
    const res = await fetch(`${API_BASE}/songs`, { credentials: 'include' });
    return res.json();
  }

  async function apiCreateSong(data) {
    const res = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  }

  async function apiDeleteSong(id) {
    await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  }

  async function apiToggleFavorite(id) {
    const res = await fetch(`${API_BASE}/songs/${id}/favorite`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  }

  async function apiGetFavorites() {
    const res = await fetch(`${API_BASE}/songs/favorites`, { credentials: 'include' });
    if (res.ok) return res.json();
    return songs.filter(s => s.favorite);
  }

  async function apiGetPlaylists() {
    const res = await fetch(`${API_BASE}/playlists`, { credentials: 'include' });
    return res.json();
  }

  async function apiGetPlaylist(id) {
    const res = await fetch(`${API_BASE}/playlists/${id}`, { credentials: 'include' });
    return res.json();
  }

  async function apiCreatePlaylist(data) {
    const res = await fetch(`${API_BASE}/playlists`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async function loadSongs() {
    songs = await apiGetSongs();
    renderSongs(songs);
    if (songs.length > 0 && currentSongIndex < 0) selectSong(0, false);
    updateStatsFromSongs();
  }

  async function loadPlaylists() {
    playlists = await apiGetPlaylists();
  }

  async function showFavoritesView() {
    hideAllViews();
    favoritesView.classList.remove('hidden');
    clearActiveTabs();
    favoritesTab.classList.add('active');
    await loadSongs();
    const favs = songs.filter(s => s.favorite);
    renderFavorites(favs);
  }
  function renderSongs(list = []) {
    songListContainer.innerHTML = '';
    if (!list.length) {
      songListContainer.innerHTML = '<p class="muted">No songs in your library.</p>';
      return;
    }

    list.forEach((s) => {
      const durationSeconds = parseDurationToSeconds(s.duration);
      const row = document.createElement('div');
      row.className = 'song';

      const idx = songs.findIndex(x => x.id === s.id);
      if (idx === currentSongIndex) row.classList.add('active');
      if (s.favorite) row.classList.add('favorite');

          const editButtonHtml = userRole === 'admin' 
      ? `<button class="edit material-symbols-outlined" data-id="${s.id}" aria-label="Edit">edit</button>` 
      : '';

    row.innerHTML = `
      <span class="song-title">${escapeHtml(s.title)}</span>
      <span class="song-artist">${escapeHtml(s.artist)}</span>
      <span class="song-year">${s.year ?? ''}</span>
      <span class="song-genre">${s.genre ?? ''}</span>
      <span class="song-duration">${formatDuration(durationSeconds)}</span>
      <button class="fav material-symbols-outlined" data-id="${s.id}" aria-label="Toggle favorite">${s.favorite ? 'favorite' : 'favorite_border'}</button>
      ${editButtonHtml}
      <button class="remove material-symbols-outlined" data-id="${s.id}" aria-label="Remove">close</button>
    `;

      row.addEventListener('click', (e) => {
        if (e.target.closest('.remove') || e.target.closest('.fav')) return;
        const songIdx = songs.findIndex(x => x.id === s.id);
        if (songIdx >= 0) selectSong(songIdx, true);
      });

      row.querySelector('.remove').addEventListener('click', async (e) => {
        e.stopPropagation();
        await apiDeleteSong(e.currentTarget.dataset.id);
        await loadSongs();
      });

      row.querySelector('.fav').addEventListener('click', async (e) => {
        e.stopPropagation();
        await apiToggleFavorite(e.currentTarget.dataset.id);
        await loadSongs();
        if (favoritesTab.classList.contains('active')) {
          const favs = songs.filter(x => x.favorite);
          renderFavorites(favs);
        }
      });

      if (userRole === 'admin') {
        const editBtn = row.querySelector('.edit');
        if (editBtn) {
          editBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            alert(`Edit song ${id} - This will open an edit form!`);
          });
        }
      }

      songListContainer.appendChild(row);
    });
  }

  if (openCreatePlaylistBtn) {
    openCreatePlaylistBtn.addEventListener('click', () => {
      location.hash = 'createPlaylistModal';
    });
  }

  function renderFavorites(list = []) {
    favoritesSongsList.innerHTML = '';

    const emptyState = document.getElementById('favoritesEmptyState');
    if (!list.length) {
      emptyState.style.display = 'block';
      return;
    }
    emptyState.style.display = 'none';

    list.forEach(s => {
      const div = document.createElement('div');
      div.className = 'favorite-row';
      div.innerHTML = `
        <div class="fav-left">
          <strong>${escapeHtml(s.title)}</strong> — <span>${escapeHtml(s.artist)}</span>
        </div>
        <div class="fav-right">
          <span>${formatDuration(parseDurationToSeconds(s.duration))}</span>
          <button class="fav-remove material-symbols-outlined" data-id="${s.id}">favorite</button>
        </div>
      `;

      div.querySelector('.fav-remove').addEventListener('click', async (e) => {
        await apiToggleFavorite(e.currentTarget.dataset.id);
        const favs = songs.filter(x => x.favorite);
        renderFavorites(favs);
        await loadSongs();
      });

      favoritesSongsList.appendChild(div);
    });
  }

  function selectSong(index, autoPlay = true) {
    if (index < 0 || index >= songs.length) return;
    currentSongIndex = index;
    const s = songs[index];

    document.querySelectorAll('.song').forEach(el => el.classList.remove('active'));
    const activeRow = Array.from(document.querySelectorAll('.song'))
      .find(row => row.querySelector('.remove')?.dataset.id == s.id);
    activeRow?.classList.add('active');

    audioElem.src = s.url || '';
    playerSongTitle.textContent = s.title || 'No song selected';
    playerSongArtist.textContent = s.artist || '—';
    timeCurrent.textContent = '0:00';
    timeTotal.textContent = formatDuration(parseDurationToSeconds(s.duration || 0));
    progressFill.style.width = '0%';

    if (autoPlay) {
      audioElem.play().catch(() => { });
      playBtn.textContent = 'pause';
      isPlaying = true;
    }
  }

  function togglePlay() {
    if (!audioElem) return;

    if (audioElem.paused) {
      audioElem.play();
      if (playIcon) playIcon.textContent = 'pause';
      isPlaying = true;
    } else {
      audioElem.pause();
      if (playIcon) playIcon.textContent = 'play_arrow';
      isPlaying = false;
    }
  }

  function nextSong() {
    if (!songs.length) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    selectSong(currentSongIndex, true);
  }

  function prevSong() {
    if (!songs.length) return;
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

  playBtn?.addEventListener('click', togglePlay);

  document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const label = e.currentTarget.getAttribute('aria-label') || '';
      if (label.toLowerCase().includes('previous')) prevSong();
      if (label.toLowerCase().includes('next')) nextSong();
    });
  });

  function updateStatsFromSongs() {
    const totalSongs = songs.length;
    const favs = songs.filter(s => s.favorite).length;
    const totalSeconds = songs.reduce((sum, s) => sum + parseDurationToSeconds(s.duration || 0), 0);
    const minutes = Math.floor(totalSeconds / 60);

    document.getElementById('totalSongsCount').textContent = totalSongs;
    document.getElementById('totalDuration').textContent = minutes + ' min';
    document.getElementById('favoriteSongsCount').textContent = favs;

    document.getElementById('statsTotalSongs').textContent = totalSongs;
    document.getElementById('statsFavoriteSongs').textContent = favs;
    document.getElementById('statsTotalDuration').textContent = minutes + ' min';
  }

  async function renderPlaylistsSidebar() {
    playlistsList.innerHTML = '';
    await loadPlaylists();

    if (!playlists.length) {
      playlistsList.innerHTML = '<p class="empty-playlists-message">You haven’t created any playlists yet.</p>';
      return;
    }

    playlists.forEach((p) => {
      const div = document.createElement('div');
      div.className = 'playlist-item';
      div.innerHTML = `<button class="playlist-select" data-id="${p.id}">${escapeHtml(p.name)}</button>`;
      playlistsList.appendChild(div);
    });

    playlistsList.querySelectorAll('.playlist-select').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const p = await apiGetPlaylist(id);
        renderPlaylistDetail(p);
      });
    });
  }

  async function renderPlaylistDetail(playlist) {
    playlistSongsList.innerHTML = '';
    document.querySelector('.playlist-detail-title').textContent = playlist.name;

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
  if (createPlaylistForm) {
    createPlaylistForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(createPlaylistForm);
      const name = f.get('name')?.trim();
      const desc = f.get('description')?.trim();

      if (!name) {
        alert('Playlist name required');
        return;
      }

      await apiCreatePlaylist({ name, description: desc || '' });
      await renderPlaylistsSidebar();
      createPlaylistForm.reset();
      location.hash = '';
    });
  }

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

      await apiCreateSong(data);
      songForm.reset();
      await loadSongs();
    });
  }

  if (statsTab) statsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showStatsView();
  });

  if (settingsTab) settingsTab.addEventListener("click", (e) => {
    e.preventDefault();
    showSettingsView();
  });

  if (goToLibraryBtn) {
    goToLibraryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showHomeView();
      renderSongs(songs);
    });
  }

  if (themeChips && themeChips.length) {
    let storedTheme = localStorage.getItem('musix-theme') || 'dark';
    applyTheme(storedTheme);

    themeChips.forEach((chip) => {
      chip.addEventListener('click', () => {
        const label = chip.textContent.trim().toLowerCase();
        applyTheme(label === 'light' ? 'light' : 'dark');
      });
    });
  } else {
    applyTheme('dark');
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/logout';
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function loadUserRole() {
  try {
    const res = await fetch(`${API_BASE}/user/role`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      userRole = data.role || 'user';
      console.log('User role:', userRole);
    }
  } catch (e) {
    console.error('Could not load user role', e);
  }
}

  function showSettingsView() {
    hideAllViews();
    settingsView.classList.remove('hidden');
    clearActiveTabs();
    settingsTab.classList.add('active');
  }

  function showStatsView() {
    hideAllViews();
    statsView.classList.remove("hidden");
    clearActiveTabs();
    statsTab.classList.add("active");
  }

  if (homeTab) homeTab.addEventListener('click', (e) => {
    e.preventDefault();
    showHomeView();
  });
  if (favoritesTab) favoritesTab.addEventListener('click', (e) => {
    e.preventDefault();
    showFavoritesView();
  });
  if (playlistsTab) playlistsTab.addEventListener('click', (e) => {
    e.preventDefault();
    showPlaylistsView();
  });
  if (settingsTab) settingsTab.addEventListener('click', (e) => {
    e.preventDefault();
    showSettingsView();
  });

  function showPlaylistsView() {
    hideAllViews();
    playlistsView.classList.remove('hidden');
    clearActiveTabs();
    playlistsTab.classList.add('active');
    renderPlaylistsSidebar();
  }

  (async function init() {
    await loadUserRole();
    await loadSongs();
    await renderPlaylistsSidebar();
    showHomeView();
  })();

});
