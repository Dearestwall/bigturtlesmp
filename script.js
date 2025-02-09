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
  if (modal) modal.classList.add("open");
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

  // Reset buttons and clear any highlighting
  resetButtons(listenButton, pauseButton, resumeButton);
  clearHighlight(textElement);
}

// --------------------------
// Speech Synthesis Management
// --------------------------
let speechInstances = {}; // To keep track of utterances per episode

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

  // Create a new utterance
  const utterance = new SpeechSynthesisUtterance(text);
  speechInstances[episodeId] = utterance;

  // Configure voice properties (keep voice unchanged)
  utterance.lang = "en-US";
  utterance.pitch = 1;    // No change in pitch
  utterance.rate = 1;     // Normal rate
  utterance.volume = 1;

  // For mobile, force fallback highlighting since onboundary is unreliable.
  // For desktop, use native onboundary if available.
  utterance.boundaryFired = false;
  utterance.onboundary = function (event) {
    // Mark that native boundary event fired
    utterance.boundaryFired = true;
    // Use native highlighting (only works on desktop)
    highlightText(textElement, event.charIndex);
  };

  // onstart: decide which highlighter to use
  utterance.onstart = function () {
    if (isMobile()) {
      // Immediately start fallback highlighting on mobile
      startFallbackHighlight(textElement, utterance);
    } else {
      // Wait a short moment to see if onboundary fires; if not, use fallback.
      setTimeout(() => {
        if (!utterance.boundaryFired) {
          startFallbackHighlight(textElement, utterance);
        }
      }, 250);
    }
  };

  // onend: reset UI and clear highlighting
  utterance.onend = function () {
    resetButtons(listenButton, pauseButton, resumeButton);
    clearHighlight(textElement);
    console.log("Speech ended.");
  };

  // Optional: update UI on pause/resume events (if supported)
  utterance.onpause = function () {
    const pBtn = document.querySelector(`#${episodeId} .pause-button`);
    const rBtn = document.querySelector(`#${episodeId} .resume-button`);
    if (pBtn && rBtn) {
      pBtn.style.display = "none";
      rBtn.style.display = "inline-block";
    }
    console.log("Speech paused (event).");
  };

  utterance.onresume = function () {
    const pBtn = document.querySelector(`#${episodeId} .pause-button`);
    const rBtn = document.querySelector(`#${episodeId} .resume-button`);
    if (pBtn && rBtn) {
      pBtn.style.display = "inline-block";
      rBtn.style.display = "none";
    }
    console.log("Speech resumed (event).");
  };

  // Cancel any ongoing speech and start this utterance immediately
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  // Update button UI: hide Listen, show Pause
  listenButton.style.display = "none";
  pauseButton.style.display = "inline-block";
  resumeButton.style.display = "none";
}

function pauseSpeech(episodeId) {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();
    const pBtn = document.querySelector(`#${episodeId} .pause-button`);
    const rBtn = document.querySelector(`#${episodeId} .resume-button`);
    if (pBtn && rBtn) {
      pBtn.style.display = "none";
      rBtn.style.display = "inline-block";
    }
    console.log("Speech paused via button.");
  }
}

function resumeSpeech(episodeId) {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    const pBtn = document.querySelector(`#${episodeId} .pause-button`);
    const rBtn = document.querySelector(`#${episodeId} .resume-button`);
    if (pBtn && rBtn) {
      pBtn.style.display = "inline-block";
      rBtn.style.display = "none";
    }
    console.log("Speech resumed via button.");
  }
}

function resetButtons(listenButton, pauseButton, resumeButton) {
  listenButton.style.display = "inline-block";
  pauseButton.style.display = "none";
  resumeButton.style.display = "none";
}

// --------------------------
// Highlighting & Autoscroll
// --------------------------
// Native highlighter: highlights based on character index and scrolls into view.
function highlightText(element, startIndex) {
  const text = element.innerText || element.textContent;
  const before = text.slice(0, startIndex);
  const word = text.slice(startIndex).split(" ")[0];
  const after = text.slice(startIndex + word.length);
  element.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;

  // Autoscroll: scroll the highlighted word into view.
  const span = element.querySelector(".highlight");
  if (span) {
    span.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Fallback highlighter: used when native onboundary is unavailable.
function startFallbackHighlight(element, utterance) {
  // Store original text in a data attribute for consistency.
  if (!element.dataset.originalText) {
    element.dataset.originalText = element.innerText || element.textContent;
  }
  const originalText = element.dataset.originalText;
  const words = originalText.split(/\s+/);
  utterance.currentFallbackIndex = 0;
  const wordDuration = 400 / utterance.rate; // Estimate per word

  utterance.fallbackInterval = setInterval(() => {
    if (window.speechSynthesis.paused) return; // Do nothing if paused.
    if (utterance.currentFallbackIndex >= words.length) {
      clearInterval(utterance.fallbackInterval);
      utterance.fallbackInterval = null;
      return;
    }
    fallbackHighlightWord(element, utterance.currentFallbackIndex);
    utterance.currentFallbackIndex++;
  }, wordDuration);
}

// Fallback: highlight word at given index and autoscroll.
function fallbackHighlightWord(element, wordIndex) {
  const originalText = element.dataset.originalText || (element.innerText || element.textContent);
  const words = originalText.split(/\s+/);
  const rebuilt = words
    .map((w, idx) =>
      idx === wordIndex ? `<span class="highlight">${w}</span>` : w
    )
    .join(" ");
  element.innerHTML = rebuilt;
  const span = element.querySelector(".highlight");
  if (span) {
    span.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// --------------------------
// Episode Navigation
// --------------------------
const TOTAL_EPISODES = 9;

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
