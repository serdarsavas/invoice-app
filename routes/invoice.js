const express = require('express')
const { body } = require('express-validator/check')

const invoiceController = require('../controllers/invoice')
const auth = require('../middleware/is-auth')

const router = new express.Router()

router.get('/start', auth, invoiceController.getStartPage)

router.get('/new-invoice', auth, invoiceController.getNewInvoice)

router.post('/new-invoice', auth, 
[
  body('invoiceNumber')
    .isInt().withMessage('Bara siffror i heltal är tillåtna'),
  body('assignmentNumber')
    .isInt().withMessage('Bara siffror i heltal är tillåtna'),
  body('quantity')
    .isFloat().withMessage('Bara siffror är tillåtna'),
  body('price')
    .isFloat().withMessage('Bara siffror är tillåtna')
], invoiceController.postNewInvoice)

router.post('/new-invoice/autofill', auth, 
[
  body('invoiceNumber')
  .isInt().withMessage('Bara siffror i heltal är tillåtna'),
body('assignmentNumber')
  .isInt().withMessage('Bara siffror i heltal är tillåtna'),
body('quantity')
  .isFloat().withMessage('Bara siffror är tillåtna'),
body('price')
  .isFloat().withMessage('Bara siffror är tillåtna')
], invoiceController.postInvoiceRecipientData)

router.get('/invoices', auth, invoiceController.getInvoices)

module.exports = router
