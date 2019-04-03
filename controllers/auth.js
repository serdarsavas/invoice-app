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
    },
    validationErrors: []
  })
}

exports.postLogin = async (req, res) => {
  const errors = validationResult(req)
  const { email, password } = req.body

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Logga in',
      errorMessage: errors.array()[0].msg,
      inputData: {
        email,
        password
      },
      validationErrors: errors.array()
    })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Logga in',
        errorMessage: 'Felaktig epostadress eller lösenord.',
        inputData: {
          email,
          password
        },
        validationErrors: []
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
        },
        validationErrors: []
      })
    }
    req.session.isLoggedIn = true
    req.session.user = user
    await req.session.save()
    res.redirect('/admin/invoices')
  } catch (e) {
    console.log(e)
  }
}

exports.postLogout = async (req, res) => {
  try {
    await req.session.destroy()
    res.redirect('/')
  } catch (e) {
    console.log(e)
  }
}

exports.getSignup = (req, res) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Registrering',
    validationErrors: [],
    inputData: null 
  })
}

exports.postSignup = async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Registrering',
      validationErrors: errors.array({ onlyFirstError: true }),
      inputData: req.body
    })
  }
  
  try {
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: await bcrypt.hash(req.body.password, 8),
        phone: req.body.phone,
        street: req.body.street,
        zip: req.body.zip,
        city: req.body.city
    })

    await user.save()
  } catch (e) {
    console.log(e)
  }
  res.redirect('/')
}
