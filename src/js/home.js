import '../css/main.css';

// countdown (your former timer.js)
const target = new Date("2026-05-22T00:00:00+02:00");
const el = {
  bigNum : document.getElementById("big-number"),
  bigLab : document.getElementById("big-label"),
  d      : document.getElementById("d"),
  h      : document.getElementById("h"),
  m      : document.getElementById("m"),
  s      : document.getElementById("s")
};
const UNITS = [
  {k:"d", secs:86400}, {k:"h", secs:3600}, {k:"m", secs:60}, {k:"s", secs:1}
];
const pad = n => String(n).padStart(2,"0");
function tick(){
  let diff = Math.max(0, Math.floor((target - new Date())/1000));
  UNITS.forEach(u=>{ const val = Math.floor(diff / u.secs); diff %= u.secs; el[u.k].textContent = pad(val); });
  const days = Number(el.d.textContent);
  el.bigNum.textContent = days;
  el.bigLab.textContent = days === 1 ? "DAY" : "DAYS";
}
tick(); setInterval(tick,1000);
