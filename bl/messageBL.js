const messageDL = require('../dl/messageDL')

function obj() {
    this.ensureSchema = async function () {
        await messageDL.ensureSchema()
    }

    this.storePublicMessage = async function ({ senderName, messageText, sentAt }) {
        try {
            await messageDL.insertPublicMessage({ senderName, messageText, sentAt })
        } catch (err) {
            console.error('Failed to store public message:', err.message)
        }
    }

    this.storeDirectMessage = async function ({ fromName, toName, roomId, messageText, sentAt }) {
        try {
            await messageDL.insertDirectMessage({ fromName, toName, roomId, messageText, sentAt })
        } catch (err) {
            console.error('Failed to store DM message:', err.message)
        }
    }

    this.getPublicMessages = async function (limit) {
        try {
            return await messageDL.getPublicMessages(limit)
        } catch (err) {
            console.error('Failed to fetch public messages:', err.message)
            return []
        }
    }

    this.getDirectMessages = async function (limit) {
        try {
            return await messageDL.getDirectMessages(limit)
        } catch (err) {
            console.error('Failed to fetch direct messages:', err.message)
            return []
        }
    }
}

module.exports = new obj()


