const socket = io();
let roomId = null;
let myId = null;

// 내 id 받기
socket.on("connect", ()=>{
  myId = socket.id;
});

// 방 만들기
function createRoom(){
  socket.emit("createRoom");
}

socket.on("roomCreated",(id)=>{
  roomId = id;
  alert("방 코드: " + id);
});

// 참가
function joinRoom(){
  const code = document.getElementById("roomInput").value;
  roomId = code;
  socket.emit("joinRoom", code);
}

// 시작
socket.on("startGame", ()=>{
  document.getElementById("lobby").style.display="none";
  document.getElementById("game").style.display="block";
});

// 문제
socket.on("question",(q)=>{
  document.getElementById("question").innerText = q.q;

  const div = document.getElementById("answers");
  div.innerHTML = "";

  q.a.forEach((ans,i)=>{
    let btn = document.createElement("button");
    btn.innerText = ans;

    btn.onclick = ()=>{
      socket.emit("answer",{roomId,answerIndex:i});
    };

    div.appendChild(btn);
  });
});

// 결과
socket.on("result",(data)=>{
  const buttons = document.querySelectorAll("#answers button");

  buttons.forEach((btn,i)=>{
    btn.disabled = true;

    if(i === data.correctAnswer){
      btn.style.background = "green";
    }else{
      btn.style.background = "red";
    }
  });

  if(data.hp){
    document.getElementById("hp").innerText = JSON.stringify(data.hp);
  }
});

// 승리
socket.on("gameOver",(data)=>{
  if(data.winner === myId){
    alert("🎉 승리!");
  }else{
    alert("💀 패배...");
  }
});