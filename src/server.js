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
    if (roomExists(roomId)) {
        rooms.get(roomId).users.delete(socket.id);

        if (rooms.get(roomId).users.size === 0) {
            ConsoleLog.closingRoom(roomId);

            rooms.get(roomId).timeout = setTimeout(
                deleteRoom,
                timeToClose,
                roomId
            );
        }
    }
}
function deleteRoom(roomId) {
    if (roomExists(roomId)) {
        rooms.delete(roomId);

        ConsoleLog.closeRoom(roomId);
        ConsoleLog.roomsCount();
    }
}

function roomExists(data) {
    return rooms.has(data);
}

function stopTimeOut(roomId) {
    if (rooms.get(roomId).timeout != null) {
        clearTimeout(rooms.get(roomId).timeout);
        rooms.get(roomId).timeout = null;
    }
}

function addUserToRoom(socket, roomId) {
    rooms.get(roomId).users.add(socket.id);
    socket.join(roomId);
    ConsoleLog.userJoin(socket, roomId);
}
function createRoom(socket, roomId) {
    rooms.set(roomId, {
        users: new Set([socket.id]),
        lines: new Array(),
        background: null,
        timeout: null,
    });

    socket.join(roomId);
    socket.emit('path', '/' + roomId);
    ConsoleLog.userJoin(socket, roomId);
}

function roomProcess(socket, data) {
    let roomId;

    if (roomExists(data)) {
        roomId = data;
        stopTimeOut(roomId);
        addUserToRoom(socket, roomId);
        loadCanvasToUser(socket, roomId);
    } else {
        roomId = crypto.randomBytes(10).toString('hex');
        createRoom(socket, roomId);
    }
    ConsoleLog.roomsCount();

    return roomId;
}
function loadCanvasToUser(socket, roomId) {
    socket.emit('canvas', {
        lines: rooms.get(roomId).lines,
        background: rooms.get(roomId).background,
    });
    ConsoleLog.sentLines();
}


function changeBackground(roomId, data) {
    ConsoleLog.backgroundChange();

    if (roomExsists(roomId)) {
        rooms.get(roomId).background = data;
    }
}
function draw(roomId, data) {
    if (roomExsists(roomId)) {
        rooms.get(roomId).lines.push(data);
    }

    io.to(roomId).emit('draw', data);
}
function clearAllStuff(socket, roomId) {
    if (roomExsists(roomId)) {
        rooms.get(roomId).lines = [];
    }

    socket.to(roomId).emit('clearAll');
}
function redrawLines(roomId, data) {
    io.to(roomId).emit('canvas', {
        lines: rooms.get(roomId).lines,
        background: data,
    });
}
class ConsoleLog {
    static userJoin(socket, roomId) {
        console.log(
            socket.id,
            'connected to',
            roomId,
            'with',
            rooms.get(roomId).users.size,
            'users'
        );
    }

    static newConnection(socket) {
        console.log('new connection:', socket.id);
    }

    static roomsCount() {
        console.log('rooms:', rooms.size);
    }

    static sentLines() {
        console.log('sent lines');
    }

    static closingRoom(roomId) {
        console.log('closing room', roomId);
    }

    static backgroundChange() {
        console.log('background changed');
    }

    static closeRoom(roomId) {
        console.log('close room', roomId);
    }
}