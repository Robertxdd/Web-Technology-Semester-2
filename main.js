document.addEventListener('DOMContentLoaded', () => {
  const songList = document.querySelector('.songs-list');
  const songForm = document.getElementById('songForm');

  const playBtn = document.querySelector('.play-btn');
  const progressFill = document.querySelector('.progress-fill');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');

  // Ajusta esta URL según donde tengas levantado Laravel
  const API_BASE = 'http://localhost:8000/api';

  let songs = [];
  let currentSongIndex = 0;
  let isPlaying = false;
  let progressInterval = null;

  // ---------- API / BACKEND ----------

  async function loadSongs() {
    try {
      const res = await fetch(`${API_BASE}/songs`);
      if (!res.ok) throw new Error('Error loading songs');
      songs = await res.json();
      renderSongs();

      if (songs.length > 0) {
        selectSong(0, false);
      } else {
        songList.innerHTML = '<p class="empty-msg">No songs yet. Add one!</p>';
        timeCurrent.textContent = '0:00';
        timeTotal.textContent = '0:00';
      }
    } catch (err) {
      console.error(err);
      songList.innerHTML = '<p class="error-msg">Error loading songs from the server.</p>';
    }
  }

  async function createSong(newSong) {
    const res = await fetch(`${API_BASE}/songs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSong),
    });
    if (!res.ok) throw new Error('Error creating song');
    return res.json();
  }

  async function deleteSong(id) {
    const res = await fetch(`${API_BASE}/songs/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Error deleting song');
  }

  // ---------- RENDER LISTA ----------

  function renderSongs() {
    songList.innerHTML = '';

    songs.forEach((s, index) => {
      const row = document.createElement('div');
      row.classList.add('song');
      if (index === currentSongIndex) {
        row.classList.add('active');
      }

      // duration viene como segundos (int) del backend
      const durationSeconds = typeof s.duration === 'number'
        ? s.duration
        : parseDurationToSeconds(s.duration);
      const durationText = formatDuration(durationSeconds);

      row.innerHTML = `
        <span>${s.title}</span>
        <span>${s.artist}</span>
        <span>${s.year ?? ''}</span>
        <span>${s.genre ?? ''}</span>
        <span>${durationText}</span>
        <button class="remove material-symbols-outlined" aria-label="Delete song">close</button>
      `;

      // Seleccionar canción (click en la fila)
      row.addEventListener('click', (e) => {
        if (e.target.closest('.remove')) return; // no disparar al borrar
        selectSong(index);
      });

      // Borrar canción
      const removeBtn = row.querySelector('.remove');
      removeBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Delete this song?')) return;
        try {
          await deleteSong(s.id);
          await loadSongs();
        } catch (err) {
          console.error(err);
          alert('Error deleting song');
        }
      });

      songList.appendChild(row);
    });
  }

  // ---------- REPRODUCTOR “FAKE” ----------

  function selectSong(index, autoPlay = true) {
    if (!songs.length) return;

    currentSongIndex = index;

    document.querySelectorAll('.song').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    const song = songs[currentSongIndex];
    const totalSeconds = typeof song.duration === 'number'
      ? song.duration
      : parseDurationToSeconds(song.duration);

    timeTotal.textContent = formatDuration(totalSeconds || 0);
    timeCurrent.textContent = '0:00';
    progressFill.style.width = '0%';

    if (autoPlay) {
      if (isPlaying) stopPlayback();
      togglePlay();
    }
  }

  function togglePlay() {
    if (!songs.length) return;

    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? 'pause' : 'play_arrow';

    if (isPlaying) {
      startFakeProgress();
    } else {
      stopPlayback();
    }
  }

  function startFakeProgress() {
    stopPlayback();

    const song = songs[currentSongIndex];
    let totalSeconds = typeof song.duration === 'number'
      ? song.duration
      : parseDurationToSeconds(song.duration);

    if (!totalSeconds) totalSeconds = 180; // default 3 min si no hay valor

    let elapsed = 0;
    timeCurrent.textContent = '0:00';
    timeTotal.textContent = formatDuration(totalSeconds);
    progressFill.style.width = '0%';

    progressInterval = setInterval(() => {
      elapsed++;
      if (elapsed > totalSeconds) {
        nextSong();
        return;
      }

      const percent = (elapsed / totalSeconds) * 100;
      progressFill.style.width = `${percent}%`;
      timeCurrent.textContent = formatDuration(elapsed);
    }, 1000);
  }

  function stopPlayback() {
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function nextSong() {
    if (!songs.length) return;
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    selectSong(currentSongIndex);
  }

  function formatDuration(seconds) {
    if (!seconds && seconds !== 0) return '0:00';
    const min = Math.floor(seconds / 60);
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  function parseDurationToSeconds(str) {
    if (!str) return 0;
    const parts = String(str).split(':');
    if (parts.length !== 2) return 0;
    const min = parseInt(parts[0], 10) || 0;
    const sec = parseInt(parts[1], 10) || 0;
    return min * 60 + sec;
  }

  // ---------- FORMULARIO (CREATE) ----------

  if (songForm) {
    songForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(songForm);
      const newSong = {
        title: formData.get('title')?.toString().trim(),
        artist: formData.get('artist')?.toString().trim(),
        genre: formData.get('genre')?.toString().trim() || null,
        year: formData.get('year') ? Number(formData.get('year')) : null,
        duration: formData.get('duration') ? Number(formData.get('duration')) : null,
      };

      if (!newSong.title || !newSong.artist) {
        alert('Title and artist are required');
        return;
      }

      try {
        await createSong(newSong);
        songForm.reset();
        await loadSongs();
      } catch (err) {
        console.error(err);
        alert('Error saving song');
      }
    });
  }

  // ---------- EVENTOS Y CARGA INICIAL ----------

  if (playBtn) {
    playBtn.addEventListener('click', togglePlay);
  }

  loadSongs();
});