const express = require('express')
const router = express.Router();
const verifyRole = require('../middleware/verifyRole')
const Event = require('../model/event')
const User = require('../model/user')

router.get("/dashboard",verifyRole('participant'),async (req,res)=>{
    try{
        const parti = await User.findOne({_id:req.id})
        const {name,email,role,events} = parti;
        res.status(200).json({
            message:"dashboard fetched",
            events,
            profile:{name,email,role},
        })
    } catch(e){
        res.status(400).send(e.message)
        console.log(e)
    }
})

module.exports = router;