const mongoose = require('mongoose')

async function connectDB(){
    try{
        mongoose.connect(process.env.MONGODB_URI)
        console.log("Database connected")
    } catch(e){
        console.log("Database error: ",e)
    }
}

module.exports = connectDB;