const express = require('express')

const { validate } = require('../form-validation/validation')
const authController = require('../controllers/auth')

const router = new express.Router()

router.get('/', authController.getIndex)

router.get('/login', authController.getLogin)

router.post('/login', validate('postLogin'), authController.postLogin)

router.post('/logout', authController.postLogout)

router.get('/signup', authController.getSignup)

router.post('/signup', validate('postSignup'), authController.postSignup)

module.exports = router
