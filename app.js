const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)
const csrf = require('csurf')

const User = require('./models/user')
const authRoutes = require('./routes/auth')
const adminRoutes = require('./routes/admin')

const app = express()
const port = process.env.PORT
const store = new MongoDBStore({
  uri: process.env.MONGODB_URL,
  collection: 'sessions'
})
const csrfProtection = csrf()

app.set('view engine', 'ejs')
app.set('views', 'views')

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: store
  })
)
app.use(csrfProtection)
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken()
  next();
});

app.use(async (req, res, next) => {
  if (!req.session.user) {
    return next()
  }
  try {
    const user = await User.findById(req.session.user._id)
    if (!user) {
      return next()
    }
    req.user = user
    return next()
  } catch (e) {
    throw new Error(e)
  }
})
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn
  res.locals.csrfToken = req.csrfToken()
  next()
})

app.use(authRoutes)
app.use(adminRoutes)


mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true
  })
  .then(() => {
    app.listen(port, () => {
      console.log('App is connected to port', port)
    })
  })
  .catch(e => console.log(e))
