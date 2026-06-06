const jwt = require('jsonwebtoken');


async function verifyLogin(req, res, next) {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(400).send("login Required")
        }
        const validate = jwt.verify(token, process.env.JWT_SIGN);
        next();

    } catch(e){
        res.status(400).send("Some error occured")
        console.log(e)
    }
}

module.exports = verifyLogin