// In-memory message store

function createInMemoryMessageDL() {
	const publicMessages = []
	const directMessages = []

	async function ensureSchema() {
		// no-op for in-memory
	}

	async function insertPublicMessage({ senderName, messageText, sentAt }) {
		publicMessages.push({
			id: publicMessages.length + 1,
			sender_name: senderName,
			message_text: messageText,
			sent_at: sentAt || new Date()
		})
	}

	async function insertDirectMessage({ fromName, toName, roomId, messageText, sentAt }) {
		directMessages.push({
			id: directMessages.length + 1,
			room_id: roomId,
			from_name: fromName,
			to_name: toName,
			message_text: messageText,
			sent_at: sentAt || new Date()
		})
	}

	async function getPublicMessages(limit = 200) {
		return publicMessages.slice(-limit).sort((a, b) => b.sent_at - a.sent_at)
	}

	async function getDirectMessages(limit = 200) {
		return directMessages.slice(-limit).sort((a, b) => b.sent_at - a.sent_at)
	}

	return { ensureSchema, insertPublicMessage, insertDirectMessage, getPublicMessages, getDirectMessages }
}

module.exports = createInMemoryMessageDL()


