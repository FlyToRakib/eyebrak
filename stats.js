const totalEl = document.getElementById("total");
const breaksEl = document.getElementById("breaks");
const streakEl = document.getElementById("streak");
const wellnessBar = document.getElementById("wellnessBar");
const wellnessText = document.getElementById("wellnessText");
const waterStatText = document.getElementById("waterStatText");
const waterPercent = document.getElementById("waterPercent");
const waterBar = document.getElementById("waterBar");
const activityGraph = document.getElementById("activityGraph");

function updateStats() {
  chrome.storage.sync.get(["totalReminders", "breaksTaken", "streakCount", "waterIntake", "waterGoal"], data => {
    const total = data.totalReminders || 0;
    const breaks = data.breaksTaken || 0;
    const streaks = data.streakCount || 0;
    const water = data.waterIntake || 0;
    const goal = data.waterGoal || 8;
    
    totalEl.textContent = total;
    breaksEl.textContent = breaks;
    streakEl.textContent = streaks;

    // Hydration Update
    const wPercent = Math.min(100, Math.round((water / goal) * 100));
    waterStatText.textContent = `${water} / ${goal} glasses`;
    waterPercent.textContent = `${wPercent}%`;
    waterBar.style.width = `${wPercent}%`;

    // Wellness Score
    let score = 0;
    if (total > 0) score = Math.min(100, Math.round((breaks / total) * 100));
    wellnessBar.style.width = score + "%";
    wellnessText.textContent = `${score}% Consistency Score`;
  });

  // Activity Graph Rendering
  chrome.storage.local.get(["dailyUsage"], data => {
    const usage = data.dailyUsage || {};
    activityGraph.innerHTML = "";
    const maxVal = Math.max(...Object.values(usage), 1);
    
    for (let i = 0; i < 24; i++) {
      const val = usage[i] || 0;
      const height = (val / 60) * 100; // minutes per hour
      const bar = document.createElement("div");
      bar.style.flex = "1";
      bar.style.height = `${Math.max(2, height)}%`;
      bar.style.background = val > 0 ? "var(--accent-color)" : "var(--glass-bg)";
      bar.style.borderRadius = "2px 2px 0 0";
      bar.title = `${i}:00 - ${val} mins`;
      activityGraph.appendChild(bar);
    }
  });
}

setInterval(updateStats, 2000);
updateStats();
