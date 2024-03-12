import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import http from 'http'

import {chats} from './data/data.js'

const app = express()
dotenv.config();

app.use(cors());
app.use(morgan("dev"));

// app.get('/', (req,res)=>{
//     res.send("API is running successfully");
// });
// app.get('/api/chat', (req,res)=>{
//     res.json({"chats":chats});
// });
// app.get('/api/chat/:id', (req,res)=>{
//     // console.log(req);
//     const singleChat = chats.find((c)=>c._id === req.params.id)
//     res.send(singleChat);
// });

const PORT = process.env.PORT || 5000

app.listen(PORT, () =>{ 
    console.log(`Server started on port ${PORT}`)
});