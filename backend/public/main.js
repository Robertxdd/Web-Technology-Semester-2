document.addEventListener('DOMContentLoaded', () => {
  const songList = document.querySelector('.songs-list');
  const playBtn = document.querySelector('.play-btn');
  const progressFill = document.querySelector('.progress-fill');
  const timeCurrent = document.querySelector('.time-current');
  const timeTotal = document.querySelector('.time-total');
  const songInput = document.getElementById('songInput');
  const addSongBtn = document.getElementById('addSongBtn');

  let songs = [
    { title: "Smells Like Teen Spirit", artist: "Nirvana", album: "Nevermind", genre: "Grunge", duration: "5:01" },
    { title: "Enter Sandman", artist: "Metallica", album: "Metallica", genre: "Metal", duration: "5:32" },
    { title: "Seven Nation Army", artist: "The White Stripes", album: "Elephant", genre: "Rock", duration: "3:52" },
    { title: "Do I Wanna Know?", artist: "Arctic Monkeys", album: "AM", genre: "Alternative", duration: "4:32" },
    { title: "Killing in the Name", artist: "Rage Against The Machine", album: "RATM", genre: "Rap Metal", duration: "5:14" }
  ];

  let currentSongIndex = 0;
  let isPlaying = false;
  let progressInterval = null;

  function renderSongs() {
    songList.innerHTML = "";
    songs.forEach((s, index) => {
      const song = document.createElement('div');
      song.classList.add('song');
      song.innerHTML = `
        <span>${s.title}</span>
        <span>${s.artist}</span>
        <span>${s.album}</span>
        <span>${s.genre}</span>
        <span>${s.duration}</span>
        <button class="remove material-symbols-outlined">close</button>
      `;
      songList.appendChild(song);

      song.addEventListener('click', () => selectSong(index));
      song.querySelector('.remove').addEventListener('click', (e) => {
        e.stopPropagation();
        songs.splice(index, 1);
        renderSongs();
      });
    });
  }

  function selectSong(index) {
    currentSongIndex = index;
    document.querySelectorAll('.song').forEach((el, i) => {
      el.style.background = i === index ? 'var(--accent-2)' : 'var(--panel)';
    });
  }

  function togglePlay() {
    if (!songs.length) return;
    isPlaying = !isPlaying;
    playBtn.querySelector('.material-symbols-outlined').textContent =
      isPlaying ? 'pause' : 'play_arrow';
    clearInterval(progressInterval);
    if (isPlaying) startProgress();
  }

  function startProgress() {
    let elapsed = 0;
    const currentSong = songs[currentSongIndex];
    const durationParts = currentSong.duration.split(':');
    const totalSeconds = parseInt(durationParts[0]) * 60 + parseInt(durationParts[1]);

    timeTotal.textContent = currentSong.duration;
    progressFill.style.width = "0%";
    timeCurrent.textContent = "0:00";

    progressInterval = setInterval(() => {
      elapsed++;
      const percent = (elapsed / totalSeconds) * 100;
      progressFill.style.width = `${percent}%`;
      const min = Math.floor(elapsed / 60);
      const sec = (elapsed % 60).toString().padStart(2, '0');
      timeCurrent.textContent = `${min}:${sec}`;

      if (elapsed >= totalSeconds) {
        clearInterval(progressInterval);
        nextSong();
      }
    }, 1000);
  }

  function nextSong() {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    selectSong(currentSongIndex);
    togglePlay(); // restart playback
  }

  // Added validation
  addSongBtn.addEventListener('click', () => {
    const value = songInput.value.trim();
    if (value === "") {
      alert("Please enter a song name.");
      return;
    }
    songs.push({
      title: value,
      artist: "Unknown",
      album: "Unknown",
      genre: "Unknown",
      duration: "3:00"
    });
    songInput.value = "";
    renderSongs();
  });

  playBtn.addEventListener('click', togglePlay);
  renderSongs();
});
