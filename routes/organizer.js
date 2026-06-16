const express = require('express')
const router = express.Router();
const verifyRole = require('../middleware/verifyRole')
const Event = require('../model/event')

router.get("/dashboard",verifyRole('organizer'),async (req,res)=>{
    try{
        const events = await Event.find({organizer:req.id})
        const count = events.length;
        res.status(200).json({
            message:"dashboard fetched",
            events,
            count
        })
    } catch(e){
        res.status(400).send(e.message)
        console.log(e)
    }
})

module.exports = router;