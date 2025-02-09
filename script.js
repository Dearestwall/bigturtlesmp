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
  window.speechSynthesis.cancel();
  resetButtons(listenButton, pauseButton, resumeButton);
  clearHighlight(textElement);
}

// --------------------------
// Speech Synthesis Management
// --------------------------
// We'll store a speechData object for each episode.
let speechInstances = {}; // Maps episodeId -> speechData

function startSpeech(textId, episodeId) {
  const textElement = document.getElementById(textId);
  const listenButton = document.querySelector(`#${episodeId} .listen-button`);
  const pauseButton = document.querySelector(`#${episodeId} .pause-button`);
  const resumeButton = document.querySelector(`#${episodeId} .resume-button`);
  
  if (!textElement) {
    console.error(`Element with id "${textId}" not found.`);
    return;
  }
  
  const fullText = textElement.innerText || textElement.textContent;
  if (!fullText || fullText.trim() === "") {
    console.error("No text content found for speech.");
    return;
  }
  
  // Create and store a new speechData object.
  let speechData = {
    originalText: fullText,
    textElement: textElement,
    utterance: null,
    fallbackInterval: null,
    // fallbackIndex: index (in number of words) of the next word to speak,
    // For mobile simulation, this will also be saved as resumeWordIndex upon pause.
    fallbackIndex: 0,
    isPaused: false,
    resumeWordIndex: 0,
    listenButton: listenButton,
    pauseButton: pauseButton,
    resumeButton: resumeButton
  };
  speechInstances[episodeId] = speechData;
  
  // Create an utterance for the full text.
  let utterance = new SpeechSynthesisUtterance(fullText);
  speechData.utterance = utterance;
  
  // Configure utterance properties (keeping the voice unchanged).
  utterance.lang = "en-US";
  utterance.pitch = 1;
  utterance.rate = 1;
  utterance.volume = 1;
  
  // Use native onboundary event (desktop only).
  utterance.boundaryFired = false;
  utterance.onboundary = function(event) {
    utterance.boundaryFired = true;
    // Use native highlighting
    highlightText(textElement, event.charIndex);
  };
  
  // onstart: decide which highlighter to use.
  utterance.onstart = function() {
    if (isMobile()) {
      // On mobile, immediately start fallback highlighting.
      startFallbackHighlighter(speechData);
    } else {
      // On desktop, wait briefly; if native boundary events haven't fired, use fallback.
      setTimeout(() => {
        if (!utterance.boundaryFired) {
          startFallbackHighlighter(speechData);
        }
      }, 250);
    }
  };
  
  // onend: clean up UI.
  utterance.onend = function() {
    resetButtons(listenButton, pauseButton, resumeButton);
    clearHighlight(textElement);
    console.log("Speech ended.");
  };
  
  // For desktop, let native onpause/onresume update UI (if supported).
  utterance.onpause = function() {
    if (!isMobile()) {
      pauseButton.style.display = "none";
      resumeButton.style.display = "inline-block";
      console.log("Speech paused (desktop event).");
    }
  };
  utterance.onresume = function() {
    if (!isMobile()) {
      pauseButton.style.display = "inline-block";
      resumeButton.style.display = "none";
      console.log("Speech resumed (desktop event).");
    }
  };
  
  // Cancel any ongoing speech and start this utterance immediately.
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  
  // Update UI: hide Listen, show Pause.
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
    // Simulate pause on mobile by canceling the utterance and stopping the fallback highlighter.
    window.speechSynthesis.cancel();
    if (speechData.fallbackInterval) {
      clearInterval(speechData.fallbackInterval);
      speechData.fallbackInterval = null;
    }
    speechData.isPaused = true;
    // Save current fallback index as the resume index.
    speechData.resumeWordIndex = speechData.fallbackIndex;
    speechData.pauseButton.style.display = "none";
    speechData.resumeButton.style.display = "inline-block";
    console.log("Speech paused (mobile simulation) at word index:", speechData.resumeWordIndex);
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
      // Rebuild the remaining text from the original text using the saved resumeWordIndex.
      let words = speechData.originalText.split(/\s+/);
      if (speechData.resumeWordIndex >= words.length) {
        console.log("No remaining text to resume.");
        return;
      }
      let remainingText = words.slice(speechData.resumeWordIndex).join(" ");
      // Reset the text element to show only the remaining text.
      speechData.textElement.innerHTML = remainingText;
      
      // Create a new utterance for the remaining text.
      let newUtterance = new SpeechSynthesisUtterance(remainingText);
      // Copy configuration from the previous utterance.
      newUtterance.lang = speechData.utterance.lang;
      newUtterance.pitch = speechData.utterance.pitch;
      newUtterance.rate = speechData.utterance.rate;
      newUtterance.volume = speechData.utterance.volume;
      
      // Reset fallback index for the new utterance.
      speechData.fallbackIndex = 0;
      // Set up onstart for the new utterance to start the fallback highlighter.
      newUtterance.onstart = function() {
        startFallbackHighlighter(speechData);
      };
      newUtterance.onend = function() {
        resetButtons(speechData.listenButton, speechData.pauseButton, speechData.resumeButton);
        clearHighlight(speechData.textElement);
        console.log("Resumed speech ended.");
      };
      // Replace the old utterance with the new one and start speaking.
      speechData.utterance = newUtterance;
      speechData.isPaused = false;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(newUtterance);
      
      // Update UI.
      speechData.pauseButton.style.display = "inline-block";
      speechData.resumeButton.style.display = "none";
      console.log("Speech resumed (mobile simulation) from word index", speechData.resumeWordIndex);
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
// Highlighting & Autoscroll Functions
// --------------------------
// Native highlighter: uses a character index to highlight a word.
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

// Clear highlighting: restore the full original text.
function clearHighlight(element) {
  element.innerHTML = element.innerText || element.textContent;
}

// Fallback highlighter: for environments (mobile) where native onboundary is unreliable.
function startFallbackHighlighter(speechData) {
  const element = speechData.textElement;
  // Ensure the original text is stored.
  if (!element.dataset.originalText) {
    element.dataset.originalText = element.innerText || element.textContent;
  }
  const originalText = element.dataset.originalText;
  const words = originalText.split(/\s+/);
  speechData.fallbackIndex = 0;
  const wordDuration = 400 / speechData.utterance.rate; // time per word
  
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

// Fallback: highlight a word by its index and autoscroll.
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
