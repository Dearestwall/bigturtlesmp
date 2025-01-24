// Modal Management
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
    }, 500); // Wait for the animation to complete
  }

  // Stop ongoing speech synthesis
  window.speechSynthesis.cancel();

  // Reset buttons and clear text highlights
  resetButtons(listenButton, pauseButton, resumeButton);
  clearHighlight(textElement);
}

// Speech Synthesis Management
let currentSpeechInstance = null;

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

  // Create a new SpeechSynthesisUtterance instance
  const speechInstance = new SpeechSynthesisUtterance(text);
  currentSpeechInstance = speechInstance;

  // Configure voice properties
  speechInstance.lang = "en-US";
  speechInstance.pitch = 1;
  speechInstance.rate = 1;
  speechInstance.volume = 1;

  // Highlight words as they are spoken
  speechInstance.onboundary = (event) => {
    const currentIndex = event.charIndex;
    highlightText(textElement, currentIndex);
  };

  // Handle speech end
  speechInstance.onend = () => {
    resetButtons(listenButton, pauseButton, resumeButton);
    clearHighlight(textElement);
  };

  // Stop ongoing speech and start new speech
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speechInstance);

  // Update button visibility
  listenButton.style.display = "none";
  pauseButton.style.display = "inline-block";
  resumeButton.style.display = "none";
}

function pauseSpeech() {
  if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
    window.speechSynthesis.pause();

    // Toggle button visibility
    togglePauseResumeButtons("pause");
  }
}

function resumeSpeech() {
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();

    // Toggle button visibility
    togglePauseResumeButtons("resume");
  }
}

function togglePauseResumeButtons(state) {
  const pauseButtons = document.querySelectorAll(".pause-button");
  const resumeButtons = document.querySelectorAll(".resume-button");

  pauseButtons.forEach((btn) => (btn.style.display = state === "pause" ? "none" : "inline-block"));
  resumeButtons.forEach((btn) => (btn.style.display = state === "pause" ? "inline-block" : "none"));
}

function resetButtons(listenButton, pauseButton, resumeButton) {
  if (listenButton) listenButton.style.display = "inline-block";
  if (pauseButton) pauseButton.style.display = "none";
  if (resumeButton) resumeButton.style.display = "none";
}

function highlightText(element, startIndex) {
  const text = element.innerText || element.textContent;
  const before = text.slice(0, startIndex);
  const word = text.slice(startIndex).split(" ")[0];
  const after = text.slice(startIndex + word.length);

  element.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;
}

function clearHighlight(element) {
  element.innerHTML = element.innerText || element.textContent;
}

// Episode Navigation
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
  const nextButton = document.querySelector(`#${currentEpisode} .next-episode`);

  if (prevButton) prevButton.disabled = currentEpisode === 1;
  if (nextButton) nextButton.disabled = currentEpisode === TOTAL_EPISODES;
}
