const bcrypt = require('bcryptjs')
const User = require('../models/user')
const { validationResult } = require('express-validator/check')

exports.getIndex = (req, res) => {
  res.render('index', {
    path: '/',
    pageTitle: 'Välkommen'
  })
}

exports.getLogin = (req, res) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Logga in',
    errorMessage: null,
    inputData: {
      email: '',
      password: ''
    }
  })
}

exports.postLogin = async (req, res) => {
  const errors = validationResult(req)

  const email = req.body.email
  const password = req.body.password
  
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Logga in',
      errorMessage: errors.array()[0].msg,
      inputData: {
        email,
        password
      }
    })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Logga in',
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
        path: '/login',
        pageTitle: 'Logga in',
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
    path: '/signup',
    pageTitle: 'Registrering',
    errorMessage: null
  })
}

exports.postSignup = async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Registrering',
      errorMessage: errors.array()[0].msg
    })
  }
  const password = req.body.password
  try {
    const hashedPassword = await bcrypt.hash(password, 8)
    const user = new User({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      telephone: req.body.telephone,
      position: req.body.position,
      address: {
        street: req.body.street,
        zip: req.body.zip,
        city: req.body.city
      },
      registrationNumber: req.body.registrationNumber,
      vatNumber: req.body.vatNumber,
      bankgiro: req.body.bankgiro,
      password: hashedPassword
    })
    await user.save()
  } catch (e) {
    console.log(e)
  }
  res.redirect('/login')
}
