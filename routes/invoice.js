const express = require('express')

const invoiceController = require('../controllers/invoice')

const auth = require('../middleware/is-auth')

const router = new express.Router()

router.get('/start', auth, invoiceController.getStartPage)

router.get('/invoice/add', auth, invoiceController.getAddInvoice)

router.post('/invoice/add', auth, invoiceController.postAddInvoice)

router.get('/invoice/recipient/:recipient', auth, invoiceController.getRecipient)

router.post('/invoice/add/autofill', auth, invoiceController.postInvoiceRecipientData)

router.get('/invoice/invoices', auth, invoiceController.getInvoices)

router.get('/invoice/edit/:invoiceId', auth, invoiceController.getEditInvoice)

router.post('/invoice/edit', auth, invoiceController.postEditInvoice)

router.get('/invoice/view/:invoiceId', auth, invoiceController.getViewInvoice)

router.get('/invoice/download/:invoiceId', auth, invoiceController.getDownloadInvoice)

router.post('/invoice/delete', auth, invoiceController.postDeleteInvoice)

router.post('/invoice/edit-cancel', auth, invoiceController.postCancelEdit)

module.exports = router
