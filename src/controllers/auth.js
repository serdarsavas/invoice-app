const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const { sendResetMail } = require('../email/email');
const User = require('../models/user');
const { validationResult } = require('express-validator/check');

exports.getLogin = (req, res) => {
  if (req.session.isLoggedIn) {
    return res.redirect('/admin/invoices');
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Logga in',
    errorMessage: null,
    inputData: {
      email: '',
      password: ''
    },
    validationErrors: []
  });
};

exports.postLogin = async (req, res) => {
  const errors = validationResult(req);
  const { email, password } = req.body;

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
    });
  }

  try {
    const user = await User.findOne({ email });
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
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
      });
    }
    req.session.isLoggedIn = true;
    req.session.user = user;
    await req.session.save();
    res.redirect('/admin/invoices');
  } catch (e) {
    next(new Error(e));
  }
};

exports.getSignup = (req, res) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Registrering',
    validationErrors: [],
    inputData: null
  });
};

exports.postSignup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Registrering',
      validationErrors: errors.array({ onlyFirstError: true }),
      inputData: req.body
    });
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
    });

    await user.save();
    res.redirect('/');
  } catch (e) {
    next(new Error(e));
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(e => {
    if (e) {
      return next(new Error(e));
    }
    res.redirect('/');
  });
};

exports.getReset = (req, res) => {
  res.render('auth/reset', {
    pageTitle: 'Återställ lösenord',
    path: '/reset',
    errorMessage: null,
    inputData: null
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, async (err, buffer) => {
    if (err) {
      return res.redirect('/reset');
    }

    const token = buffer.toString('hex');

    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.render('auth/reset', {
          pageTitle: 'Återställ lösenord',
          path: '/reset',
          errorMessage: 'Det finns inget konto kopplat till denna epostadress',
          inputData: req.body.email
        });
      }
      user.resetToken = token;
      user.resetTokenExpiration = Date.now() + 3600000;
      await user.save();
      res.redirect('/');
      sendResetMail(user);
    } catch (e) {
      next(new Error(e));
    }
  });
};

exports.getNewPassword = async (req, res, next) => {
  let errorMessage;
  const token = req.params.token;

  try {
    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() }
    });
    user
      ? (errorMessage = null)
      : (errorMessage = 'Du har inget aktivt konto.');
    res.render('auth/new-password', {
      pageTitle: 'Nytt lösenord',
      path: '/new-password',
      errorMessage,
      userId: user._id.toString(),
      passwordToken: token,
      inputData: null
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.postNewPassword = async (req, res) => {
  const { password, confirmPassword, userId, passwordToken } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.render('auth/new-password', {
      pageTitle: 'Nytt lösenord',
      path: '/new-password',
      errorMessage: errors.array()[0].msg,
      inputData: {
        password,
        confirmPassword
      }
    });
  }
  try {
    const user = await User.findOne({
      _id: userId,
      resetToken: passwordToken,
      resetTokenExpiration: { $gt: Date.now() }
    });

    const hashedPassword = await bcrypt.hash(password, 8);

    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiration = null;

    await user.save();
    res.redirect('/');
  } catch (e) {
    next(new Error(e));
  }
};
