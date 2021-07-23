const http_server = require("http").createServer().listen(8081);
const socket_cors = {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
};
const io = require("socket.io")(http_server, socket_cors);

io.on("connection", async (socket) => {
  try {
    await socket.emit("getid", socket.id);

    await socket.on("caller", async (data) => {
      try {
        io.to(data.ToCall).emit("caller", {
          signal: data.signalData,
          from: data.from,
        });
      } catch (error) {}
    });

    await socket.on("answerCall", async (data) => {
      try {
        await io.to(data.to).emit("acceptcall", data.signal);
      } catch (error) {}
    });
  } catch (error) {}
});
