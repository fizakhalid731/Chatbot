
const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    participants: [String],
    messages: [
        {
            sender: String, 
            message: String, 
            timestamp: { type: Date, default: Date.now } 
        }
    ]
});


const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = ChatMessage;
