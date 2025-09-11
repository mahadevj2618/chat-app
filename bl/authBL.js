const authDL = require('../dl/authDL')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

function obj() {
    this.readUser = async function () {
        let response = {}
        try {
            const result = await authDL.readUser()

            response = {
                status: "success",
                message: "all users",
                data: result
            }
        }
        catch (error) {
            response = {
                status: "error",
                message: "not loading",
                error: error.message
            }
        }
        return response
    }

    this.createUser = async function (req) {
        let response = {};
        try {
            let obj = req.body;
            obj.password = bcrypt.hashSync(obj.password, 10);
            let result = await authDL.createUser(obj);
            response = {
                status: "success",
                message: "User registered successfully",
                data: result
            };
        } catch (error) {
            response = {
                status: "error",
                message: "User registration failed",
                error: error.message
            };
        }
        return response;
    };



    this.loginUser = async function (req) {
    let response = {};
    try {
        const obj = req.body;
        const user = await authDL.findByMail(obj);

        if (!user) {
            return {
                status: "error",
                message: "User not found"
            };
        }
        const match = await bcrypt.compare(obj.password, user.password);
        console.log('match-', match);
        if (!match) {
            return {
                status: "error",
                message: "Incorrect password"
            };
        }
        // Only include safe info in token
        const token = jwt.sign(
            { id: user.id || user.user_id, email: user.user_email, user_name: user.user_name, admin: user.admin },
            process.env.JWT_SECRET || 'mchat',
            { expiresIn: '1h' }
        );
        if (user.admin === 1) {
            response = {
                status: "success",
                message: "Admin logged in",
                token: token,
                admin: user.admin 
            };
        } else {
            response = {
                status: "success",
                message: "User logged in",
                token: token,
                admin: user.admin 
            };
        }
    } catch (error) {
        response = {
            status: "error",
            message: "User login failed",
            error: error.message
        };
    }

    return response;
};







}
module.exports = new obj()
