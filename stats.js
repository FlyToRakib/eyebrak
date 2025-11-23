const totalEl=document.getElementById("total");
const breaksEl=document.getElementById("breaks");
const streakEl=document.getElementById("streak");

function updateStats(){
  chrome.storage.sync.get(["totalReminders","breaksTaken","streakCount"],data=>{
    totalEl.textContent=data.totalReminders||0;
    breaksEl.textContent=data.breaksTaken||0;
    streakEl.textContent=data.streakCount||0;
  });
}

setInterval(updateStats,1000);
updateStats();
