// --------------------------
// Modal Management
// --------------------------
function openModal(episodeId) {
  const modal = document.getElementById(episodeId);
  if (modal) modal.classList.add("open"); // Show the modal
}

function closeModal(episodeId) {
  const modal = document.getElementById(episodeId);
  const listenButton = document.querySelector(`#${episodeId} .listen-button`);
  const pauseButton = document.querySelector(`#${episodeId} .pause-button`);
  const resumeButton = document.querySelector(`#${episodeId} .resume-button`);
  const textElement = document.getElementById(`${episodeId}-text`);

  if (modal) {
    modal.style.animation = "fadeOutModal 0.5s forwards";
    setTimeout(() => {
      modal.classList.remove("open");
      modal.style.animation = "";
    }, 500); // Wait for the animation to complete
  }

  // Stop any ongoing speech synthesis immediately
  window.speechSynthesis.cancel();

  // Reset buttons and clear text highlights
  resetButtons(listenButton, pauseButton, resumeButton);
  clearHighlight(textElement);
}

// --------------------------
// Speech Synthesis Management
// --------------------------
let speechInstances = {}; // Store speech instances per episode

function startSpeech(textId, episodeId) {
  const textElement = document.getElementById(textId);
  const listenButton = document.querySelector(`#${episodeId} .listen-button`);
  const pauseButton = document.querySelector(`#${episodeId} .pause-button`);
  const resumeButton = document.querySelector(`#${episodeId} .resume-button`);

  if (!textElement) {
    console.error(`Element with id "${textId}" not found.`);
    return;
  }

  const text = textElement.innerText || textElement.textContent;
  if (!text || text.trim() === "") {
    console.error("No text content found for speech.");
    return;
  }

  // Create a new SpeechSynthesisUtterance instance
  const speechInstance = new SpeechSynthesisUtterance(text);
  speechInstances[episodeId] = speechInstance;

  // Configure voice properties (voice remains unchanged)
  speechInstance.lang = "en-US";
  speechInstance.pitch = 1;  // No change in pitch
  speechInstance.rate = 1;   // Normal rate
  speechInstance.volume = 1;

  // Use native onboundary event for word highlighting (if supported)
  speechInstance.onboundary = (event) => {
    const currentIndex = event.charIndex;
    highlightText(textElement, currentIndex);
  };

  // onpause and onresume events update UI accordingly (if supported)
  speechInstance.onpause = () => {
    const pauseBtn = document.querySelector(`#${episodeId} .pause-button`);
    const resumeBtn = document.querySelector(`#${episodeId} .resume-button`);
    if (pauseBtn && resumeBtn) {
      pauseBtn.style.display = "none";
      resumeBtn.style.display = "inline-block";
    }
    console.log("Speech paused (event).");
  };

  speechInstance.onresume = () => {
    const pauseBtn = document.querySelector(`#${episodeId} .pause-button`);
    const resumeBtn = document.querySelector(`#${episodeId} .resume-button`);
    if (pauseBtn && resumeBtn) {
      pauseBtn.style.display = "inline-block";
      resumeBtn.style.display = "none";
    }
    console.log("Speech resumed (event).");
  };

  // Handle speech end: reset UI and clear highlighting
  speechInstance.onend = () => {
    resetButtons(listenButton, pauseButton, resumeButton);
    clearHighlight(textElement);
    console.log("Speech ended.");
  };

  // Cancel any ongoing speech and start this new utterance immediately
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speechInstance);

  // Update button visibility immediately: hide Listen, show Pause
  listenButton.style.display = "none";
  pauseButton.style.display = "inline-block";
  resumeButton.style.display = "none";
}

function pauseSpeech(episodeId) {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    const pauseButton = document.querySelector(`#${episodeId} .pause-button`);
    const resumeButton = document.querySelector(`#${episodeId} .resume-button`);
    pauseButton.style.display = "none";
    resumeButton.style.display = "inline-block";
    console.log("Speech paused via button.");
  }
}

function resumeSpeech(episodeId) {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    const pauseButton = document.querySelector(`#${episodeId} .pause-button`);
    const resumeButton = document.querySelector(`#${episodeId} .resume-button`);
    pauseButton.style.display = "inline-block";
    resumeButton.style.display = "none";
    console.log("Speech resumed via button.");
  }
}

function resetButtons(listenButton, pauseButton, resumeButton) {
  listenButton.style.display = "inline-block"; // Show Listen button
  pauseButton.style.display = "none";            // Hide Pause button
  resumeButton.style.display = "none";           // Hide Resume button
}

// Function to highlight a word in the text using the character index
function highlightText(element, startIndex) {
  const text = element.innerText || element.textContent;
  const before = text.slice(0, startIndex);
  const word = text.slice(startIndex).split(" ")[0];
  const after = text.slice(startIndex + word.length);
  element.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;

  // --- Autoscroll Feature ---
  // Find the highlighted span and scroll it into view smoothly.
  const highlightSpan = element.querySelector(".highlight");
  if (highlightSpan) {
    highlightSpan.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Function to clear highlighting from the text (restore plain text)
function clearHighlight(element) {
  element.innerHTML = element.innerText || element.textContent;
}

// --------------------------
// Episode Navigation
// --------------------------
const TOTAL_EPISODES = 9; // Total number of episodes

function navigateEpisode(direction, currentEpisode) {
  const nextEpisode = currentEpisode < TOTAL_EPISODES ? currentEpisode + 1 : null;
  const prevEpisode = currentEpisode > 1 ? currentEpisode - 1 : null;
  const targetEpisode = direction === "next" ? nextEpisode : prevEpisode;

  if (targetEpisode) {
    closeModal(`episode${currentEpisode}`);
    setTimeout(() => openModal(`episode${targetEpisode}`), 200); // Smooth transition
    handleButtonVisibility(targetEpisode);
  }
}

function handleButtonVisibility(currentEpisode) {
  const prevButton = document.querySelector(`#episode${currentEpisode} .prev-episode`);
  const nextButton = document.querySelector(`#episode${currentEpisode} .next-episode`);
  if (prevButton) prevButton.disabled = currentEpisode === 1;
  if (nextButton) nextButton.disabled = currentEpisode === TOTAL_EPISODES;
}

// --------------------------
// Autoscroll in Fallback Highlighter
// --------------------------
// (If native onboundary doesn't fire, a fallback highlighter updates word by word)
function startFallbackHighlight(textElement, utterance) {
  const originalText = textElement.innerText || textElement.textContent;
  // Optionally, store the original text in a data attribute if needed
  if (!textElement.dataset.originalText) {
    textElement.dataset.originalText = originalText;
  }
  const words = originalText.split(/\s+/);
  utterance.currentFallbackIndex = 0;
  const wordDuration = 400 / utterance.rate; // Estimate duration per word

  utterance.fallbackInterval = setInterval(() => {
    if (window.speechSynthesis.paused) return; // Skip updates if paused
    if (utterance.currentFallbackIndex >= words.length) {
      clearInterval(utterance.fallbackInterval);
      utterance.fallbackInterval = null;
      return;
    }
    fallbackHighlightWord(textElement, utterance.currentFallbackIndex);
    utterance.currentFallbackIndex++;
  }, wordDuration);
}

// Fallback: Highlight the word at the given index and autoscroll it into view
function fallbackHighlightWord(element, wordIndex) {
  const originalText = element.dataset.originalText || (element.innerText || element.textContent);
  const words = originalText.split(/\s+/);
  const rebuilt = words
    .map((word, idx) =>
      idx === wordIndex ? `<span class="highlight">${word}</span>` : word
    )
    .join(" ");
  element.innerHTML = rebuilt;
  
  // --- Autoscroll Feature ---
  const highlightSpan = element.querySelector(".highlight");
  if (highlightSpan) {
    highlightSpan.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
