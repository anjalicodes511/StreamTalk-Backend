const mongoose = require("mongoose");

// Schema
const messageSchema = new mongoose.Schema({
    sender:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"User"
    },
    content:{
        type:String,
        required:true,
        trim:true,
    },
    group:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"Group"
    }
},{
    timestamps:true
});


const Message = mongoose.model('Message', messageSchema);
module.exports = Message;