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

// Load Surah List from API
async function loadSurahList() {
  try {
    const response = await fetch(`${API_BASE}/surah`);
    const { data } = await response.json();
    
    surahList.innerHTML = data.map(surah => `
      <div class="surah-item ${surah.number === currentSurah ? 'active' : ''}" 
           data-id="${surah.number}">
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
        updateActiveSurah();
      });
    });
  } catch (error) {
    console.error("Failed to load surah list:", error);
  }
}

// Load Verse Data from API
async function loadVerse() {
  try {
    // Get Arabic text
    const arabicRes = await fetch(`${API_BASE}/ayah/${currentSurah}:${currentVerse}/ar.alafasy`);
    const arabicData = await arabicRes.json();
    
    // Get translation (English by default)
    const translationLang = document.getElementById("translation-select").value;
    const translationRes = await fetch(`${API_BASE}/ayah/${currentSurah}:${currentVerse}/en.sahih`);
    const translationData = await translationRes.json();
    
    // Get transliteration
    const transliterationRes = await fetch(`${API_BASE}/ayah/${currentSurah}:${currentVerse}/en.transliteration`);
    const transliterationData = await transliterationRes.json();

    // Update UI
    arabicVerse.textContent = arabicData.data.text;
    transliterationVerse.textContent = transliterationData.data.text;
    translationVerse.textContent = translationData.data.text;
    
    // Update surah name in reference
    const surahNameRes = await fetch(`${API_BASE}/surah/${currentSurah}/en`);
    const surahNameData = await surahNameRes.json();
    verseRef.textContent = `${surahNameData.data.englishName}:${currentVerse}`;

    // Update navigation buttons
    updateNavButtons();
  } catch (error) {
    console.error("Failed to load verse:", error);
    arabicVerse.textContent = "Error loading verse. Please try again.";
  }
}

// Update navigation buttons state
async function updateNavButtons() {
  const surahInfoRes = await fetch(`${API_BASE}/surah/${currentSurah}`);
  const surahInfo = await surahInfoRes.json();
  
  prevVerseBtn.disabled = currentVerse === 1;
  nextVerseBtn.disabled = currentVerse === surahInfo.data.numberOfAyahs;
}

// Initialize
loadSurahList();
loadVerse();

// Translation Selector Change
document.getElementById("translation-select").addEventListener("change", loadVerse);

// Navigation Buttons
prevVerseBtn.addEventListener("click", () => {
  if (currentVerse > 1) {
    currentVerse--;
    loadVerse();
  }
});

nextVerseBtn.addEventListener("click", async () => {
  const surahInfoRes = await fetch(`${API_BASE}/surah/${currentSurah}`);
  const surahInfo = await surahInfoRes.json();
  
  if (currentVerse < surahInfo.data.numberOfAyahs) {
    currentVerse++;
    loadVerse();
  }
});
// Update theme icon based on API loading state
function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    themeToggle.innerHTML = isDark 
      ? '<i class="fas fa-sun"></i>' 
      : '<i class="fas fa-moon"></i>';
    themeToggle.title = isDark ? "Light Mode" : "Dark Mode";
    
    // API loading indicator
    if (isLoading) {
      themeToggle.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';
    }
  }
  