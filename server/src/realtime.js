import { Server } from "socket.io";

let ioInstance = null;

export function initRealtime(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"],
    },
  });

  ioInstance.on("connection", (socket) => {
    socket.on("queue:join", (payload) => {
      if (!payload) return;
      const { doctorId, day } = payload;
      if (!doctorId || !day) return;
      const dayKey = typeof day === "string" ? day.slice(0, 10) : "";
      if (!dayKey) return;
      const room = `queue:${doctorId}:${dayKey}`;
      socket.join(room);
    });
  });
}

export function getIo() {
  return ioInstance;
}

