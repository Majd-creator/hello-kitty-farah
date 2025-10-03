import '../css/planner.css';

const apiBase = "/api/planner.php";

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

const calTitle = $("#calTitle");
const calGrid = $("#calGrid");
const dayTitle = $("#dayTitle");
const form = $("#itemForm");
const formDate = $("#formDate");
const formId = $("#formId");
const resetBtn = $("#resetBtn");
const list = $("#list");
const prevM = $("#prevM");
const nextM = $("#nextM");

let viewMonth = new Date();
viewMonth.setDate(1);
let selectedDate = new Date();
let monthCounts = {}; // { 'YYYY-MM-DD': {low:n,med:n,high:n,total:n} }

function fmtDate(d){ return d.toISOString().slice(0,10); }
function fmtMonth(d){ return d.toISOString().slice(0,7); }
function humanDate(d){
  return d.toLocaleDateString(undefined, {weekday:'long', year:'numeric', month:'long', day:'numeric'});
}

async function fetchJSON(url, opts){
  const res = await fetch(url, {
    headers: {"Content-Type": "application/json"},
    credentials: "same-origin",
    ...opts
  });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

/* ------- API calls -------- */
async function loadMonthCounts(){
  const month = fmtMonth(viewMonth);
  const data = await fetchJSON(`${apiBase}?month=${encodeURIComponent(month)}`);
  monthCounts = data.counts || {};
}

async function loadDay(dateStr){
  const data = await fetchJSON(`${apiBase}?date=${encodeURIComponent(dateStr)}`);
  return data.items || [];
}

async function saveItem(payload){
  const data = await fetchJSON(apiBase, { method:"POST", body: JSON.stringify({ action:"save", ...payload }) });
  return data.item;
}
async function deleteItem(id){
  await fetchJSON(apiBase, { method:"POST", body: JSON.stringify({ action:"delete", id }) });
}

/* ------- Calendar render -------- */
function renderCalendar(){
  const monthName = viewMonth.toLocaleString(undefined, {month:"long", year:"numeric"});
  calTitle.textContent = monthName;

  calGrid.innerHTML = "";
  const first = new Date(viewMonth);
  const startIdx = first.getDay(); // 0..6
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth()+1, 0).getDate();

  for(let i=0; i<startIdx; i++){
    const empty = document.createElement("div");
    calGrid.appendChild(empty);
  }

  for(let day=1; day<=daysInMonth; day++){
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "daycell";
    const d = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    const ds = fmtDate(d);
    cell.dataset.date = ds;

    const num = document.createElement("div");
    num.className = "num";
    num.textContent = String(day);
    cell.appendChild(num);

    const badges = document.createElement("div");
    badges.className = "badges";
    const counts = monthCounts[ds] || {};
    ["high","med","low"].forEach(p=>{
      if(counts[p] > 0){
        const b = document.createElement("div");
        b.className = `badge ${p}`;
        badges.appendChild(b);
      }
    });
    if((counts.total||0) === 0){
      const b = document.createElement("div");
      b.className = "badge";
      badges.appendChild(b);
    }
    cell.appendChild(badges);

    const today = new Date();
    if(d.toDateString() === today.toDateString()) cell.classList.add("today");
    if(fmtDate(selectedDate) === ds) cell.classList.add("selected");

    cell.addEventListener("click", async ()=>{
      selectedDate = d;
      await refreshDay();
      $$(".daycell", calGrid).forEach(x=>x.classList.remove("selected"));
      cell.classList.add("selected");
    });

    calGrid.appendChild(cell);
  }
}

async function refreshDay(){
  const ds = fmtDate(selectedDate);
  dayTitle.textContent = humanDate(selectedDate);
  formDate.value = ds;
  formId.value = "";

  const items = await loadDay(ds);
  renderList(items);
}

/* ------- List render -------- */
function renderList(items){
  list.innerHTML = "";
  if(items.length === 0){
    const li = document.createElement("li");
    li.textContent = "Nothing here yet. Add the first item! 🎀";
    li.style.color = "#777";
    list.appendChild(li);
    return;
  }

  for(const it of items){
    const li = document.createElement("li");
    li.className = "item";

    const pr = document.createElement("span");
    pr.className = `prio ${it.priority}`;
    pr.textContent = it.priority.toUpperCase();
    li.appendChild(pr);

    const text = document.createElement("div");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = `${it.subject} — ${it.topic}`;
    const time = document.createElement("div");
    time.className = "time";
    const t = (s)=> s ? s.slice(0,5) : "";
    const tr = (it.start_time||it.end_time) ? `${t(it.start_time)}${it.end_time?'–'+t(it.end_time):''}` : "Any time";
    time.textContent = tr;
    text.appendChild(title);
    text.appendChild(time);
    li.appendChild(text);

    const act = document.createElement("div");
    act.className = "actions";
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", ()=>{
      form.subject.value = it.subject;
      form.topic.value = it.topic;
      form.start_time.value = it.start_time || "";
      form.end_time.value = it.end_time || "";
      form.priority.value = it.priority;
      form.notes.value = it.notes || "";
      formId.value = it.id;
      form.subject.focus();
    });
    const del = document.createElement("button");
    del.type = "button";
    del.textContent = "Delete";
    del.addEventListener("click", async ()=>{
      if(confirm("Delete this item?")){
        await deleteItem(it.id);
        await reloadMonthAndDay();
      }
    });
    act.appendChild(edit);
    act.appendChild(del);
    li.appendChild(act);

    if(it.notes){
      const notes = document.createElement("div");
      notes.className = "notes";
      notes.textContent = it.notes;
      li.appendChild(notes);
    }

    list.appendChild(li);
  }
}

/* ------- Form events -------- */
form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());
  data.priority = data.priority || "med";
  data.id = data.id ? Number(data.id) : undefined;
  await saveItem(data);
  form.reset();
  formDate.value = fmtDate(selectedDate);
  await reloadMonthAndDay();
});

resetBtn.addEventListener("click", ()=>{
  form.reset();
  formId.value = "";
  formDate.value = fmtDate(selectedDate);
});

/* ------- Month nav -------- */
prevM.addEventListener("click", async ()=>{
  viewMonth.setMonth(viewMonth.getMonth()-1);
  await reloadMonthUI();
});
nextM.addEventListener("click", async ()=>{
  viewMonth.setMonth(viewMonth.getMonth()+1);
  await reloadMonthUI();
});

async function reloadMonthUI(){
  await loadMonthCounts();
  renderCalendar();
}
async function reloadMonthAndDay(){
  await reloadMonthUI();
  await refreshDay();
}

/* ------- init -------- */
(async function init(){
  await reloadMonthAndDay();
})();
