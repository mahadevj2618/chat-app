const db = require('../db/database')

async function ensureSchema() {
    // create tables if not exist
    await db.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            sender_name VARCHAR(100) NOT NULL,
            message_text TEXT NOT NULL,
            sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `)

    await db.query(`
        CREATE TABLE IF NOT EXISTS direct_messages (
            id BIGINT PRIMARY KEY AUTO_INCREMENT,
            room_id VARCHAR(255) NOT NULL,
            from_name VARCHAR(100) NOT NULL,
            to_name VARCHAR(100) NOT NULL,
            message_text TEXT NOT NULL,
            sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_room_id (room_id)
        );
    `)
}

async function insertPublicMessage({ senderName, messageText }) {
    const sql = `INSERT INTO chat_messages (sender_name, message_text) VALUES (?, ?)`
    const params = [senderName, messageText]
    await db.query(sql, params)
}

async function insertDirectMessage({ fromName, toName, roomId, messageText }) {
    const sql = `INSERT INTO direct_messages (room_id, from_name, to_name, message_text) VALUES (?, ?, ?, ?)`
    const params = [roomId, fromName, toName, messageText]
    await db.query(sql, params)
}

module.exports = { ensureSchema, insertPublicMessage, insertDirectMessage }

async function getPublicMessages(limit = 200) {
    const [rows] = await db.query(`SELECT id, sender_name, message_text, sent_at FROM chat_messages ORDER BY sent_at DESC LIMIT ?`, [limit])
    return rows
}

async function getDirectMessages(limit = 200) {
    const [rows] = await db.query(`SELECT id, room_id, from_name, to_name, message_text, sent_at FROM direct_messages ORDER BY sent_at DESC LIMIT ?`, [limit])
    return rows
}

module.exports.getPublicMessages = getPublicMessages
module.exports.getDirectMessages = getDirectMessages


