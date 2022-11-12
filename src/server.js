let path = require('path');
let express = require('express');
let app = express();
let server = app.listen(process.env.PORT || 3000);
let socket = require('socket.io');
let io = socket(server);
let crypto = require('crypto');
app.use(express.static('public'));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});