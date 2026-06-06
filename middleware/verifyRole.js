const jwt = require('jsonwebtoken')
const User = require('../model/user')

function verifyRole(role) {
    return async (req, res, next) => {
        try {
            const token = req.headers['token'];
            const payload = jwt.verify(token, process.env.JWT_SIGN);
            const { id } = payload;
            req.id = id;
            const foundUser = await User.findOne({ _id: id });
            if (foundUser.role != role) {
                return res.status(400).send("No Access to this Route")
            }
            next();
        } catch(e){
            res.status(400).send('some error occured')
            console.log(e)
        }
    }
}

module.exports = verifyRole