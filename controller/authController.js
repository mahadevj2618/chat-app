const authBL = require('../bl/authBL')
const express = require('express')
const router = express.Router()
const auth=require('../middleware/auth')
const messageBL = require('../bl/messageBL')

router.get('/user',auth.verify, async function (req, res) {
    try {
        let response = await authBL.readUser();
        if (response.status === "success") {
            res.status(200).send(response)
        } else {
            res.status(400).send(response)
        }
    } catch (err) {
        res.status(500).send({
            status: "error",
            message: "Internal server error",
            error: err.message
        })
    }
})

// verify token and return decoded user
router.post('/verify', auth.verify, async function (req, res) {
    res.status(200).send({ status: 'success', user: req.user })
})

router.post('/register', async function (req, res) {
    try {
        let response = await authBL.createUser(req);
        if (response.status === "success") {
            res.status(200).send(response)
        } else {
            res.status(400).send(response)
        }
    } catch (err) {
        res.status(500).send({
            status: "error",
            message: "Internal server error",
            error: err.message
        })
    }
})

router.post('/login', async function (req, res) {
    try {
        let response = await authBL.loginUser(req);
        if (response.status === "success") {
            res.status(200).send(response)
        } else {
            res.status(400).send(response)
        }
    } catch (err) {
        res.status(500).send({
            status: "error",
            message: "Internal server error",
            error: err.message
        })
    }
})

// admin-only: list recent public messages
router.get('/admin/messages/public', auth.verify, async function (req, res) {
    if (!req.user || req.user.admin !== 1) return res.status(403).send({ status: 'error', message: 'Forbidden' })
    const rows = await messageBL.getPublicMessages(200)
    res.status(200).send({ status: 'success', data: rows })
})

// admin-only: list recent direct messages
router.get('/admin/messages/direct', auth.verify, async function (req, res) {
    if (!req.user || req.user.admin !== 1) return res.status(403).send({ status: 'error', message: 'Forbidden' })
    const rows = await messageBL.getDirectMessages(200)
    res.status(200).send({ status: 'success', data: rows })
})

// admin-only: delete user
router.delete('/admin/user/:userId', auth.verify, async function (req, res) {
    try {
        if (!req.user || req.user.admin !== 1) {
            return res.status(403).send({ status: 'error', message: 'Forbidden' })
        }
        
        const { userId } = req.params
        if (!userId) {
            return res.status(400).send({ status: 'error', message: 'User ID is required' })
        }
        
        const response = await authBL.deleteUser(userId)
        if (response.status === 'success') {
            res.status(200).send(response)
        } else {
            res.status(400).send(response)
        }
    } catch (err) {
        res.status(500).send({
            status: 'error',
            message: 'Internal server error',
            error: err.message
        })
    }
})

module.exports = router
