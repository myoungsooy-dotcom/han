const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

// ===== 문제 =====
const questions = [
  { q:"고구려 건국자는?", a:["주몽","이성계","왕건","세종"], c:0 },
  { q:"조선 건국자는?", a:["주몽","이성계","왕건","광개토"], c:1 },
  { q:"훈민정음 만든 왕?", a:["세종","태조","영조","광해군"], c:0 }
];

let rooms = {};

// 문제 보내기
function sendQuestion(roomId){
  const room = rooms[roomId];
  const q = questions[Math.floor(Math.random()*questions.length)];

  room.currentQ = q;
  room.answered = false; // 🔥 턴 제한

  io.to(roomId).emit("question", q);
}

io.on("connection", (socket) => {

  // 방 만들기
  socket.on("createRoom", () => {
    const roomId = Math.random().toString(36).substr(2,5);

    rooms[roomId] = {
      players:[socket.id],
      hp:{},
      answered:false
    };

    rooms[roomId].hp[socket.id] = 100;

    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  // 방 참가
  socket.on("joinRoom", (roomId)=>{
    const room = rooms[roomId];

    if(room && room.players.length < 2){
      room.players.push(socket.id);
      room.hp[socket.id] = 100;

      socket.join(roomId);

      io.to(roomId).emit("startGame");

      sendQuestion(roomId);
    }
  });

  // 답 제출
  socket.on("answer", ({roomId, answerIndex})=>{
    const room = rooms[roomId];
    if(!room || room.answered) return; // 🔥 턴 제한

    room.answered = true;

    const q = room.currentQ;
    const correct = (answerIndex === q.c);

    const enemy = room.players.find(p => p !== socket.id);

    if(correct && enemy){
      room.hp[enemy] -= 20;
    }

    io.to(roomId).emit("result", {
      correct,
      correctAnswer:q.c,
      hp:room.hp,
      attacker:socket.id
    });

    // 승리 체크
    if(enemy && room.hp[enemy] <= 0){
      io.to(roomId).emit("gameOver", {
        winner:socket.id
      });
      return;
    }

    // 다음 문제
    setTimeout(()=>{
      sendQuestion(roomId);
    },1500);
  });

});

server.listen(3000, ()=>{
  console.log("서버 실행됨 👉 http://localhost:3000");
});