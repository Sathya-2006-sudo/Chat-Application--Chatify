const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
const users = new Map();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('user_join', (userData) => {
        const username = userData.username;
        users.set(socket.id, username);
        
        socket.broadcast.emit('user_joined', {
            username: username,
            time: new Date().toLocaleTimeString()
        });
        
        io.emit('users_updated', Array.from(users.values()));
        
        socket.emit('system_message', {
            message: `Welcome to the chat, ${username}!`,
            time: new Date().toLocaleTimeString()
        });
    });

    socket.on('send_message', (data) => {
        const username = users.get(socket.id);
        io.emit('receive_message', {
            username: username,
            message: data.message,
            timestamp: new Date().toLocaleTimeString(),
            userId: socket.id
        });
    });

    socket.on('typing_start', () => {
        const username = users.get(socket.id);
        socket.broadcast.emit('user_typing', username);
    });

    socket.on('typing_stop', () => {
        socket.broadcast.emit('user_stop_typing');
    });

    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            users.delete(socket.id);
            socket.broadcast.emit('user_left', {
                username: username,
                time: new Date().toLocaleTimeString()
            });
            io.emit('users_updated', Array.from(users.values()));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});