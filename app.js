// API Configuration
const API_BASE = "https://api.alquran.cloud/v1";
let currentSurah = 1;
let currentVerse = 1;

// DOM Elements
const surahList = document.getElementById("surah-list");
const verseRef = document.getElementById("verse-ref");
const arabicVerse = document.getElementById("arabic-verse");
const transliterationVerse = document.getElementById("transliteration");
const translationVerse = document.getElementById("translation");
const prevVerseBtn = document.getElementById("prev-verse");
const nextVerseBtn = document.getElementById("next-verse");
const searchInput = document.getElementById("search-surah");
const translationSelect = document.getElementById("translation-select");
const themeToggle = document.getElementById("theme-toggle");

// Initialize
loadSurahList();
loadVerse();
initTheme();

// Load Surah List
async function loadSurahList() {
  try {
    const response = await fetch(`${API_BASE}/surah`);
    const { data } = await response.json();
    
    surahList.innerHTML = data.map(surah => `
      <div class="surah-item" data-id="${surah.number}">
        <span>${surah.englishName} (${surah.name})</span>
        <span class="surah-number">${surah.number}</span>
      </div>
    `).join('');

    // Add click events
    document.querySelectorAll('.surah-item').forEach(item => {
      item.addEventListener('click', () => {
        currentSurah = parseInt(item.dataset.id);
        currentVerse = 1;
        loadVerse();
        setActiveSurah();
      });
    });
  } catch (error) {
    console.error("Error loading surahs:", error);
    surahList.innerHTML = "<div class='error'>Failed to load surahs. Please refresh.</div>";
  }
}

// Load Verse Data
async function loadVerse() {
  try {
    // Show loading state
    arabicVerse.textContent = "Loading...";
    transliterationVerse.textContent = "Loading...";
    translationVerse.textContent = "Loading...";

    // Fetch data in parallel
    const [arabicRes, transliterationRes, translationRes, surahRes] = await Promise.all([
      fetch(`${API_BASE}/ayah/${currentSurah}:${currentVerse}/ar.alafasy`),
      fetch(`${API_BASE}/ayah/${currentSurah}:${currentVerse}/en.transliteration`),
      fetch(`${API_BASE}/ayah/${currentSurah}:${currentVerse}/${translationSelect.value}`),
      fetch(`${API_BASE}/surah/${currentSurah}/en`)
    ]);

    // Process responses
    const arabicData = await arabicRes.json();
    const transliterationData = await transliterationRes.json();
    const translationData = await translationRes.json();
    const surahData = await surahRes.json();

    // Update UI
    arabicVerse.textContent = arabicData.data.text;
    transliterationVerse.textContent = transliterationData.data.text;
    translationVerse.textContent = translationData.data.text;
    verseRef.textContent = `${surahData.data.englishName} ${currentSurah}:${currentVerse}`;

    // Update navigation
    updateNavButtons(surahData.data.numberOfAyahs);
    setActiveSurah();
  } catch (error) {
    console.error("Error loading verse:", error);
    arabicVerse.textContent = "Error loading verse";
  }
}

// Navigation functions
async function updateNavButtons(totalVerses) {
  prevVerseBtn.disabled = currentVerse <= 1;
  nextVerseBtn.disabled = currentVerse >= totalVerses;
}

function setActiveSurah() {
  document.querySelectorAll('.surah-item').forEach(item => {
    item.classList.toggle('active', parseInt(item.dataset.id) === currentSurah);
  });
}

// Event Listeners
prevVerseBtn.addEventListener('click', () => {
  if (currentVerse > 1) {
    currentVerse--;
    loadVerse();
  }
});

nextVerseBtn.addEventListener('click', async () => {
  const res = await fetch(`${API_BASE}/surah/${currentSurah}`);
  const { data } = await res.json();
  if (currentVerse < data.numberOfAyahs) {
    currentVerse++;
    loadVerse();
  }
});

translationSelect.addEventListener('change', loadVerse);

// Theme Toggle
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon();

  themeToggle.addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  themeToggle.title = isDark ? 'Light Mode' : 'Dark Mode';
}

// Search Functionality
searchInput.addEventListener('input', (e) => {
  const term = e.target.value.toLowerCase();
  document.querySelectorAll('.surah-item').forEach(item => {
    const matches = item.textContent.toLowerCase().includes(term);
    item.style.display = matches ? 'flex' : 'none';
  });
// Audio Player
const audioButton = document.getElementById("audio-button");
let currentAudio = null;

async function playVerseAudio() {
  try {
    // Stop currently playing audio
    if (currentAudio) {
      currentAudio.pause();
      audioButton.innerHTML = '<i class="fas fa-play"></i>';
    }

    // Fetch audio from API
    const response = await fetch(`https://api.alquran.cloud/v1/ayah/${currentSurah}:${currentVerse}/ar.alafasy`);
    const { data } = await response.json();
    
    // Create audio element
    currentAudio = new Audio(data.audio);
    audioButton.innerHTML = '<i class="fas fa-pause"></i>';
    
    currentAudio.play().then(() => {
      currentAudio.addEventListener('ended', () => {
        audioButton.innerHTML = '<i class="fas fa-play"></i>';
      });
    });
  } catch (error) {
    console.error("Audio error:", error);
    alert("Failed to load audio");
  }
}

audioButton.addEventListener('click', () => {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
    audioButton.innerHTML = '<i class="fas fa-play"></i>';
  } else {
    playVerseAudio();
  }
});
// Word Analysis
async function loadWordAnalysis() {
    try {
      const response = await fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?verse_key=${currentSurah}:${currentVerse}`);
      const { verses } = await response.json();
      const words = verses[0].text_uthmani.split(/\s+/);
      
      const wordBreakdown = document.getElementById("word-breakdown");
      wordBreakdown.innerHTML = '';
      
      words.forEach((word, index) => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.textContent = word;
        wordElement.dataset.position = index;
        
        // Add click event for word details
        wordElement.addEventListener('click', () => showWordDetails(word, index));
        
        wordBreakdown.appendChild(wordElement);
      });
    } catch (error) {
      console.error("Word analysis error:", error);
    }
  }
  
  async function showWordDetails(word, position) {
    try {
      const response = await fetch(`https://api.quran.com/api/v4/quran/word_by_word/${currentSurah}:${currentVerse}`);
      const { word_by_word } = await response.json();
      
      const wordData = word_by_word[position];
      const tooltip = document.createElement('div');
      tooltip.className = 'word-tooltip';
      tooltip.innerHTML = `
        <strong>${wordData.text_uthmani}</strong><br>
        Translation: ${wordData.translation.text}<br>
        Root: ${wordData.word_root}
      `;
      
      // Position and show tooltip
      const wordElement = document.querySelector(`.word-item[data-position="${position}"]`);
      wordElement.appendChild(tooltip);
      
      // Remove after delay
      setTimeout(() => tooltip.remove(), 3000);
    } catch (error) {
      console.error("Word details error:", error);
    }
  }
// Voice Recognition
const micPermission = document.getElementById("mic-permission");
const enableMicBtn = document.getElementById("enable-mic");

// Check mic permission on startup
if (navigator.permissions) {
  navigator.permissions.query({ name: 'microphone' }).then(permissionStatus => {
    if (permissionStatus.state !== 'granted') {
      micPermission.classList.remove('hidden');
    }
  });
}

enableMicBtn.addEventListener('click', async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    micPermission.classList.add('hidden');
    initVoiceRecognition();
  } catch (error) {
    alert("Microphone access denied. Please enable it in browser settings.");
  }
});

function initVoiceRecognition() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript.toLowerCase();
    handleVoiceCommand(spokenText);
  };

  recognition.onerror = (event) => {
    console.error("Voice error:", event.error);
  };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'v' && e.ctrlKey) {
      recognition.start();
    }
  });
}

function handleVoiceCommand(command) {
  // Example commands:
  if (command.includes("next verse")) {
    document.getElementById("next-verse").click();
  } 
  else if (command.includes("previous verse")) {
    document.getElementById("prev-verse").click();
  }
  else if (command.includes("play audio")) {
    document.getElementById("audio-button").click();
  }
  else if (command.match(/surah (\w+).*verse (\d+)/i)) {
    // Parse surah and verse numbers
    const matches = command.match(/surah (\w+).*verse (\d+)/i);
    // Implement surah/verse navigation
  }
}
});