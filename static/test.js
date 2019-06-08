/* eslint-disable no-console */
var newmessagealert = false;

function scroll() {
  var container = document.getElementById('conversation');
  container.maxScrollTop = container.scrollHeight - container.offsetHeight;

  if (container.maxScrollTop - container.scrollTop <= container.offsetHeight) {
    container.scrollTop = container.scrollHeight;
  } else {
    newmessagealert = true;
    document.getElementById('newmessagealert').style.visibility='visible';
  }
  if(newmessagealert === false){
    setInterval(function(){
      if (container.scrollTop == container.scrollHeight - container.offsetHeight) {
        newmessagealert = false;
        document.getElementById('newmessagealert').style.visibility='hidden';
      }
    }, 500);
  }
}

// eslint-disable-next-line no-undef
var socket = io(); // connect to server

socket.on("connect", function() {
  socket.emit("adduser", prompt("What's your name?"));
  $('#data').focus();
});

socket.on("updatechat", function(username, data) {
  $("#conversation").append("<span style='overflow-wrap:break-word;'><b>" + username + ":</b> " + data + "<br></span>");
  scroll();
});

// listener, whenever the server emits 'updaterooms', this updates the room the client is in
socket.on("updaterooms", function(rooms, current_room) {
  $("#conversation").html("");
  $("#rooms").empty();
  $.each(rooms, function(key, value) {
    if (key == current_room) {
      $("#rooms").append("<div>" + key + "</div>");
    } else {
      $("#rooms").append(
        '<div><a href="#" onclick="switchRoom(\'' +
          key +
          "')\">" +
          key +
          "</a></div>"
      );
    }
  });
});

socket.on("updatelist", function(usernames) {
  $("#locallist").html("");
  for(var name in usernames){
    $("#locallist").append(usernames[name] + "<br />");
  }
});

function switchRoom(room) {
  socket.emit("switchRoom", room);
}

// on load of page
$(function() {
  // when the client clicks SEND
  $("#datasend").click(function() {
    var message = $("#data").val();
    if(message.length >= 500)return;
    $("#data").val("");
    $("#data").focus();
    socket.emit("sendchat", message);
  });

  $("#data").keypress(function(e) {
    if (e.which == 13) {
      $(this).blur();
      $("#datasend")
        .focus()
        .click();
      $("#data").val("");
    }
  });
});
