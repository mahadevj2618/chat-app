// MongoDB-based message store for persistent storage

const { getDatabase } = require('../db/database')

function createMessageDL() {
	async function ensureSchema() {
		try {
			const db = await getDatabase()
			
			// Create indexes for public messages collection
			await db.collection('public_messages').createIndex({ sent_at: -1 })
			await db.collection('public_messages').createIndex({ sender_name: 1 })
			
			// Create indexes for direct messages collection
			await db.collection('direct_messages').createIndex({ sent_at: -1 })
			await db.collection('direct_messages').createIndex({ room_id: 1 })
			await db.collection('direct_messages').createIndex({ from_name: 1, to_name: 1 })
			
			console.log('MongoDB message collections and indexes created successfully')
		} catch (error) {
			console.error('Error creating message collections:', error)
			throw error
		}
	}

	async function insertPublicMessage({ senderName, messageText, sentAt }) {
		try {
			const db = await getDatabase()
			const result = await db.collection('public_messages').insertOne({
				sender_name: senderName,
				message_text: messageText,
				sent_at: sentAt || new Date()
			})
			return result
		} catch (error) {
			console.error('Error inserting public message:', error)
			throw error
		}
	}

	async function insertDirectMessage({ fromName, toName, roomId, messageText, sentAt }) {
		try {
			const db = await getDatabase()
			const result = await db.collection('direct_messages').insertOne({
				room_id: roomId,
				from_name: fromName,
				to_name: toName,
				message_text: messageText,
				sent_at: sentAt || new Date()
			})
			return result
		} catch (error) {
			console.error('Error inserting direct message:', error)
			throw error
		}
	}

	async function getPublicMessages(limit = 200) {
		try {
			const db = await getDatabase()
			const messages = await db.collection('public_messages')
				.find({})
				.sort({ sent_at: -1 })
				.limit(limit)
				.toArray()
			return messages
		} catch (error) {
			console.error('Error fetching public messages:', error)
			return []
		}
	}

	async function getDirectMessages(limit = 200) {
		try {
			const db = await getDatabase()
			const messages = await db.collection('direct_messages')
				.find({})
				.sort({ sent_at: -1 })
				.limit(limit)
				.toArray()
			return messages
		} catch (error) {
			console.error('Error fetching direct messages:', error)
			return []
		}
	}

	return { ensureSchema, insertPublicMessage, insertDirectMessage, getPublicMessages, getDirectMessages }
}

module.exports = createMessageDL()


