const express = require('express')

const { validate } = require('../form-validation/validation')
const authController = require('../controllers/auth')

const router = new express.Router()

router.get('/', authController.getLogin)

router.post('/login', validate('postLogin'), authController.postLogin)

router.post('/logout', authController.postLogout)

router.get('/signup', authController.getSignup)

router.post('/signup', validate('postSignup'), authController.postSignup)

router.get('/reset', authController.getReset)

router.post('/reset', validate('postReset'), authController.postReset)

router.get('/reset/:token', authController.getNewPassword)

router.post('/new-password', validate('postNewPassword'), authController.postNewPassword)

module.exports = router
