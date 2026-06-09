const express  = require('express')
const app = express()
const authRoute = require('./routes/auth')
const eventRoute= require('./routes/event')
const organizerRoute = require('./routes/organizer')
const participantRoute = require('./routes/participant')
const connectDB = require('./db');
require('dotenv').config();
app.use(express.json())
connectDB();


app.get('/',(req,res)=>{
    res.status(200).send("Welcome to Event Hub Backend Server")
})
app.use('/api/auth',authRoute)
app.use('/api/events',eventRoute)
app.use('/api/organizer',organizerRoute)
app.use('/api/participant',participantRoute)

app.listen(3000,()=>{
    console.log("listening at port 3000")
})
