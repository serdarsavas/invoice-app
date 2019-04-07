const express = require('express')

const authController = require('../controllers/auth')
const validate = require('../middleware/validation')
const handleException = require('../middleware/exception-handler')

const router = new express.Router()

router.get('/', authController.getLogin)

router.post('/login', validate('postLogin'), handleException(authController.postLogin))

router.post('/logout', handleException(authController.postLogout))

router.get('/signup', authController.getSignup)

router.post('/signup', validate('postSignup'), handleException(authController.postSignup))

router.get('/reset', authController.getReset)

router.post('/reset', validate('postReset'), authController.postReset)

router.get('/reset/:token', handleException(authController.getNewPassword))

router.post('/new-password', validate('postNewPassword'), handleException(authController.postNewPassword))

module.exports = router
