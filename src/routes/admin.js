const express = require('express');

const adminController = require('../controllers/admin');
const validate = require('../middleware/validation');
const auth = require('../middleware/is-auth');

const router = new express.Router();

router.get('/admin/add-invoice', auth, adminController.getAddInvoice);

router.get('/admin/get-recipient', auth, adminController.getRecipientData);

router.post(
  '/admin/add-invoice',
  auth,
  validate('postEmailInvoice'),
  adminController.postEmailInvoice
);

router.get('/admin/invoices', auth, adminController.getInvoiceFolders);

router.get('/admin/invoices/:folderName', auth, adminController.getInvoices);

router.get(
  '/admin/edit-invoice/:invoiceId',
  auth,
  adminController.getEditInvoice
);

router.post(
  '/admin/edit-invoice',
  auth,
  validate('postEditInvoice'),
  adminController.postEditInvoice
);

router.post(
  '/admin/save-invoice',
  auth,
  validate('postSaveInvoice'),
  adminController.postSaveInvoice
);

router.get(
  '/admin/view-invoice/:invoiceId',
  auth,
  adminController.getViewInvoice
);

router.get(
  '/admin/download-invoice/:invoiceId',
  auth,
  adminController.getDownloadInvoice
);

router.post('/admin/delete-invoice', auth, adminController.postDeleteInvoice);

router.get('/admin/profile', auth, adminController.getEditProfile);

router.post(
  '/admin/profile',
  auth,
  validate('postEditProfile'),
  adminController.postEditProfile
);

module.exports = router;
