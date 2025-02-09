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
// We now store all data for an episode's speech in a "speechData" object.
let speechInstances = {}; // Maps episodeId -> speechData object

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

  // Create the SpeechSynthesisUtterance
  const utterance = new SpeechSynthesisUtterance(text);

  // Create a speechData object to store all related info
  let speechData = {
    utterance: utterance,
    fallbackIndex: 0, // Word index for fallback highlighter
    originalText: text,
    textElement: textElement,
    listenButton: listenButton,
    pauseButton: pauseButton,
    resumeButton: resumeButton,
    isPaused: false
  };
  speechInstances[episodeId] = speechData;

  // Configure utterance properties (voice remains unchanged)
  utterance.lang = "en-US";
  utterance.pitch = 1;    // No change in pitch
  utterance.rate = 1;     // Normal rate
  utterance.volume = 1;

  // Use native onboundary event for highlighting on desktop
  utterance.boundaryFired = false;
  utterance.onboundary = function (event) {
    // If a native boundary event fires, mark it and highlight using it.
    utterance.boundaryFired = true;
    highlightText(textElement, event.charIndex);
  };

  // onstart: decide which highlighter to use.
  // For mobile, always force fallback highlighting.
  // For desktop, wait 250ms to see if onboundary fires.
  utterance.onstart = function () {
    if (isMobile()) {
      startFallbackHighlight(textElement, speechData);
    } else {
      setTimeout(() => {
        if (!utterance.boundaryFired) {
          startFallbackHighlight(textElement, speechData);
        }
      }, 250);
    }
  };

  // onend: clean up UI and highlighting.
  utterance.onend = function () {
    resetButtons(listenButton, pauseButton, resumeButton);
    clearHighlight(textElement);
    console.log("Speech ended.");
  };

  // For desktop, onpause/onresume events (if supported) update the UI.
  // (We use simulation for mobile.)
  utterance.onpause = function () {
    if (!isMobile()) {
      pauseButton.style.display = "none";
      resumeButton.style.display = "inline-block";
      console.log("Speech paused (desktop event).");
    }
  };
  utterance.onresume = function () {
    if (!isMobile()) {
      pauseButton.style.display = "inline-block";
      resumeButton.style.display = "none";
      console.log("Speech resumed (desktop event).");
    }
  };

  // Cancel any previous speech and speak the new utterance immediately.
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);

  // Update UI: hide Listen button, show Pause button.
  listenButton.style.display = "none";
  pauseButton.style.display = "inline-block";
  resumeButton.style.display = "none";
}

// --------------------------
// Pause / Resume Functions
// --------------------------
function pauseSpeech(episodeId) {
  let speechData = speechInstances[episodeId];
  if (!speechData) return;
  if (isMobile()) {
    // For mobile, simulate pause: cancel the utterance and clear fallback interval.
    window.speechSynthesis.cancel();
    if (speechData.utterance.fallbackInterval) {
      clearInterval(speechData.utterance.fallbackInterval);
      speechData.utterance.fallbackInterval = null;
    }
    speechData.isPaused = true;
    // The current fallbackIndex is preserved in speechData.fallbackIndex.
    speechData.pauseButton.style.display = "none";
    speechData.resumeButton.style.display = "inline-block";
    console.log("Speech paused (mobile simulation) at word index:", speechData.fallbackIndex);
  } else {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      speechData.pauseButton.style.display = "none";
      speechData.resumeButton.style.display = "inline-block";
      console.log("Speech paused (desktop).");
    }
  }
}

function resumeSpeech(episodeId) {
  let speechData = speechInstances[episodeId];
  if (!speechData) return;
  if (isMobile()) {
    if (speechData.isPaused) {
      let originalText = speechData.originalText;
      let words = originalText.split(/\s+/);
      let startIdx = speechData.fallbackIndex;
      if (startIdx >= words.length) {
        console.log("No remaining text to resume.");
        return;
      }
      let remainingText = words.slice(startIdx).join(" ");
      // Create a new utterance for the remaining text.
      let newUtterance = new SpeechSynthesisUtterance(remainingText);
      // Copy configuration from the previous utterance.
      newUtterance.lang = speechData.utterance.lang;
      newUtterance.pitch = speechData.utterance.pitch;
      newUtterance.rate = speechData.utterance.rate;
      newUtterance.volume = speechData.utterance.volume;
      // When starting, re-initiate fallback highlighting.
      newUtterance.onstart = function () {
        startFallbackHighlight(speechData.textElement, speechData);
      };
      newUtterance.onend = function () {
        resetButtons(speechData.listenButton, speechData.pauseButton, speechData.resumeButton);
        clearHighlight(speechData.textElement);
        console.log("Resumed speech ended.");
      };
      // Replace the old utterance with the new one.
      speechData.utterance = newUtterance;
      speechData.isPaused = false;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(newUtterance);
      // Update UI: show Pause button, hide Resume.
      speechData.pauseButton.style.display = "inline-block";
      speechData.resumeButton.style.display = "none";
      console.log("Speech resumed (mobile simulation) starting from word index", startIdx);
    }
  } else {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      speechData.pauseButton.style.display = "inline-block";
      speechData.resumeButton.style.display = "none";
      console.log("Speech resumed (desktop).");
    }
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
// Native highlighter: uses the character index to update highlighting.
function highlightText(element, startIndex) {
  const text = element.innerText || element.textContent;
  const before = text.slice(0, startIndex);
  const word = text.slice(startIndex).split(" ")[0];
  const after = text.slice(startIndex + word.length);
  element.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;
  const span = element.querySelector(".highlight");
  if (span) {
    span.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

// Clear highlighting by restoring the original text.
function clearHighlight(element) {
  element.innerHTML = element.innerText || element.textContent;
}

// Fallback highlighter: uses a timer to highlight word by word.
function startFallbackHighlight(element, speechData) {
  // Store original text in a data attribute for consistency.
  if (!element.dataset.originalText) {
    element.dataset.originalText = element.innerText || element.textContent;
  }
  const originalText = element.dataset.originalText;
  const words = originalText.split(/\s+/);
  speechData.fallbackIndex = 0;
  const wordDuration = 400 / speechData.utterance.rate; // Estimate duration per word.
  // Save the interval ID in the utterance object.
  speechData.utterance.fallbackInterval = setInterval(() => {
    if (window.speechSynthesis.paused) return;
    if (speechData.fallbackIndex >= words.length) {
      clearInterval(speechData.utterance.fallbackInterval);
      speechData.utterance.fallbackInterval = null;
      return;
    }
    fallbackHighlightWord(element, speechData.fallbackIndex);
    speechData.fallbackIndex++;
  }, wordDuration);
}

// Fallback: highlight the word at the given index and autoscroll it into view.
function fallbackHighlightWord(element, wordIndex) {
  const originalText = element.dataset.originalText || (element.innerText || element.textContent);
  const words = originalText.split(/\s+/);
  const rebuilt = words
    .map((w, idx) => (idx === wordIndex ? `<span class="highlight">${w}</span>` : w))
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
