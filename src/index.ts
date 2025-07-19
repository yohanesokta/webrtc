import express from "express";
import { Server as SocketIoServer} from "socket.io";
import path from "path";
import http from "http";
import dotenv from "dotenv"
dotenv.config()

export const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server);
const credentials  = process.env.APP_CREDENSIAL || ""

app.use(express.static(path.join(__dirname,'..','public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

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
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http: ${PORT}`)
})