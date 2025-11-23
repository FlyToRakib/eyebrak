// options.js - show/hide fields, persist settings and notify background

const modeSelect = document.getElementById("mode");
const intervalInput = document.getElementById("interval");
const pomodoroWorkInput = document.getElementById("pomodoroWork");
const pomodoroBreakInput = document.getElementById("pomodoroBreak");
const enabledCheckbox = document.getElementById("enabled");
const saveBtn = document.getElementById("saveBtn");
const statusEl = document.getElementById("status");

const intervalDiv = document.getElementById("intervalDiv");
const pomodoroDiv = document.getElementById("pomodoroDiv");

chrome.storage.sync.get(["mode","interval","pomodoroWork","pomodoroBreak","enabled"], data => {
  modeSelect.value = data.mode || "interval";
  intervalInput.value = (data.interval !== undefined) ? data.interval : 15;
  pomodoroWorkInput.value = data.pomodoroWork || 25;
  pomodoroBreakInput.value = data.pomodoroBreak || 5;
  enabledCheckbox.checked = (data.enabled !== undefined) ? data.enabled : true;
  toggleFields();
});

function toggleFields() {
  if (modeSelect.value === "pomodoro") {
    intervalDiv.style.display = "none";
    pomodoroDiv.style.display = "block";
  } else {
    intervalDiv.style.display = "block";
    pomodoroDiv.style.display = "none";
  }
}
modeSelect.addEventListener("change", toggleFields);

saveBtn.addEventListener("click", () => {
  const mode = modeSelect.value;
  const interval = Math.max(1, parseInt(intervalInput.value) || 15);
  const pomodoroWork = Math.max(1, parseInt(pomodoroWorkInput.value) || 25);
  const pomodoroBreak = Math.max(1, parseInt(pomodoroBreakInput.value) || 5);
  const enabled = !!enabledCheckbox.checked;

  // send message to background - background will persist and set alarm unless paused
  chrome.runtime.sendMessage({
    action: "updateAlarm",
    mode,
    interval,
    pomodoroWork,
    pomodoroBreak,
    enabled
  }, (resp) => {
    if (chrome.runtime.lastError) {
      statusEl.textContent = "Saved (background unavailable).";
    } else {
      statusEl.textContent = (resp && resp.paused) ? "Saved (paused)" : "Saved!";
    }
    setTimeout(() => statusEl.textContent = "", 1600);
  });

  // also persist in storage for immediate reflection
  chrome.storage.sync.set({ mode, interval, pomodoroWork, pomodoroBreak, enabled });
});
