import express from "express";
import { Server as SocketIoServer} from "socket.io";
import path from "path";
import http from "http";

const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server);

app.use(express.static(path.join(__dirname,'..','public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Seorang pengguna terhubung:', socket.id);

  // --- SEMUA EVENT LISTENER SEKARANG BERADA DI LEVEL INI ---

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`Pengguna ${socket.id} bergabung ke room ${roomId}`);
    // Beri tahu pengguna lain di room bahwa ada pengguna baru yang bergabung
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
    // Teruskan kandidat ke target yang benar
    io.to(payload.target).emit('ice-candidate', { from: socket.id, candidate: payload.candidate });
  });

  socket.on('disconnect', () => {
    console.log('Pengguna terputus:', socket.id);
    // Di aplikasi nyata, Anda perlu memberi tahu pengguna lain di room
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});