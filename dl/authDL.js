const bcrypt = require('bcrypt')
const { getDatabase } = require('../db/database')

function createAuthDL() {
	async function ensureSchema() {
		try {
			const db = await getDatabase()
			
			// Create indexes for users collection
			await db.collection('users').createIndex({ user_email: 1 }, { unique: true })
			await db.collection('users').createIndex({ user_id: 1 }, { unique: true, sparse: true })
			await db.collection('users').createIndex({ created_at: -1 })
			
			console.log('MongoDB users collection and indexes created successfully')
		} catch (error) {
			console.error('Error creating users collection:', error)
			throw error
		}
	}

	async function readUser() {
		try {
			const db = await getDatabase()
			const users = await db.collection('users')
				.find({})
				.sort({ created_at: -1 })
				.toArray()
			return users
		} catch (error) {
			console.error('Error reading users:', error)
			return []
		}
	}

	async function createUser(user) {
		try {
			const db = await getDatabase()
			
			// Check if email already exists
			const existing = await db.collection('users').findOne({
				user_email: user.user_email
			})
			
			if (existing) {
				const err = new Error('Email already registered')
				err.code = 'EMAIL_EXISTS'
				throw err
			}

			// Insert new user
			const result = await db.collection('users').insertOne({
				user_name: user.user_name,
				user_email: user.user_email,
				user_phone: user.user_phone,
				password: user.password,
				user_address: user.user_address,
				admin: user.admin || 0,
				created_at: new Date()
			})

			return { insertId: result.insertedId }
		} catch (error) {
			console.error('Error creating user:', error)
			throw error
		}
	}

	async function findByMail(obj) {
		try {
			const db = await getDatabase()
			const user = await db.collection('users').findOne({
				user_email: obj.user_email
			})
			return user
		} catch (error) {
			console.error('Error finding user by email:', error)
			return null
		}
	}

	async function deleteUser(userId) {
		try {
			const db = await getDatabase()
			const result = await db.collection('users').deleteOne({
				_id: userId
			})
			return result
		} catch (error) {
			console.error('Error deleting user:', error)
			throw error
		}
	}

	// Initialize schema and seed admin user
	;(async () => {
		try {
			await ensureSchema()
			
			// Seed admin user if env vars provided
			const seedEmail = process.env.SEED_ADMIN_EMAIL
			const seedPass = process.env.SEED_ADMIN_PASSWORD
			const seedName = process.env.SEED_ADMIN_NAME || 'Admin'
			
			if (seedEmail && seedPass) {
				const existing = await findByMail({ user_email: seedEmail })
				if (!existing) {
					const hashed = await bcrypt.hash(seedPass, 10)
					await createUser({ 
						user_name: seedName, 
						user_email: seedEmail, 
						user_phone: '', 
						password: hashed, 
						user_address: '', 
						admin: 1 
					})
					console.log('Admin user seeded successfully')
				}
			}
		} catch (error) {
			console.error('Error initializing auth schema:', error)
		}
	})()

	return { readUser, createUser, findByMail, deleteUser, ensureSchema }
}

module.exports = createAuthDL()