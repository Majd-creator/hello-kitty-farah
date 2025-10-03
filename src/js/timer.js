// Farah's birthday — 22 May 2026, adjust offset if needed
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
  {k:"d", secs:86400, label:["DAY","DAYS"]},
  {k:"h", secs:3600 , label:["HOUR","HOURS"]},
  {k:"m", secs:60   , label:["MIN","MINS"]},
  {k:"s", secs:1    , label:["SEC","SECS"]}
];

const pad = n => String(n).padStart(2,"0");

function tick(){
  let diff = Math.max(0, Math.floor((target - new Date())/1000));

  UNITS.forEach(u=>{
    const val = Math.floor(diff / u.secs);
    diff %= u.secs;
    el[u.k].textContent = pad(val);
  });

  const days = Number(el.d.textContent);
  el.bigNum.textContent = days;
  el.bigLab.textContent = days === 1 ? "DAY" : "DAYS";
}

tick();
setInterval(tick,1000);
