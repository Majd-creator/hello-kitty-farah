// ---- src/js/timer.js ----
const target = new Date("2026-02-14T00:00:00+01:00"); // Farah's birthday (edit if needed)
const pad    = n => String(n).padStart(2,"0");

// Cache the <span> elements once
const els = {
  days:    document.getElementById("days"),
  hours:   document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds")
};

function tick(){
  // ms → secs
  let diff = Math.max(0, Math.floor((target - new Date()) / 1000));

  const d = Math.floor(diff / 86400);
  diff   %= 86400;
  const h = Math.floor(diff / 3600);
  diff   %= 3600;
  const m = Math.floor(diff / 60);
  const s = diff % 60;

  els.days.textContent    = pad(d);
  els.hours.textContent   = pad(h);
  els.minutes.textContent = pad(m);
  els.seconds.textContent = pad(s);
}

// Initial render + 1-second interval
tick();
setInterval(tick, 1000);
