document.addEventListener('DOMContentLoaded', () => {
  const songList = document.querySelector('.songs-list');
  const songForm = document.getElementById('songForm');

  const playBtn = document.querySelector('.play-btn');
  const progressFill = document.querySelector('.progress-fill');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');

  const API_BASE = 'http://127.0.0.1:8000/api';

  // ---------------- SEARCH FILTER ----------------
  const searchInput = document.querySelector('.search-input');

  if (searchInput) {
    searchInput.addEventListener('input', async () => {
      const q = searchInput.value.trim();

      const res = await fetch(`${API_BASE}/songs?q=${encodeURIComponent(q)}`, {
        credentials: 'include'
      });

      songs = await res.json();
      renderSongs();
    });
  }
  

  let songs = [];
  let currentSongIndex = 0;
  let isPlaying = false;
  let progressInterval = null;

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

  async function deleteSong(id) {
    const res = await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) throw new Error();
  }

  function renderSongs() {
    songList.innerHTML = '';

    songs.forEach((s, index) => {
      const durationSeconds = typeof s.duration === 'number'
        ? s.duration
        : parseDurationToSeconds(s.duration);

      const row = document.createElement('div');
      row.classList.add('song');
      if (index === currentSongIndex) row.classList.add('active');

      row.innerHTML = `
        <span>${s.title}</span>
        <span>${s.artist}</span>
        <span>${s.year ?? ''}</span>
        <span>${s.genre ?? ''}</span>
        <span>${formatDuration(durationSeconds)}</span>
        <button class="remove material-symbols-outlined">close</button>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.closest('.remove')) return;
        selectSong(index);
      });

      row.querySelector('.remove').addEventListener('click', async (e) => {
        e.stopPropagation();
        await deleteSong(s.id);
        await loadSongs();
      });

      songList.appendChild(row);
    });
  }

  function selectSong(index, autoPlay = true) {
    currentSongIndex = index;

    document.querySelectorAll('.song').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    const s = songs[index];
    const dur = typeof s.duration === 'number'
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

  function togglePlay() {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'pause' : 'play_arrow';
    isPlaying ? startProgress() : stopPlayback();
  }

  function startProgress() {
    stopPlayback();

    const s = songs[currentSongIndex];
    let total = typeof s.duration === 'number'
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
