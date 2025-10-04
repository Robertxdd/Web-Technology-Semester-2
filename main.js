document.addEventListener('DOMContentLoaded', () => {
  const songList = document.querySelector('.songs-list');
  const playBtn = document.querySelector('.play-btn');
  const addSongBtn = document.getElementById('addSongBtn');
  const songInput = document.getElementById('songInput');

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
    // just a placeholder for progress simulation
    progressInterval = setInterval(() => {
      console.log("Playing:", songs[currentSongIndex].title);
    }, 1000);
  }

  function addSong() {
    const title = songInput.value.trim();
    if (title === "") return;

    songs.push({
      title: title,
      artist: "Unknown Artist",
      album: "Unknown Album",
      genre: "Unknown Genre",
      duration: "--:--"
    });

    songInput.value = "";
    renderSongs();
  }

  addSongBtn.addEventListener('click', addSong);
  songInput.addEventListener('keypress', (e) => {
    if (e.key === "Enter") addSong();
  });

  playBtn.addEventListener('click', togglePlay);
  renderSongs();
});
