/* eslint-disable no-console */
// Dependencies.
var express = require("express");
var http = require("http");
var path = require("path");
var socketIO = require("socket.io");

var app = express();
var server = http.Server(app);
var io = socketIO(server);
var port = 5000;

app.set("port", port);
app.use("/static", express.static(__dirname + "/static"));
// Routing
app.get("/", function(request, response) {
  response.sendFile(path.join(__dirname, "index.html"));
});
server.listen(port, function() {
  console.log("Starting server on port " + port + ' with game: "chat"');
});

var usernames = {};
var rooms = { room1: [], room2: [], room3: [] };

io.sockets.on("connection", function(socket) {
  socket.on("adduser", async function(username) {
    socket.username = username;
    socket.room = "room1";
    usernames[username] = username;
    socket.join("room1");
    rooms[socket.room].push(socket.username);
    socket.emit("updaterooms", rooms, socket.room);
    socket.emit("updatelist", rooms[socket.room]);
    socket.to(socket.room).emit("updatelist", rooms[socket.room]);
    socket.to(socket.room).emit(
        "updatechat",
        "SERVER",
        username + " has joined this room"
      );
    await socket.emit(
      "updatechat",
      "SERVER",
      username + " has joined this room"
    );
  });

  socket.on("sendchat", function(data) {
    io.sockets.in(socket.room).emit("updatechat", socket.username, data);
  });

  socket.on("switchRoom", async function(newroom) {
    socket.leave(socket.room);
    socket.join(newroom);
    socket.broadcast
      .to(socket.room)
      .emit("updatechat", "SERVER", socket.username + " has left this room"); // send message to OLD room
    rooms[socket.room].find((item, index, array) => {
      if (item == socket.username) return rooms[socket.room].splice(index, 1);
    });
    socket.to(socket.room).emit("updatelist", rooms[socket.room]); // update list of OLD room

    socket.room = newroom;
    rooms[socket.room].push(socket.username);
    socket.emit("updaterooms", rooms, newroom);
    socket.emit("updatelist", rooms[socket.room]);
    socket.to(socket.room).emit("updatelist", rooms[socket.room]);
    socket.emit("updatechat", "SERVER", socket.username + " has joined this room");
    await socket.to(socket.room).emit("updatechat", "SERVER", socket.username + " has joined this room");
  });

  socket.on("disconnect", function() {
    delete usernames[socket.username];
    rooms[socket.room].find((item, index, array) => {
      if (item == socket.username) return rooms[socket.room].splice(index, 1);
    });
    socket.to(socket.room).emit("updatelist", rooms[socket.room]);
    socket.broadcast.emit(
      "updatechat",
      "SERVER",
      socket.username + " has disconnected"
    );
    socket.leave(socket.room);
  });
});
