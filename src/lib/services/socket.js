import { Server as SocketServer } from "socket.io";
import { NextApiResponse } from "next/server";
import { Server as HttpServer } from "http";

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer, res: NextApiResponse) {
  if (!io) {
    io = new SocketServer(httpServer, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      socket.on("joinChat", (chatId) => {
        socket.join(chatId);
        console.log(`User joined chat room: ${chatId}`);
      });

      socket.on("sendMessage", (message) => {
        io?.to(message.chatId).emit("receiveMessage", message);
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    console.log("WebSocket server initialized.");
  }
}
