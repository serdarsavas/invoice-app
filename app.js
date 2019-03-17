const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)

const User = require('./models/user')
const authRoutes = require('./routes/auth')
const invoiceRoutes = require('./routes/invoice')
const config = require('./config')

const app = express()

const store = new MongoDBStore({
  uri: config.dbUri,
  collection: 'sessions'
})

app.set('view engine', 'ejs')
app.set('views', 'views')

app.use(bodyParser.urlencoded({ extended: true }))

app.use(express.static(path.join(__dirname, 'public')))

app.use(
  session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: store
  })
)

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
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

app.use(authRoutes)
app.use(invoiceRoutes)

mongoose
  .connect(config.dbUri, {
    useNewUrlParser: true
  })
  .then(() => {
    app.listen(config.port, () => {
      console.log('App is connected')
    })
  })
  .catch(e => console.log(e))
