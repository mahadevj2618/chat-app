const bcrypt = require('bcrypt')

function createInMemoryAuthDL() {
	// In-memory user list. Not persisted across restarts.
	const users = []
	let nextId = 1

	async function readUser() {
		// return shallow copy to avoid external mutation
		return users.slice()
	}

	async function createUser(user) {
		// ensure email unique
		const existing = users.find(u => u.user_email === user.user_email)
		if (existing) {
			const err = new Error('Email already registered')
			err.code = 'EMAIL_EXISTS'
			throw err
		}
		const toInsert = {
			id: nextId++,
			user_id: undefined,
			user_name: user.user_name,
			user_email: user.user_email,
			user_phone: user.user_phone,
			password: user.password, // already hashed by BL
			user_address: user.user_address,
			admin: user.admin === 1 ? 1 : 0,
		}
		users.push(toInsert)
		return { insertId: toInsert.id }
	}

	async function findByMail(obj) {
		const email = obj.user_email
		return users.find(u => u.user_email === email) || null
	}

	// Optionally seed an admin user if env vars provided (password hashed here)
	;(async () => {
		try {
			const seedEmail = process.env.SEED_ADMIN_EMAIL
			const seedPass = process.env.SEED_ADMIN_PASSWORD
			const seedName = process.env.SEED_ADMIN_NAME || 'Admin'
			if (seedEmail && seedPass && !users.find(u => u.user_email === seedEmail)) {
				const hashed = await bcrypt.hash(seedPass, 10)
				await createUser({ user_name: seedName, user_email: seedEmail, user_phone: '', password: hashed, user_address: '', admin: 1 })
			}
		} catch (_) { /* ignore seed errors */ }
	})()

	return { readUser, createUser, findByMail }
}

module.exports = createInMemoryAuthDL()