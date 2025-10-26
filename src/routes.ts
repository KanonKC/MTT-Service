import fastify from "fastify";

const server = fastify();

server.get("/", (req, res) => {
  res.send("Hello World");
});

export default server;