const db = require('../db/database')

function obj() {
    this.readUser = async function () {
        [res] = await db.query(`select * from users;`)
        return res
    }

    this.createUser = async function (user) {
        const sql = `
            INSERT INTO users
            (user_name, user_email, user_phone, password, user_address)
            VALUES (?, ?, ?, ?, ?)
        `;

        const params = [
            user.user_name,
            user.user_email,
            user.user_phone,
            user.password,
            user.user_address,
        ];

        const [res] = await db.query(sql, params)
        return res;
    }


    this.findByMail = async function (obj) {
        const sql = `select * from users where user_email=?`
        const param = obj.user_email;
        const [res] = await db.query(sql, param)
        return res[0]
    }
    


}
module.exports = new obj()