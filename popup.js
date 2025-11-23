// popup.js - UI: countdown, pause/resume (robust), hide streak/phase when not pomodoro

const timerEl = document.getElementById("timer");
const timerLabelEl = document.getElementById("timerLabel");

const streakContainerEl = document.getElementById("streakContainer");
const streakEl = document.getElementById("streak");

const phaseContainerEl = document.getElementById("phaseContainer");
const phaseEl = document.getElementById("phase");

const pauseBtn = document.getElementById("pauseBtn");
const optionsBtn = document.getElementById("optionsBtn");
const statsBtn = document.getElementById("statsBtn");

let paused = false;
let pausedRemainingMs = null;

// get paused state from background
function refreshPausedState(callback) {
  chrome.runtime.sendMessage({ action: "getPaused" }, (resp) => {
    if (resp && typeof resp.pausedRemainingMs !== "undefined") {
      pausedRemainingMs = resp.pausedRemainingMs;
      paused = !!pausedRemainingMs;
      pauseBtn.textContent = paused ? "Resume" : "Pause";
    } else {
      pausedRemainingMs = null;
      paused = false;
      pauseBtn.textContent = "Pause";
    }
    if (callback) callback();
  });
}

function updateTimer() {
  if (paused) {
    if (pausedRemainingMs !== null) {
      const minutes = Math.floor(pausedRemainingMs / 60000);
      const seconds = Math.floor((pausedRemainingMs % 60000) / 1000);
      timerEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      timerLabelEl.textContent = "Paused — remaining:";
      // decrement locally so UI looks alive; real persisted value lives in background
      pausedRemainingMs = Math.max(0, pausedRemainingMs - 1000);
    } else {
      timerEl.textContent = "--:--";
      timerLabelEl.textContent = "Paused";
    }
    // still update streak/phase visibility based on mode
    chrome.storage.sync.get(["mode", "streakCount"], (data) => {
      if (data.mode === "pomodoro") {
        streakContainerEl.style.display = "block";
        streakEl.textContent = data.streakCount || 0;
        chrome.runtime.sendMessage({ action: "getPhase" }, (resp) => {
          phaseEl.textContent = resp && resp.phase ? resp.phase : "--";
          phaseContainerEl.style.display = "block";
        });
      } else {
        streakContainerEl.style.display = "none";
        phaseContainerEl.style.display = "none";
      }
    });
    return;
  }

  // not paused -> show the active alarm countdown
  chrome.alarms.get("breakReminder", (alarm) => {
    if (alarm && alarm.scheduledTime) {
      const remaining = Math.max(0, alarm.scheduledTime - Date.now());
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      timerEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
      timerEl.textContent = "--:--";
    }
  });

  chrome.storage.sync.get(["mode", "streakCount"], (data) => {
    if (data.mode === "pomodoro") {
      streakContainerEl.style.display = "block";
      streakEl.textContent = data.streakCount || 0;
      chrome.runtime.sendMessage({ action: "getPhase" }, (resp) => {
        phaseEl.textContent = resp && resp.phase ? resp.phase : "--";
        phaseContainerEl.style.display = "block";
        timerLabelEl.textContent = "Next reminder (" + (resp && resp.phase ? resp.phase : "--") + " phase) in:";
      });
    } else {
      streakContainerEl.style.display = "none";
      phaseContainerEl.style.display = "none";
      timerLabelEl.textContent = "Next reminder in:";
    }
  });
}

// initialize paused state then start interval
refreshPausedState(updateTimer);
setInterval(updateTimer, 1000);

// pause/resume click
pauseBtn.addEventListener("click", () => {
  if (!paused) {
    // send pause request and update UI from response (we expect pausedRemainingMs)
    chrome.runtime.sendMessage({ action: "pause" }, (resp) => {
      paused = true;
      pausedRemainingMs = resp && typeof resp.pausedRemainingMs === "number" ? resp.pausedRemainingMs : null;
      pauseBtn.textContent = "Resume";
      updateTimer(); // immediately show paused time
    });
  } else {
    chrome.runtime.sendMessage({ action: "resume" }, (resp) => {
      // after resume, clear paused state and refresh alarms
      paused = false;
      pausedRemainingMs = null;
      pauseBtn.textContent = "Pause";
      // small delay to allow alarm scheduling then refresh
      setTimeout(() => { updateTimer(); }, 300);
    });
  }
});

// controls
optionsBtn.addEventListener("click", () => chrome.runtime.openOptionsPage());
statsBtn.addEventListener("click", () => chrome.tabs.create({ url: "stats.html" }));
