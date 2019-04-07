const express = require('express')

const adminController = require('../controllers/admin')
const validate = require('../middleware/validation')
const auth = require('../middleware/is-auth')
const handleException = require('../middleware/exception-handler')

const router = new express.Router()

router.get('/admin/add-invoice', auth, handleException(adminController.getAddInvoice))

router.post('/admin/add-invoice', auth, validate('postAddInvoice'), handleException(adminController.postAddInvoice))

router.post('/admin/add-invoice/autofill', auth, handleException(adminController.postAddInvoiceRecipient))

router.get('/admin/invoices', auth, handleException(adminController.getInvoiceFolders))

router.get('/admin/invoices/:folderName', auth, handleException(adminController.getInvoices))

router.get('/admin/edit-invoice/:invoiceId', auth, handleException(adminController.getEditInvoice))

router.post('/admin/edit-invoice', auth, validate('postEditInvoice'), handleException(adminController.postEditInvoice))

router.get('/admin/view-invoice/:invoiceId', auth, handleException(adminController.getViewInvoice))

router.get('/admin/download-invoice/:invoiceId', auth, handleException(adminController.getDownloadInvoice))

router.post('/admin/delete-invoice', auth, handleException(adminController.postDeleteInvoice))

router.get('/admin/profile', auth, adminController.getEditProfile)

router.post('/admin/profile', auth, validate('postEditProfile'), handleException(adminController.postEditProfile))

module.exports = router
