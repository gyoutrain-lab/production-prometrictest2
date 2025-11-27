const BACKEND_URL = "YOUR_GAS_WEBAPP_URL"; // replace with your existing GAS Web App URL

// Candidate info persisted via localStorage
function saveCandidate(name, whatsapp, unlockCode){
    localStorage.setItem('candidate', JSON.stringify({name, whatsapp, unlockCode}));
}
function getCandidate(){
    return JSON.parse(localStorage.getItem('candidate') || '{}');
}

// Landing page: verify unlock code
function verifyUser(name, whatsapp, unlockCode, callback){
    if(!name||!whatsapp||!unlockCode){ alert("Please fill all fields"); return; }
    fetch(BACKEND_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"verify", name, whatsapp, unlockCode})
    }).then(res=>res.json())
    .then(data=>{
        if(data.status==="success"){ saveCandidate(name, whatsapp, unlockCode); callback(true); }
        else{ alert(data.message||"Invalid unlock code"); callback(false); }
    }).catch(err=>{ alert("Cannot connect to backend"); console.error(err); callback(false); });
}

// Quiz variables
let questions=[], answers={}, reviewMarks={}, currentQ=0, timerInterval=0;

// Fetch questions
function fetchQuestions(callback){
    fetch(BACKEND_URL+"?action=getQuestions").then(res=>res.json()).then(data=>{
        if(data.status==="success"){ questions=data.questions; callback(true); }
        else{ alert("Failed to fetch questions"); callback(false); }
    }).catch(err=>{ alert("Cannot fetch questions from backend"); console.error(err); callback(false); });
}

// Sidebar
function generateSidebar(){
    const sidebar=document.getElementById('sidebar'); sidebar.innerHTML="";
    questions.forEach((q,i)=>{
        const btn=document.createElement('div'); btn.className="qnum"; btn.textContent=i+1;
        btn.onclick=()=>{ saveAnswer(); currentQ=i; renderQuestion(); };
        sidebar.appendChild(btn);
    });
    updateSidebar();
}
function updateSidebar(){ questions.forEach((_,i)=>{
    const btn=document.getElementById('sidebar').children[i]; btn.className="qnum";
    if(answers[i]!=null) btn.classList.add("answered");
    if(reviewMarks[i]) btn.classList.add("review");
}); }

// Render current question
function renderQuestion(){
    const q=questions[currentQ]; 
    document.getElementById('q-number').textContent=`Question ${currentQ+1}`;
    const container=document.getElementById('questions');
    container.innerHTML=`<div class="question">${q.question}</div>`+
        q.options.map((opt,idx)=>`<label class="option"><input type="radio" name="q${currentQ}" value="${idx}" ${answers[currentQ]==idx?'checked':''}> ${opt}</label>`).join('');
    updateSidebar();
    document.getElementById('review-btn') && updateReviewButton();
}

// Navigation
function nextQuestion(){ saveAnswer(); if(currentQ<questions.length-1){ currentQ++; renderQuestion(); } }
function prevQuestion(){ saveAnswer(); if(currentQ>0){ currentQ--; renderQuestion(); } }
function saveAnswer(){ const sel=document.querySelector(`input[name="q${currentQ}"]:checked`); answers[currentQ]=sel?sel.value:null; updateSidebar(); }

// Review
function toggleReview(){ reviewMarks[currentQ]=!reviewMarks[currentQ]; updateReviewButton(); updateSidebar(); }
function updateReviewButton(){ document.getElementById('review-btn') && (document.getElementById('review-btn').textContent = reviewMarks[currentQ]?"Marked for Review":"Mark for Review"); }
function openReviewModal(){ 
    const modal=document.getElementById('review-modal');
    const list=document.getElementById('review-list'); list.innerHTML="";
    questions.forEach((_,i)=>{
        const btn=document.createElement('div'); btn.textContent=i+1;
        if(reviewMarks[i]) btn.style.background="#ffc107";
        else if(answers[i]!=null) btn.style.background="#28a745";
        else btn.style.background="#ccc";
        btn.onclick=()=>{ currentQ=i; renderQuestion(); closeReviewModal(); };
        list.appendChild(btn);
    });
    modal.style.display="flex";
}
function closeReviewModal(){ document.getElementById('review-modal').style.display="none"; }

// Timer
function startTimer(duration){
    let timer=duration, min, sec;
    const display=document.getElementById('timer');
    timerInterval=setInterval(()=>{
        min=Math.floor(timer/60); sec=timer%60;
        display.textContent=`${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}`;
        if(--timer<0){ clearInterval(timerInterval); alert("Time is up! Submitting answers"); submitAnswers(); }
    },1000);
}

// Submit answers
function submitAnswers(){
    saveAnswer();
    const candidate=getCandidate();
    fetch(BACKEND_URL,{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:"submitAnswers", user:candidate, answers, reviewMarks})
    }).then(res=>res.json()).then(data=>{
        if(data.status==="success"){ alert("Test submitted successfully"); localStorage.removeItem('candidate'); window.location.href='index.html'; }
        else{ alert(data.message||"Submission failed"); }
    }).catch(err=>{ alert("Cannot submit answers"); console.error(err); });
}
