<<<<<<< HEAD
import express from 'express';
import { Server, Socket } from 'socket.io'
import cors from 'cors';




const app = express()
const PORT = process.env.PORT || 4000;
const io = new Server(PORT, {
    cors: true
})

app.use(cors())

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
    console.log (Socket, Connected, socket.id)

    socket.on('room:join', (data) => {

        const { email, room } = data;

        emailToSocketIdMap.set(email, socket.id) 
        socketIdToEmailMap.set(socket.id, email)
        io.to(room).emit('user:joined', { email, id: socket.id })
        socket.join(room);
        io.to(socket.id).emit('room:join', data)
    });

    socket.on("user:call", ({ to, offer }) => {
        io.to(to).emit("incomming:call", { from: socket.id, offer });
      });
    
      socket.on("call:accepted", ({ to, ans }) => {
        io.to(to).emit("call:accepted", { from: socket.id, ans });
      });
    
      socket.on("peer:nego:needed", ({ to, offer }) => {
        console.log("peer:nego:needed", offer);
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
      });
    
      socket.on("peer:nego:done", ({ to, ans }) => {
        console.log("peer:nego:done", ans);
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
      });
})
=======
const express = require("express");
const dotenv = require("dotenv");
const { chats } = require("./data/data");
const cors = require("cors");
const connectDB = require("./config/database");
// const userRoutes = express.Router();
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
dotenv.config();
connectDB();

app.use(cors());
app.use(express.json()); //so that the frontend accepts json data

const morgan = require("morgan");
const { notFound, errorHandler } = require("./middlewares/errorHandling");
// const connectDB = require("./config/database");
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("API is running successfully");
});

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 5000;


//Web socket initialization and function call
const server = app.listen(PORT, console.log(`Server started on port ${PORT}`));
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});

io.on("connection",(socket)=>{
  console.log('connected to socket.io');

  socket.on('setup',(userData)=>{
    socket.join(userData._id);
    // console.log(userData._id);
    socket.emit('connected');
  });

  socket.on('join chat', (room)=>{
    socket.join(room);
    console.log("User Joined Room:"+ room);
  })

  //typing... logic
  socket.on('typing',(room)=>socket.in(room).emit('typing'));
  socket.on('stop typing',(room)=>socket.in(room).emit('stop typing'));


  socket.on('new message',(newMessageReceived)=>{
    var chat = newMessageReceived.chat;

    if(!chat.users) return console.log('chat.users not defined');

    chat.users.forEach(user=>{
      if(user._id == newMessageReceived.sender._id) return;

      socket.in(user._id).emit('message received', newMessageReceived);

    });
  })
    socket.off("setup",()=>{
      console.log("USER Disconnected");
      socket.leave(userData._id);
    })

})
>>>>>>> master
