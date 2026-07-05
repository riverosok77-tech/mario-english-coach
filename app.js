const questions = [
  "Tell me about your day.",
  "What did you do yesterday?",
  "What are your plans for tomorrow?",
  "Describe your job.",
  "What do you usually do in the morning?",
  "What is difficult for you in English?",
  "Tell me about your family.",
  "Describe your favorite food."
];

const shadowPhrases = [
  "I want to improve my American pronunciation.",
  "Could you say that again, please?",
  "I usually go to work at eight.",
  "Yesterday I worked all day and then I went home.",
  "I feel more confident when I practice every day.",
  "Speaking English is getting easier for me."
];

const sounds = [
  {title:"TH sound: think / three / thank", tip:"Pon la punta de la lengua suavemente entre los dientes y sopla. No digas T.", example:"think, three, thank you"},
  {title:"V sound: very / voice / vacation", tip:"Toca el labio inferior con los dientes superiores y vibra. No lo pronuncies como B.", example:"very good voice"},
  {title:"American R: car / work / teacher", tip:"Lleva la lengua hacia atrás sin tocar el paladar.", example:"car, work, teacher"},
  {title:"Final ED: worked / played / wanted", tip:"Worked suena T, played suena D, wanted suena ID.", example:"worked, played, wanted"}
];

const roles = [
  {title:"At a restaurant", line:"Mario: Hi! Are you ready to order?"},
  {title:"At the airport", line:"Mario: Good morning. Can I see your passport, please?"},
  {title:"Job interview", line:"Mario: Tell me about yourself."},
  {title:"At work", line:"Mario: Can you explain what you did today?"}
];

document.querySelectorAll(".nav").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.screen).classList.add("active");
    updateStats();
  });
});

function speakText(text, rate=0.9){
  if(!("speechSynthesis" in window)){alert("Tu navegador no permite voz.");return;}
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US"; u.rate = rate; u.pitch = 1;
  const voices = speechSynthesis.getVoices();
  const us = voices.find(v=>v.lang==="en-US") || voices.find(v=>v.lang.startsWith("en"));
  if(us) u.voice = us;
  speechSynthesis.speak(u);
}

function startListening(targetId){
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){alert("Tu navegador no soporta reconocimiento de voz. Escribe la respuesta.");return;}
  const rec = new SR();
  rec.lang = "en-US";
  rec.interimResults = false;
  rec.continuous = false;
  rec.onresult = e => {
    const text = Array.from(e.results).map(r=>r[0].transcript).join(" ");
    document.getElementById(targetId).value = text;
  };
  rec.onerror = e => alert("Error de micrófono: " + e.error);
  rec.start();
}

function newQuestion(){document.getElementById("question").textContent = random(questions);}
function newShadow(){document.getElementById("shadowPhrase").textContent = random(shadowPhrases);}
function newSound(){const s=random(sounds);document.getElementById("soundTitle").textContent=s.title;document.getElementById("soundTip").textContent=s.tip;}
function speakCurrentSound(){const title=document.getElementById("soundTitle").textContent;const s=sounds.find(x=>x.title===title)||sounds[0];speakText(s.example,.75)}
function newRole(){const r=random(roles);document.getElementById("roleTitle").textContent=r.title;document.getElementById("roleLine").textContent=r.line;}
function random(arr){return arr[Math.floor(Math.random()*arr.length)]}

function correctAnswer(){
  const text = document.getElementById("answer").value.trim();
  if(!text){document.getElementById("feedback").innerHTML="Primero habla o escribe una respuesta.";return;}
  let improved = text;
  let notes = [];
  const rules = [
    [/I go to (.+) yesterday/ig,"I went to $1 yesterday","Con yesterday usamos Simple Past."],
    [/I have (\d+) years old/ig,"I am $1 years old","En inglés decimos I am ... years old."],
    [/I am agree/ig,"I agree","No se dice I am agree."],
    [/people is/ig,"people are","People es plural."],
    [/I am work/ig,"I work","Para hablar de tu trabajo usa I work."]
  ];
  rules.forEach(([re,rep,note])=>{if(re.test(improved)){improved=improved.replace(re,rep);notes.push(note);}});
  const words=text.split(/\s+/).length;
  const score=Math.max(60,Math.min(96,75+Math.floor(words/3)-notes.length*4));
  saveProgress(words,score);
  document.getElementById("feedback").innerHTML = `
    <b>Tu frase:</b><br>${escapeHtml(text)}<br><br>
    <b>Versión más natural:</b><br>${escapeHtml(improved)}<br><br>
    <b>Explicación:</b><br>${notes.length?notes.join("<br>"):"Muy bien para nivel B1. Ahora intenta hablar con más ritmo y conectar palabras."}<br><br>
    <b>Puntaje aproximado:</b> ${score}/100<br>
    <button onclick="speakText('${improved.replace(/'/g,"\\'")}')">🔊 Escuchar versión correcta</button>
  `;
}

function checkShadow(){
  const target = document.getElementById("shadowPhrase").textContent.toLowerCase().replace(/[^a-z\s]/g,"").trim();
  const answer = document.getElementById("shadowAnswer").value.toLowerCase().replace(/[^a-z\s]/g,"").trim();
  if(!answer){document.getElementById("shadowFeedback").textContent="Primero repite la frase.";return;}
  const tw=target.split(/\s+/), aw=answer.split(/\s+/);
  const hits=tw.filter(w=>aw.includes(w)).length;
  const score=Math.round((hits/tw.length)*100);
  saveProgress(aw.length,score);
  document.getElementById("shadowFeedback").innerHTML=`Coincidencia aproximada: <b>${score}%</b><br>Frase correcta: <b>${document.getElementById("shadowPhrase").textContent}</b>`;
}

function saveProgress(words, score){
  const p=JSON.parse(localStorage.getItem("marioProgressV4")||'{"sessions":0,"words":0,"scores":[]}');
  p.sessions++; p.words+=words; p.scores.push(score);
  localStorage.setItem("marioProgressV4",JSON.stringify(p));
  updateStats();
}
function updateStats(){
  const p=JSON.parse(localStorage.getItem("marioProgressV4")||'{"sessions":0,"words":0,"scores":[]}');
  const avg=p.scores.length?Math.round(p.scores.reduce((a,b)=>a+b,0)/p.scores.length):0;
  ["statSessions","pSessions"].forEach(id=>{const el=document.getElementById(id); if(el) el.textContent=p.sessions});
  ["statWords","pWords"].forEach(id=>{const el=document.getElementById(id); if(el) el.textContent=p.words});
  ["statScore","pScore"].forEach(id=>{const el=document.getElementById(id); if(el) el.textContent=avg});
}
function resetProgress(){localStorage.removeItem("marioProgressV4");updateStats();}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}

if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{});}
updateStats();
