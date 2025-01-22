function openModal(episode) {
  document.getElementById(episode).classList.add("open");
}

function closeModal(episode) {
  const modal = document.getElementById(episode);
  modal.style.animation = "fadeOutModal 0.5s forwards";
  setTimeout(() => {
    modal.classList.remove("open");
    modal.style.animation = "";
  }, 500);
}
let speechInstance; // Global instance for speech
let isSpeaking = false; // Tracks if speech is ongoing

function startSpeech(elementId) {
  const textElement = document.getElementById(elementId);
  const listenButton = document.getElementById("listen-button");
  const pauseButton = document.getElementById("pause-button");
  const resumeButton = document.getElementById("resume-button");

  if (!textElement) {
    console.error(`Element with id "${elementId}" not found.`);
    return;
  }

  const text = textElement.innerText || textElement.textContent;
  speechInstance = new SpeechSynthesisUtterance(text);

  // Configure voice properties
  speechInstance.lang = "en-US";
  speechInstance.pitch = 1;
  speechInstance.rate = 1;
  speechInstance.volume = 1;

  // Event listener for word highlighting
  speechInstance.onboundary = (event) => {
    const currentIndex = event.charIndex;
    highlightText(textElement, currentIndex);
  };

  // Stop speech on close
  speechInstance.onend = () => {
    resetButtons(listenButton, pauseButton, resumeButton);
    clearHighlight(textElement);
  };

  // Speak the text
  window.speechSynthesis.cancel(); // Stop any ongoing speech
  window.speechSynthesis.speak(speechInstance);
  isSpeaking = true;

  // Toggle button visibility
  listenButton.style.display = "none";
  pauseButton.style.display = "inline-block";
  resumeButton.style.display = "none";
}

function pauseSpeech() {
  if (isSpeaking && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    isSpeaking = false;

    // Toggle button visibility
    document.getElementById("pause-button").style.display = "none";
    document.getElementById("resume-button").style.display = "inline-block";
  }
}

function resumeSpeech() {
  if (!isSpeaking && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    isSpeaking = true;

    // Toggle button visibility
    document.getElementById("pause-button").style.display = "inline-block";
    document.getElementById("resume-button").style.display = "none";
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  const listenButton = document.getElementById("listen-button");
  const pauseButton = document.getElementById("pause-button");
  const resumeButton = document.getElementById("resume-button");
  const textElement = document.getElementById("episode9-text");

  if (modal) modal.style.display = "none";

  // Stop speech synthesis
  window.speechSynthesis.cancel();
  resetButtons(listenButton, pauseButton, resumeButton);
  clearHighlight(textElement);
}

function resetButtons(listenButton, pauseButton, resumeButton) {
  listenButton.style.display = "inline-block";
  pauseButton.style.display = "none";
  resumeButton.style.display = "none";
  isSpeaking = false;
}

function highlightText(element, startIndex) {
  const text = element.innerText || element.textContent;
  const before = text.slice(0, startIndex);
  const word = text.slice(startIndex).split(" ")[0];
  const after = text.slice(startIndex + word.length);

  element.innerHTML = `${before}<span class="highlight">${word}</span>${after}`;
}

function clearHighlight(element) {
  element.innerHTML = element.innerText || element.textContent; // Clear highlighting
}
