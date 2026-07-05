let deferredPrompt;
const API_URL = "https://script.google.com/macros/s/AKfycbwCN39HHbwgo92ItpTXazCzkblFZHn7m3zhnLkGh7qQUqFoescOPRY58xu_uTkVwUF8HQ/exec";
const questions=["Tell me about your day.","What did you do yesterday?","What are your plans for tomorrow?","Describe your job in three sentences.","Tell me about your favorite food.","What is difficult for you when you speak English?"];
const shadows=["I want to improve my American pronunciation.","Could you say that again, please?","I usually go to work at eight.","Yesterday I worked all day and then I went home.","I feel more confident when I practice every day."];
const sounds=[{title:"TH sound: think / three / thank",tip:"Pon la punta de la lengua suavemente entre los dientes y sopla. No digas “tink”.",example:"think, three, thank you"},{title:"V sound: very / voice / vacation",tip:"Toca el labio inferior con los dientes superiores y vibra. No lo pronuncies como B.",example:"very good voice"},{title:"American R: car / work / teacher",tip:"Lleva la lengua hacia atrás sin tocar el paladar.",example:"car, work, teacher"},{title:"Final ED: worked / played / wanted",tip:"Worked suena T, played suena D, wanted suena ID.",example:"worked, played, wanted"}];

async function clearOldCache(){
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) await reg.unregister();
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      for (const key of keys) await caches.delete(key);
    }
    localStorage.setItem("marioCacheFixedV9","yes");
    alert("Caché vieja eliminada. La página se recargará.");
    location.reload(true);
  } catch(e) {
    alert("No se pudo limpiar todo, pero la V9 seguirá funcionando.");
  }
}

(async function initCacheFix(){
  if (localStorage.getItem("marioCacheFixedV9") !== "yes") {
    try {
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.unregister();
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        for (const key of keys) await caches.delete(key);
      }
      localStorage.setItem("marioCacheFixedV9","yes");
    } catch(e) {}
  }
})();

document.querySelectorAll(".tabs button").forEach(btn=>btn.addEventListener("click",()=>{document.querySelectorAll(".tabs button").forEach(b=>b.classList.remove("active"));document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));btn.classList.add("active");document.getElementById(btn.dataset.screen).classList.add("active");}));
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;});
function installApp(){if(deferredPrompt){deferredPrompt.prompt();}else alert("En Chrome toca ⋮ y luego Agregar a pantalla principal.");}
function getText(id){return document.getElementById(id).textContent;}
function random(arr){return arr[Math.floor(Math.random()*arr.length)];}
function marioSpeak(text,rate=.9){if(!("speechSynthesis" in window)){alert("Este navegador no permite voz.");return;}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="en-US";u.rate=rate;u.pitch=1;const voices=speechSynthesis.getVoices();const us=voices.find(v=>v.lang==="en-US")||voices.find(v=>v.lang&&v.lang.startsWith("en"));if(us)u.voice=us;speechSynthesis.speak(u);}
function listenTo(id){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){alert("Tu navegador no permite reconocimiento de voz. Escribe tu respuesta.");return;}const rec=new SR();rec.lang="en-US";rec.interimResults=false;rec.continuous=false;rec.onresult=e=>{document.getElementById(id).value=Array.from(e.results).map(r=>r[0].transcript).join(" ");};rec.onerror=e=>alert("Error de micrófono: "+e.error);rec.start();}
function newQuestion(){document.getElementById("question").textContent=random(questions);}
function newShadow(){document.getElementById("shadowPhrase").textContent=random(shadows);}
function newSound(){const s=random(sounds);document.getElementById("soundTitle").textContent=s.title;document.getElementById("soundTip").textContent=s.tip;}
function speakSound(){const s=sounds.find(x=>x.title===getText("soundTitle"))||sounds[0];marioSpeak(s.example,.75);}
async function callMarioAI(text,mode){const res=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({text,mode})});const data=await res.json();if(data.error)throw new Error(data.error);return data.reply;}
async function sendChat(){const input=document.getElementById("chatInput");const text=input.value.trim();if(!text)return;addBubble("user","<b>You:</b> "+escapeHtml(text));input.value="";addBubble("mario","<b>Mario:</b> Thinking...");try{const reply=await callMarioAI(text,"conversation");document.querySelector("#chat .bubble:last-child").innerHTML="<b>Mario:</b> "+format(reply);marioSpeak(stripHtml(reply));addProgress(text.split(/\s+/).length,90,20);}catch(e){document.querySelector("#chat .bubble:last-child").innerHTML="<b>Mario:</b> "+escapeHtml(e.message);}}
async function correctSpeaking(){const text=document.getElementById("answer").value.trim();if(!text){document.getElementById("feedback").innerHTML="Primero habla o escribe una respuesta.";return;}document.getElementById("feedback").innerHTML="Mario IA está corrigiendo...";try{const reply=await callMarioAI(text,"speaking correction: "+getText("question"));document.getElementById("feedback").innerHTML=format(reply);addProgress(text.split(/\s+/).length,90,15);}catch(e){document.getElementById("feedback").innerHTML=escapeHtml(e.message);}}
function checkShadow(){const target=getText("shadowPhrase").toLowerCase().replace(/[^a-z\s]/g,"").trim();const ans=document.getElementById("shadowAnswer").value.toLowerCase().replace(/[^a-z\s]/g,"").trim();if(!ans){document.getElementById("shadowFeedback").innerHTML="Primero repite la frase.";return;}const tw=target.split(/\s+/),aw=ans.split(/\s+/);const hits=tw.filter(w=>aw.includes(w)).length;const score=Math.round(hits/tw.length*100);addProgress(aw.length,score,10);document.getElementById("shadowFeedback").innerHTML=`<b>Coincidencia:</b> ${score}%<br><b>Frase correcta:</b> ${getText("shadowPhrase")}<br>Ahora repítela copiando ritmo y entonación.`;}
async function testApi(){const status=document.getElementById("apiStatus");status.innerHTML="Probando conexión...";try{const reply=await callMarioAI("Hello Mario, this is a test.","test");status.innerHTML="✅ Conexión correcta:<br>"+format(reply);}catch(e){status.innerHTML="❌ "+escapeHtml(e.message);}}
function addBubble(type,html){const chat=document.getElementById("chat");const div=document.createElement("div");div.className="bubble "+type;div.innerHTML=html;chat.appendChild(div);chat.scrollTop=chat.scrollHeight;}
function loadProgress(){return JSON.parse(localStorage.getItem("marioV9")||'{"xp":0,"sessions":0,"words":0,"scores":[],"lastDay":"","streak":0}');}
function saveProgress(p){localStorage.setItem("marioV9",JSON.stringify(p));updateStats();}
function addProgress(words,score,xp){const p=loadProgress();const today=new Date().toDateString();if(p.lastDay!==today){p.streak=(p.lastDay?p.streak+1:1);p.lastDay=today;}p.sessions++;p.words+=words;p.scores.push(score);p.xp+=xp;saveProgress(p);}
function updateStats(){const p=loadProgress();const avg=p.scores.length?Math.round(p.scores.reduce((a,b)=>a+b,0)/p.scores.length):0;document.getElementById("xp").textContent=p.xp;document.getElementById("streak").textContent=p.streak;document.getElementById("sessions").textContent=p.sessions;document.getElementById("avg").textContent=avg;}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));}
function format(s){return escapeHtml(s).replace(/\n/g,"<br>");}
function stripHtml(s){return String(s).replace(/<[^>]*>/g," ");}
updateStats();
