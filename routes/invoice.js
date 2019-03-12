const express = require('express')

const invoiceController = require('../controllers/invoice')
const auth = require('../middleware/is-auth')

const router = new express.Router()

router.get('/start', auth, invoiceController.getStartPage)

router.get('/new-invoice', auth, invoiceController.getNewInvoice)

router.post('/new-invoice', auth, invoiceController.postNewInvoice)

module.exports = router
