const bcrypt = require('bcryptjs')
const User = require('../models/user')
const { validationResult } = require('express-validator/check')

exports.getIndex = (req, res) => {
  res.render('index')
}

exports.getLogin = (req, res) => {
  res.render('auth/login', {
    errorMessage: null,
    inputData: {
      email: '',
      password: ''
    }
  })
}

exports.postLogin = async (req, res) => {
  const email = req.body.email
  const password = req.body.password

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      errorMessage: errors.array()[0].msg,
      inputData: {
        email,
        password
      }
    })
  }
  try {
    const user = await User.findOne({ email: email })
    if (!user) {
      return res.status(422).render('auth/login', {
        errorMessage: 'Felaktig epost eller lösenord.',
        inputData: {
          email,
          password
        }
      })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(422).render('auth/login', {
        errorMessage: 'Felaktig epostadress eller lösenord',
        inputData: {
          email,
          password
        }
      })
    }
    req.session.isLoggedIn = true
    req.session.user = user
    await req.session.save()
    res.redirect('/start')
    
  } catch (e) {
    console.log(e)
  }
}

exports.postLogout = (req, res) => {
  req.session.destroy(err => {
    res.redirect('/')
    if (err) console.log(err)
  })
}

exports.getSignup = (req, res) => {
  res.render('auth/signup', {
    errorMessage: null
  })
}

exports.postSignup = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      errorMessage: errors.array()[0].msg
    })
  }
  const username = req.body.username
  const email = req.body.email
  const password = req.body.password

  try {
    const hashedPassword = await bcrypt.hash(password, 8)
    const user = new User({
      username,
      email,
      password: hashedPassword
    })
    await user.save()
  } catch (e) {
    console.log(e)
  }
  res.redirect('/login')
}
