const express = require('express')
const { body } = require('express-validator/check')

const User = require('../models/user')
const authController = require('../controllers/auth')

const router = new express.Router()

router.get('/', authController.getIndex)

router.get('/login', authController.getLogin)

router.post('/login', 
  [
    body('email')
      .isEmail()
      .withMessage('Ange en korrekt epostadress.')
      .normalizeEmail(),
    body('password', 'Lösenordet måste vara minst 6 tecken')
      .isLength({ min: 6 })
      .trim()
  ],
  authController.postLogin
)

router.post('/logout', authController.postLogout)

router.get('/signup', authController.getSignup)

router.post('/signup',
  [
    body('email')
      .isEmail()
      .withMessage('Ange en giltig epostadress.')
      .custom(async email => {
        try {
          const user = await User.findOne({ email })
          if (user) {
            throw new Error('Epostadressen existerar redan.')
          }
          return true
        } catch (e) {
          console.log(e)
        }
      })
      .normalizeEmail(),
    body('password', 'Lösenordet måste vara minst 6 tecken.')
      .isLength({ min: 6 })
      .trim(),
    body('confirmPassword')
      .trim()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Lösenorden måste matcha.')
        }
        return true
      })
  ],
  authController.postSignup
)

module.exports = router
