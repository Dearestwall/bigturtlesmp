/* General Styling */
:root {
  --primary-gradient: linear-gradient(135deg, #1d2b64, #f8cdda);
  --secondary-gradient: linear-gradient(135deg, #4e4376, #2b5876);
  --highlight-color: #f8cdda;
  --highlight-active: rgba(255, 223, 186, 0.8); /* Highlight for speech */
  --background-dark: rgba(0, 0, 0, 0.8);
  --white: #ffffff;
  --black: #000000;
  --font-primary: "Poppins", sans-serif;
  --shadow-light: 0 5px 15px rgba(0, 0, 0, 0.3);
  --shadow-heavy: 0 10px 20px rgba(0, 0, 0, 0.5);
}
/* Highlight Text Styling */
.highlight {
  background-color: var(--highlight-active); /* Soft highlight color */
  color: #070; /* Dark text for better contrast */
  border-radius: 6px; /* Rounded corners for a smoother look */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); /* Subtle shadow to add depth */
  padding: 0 5px; /* Adds some padding for a better visual effect */
  transition: all 0.3s ease-in-out; /* Smooth transitions for hover effect */
}

/* On Hover, the highlighter will have a more intense glow effect */
.highlight:hover {
  background-color: var(
    --highlight-color
  ); /* Light yellowish background on hover */
  color: var(--black); /* Darker text for better visibility */
  transform: scale(1.05); /* Slight zoom-in for added effect */
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2); /* Stronger shadow for emphasis */
}

/* body */
body {
  font-family: var(--font-primary);
  margin: 0;
  padding: 0;
  background: var(--primary-gradient);
  color: var(--white);
  overflow-x: hidden;
}

/* Header Styling */
h1 {
  font-size: 4rem;
  color: transparent;
  background: url("https://www.cjs-cdkeys.com/product_images/uploaded_images/minecraft-java.jpg")
    no-repeat center;
  background-size: cover;
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  margin: 20px auto;
  text-align: center;
  animation: float 3s infinite ease-in-out;
}

h2,
h3 {
  font-size: 1.5rem;
  color: transparent;
  background: url("https://www.cjs-cdkeys.com/product_images/uploaded_images/minecraft-java.jpg")
    no-repeat center;
  background-size: cover;
  -webkit-background-clip: text;
  background-clip: text;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  text-align: center;
  animation: float 3s infinite ease-in-out;
  margin: 20px auto;
}

/* Animations */
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes zoomIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* Episode Grid */
.episode-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeIn 2s ease-in-out;
}

.episode-card {
  background: var(--background-dark);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-light);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.episode-card:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-heavy);
}

.episode-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 10px 10px 0 0;
}

/* Episode Buttons */
.episode-title {
  font-size: 1.5rem;
  color: var(--highlight-color);
  text-align: center;
  padding: 10px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.episode-title:hover {
  color: #f4a261;
  text-decoration: underline;
}

.episode-button {
  display: block;
  margin: 10px auto;
  padding: 10px 20px;
  font-size: 1rem;
  color: var(--white);
  background: linear-gradient(135deg, #4caf50, #3e8e41);
  border: none;
  border-radius: 5px;
  text-align: center;
  cursor: pointer;
  box-shadow: var(--shadow-light);
  transition: background 0.3s ease, transform 0.2s;
}

.episode-button:hover {
  background: linear-gradient(135deg, #3e8e41, #4caf50);
  transform: translateY(-2px);
  box-shadow: var(--shadow-heavy);
}

/* Modal Styling */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: none;
  justify-content: center;
  align-items: center;
  animation: fadeIn 0.5s;
}

.modal.open {
  display: flex;
}

/* Modal Content Styling */
.modal-content {
  background: var(--secondary-gradient); /* Elegant gradient background */
  padding: 25px; /* Comfortable padding for content */
  border-radius: 12px; /* Rounded corners for a polished look */
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2); /* Subtle shadow for depth */
  width: 80%; /* Adaptive width */
  max-width: 800px; /* Prevents excessive width */
  color: var(--white); /* High-contrast text for readability */
  animation: zoomIn 0.5s ease-out; /* Smooth entry animation */
  font-family: var(--font-primary); /* Consistent font */
  overflow: hidden; /* Ensures content doesn’t overflow */
}

/* Modal Header Styling (for Listen, Pause, Resume, and Close buttons) */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
}

.modal-header h2 {
  font-size: 2rem;
  color: var(--highlight-color);
  flex-grow: 1;
  text-align: center;
}

/* Buttons in Modal Header */
button.listen-button,
button.pause-button,
button.resume-button,
button.close-btn {
  background: linear-gradient(135deg, #4caf50, #2e7d32);
  color: #fff;
  padding: 10px 15px;
  font-size: 1rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  margin: 0 5px;
}

button.listen-button:hover,
button.pause-button:hover,
button.resume-button:hover,
button.close-btn:hover {
  background: linear-gradient(135deg, #2e7d32, #4caf50);
  transform: translateY(-3px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.3);
}

button.listen-button {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

button.listen-button:hover {
  background: linear-gradient(135deg, #1976d2, #2196f3);
}

button.pause-button {
  background: linear-gradient(135deg, #f44336, #d32f2f);
}

button.pause-button:hover {
  background: linear-gradient(135deg, #d32f2f, #f44336);
}

button.resume-button {
  background: linear-gradient(135deg, #8bc34a, #7cb342);
}

button.resume-button:hover {
  background: linear-gradient(135deg, #7cb342, #8bc34a);
}

button.close-btn {
  background: #f39c12;
  color: #000;
  font-size: 1rem;
  padding: 10px 15px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
}

button.close-btn:hover {
  background: #f39a9a; /* Slightly brighter on hover */
  transform: scale(1.05); /* Gentle zoom effect */
}

button.close-btn:focus {
  outline: none;
}

.modal-body {
  font-size: 1.2rem;
  line-height: 1.6;
  max-height: 60vh;
  overflow-y: auto;
}
/*modal footer */

.modal-footer {
  display: flex;
  justify-content: space-between;
  padding-top: 15px;
}

.modal-footer button {
  background: linear-gradient(135deg, #f39c12, #e74c3c);
  color: #fff;
  font-size: 1.1rem;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  font-weight: bold;
  width: 45%;
}

.modal-footer button:hover {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.modal-footer button:focus {
  outline: none;
}
/* Footer */
footer {
  text-align: center;
  padding: 10px;
  background: linear-gradient(45deg, #2c3e50, #4ca1af);
  color: var(--white);
  box-shadow: var(--shadow-light);
  border-top: 3px solid #e74c3c;
}

footer p {
  font-size: 1rem;
  margin: 0;
  animation: fadeIn 3s ease-in-out;
}

footer span {
  font-weight: bold;
  color: #f39c12;
  text-shadow: 1px 1px 0px #e74c3c, 2px 2px 0px #3498db;
}

/* Responsive Design */
@media (max-width: 768px) {
  h1 {
    font-size: 2.5rem;
  }

  .episode-title {
    font-size: 1.2rem;
  }

  .modal-content {
    width: 90%;
  }

  .episode-card {
    width: 100%;
  }
}
