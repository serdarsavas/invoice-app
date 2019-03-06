const express = require('express')

const invoiceController = require('../controllers/invoice')
const isAuth = require('../middleware/is-auth')

const router = express.Router()

router.get('/start', isAuth, invoiceController.getStartPage)

module.exports = router
