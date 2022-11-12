let path = require('path');
let express = require('express');
let app = express();
let server = app.listen(process.env.PORT || 3000);
let socket = require('socket.io');
let io = socket(server);
let crypto = require('crypto');
const rooms = new Map();
const timeToClose = 1000 * 60 * 60;
app.use(express.static('public'));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
io.sockets.on('connection', newConnection);

function newConnection(socket) {
    let roomId = socket.id;
    ConsoleLog.newConnection(socket);

    socket.on('room', (data) => {
        roomId = roomProcess(socket, data);
    });

    socket.on('disconnecting', () => {
        disconnectUser(roomId);
    });

    // receiving info about new line from client and sending it to all other clients
    socket.on('draw', (data) => {
        draw(roomId, data);
    });

    socket.on('clearAll', () => {
        clearAllStuff(socket, roomId);
    });

    socket.on('background', (data) => {
        changeBackground(roomId, data);
        redrawLines(roomId, data);
    });
}

function disconnectUser(roomId) {
    if (roomExsists(roomId)) {
        rooms.get(roomId).users.delete(socket.id);

        if (rooms.get(roomId).users.size == 0) {
            ConsoleLog.closingRoom(roomId);

            rooms.get(roomId).timeout = setTimeout(
                deleteRoom,
                timeToClose,
                roomId
            );
        }
    }
}

