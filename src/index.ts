import express, { response } from "express";
import { Server as SocketIoServer} from "socket.io";
import path from "path";
import http, { request } from "http";
import dotenv from "dotenv"
import { getMessageData, updateMessage, deleteMessage } from "./main.service";

if (process.env.NODE_ENV !== "production") {
    dotenv.config();
}


export const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server);
const credentials  = process.env.APP_CREDENSIAL || ""
app.use(express.json())
if (process.env.DISABLE_TEST != "active") {
  app.use(express.static(path.join(__dirname,'..','public')));
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
}

app.post('/turn', async (_,response) => {
    try {
      const data = await fetch(`https://yohancloud.metered.live/api/v1/turn/credentials?apiKey=${credentials}`)
      const turnCredential = await data.json();
      response.json(turnCredential);
    } catch (error) {
      console.log(error)
      response.status(500).json({ message : "internal server error"})
    }
})

app.post("/message/send",async (request,response)=> {
  const message = request.body?.message
  const device_id = request.body?.device_id
  if (message && device_id) {
    try {
      const stage = await updateMessage({
        message, device_id
      });

      if (stage) {
        io.emit('message',JSON.stringify({
          device_id,message
        }))

      response.json({message : "success"})
      } else {
      response.status(400).json({message : "Bad request"})
      }
    } catch (err) {
      response.status(400).json({message : "Bad request"})
      console.log(err)
    }
  } else {
    response.status(400).json({message : "Bad request"})
  }
})

app.post("/message/clear",async (_,response)=>{
  try {
    await deleteMessage();
    response.json({message : "success"});
  } catch {
    response.status(500).send('internal server error');
  }
})

app.post('/message',async (request,response) => {
  const last: string|null = request.body?.last || null
  try {
    const data = await getMessageData(last)
    response.json(data)
  } catch (error) {
      console.log(error)
      response.status(500).json({ message : "internal server error"})
    } 
})

io.on('connection', (socket) => {
  console.log('Seorang pengguna terhubung:', socket.id);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Pengguna ${socket.id} bergabung ke room ${roomId}`);
    
    socket.to(roomId).emit('user-joined', socket.id);
  });

  socket.on('offer', (payload: { target: string, sdp: any }) => {
    console.log(`Meneruskan offer dari ${socket.id} ke ${payload.target}`);
    io.to(payload.target).emit('offer', { from: socket.id, sdp: payload.sdp });
  });

  socket.on('answer', (payload: { target: string, sdp: any }) => {
    console.log(`Meneruskan answer dari ${socket.id} ke ${payload.target}`);
    io.to(payload.target).emit('answer', { from: socket.id, sdp: payload.sdp });
  });

  socket.on('ice-candidate', (payload: { target: string, candidate: any }) => {
    
    io.to(payload.target).emit('ice-candidate', { from: socket.id, candidate: payload.candidate });
  });

  socket.on('disconnect', () => {
    console.log('Pengguna terputus:', socket.id);
    
  });

  interface Messages {
    device_id : string
    message : string
  }

  socket.on('message', async (payload)=> {
    console.log(payload)
    try {
      const messages : Messages = JSON.parse(payload)
      const status  = await updateMessage(messages)
      if (status) {
        
        io.emit('message',JSON.stringify(messages))
      }
    } catch (error) {
      console.log(error)
    }
  })
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http: ${PORT}`)
})