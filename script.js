// Variable Declarations & Experiment State
let currentHand = "Dominant"; // 'Dominant' or 'Non-Dominant'
let state = "idle"; // 'idle', 'waiting', 'ready', 'early', 'finished'
let startTime = 0;
let timeOutId = null;

// Store reaction times for both hands (5 trials each)
const results = {
  Dominant: [],
  "Non-Dominant": []
};

const MAX_TRIALS = 5;

// DOM Element References
const testBox = document.getElementById("test-box");
const boxTitle = document.getElementById("box-title");
const boxDesc = document.getElementById("box-desc");
const trialCounter = document.getElementById("trial-counter");
const currentHandText = document.getElementById("current-hand-text");
const terminalOutput = document.getElementById("terminal-output");

const btnDominant = document.getElementById("btn-dominant");
const btnNonDominant = document.getElementById("btn-nondominant");

// Event Listeners for Hand Selection Buttons
btnDominant.addEventListener("click", () => setHand("Dominant"));
btnNonDominant.addEventListener("click", () => setHand("Non-Dominant"));

// Event Listener for Spacebar Press
document.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    // Prevent default scrolling behavior when pressing spacebar
    event.preventDefault();
    handleInput();
  }
});

// Event Listener for Direct Clicks on the Box
testBox.addEventListener("mousedown", () => {
  handleInput();
});

// Switch Active Hand Mode
function setHand(hand) {
  if (state === "waiting") {
    clearTimeout(timeOutId);
  }
  currentHand = hand;
  currentHandText.textContent = hand;

  if (hand === "Dominant") {
    btnDominant.classList.add("btn-active");
    btnNonDominant.classList.remove("btn-active");
  } else {
    btnNonDominant.classList.add("btn-active");
    btnDominant.classList.remove("btn-active");
  }

  resetTestState();
}

// Reset State when switching hands or restarting
function resetTestState() {
  state = "idle";
  setBoxStyle("state-idle", "Click or Press Space", `Ready to test ${currentHand} Hand`);
  updateHUD();
}

// Main Logic Handler for User Inputs (Spacebar or Mouse Click)
function handleInput() {
  switch (state) {
    case "idle":
    case "early":
    case "result":
      if (results[currentHand].length < MAX_TRIALS) {
        startTrial();
      } else {
        logToTerminal(`[INFO] ${currentHand} hand trials are already completed! Resetting hand data...`);
        results[currentHand] = [];
        startTrial();
      }
      break;

    case "waiting":
      // User pressed spacebar TOO EARLY
      clearTimeout(timeOutId);
      state = "early";
      setBoxStyle("state-early", "Too Soon!", "You pressed before the screen turned green. Press Space to retry.");
      logToTerminal(`[WARNING] Early press detected for ${currentHand} Hand! Trial invalid.`);
      break;

    case "ready":
      // Valid reaction! Calculate reaction time
      const endTime = performance.now();
      const reactionTime = Math.round(endTime - startTime);
      results[currentHand].push(reactionTime);

      state = "result";
      setBoxStyle(
        "state-result",
        `${reactionTime} ms`,
        results[currentHand].length < MAX_TRIALS 
          ? "Press SPACEBAR for next trial" 
          : "Batch Completed! Press SPACEBAR to reset or switch hand."
      );

      updateHUD();
      logToTerminal(`[TRIAL ${results[currentHand].length}/${MAX_TRIALS}] ${currentHand} Hand: ${reactionTime} ms`);

      // Print full report if both hands have completed 5 trials
      if (results.Dominant.length === MAX_TRIALS && results["Non-Dominant"].length === MAX_TRIALS) {
        printFinalReport();
      }
      break;
  }
}

// Begin a new reaction trial
function startTrial() {
  state = "waiting";
  setBoxStyle("state-waiting", "Wait for Green...", "Get ready to press SPACEBAR!");

  // Random delay between 2000ms (2s) and 5000ms (5s)
  const randomDelay = Math.floor(Math.random() * 3000) + 2000;

  timeOutId = setTimeout(() => {
    state = "ready";
    startTime = performance.now();
    setBoxStyle("state-ready", "PRESS SPACEBAR!", "NOW NOW NOW!");
  }, randomDelay);
}

// Helper Function: Update Box Color and Text Content
function setBoxStyle(className, title, desc) {
  testBox.className = className;
  boxTitle.textContent = title;
  boxDesc.textContent = desc;
}

// Helper Function: Update HUD counter
function updateHUD() {
  trialCounter.textContent = `${results[currentHand].length} / ${MAX_TRIALS}`;
}

// Helper Function: Calculate average of an array of numbers
function calculateAverage(arr) {
  if (arr.length === 0) return 0;
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return (sum / arr.length).toFixed(2);
}

// Print messages to browser Console (F12) AND on-screen terminal screen
function logToTerminal(message) {
  console.log(message);
  terminalOutput.textContent += "\n" + message;
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Generate full experiment report when all 10 trials (5 dominant + 5 non-dominant) are finished
function printFinalReport() {
  const domAvg = calculateAverage(results.Dominant);
  const nonDomAvg = calculateAverage(results["Non-Dominant"]);
  const difference = (nonDomAvg - domAvg).toFixed(2);

  const report = `
==================================================
           EXPERIMENT RESULTS SUMMARY             
==================================================
Dominant Hand Trials (ms):     [ ${results.Dominant.join(", ")} ]
Dominant Hand Average:        ${domAvg} ms

Non-Dominant Hand Trials (ms): [ ${results["Non-Dominant"].join(", ")} ]
Non-Dominant Hand Average:    ${nonDomAvg} ms
--------------------------------------------------
Difference (Non-Dom - Dom):   ${difference} ms
Faster Hand:                  ${domAvg < nonDomAvg ? "Dominant Hand" : "Non-Dominant Hand"}
==================================================`;

  logToTerminal(report);
}