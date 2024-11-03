const express = require('express');
const mongoose = require("mongoose");
const http = require('http');
const socketIo = require('socket.io');
const ChatMessage = require('./model/chatmessage');

const app = express();
app.use(express.static(__dirname));
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/chatdatabase", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("MongoDB connection succeeded"))
    .catch((error) => console.error("Connection error:", error));

app.get('/',(req, res) =>{
    res.sendFile(__dirname + '/index.html');
});

io.on('connection',(socket) =>{
    console.log('user connected');

    // fetch history
    socket.on("start chat", async ({username, participant}) =>{
        // unique block based on participants' names
        const blockName = [username, participant].sort().join("-");

        socket.join(blockName);

        // Check if chat already exists between participants
        let chat = await ChatMessage.findOne({
            participants: {$all:[username, participant]}
        });

        if(!chat){
            chat = new ChatMessage({
                participants: [username, participant],
                messages:[]
            });

            await chat.save();
        }
          // Send the existing chat history to the client
          socket.emit("chat history", chat.messages);

    });

    // new message send

    socket.on("chat message", async({message, sender, participant}) =>{
        // generate same blockname based on participant names
        const blockName = [sender, participant].sort().join("-");

        const chat = await ChatMessage.findOneAndUpdate(
            {participants: {$all: [sender, participant]}},
            {$push: {messages: {sender, message, timestamp: new Date()}}},
            { new: true, upsert: true } // Creates document if it doesn't exist

        );

        if(chat){
            //new message both participants
            io.to(blockName).emit("chat message", {sender, message});
        }

    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});
const port = 3000;
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})