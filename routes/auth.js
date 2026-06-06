const express = require('express')
const router = express.Router();
const User = require('../model/user');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const foundUser = await User.findOne({ email });
        if (foundUser) {
            let err = new Error("Email already registered")
            err.status = 400;
            throw err
        }
        if(role!='organizer' && role!='participant'){
            let err = new Error("Invalid User Role")
            err.status = 400;
            throw err
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPass = await bcrypt.hash(password, salt)
        const newUser = new User({ name, email, password: hashedPass, role })
        await newUser.save()
        res.status(200).json({
            message: 'Registration successfull',
            user:{name:newUser.name,email:newUser.email,role:newUser.role,_id:newUser._id},
        })

    } catch (e) {
        res.status(400).send("Some Error occured")
        console.log(e)
    }
})

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const foundUser = await User.findOne({ email });
        if (!foundUser) {
            let err = new Error("User Not Found")
            err.status = 404;
            throw err
        }
        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) {
            let err = new Error("Password is incorrect")
            err.status = 400
            throw err
        }
        const token = await jwt.sign({ id: foundUser._id }, process.env.JWT_SIGN)
        res.status(200).json({
            message: "Login successfull",
            token
        })

    } catch (e) {
        res.status(400).send("Some Error occured")
        console.log(e)
    }
})

module.exports = router;