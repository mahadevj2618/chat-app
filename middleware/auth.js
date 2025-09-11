const jwt = require('jsonwebtoken')
const tokenSecret = process.env.JWT_SECRET || 'mchat';

exports.verify = (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1] || req.query.token;
    if (!token) {
        return res.status(401).json({ status: 'error', message: "please provide a valid token" })
    }
    jwt.verify(token, tokenSecret, (err, decoded) => {
        if (err) {
            return res.status(401).json({ status: 'error', message: 'failed to authenticate token' })
        }
        req.user = decoded
        next()
    })
}