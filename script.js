// --------------------------
// Utility: Detect Mobile Devices
// --------------------------
function isMobile() {
  return /Mobi|Android/i.test(navigator.userAgent);
}

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
    }, 500);
  }

  // Immediately cancel any ongoing speech
  window.speechSynthesis.cancel();

  // Reset buttons and clear any text highlighting
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
  const utterance = new SpeechSynthesisUtterance(text);
  speechInstances[episodeId] = utterance;

  // Configure voice properties (voice remains unchanged)
  utterance.lang = "en-US";
  utterance.pitch = 1;  // No change in pitch
  utterance.rate = 1;   // Normal rate
  utterance.volume = 1;

  // Use native onboundary event for word highlighting (if supported)
  utterance.boundaryFired = false;
  utterance.onboundary = (event) => {
    // If this event fires, we mark that native boundary highlighting is available.
    utterance.boundaryFired = true;
    highlightText(textElement, event.charIndex);
  };

  // onstart: Start fallback highlighter immediately on mobile,
  // or after 250ms on desktop if onboundary has not fired.
  utterance.onstart = () => {
    if (isMobile()) {
      // On mobile, force fallback highlighting since onboundary is unreliable.
      startFallbackHighlight(textElement, utterance);
    } else {
      setTimeout(() => {
        if (!utterance.boundaryFired) {
          startFallbackHighlight(textElement, utterance);
        }
      }, 250);
    }
  };

  // onend: Reset UI and clear highlighting
  utterance.onend = () => {
    resetButtons(listenButton, pauseButton, resumeButton);
    clearHighlight(textElement);
    console.log("Speech ended.");
  };

  // (Optional) Add onpause and onresume events if supported by the browser
  utterance.onpause = () => {
    const pauseBtn = document.querySelector(`#${episodeId} .pause-button`);
    const resumeBtn = document.querySelector(`#${episodeId} .resume-button`);
    if (pauseBtn && resumeBtn) {
      pauseBtn.style.display = "none";
      resumeBtn.style.display = "inline-block";
    }
    console.log("Speech paused (event).");
  };

  utterance.onresume = () => {
    const pauseBtn = document.querySelector(`#${episodeId} .pause-button`);
    const resumeBtn = document.querySelector(`#${episodeId} .resume-button`);
    if (pauseBtn && resumeBtn) {
      pauseBtn.style.display = "inline-block";
      resumeBtn.style.display = "none";
    }
    console.log("Speech resumed (event).");
  };

  // Cancel any ongoing speech and immediately start this utterance
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  // Update button visibility: hide Listen, show Pause
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
  listenButton.style.display = "inline-block";
  pauseButton.style.display = "none";
  resumeButton.style.display = "none";
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

// Function to clear highlighting (restore original text)
function clearHighlight(element) {
  element.innerHTML = element.innerText || element.textContent;
}

// --------------------------
// Fallback Highlighter & Autoscroll
// --------------------------
// In environments where onboundary isn't reliable (common on mobile),
// this fallback highlights word by word using a timer.
function startFallbackHighlight(textElement, utterance) {
  // Ensure we store the original text in a data attribute for repeated use.
  if (!textElement.dataset.originalText) {
    textElement.dataset.originalText = textElement.innerText || textElement.textContent;
  }
  const originalText = textElement.dataset.originalText;
  const words = originalText.split(/\s+/);
  utterance.currentFallbackIndex = 0;
  const wordDuration = 400 / utterance.rate; // Estimated time per word

  utterance.fallbackInterval = setInterval(() => {
    if (window.speechSynthesis.paused) return; // Do not update while paused
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

  // Autoscroll: Find the highlighted word and scroll it into view.
  const highlightSpan = element.querySelector(".highlight");
  if (highlightSpan) {
    highlightSpan.scrollIntoView({ behavior: "smooth", block: "center" });
  }
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
    setTimeout(() => openModal(`episode${targetEpisode}`), 200);
    handleButtonVisibility(targetEpisode);
  }
}

function handleButtonVisibility(currentEpisode) {
  const prevButton = document.querySelector(`#episode${currentEpisode} .prev-episode`);
  const nextButton = document.querySelector(`#episode${currentEpisode} .next-episode`);
  if (prevButton) prevButton.disabled = currentEpisode === 1;
  if (nextButton) nextButton.disabled = currentEpisode === TOTAL_EPISODES;
}
