const mongoose = require('mongoose')

const eventSchema = new mongoose.Schema({
    organizer:{type:mongoose.Schema.Types.ObjectId,ref:'User', required:true},
    title:{type:String, required:true},
    description:{type:String, required:true},
    category:{type:String, required:true},
    mode:{type:String, required:true},
    location:{type:String, required:true},
    event_date:{type:Date, required:true},
    registration_deadline:{type:Date, required:true},
    max_participants:{type:Number, min:1, required:true},
    participants:{type:[{id:mongoose.Schema.Types.ObjectId,status:String}]},
    status:{type:String,enum:['open','closed','full','completed']}
})

module.exports = mongoose.model('Event',eventSchema);