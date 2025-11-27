const ADMIN_WA_NUMBER = "6285399652487";
let studentName="", studentWA="", unlockCode="";
let currentTestLevel="", questions=[], qIndex=0, correct=0, incorrect=0, timer=null, elapsed=0;

// UI elements
const registrationCard = document.getElementById('registrationCard');
const confirmMessage = document.getElementById('confirmMessage');
const waNotifyArea = document.getElementById('waNotifyArea');
const waNotifyBtn = document.getElementById('waNotifyBtn');
const unlockCard = document.getElementById('unlockCard');
const unlockMessage = document.getElementById('unlockMessage');
const dashboardCard = document.getElementById('dashboardCard');
const welcomeMsg = document.getElementById('welcomeMsg');
const testGrid = document.getElementById('testGrid');
const quizCard = document.getElementById('quizCard');
const progressInfo = document.getElementById('progressInfo');
const questionText = document.getElementById('questionText');
const optionsDiv = document.getElementById('options');
const resultCard = document.getElementById('resultCard');
const summaryDiv = document.getElementById('summary');
const answersDiv = document.getElementById('answers');

const TEST_TITLES = ["Level1","Level2","Level3","Level4","Level5"];

// 1️⃣ Registration + WA Notify
function submitConfirmation(){
    const name = document.getElementById('regName').value.trim();
    const wa = document.getElementById('regWA').value.trim();
    if(!name || !wa){ confirmMessage.innerText="Please fill both name and WA number."; return; }
    studentName=name; studentWA=wa;

    // Prepare WhatsApp link
    const textRaw = `Payment Confirmed,%0AName: ${encodeURIComponent(name)}%0AWhatsApp: ${encodeURIComponent(wa)}%0AShare Proof QR IDR 50k to get the Unlock Code`;
    waNotifyBtn.setAttribute('href',`https://wa.me/${ADMIN_WA_NUMBER}?text=${textRaw}`);
    
    confirmMessage.innerText="Confirmation received. Click WhatsApp button to notify admin.";
    waNotifyArea.classList.remove('hidden');
    unlockCard.classList.remove('hidden');
    setTimeout(()=>{ registrationCard.classList.add('hidden'); },700);
}

// 2️⃣ Unlock Code Validation
async function verifyCode(){
    const code = document.getElementById('unlockInput').value.trim();
    if(!code){ unlockMessage.innerText="Enter unlock code."; return; }

    const res = await fetch('assets/unlockCodes.json');
    const codes = await res.json();
    const valid = codes.some(c => c.name===studentName && c.wa===studentWA && c.code===code);
    if(valid){
        unlockCode=code;
        unlockMessage.innerText="Code valid! Opening dashboard...";
        setTimeout(()=>{
            unlockCard.classList.add('hidden');
            showDashboard();
        },700);
    } else unlockMessage.innerText="Invalid unlock code.";
}

// 3️⃣ Dashboard
function showDashboard(){
    welcomeMsg.innerText=`Welcome ${studentName}. Choose a test to start:`;
    testGrid.innerHTML="";
    TEST_TITLES.forEach((t,i)=>{
        const div=document.createElement('div');
        div.className='test-card';
        div.innerHTML=`<h3>${t}</h3><button onclick="startTest('${t}')">Start</button>`;
        testGrid.appendChild(div);
    });
    dashboardCard.classList.remove('hidden');
}

// 4️⃣ Start Test
async function startTest(level){
    currentTestLevel=level; qIndex=0; correct=0; incorrect=0; elapsed=0;
    dashboardCard.classList.add('hidden'); quizCard.classList.remove('hidden');
    const res = await fetch('assets/questions.json');
    const allQ = await res.json();
    questions = allQ[level] || [];
    startTimer(); showQuestion();
}

// 5️⃣ Timer
function startTimer(){ clearInterval(timer); timer=setInterval(()=>{ elapsed++; updateProgress(); },1000); }
function updateProgress(){ progressInfo.innerText=`⏱ ${Math.floor(elapsed/60)}m ${elapsed%60}s | Q ${qIndex+1}/${questions.length} | ✅ ${correct} | ❌ ${incorrect}`; }

// 6️⃣ Show Question
function showQuestion(){
    const q=questions[qIndex];
    questionText.innerText=q.question;
    optionsDiv.innerHTML="";
    q.options.forEach((o,idx)=>{
        optionsDiv.insertAdjacentHTML('beforeend',`<div class="option"><label><input type="radio" name="opt" value="${idx}"> ${o}</label></div>`);
    });
    updateProgress();
}

// 7️⃣ Next / Finish
function nextQuestion(){
    const sel=document.querySelector("input[name='opt']:checked");
    if(!sel) return;
    (+sel.value===questions[qIndex].answer)?correct++:incorrect++;
    qIndex++;
    (qIndex<questions.length)?showQuestion():finishQuiz();
}

// 8️⃣ Finish Quiz
function finishQuiz(){
    clearInterval(timer); quizCard.classList.add('hidden'); resultCard.classList.remove('hidden');
    const score=Math.round((correct/questions.length)*100);
    const status=score>=75?"PASS":"FAIL";
    summaryDiv.innerHTML=`<b>Score:</b> ${score}%<br><b>Correct:</b> ${correct}<br><b>Incorrect:</b> ${incorrect}<br><b>Status:</b> ${status}`;
    answersDiv.innerHTML="";
    questions.forEach((q,idx)=>{
        answersDiv.insertAdjacentHTML('beforeend',`<div><b>Q${idx+1}.</b> ${q.question}<br><b>Answer:</b> ${q.options[q.answer]}<br><b>Rationale:</b> ${q.rationale||""}<br><br></div>`);
    });

    // Save results locally
    let results = JSON.parse(localStorage.getItem('results')||'[]');
    results.push({candidate:studentName, level:currentTestLevel, score, correct, incorrect, timestamp:new Date()});
    localStorage.setItem('results', JSON.stringify(results));
}

// 9️⃣ Utilities
function goToDashboard(){ resultCard.classList.add('hidden'); showDashboard(); }
function logout(){ dashboardCard.classList.add('hidden'); registrationCard.classList.remove('hidden'); studentName=""; studentWA=""; unlockCode=""; waNotifyArea.classList.add('hidden'); }
