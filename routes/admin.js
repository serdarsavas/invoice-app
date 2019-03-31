const express = require('express')

const adminController = require('../controllers/admin')
const { validate } = require('../form-validation/validation')

const auth = require('../middleware/is-auth')

const router = new express.Router()

router.get('/admin/add-invoice', auth, adminController.getAddInvoice)

router.post('/admin/add-invoice', auth, validate('postAddInvoice'), adminController.postAddInvoice)

router.post('/admin/add-invoice/autofill', auth, adminController.postInvoiceRecipientData)

router.get('/admin/invoices', auth, adminController.getInvoices)

router.get('/admin/edit-invoice/:invoiceId', auth, adminController.getEditInvoice)

router.post('/admin/edit-invoice', auth, validate('postEditInvoice'), adminController.postEditInvoice)

router.get('/admin/view-invoice/:invoiceId', auth, adminController.getViewInvoice)

router.get('/admin/download-invoice/:invoiceId', auth, adminController.getDownloadInvoice)

router.post('/admin/delete-invoice', auth, adminController.postDeleteInvoice)

router.post('/admin/edit-cancel', auth, adminController.postCancelEdit)

router.get('/admin/profile', auth, adminController.getEditProfile)

router.post('/admin/profile', auth, validate('postEditProfile'), adminController.postEditProfile)

module.exports = router
