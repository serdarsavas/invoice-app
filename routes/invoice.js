const express = require('express')
const { body } = require('express-validator/check')

const invoiceController = require('../controllers/invoice')
const auth = require('../middleware/is-auth')

const router = new express.Router()

router.get('/start', auth, invoiceController.getStartPage)

router.get('/invoice/new', auth, invoiceController.getNewInvoice)

router.post(
  '/invoice/new',
  auth,
  [
    body('invoiceNumber')
      .isInt()
      .withMessage('Bara siffror i heltal är tillåtna'),
    body('assignmentNumber')
      .isInt()
      .withMessage('Bara siffror i heltal är tillåtna'),
    body('quantity')
      .isFloat()
      .withMessage('Bara siffror är tillåtna'),
    body('price')
      .isFloat()
      .withMessage('Bara siffror är tillåtna')
  ],
  invoiceController.postNewInvoice
)

router.post('/invoice/new/autofill',auth, invoiceController.postInvoiceRecipientData)

router.get('/invoice/invoices', auth, invoiceController.getInvoices)

router.get('/invoice/view/:invoiceId', auth, invoiceController.getViewInvoice)

router.get('/invoice/edit/:invoiceId', auth, invoiceController.getEditInvoice)

router.get('/invoice/download/:invoiceId', auth, invoiceController.getDownloadInvoice)

router.post('/invoice/delete', auth, invoiceController.postDeleteInvoice)

module.exports = router
