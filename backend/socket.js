import http from "http";
import { Server } from "socket.io";

const httpServer = http.createServer();
const PORT = 3001;

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log(`New client connected: ${socket.id}`);

  socket.on("userOnline", (userId) => {
    activeUsers.set(socket.id, userId);
    console.log(`User online: ${userId}`);

    io.emit("updateUserList", Array.from(new Set(activeUsers.values())));
  });

  socket.on("userOffline", () => {
    if (activeUsers.has(socket.id)) {
      console.log(`User offline: ${activeUsers.get(socket.id)}`);
      activeUsers.delete(socket.id);

      io.emit("updateUserList", Array.from(new Set(activeUsers.values())));
    }
  });
  socket.on("joinChat", (chatId) => {
    const isJoined = socket.rooms.has(chatId);
    if (isJoined) {
      return;
    }
    socket.join(chatId);
    console.log(`User joined chat room: ${chatId}`);
  });

  socket.on("sendMessage", (message) => {
    io.to(message.chatId).emit("receiveMessage", message);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);

    for (const userId of activeUsers) {
      if (socket.id === userId) {
        activeUsers.delete(userId);
        console.log(`User removed from active list: ${userId}`);
        io.emit("updateUserList", Array.from(activeUsers));
        break;
      }
    }
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log(`Connect using: http://localhost:${PORT}`);
});
