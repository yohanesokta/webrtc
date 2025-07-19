"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const path_1 = __importDefault(require("path"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.app = (0, express_1.default)();
const server = http_1.default.createServer(exports.app);
const io = new socket_io_1.Server(server);
const credentials = process.env.APP_CREDENSIAL || "";
exports.app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
exports.app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
exports.app.post('/turn', (_, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield fetch(`https://yohancloud.metered.live/api/v1/turn/credentials?apiKey=${credentials}`);
        const turnCredential = yield data.json();
        response.json(turnCredential);
    }
    catch (error) {
        console.log(error);
        response.status(500).json({ message: "internal server error" });
    }
}));
io.on('connection', (socket) => {
    console.log('Seorang pengguna terhubung:', socket.id);
    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        console.log(`Pengguna ${socket.id} bergabung ke room ${roomId}`);
        socket.to(roomId).emit('user-joined', socket.id);
    });
    socket.on('offer', (payload) => {
        console.log(`Meneruskan offer dari ${socket.id} ke ${payload.target}`);
        io.to(payload.target).emit('offer', { from: socket.id, sdp: payload.sdp });
    });
    socket.on('answer', (payload) => {
        console.log(`Meneruskan answer dari ${socket.id} ke ${payload.target}`);
        io.to(payload.target).emit('answer', { from: socket.id, sdp: payload.sdp });
    });
    socket.on('ice-candidate', (payload) => {
        io.to(payload.target).emit('ice-candidate', { from: socket.id, candidate: payload.candidate });
    });
    socket.on('disconnect', () => {
        console.log('Pengguna terputus:', socket.id);
    });
});
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http: ${PORT}`);
});
