const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator/check')

const pdfHandler = require('../pdf/pdf')
const Invoice = require('../models/invoice')

//Helpers

const getInvoiceRows = req => {
  const numRows = req.body.description.length
  let rows = []
  for (let i = 0; i < numRows; i++) {
    let quantity = Number(req.body.quantity[i])
    let price = Number(req.body.price[i])
    rows.push({
      description: req.body.description[i],
      quantity: quantity,
      unit: req.body.unit[i],
      price: price,
      amount: Math.ceil(quantity) * price
    })
  }
  return rows
}

const getTotal = rows => {
  let total = 0
  rows.forEach(row => {
    total += Number(row.amount)
  })
  return total
}

const createInvoice = async req => {
  const rows = getInvoiceRows(req)
  const total = getTotal(rows)
  const invoice = new Invoice({
    invoiceNumber: req.body.invoiceNumber,
    assignmentNumber: req.body.assignmentNumber,
    recipient: {
      authority: req.body.authority,
      refPerson: req.body.refPerson,
      street: req.body.street,
      zip: req.body.zip,
      city: req.body.city
    },
    rows: rows,
    totalBeforeVAT: total,
    VAT: 0.25,
    totalAfterVAT: total * 1.25,
    owner: req.user
  })
  try {
    await invoice.save()
    return invoice
  } catch (e) {
    throw new Error(e)
  }
}

const getUniqueRecipients = async user => {
  try {
    const invoices = await Invoice.find({ owner: user })
    if (!invoices) {
      return []
    }
    const allRecipients = invoices.map(invoice => invoice.recipient)
    const uniqueRecipients = []
    const map = new Map()
    for (const recipient of allRecipients) {
      if (!map.has(recipient.authority)) {
        map.set(recipient.authority, true)
        uniqueRecipients.push({
          authority: recipient.authority,
          refPerson: recipient.refPerson,
          street: recipient.street,
          zip: recipient.zip,
          city: recipient.city
        })
      }
    }
    return uniqueRecipients
  } catch (e) {
    throw new Error(e)
  }
}

//Exports

exports.getAddInvoice = async (req, res, next) => {
  try {
    const recipients = await getUniqueRecipients(req.user)
    res.render('admin/add-invoice', {
      path: '/add',
      pageTitle: 'Ny faktura',
      recipients,
      recipient: null,
      validationErrors: [],
      inputData: null
    })
  } catch (e) {
    next(new Error(e))
  }
}

exports.postAddInvoice = async (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/add-invoice', {
      path: '/add',
      pageTitle: 'Ny faktura',
      recipients: [],
      recipient: null,
      validationErrors: errors.array({ onlyFirstError: true }),
      inputData: req.body
    })
  }
  try {
    const invoice = await createInvoice(req)
    await pdfHandler.convertInvoiceToPdf(invoice, req.user)
    await pdfHandler.emailPdf(invoice, req.user)
    return res.redirect('/admin/invoices')
  } catch (e) {
    next(new Error(e))
  }
}

exports.postAddInvoiceRecipient = async (req, res, next) => {
  const authority = req.body.authority

  try {
    const invoice = await Invoice.findOne({ 'recipient.authority': authority })
    const { recipient } = invoice
    const recipients = await getUniqueRecipients(req.user)

    res.render('admin/add-invoice', {
      path: '/add',
      pageTitle: 'Ny faktura',
      recipient,
      recipients,
      validationErrors: [],
      inputData: null
    })
  } catch (e) {
    next(new Error(e))
  }
}

exports.getEditInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
    if (!invoice) {
      throw new Error()
    }
    res.render('admin/edit-invoice', {
      pageTitle: 'Redigera faktura',
      path: '/invoices',
      invoice,
      inputData: null,
      validationErrors: [],
      successMessage: null
    })
  } catch (e) {
    next(new Error(e))
  }
}

exports.postEditInvoice = async (req, res, next) => {
  const invoiceId = req.body.invoiceId
  const errors = validationResult(req)

  try {
    const invoice = await Invoice.findOne({ _id: invoiceId, owner: req.user })
    if (!errors.isEmpty()) {
      return res.render('admin/edit-invoice', {
        pageTitle: 'Redigera faktura',
        path: '/invoices',
        invoice,
        inputData: req.body,
        validationErrors: errors.array({ onlyFirstError: true }),
        successMessage: null
      })
    }
    const rows = getInvoiceRows(req)
    const total = getTotal(rows)

    invoice.invoiceNumber = req.body.invoiceNumber
    invoice.assignmentNumber = req.body.assignmentNumber
    invoice.recipient.authority = req.body.authority
    invoice.recipient.refPerson = req.body.refPerson
    invoice.recipient.street = req.body.street
    invoice.recipient.zip = req.body.zip
    invoice.recipient.city = req.body.city
    invoice.rows = rows
    invoice.totalBeforeVAT = total
    invoice.totalAfterVAT = total * (invoice.VAT + 1)

    await invoice.save()

    res.render('admin/edit-invoice', {
      pageTitle: 'Redigera faktura',
      path: '/invoices',
      invoice,
      inputData: req.body,
      validationErrors: [],
      successMessage: 'Ändringarna är sparade!'
    })
  } catch (e) {
    next(new Error(e))
  }
}

exports.getInvoiceFolders = async (req, res, next) => {
  try {
    const recipients = await getUniqueRecipients(req.user)
    if (!recipients.length > 0) {
      return res.render('admin/invoice-folders', {
        path: '/invoices',
        pageTitle: 'Fakturor',
        recipients: recipients
      })
    }
    recipients.sort((a, b) =>
      a.authority.toLowerCase() > b.authority.toLowerCase() ? 1 : -1
    )
    res.render('admin/invoice-folders', {
      path: '/invoices',
      pageTitle: 'Fakturor',
      recipients: recipients
    })
  } catch (e) {
    next(new Error(e))
  }
}

exports.getInvoices = async (req, res, next) => {
  const folderName = req.params.folderName

  try {
    const documents = await Invoice.find({
      owner: req.user,
      'recipient.authority': folderName
    })
    const invoices = [...documents].reverse()
    res.render('admin/invoices', {
      path: '',
      pageTitle: 'Fakturor',
      invoices
    })
  } catch (e) {
    next(new Error(e))
  }
}

exports.getViewInvoice = async (req, res, next) => {
  const invoiceId = req.params.invoiceId

  try {
    const invoice = await Invoice.findById(invoiceId)
    await pdfHandler.convertInvoiceToPdf(invoice, req.user)
    await pdfHandler.viewPdf(res)
  } catch (e) {
    next(new Error(e))
  }
}

exports.getDownloadInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
    await pdfHandler.convertInvoiceToPdf(invoice, req.user)
    pdfHandler.downloadPdf(invoice, res)
  
  } catch (e) {
    next(new Error(e))
  }
}

exports.postDeleteInvoice = async (req, res, next) => {
  try {
    await Invoice.findByIdAndDelete(req.body.invoiceId)
    res.redirect('/admin/invoices')
  
  } catch (e) {
    next(new Error(e))
  }
}

exports.getEditProfile = (req, res) => {
  res.render('admin/edit-profile', {
    pageTitle: 'Mina uppgifter',
    path: '/profile',
    user: req.user,
    validationErrors: [],
    inputData: null,
    successMessage: null
  })
}

exports.postEditProfile = async (req, res, next) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-profile', {
      pageTitle: 'Mina uppgifter',
      path: '/profile',
      user: req.user,
      validationErrors: errors.array({ onlyFirstError: true }),
      inputData: req.body,
      successMessage: null
    })
  }

  const user = req.user

  try {
    const isNewPassword = await bcrypt.compare(req.body.password, user.password)
  
    if (isNewPassword) {
      user.password = await bcrypt.hash(req.body.password, 8)
    }
    user.name = req.body.name
    user.email = req.body.email
    user.phone = req.body.phone
    user.street = req.body.street
    user.zip = req.body.zip
    user.city = req.body.city
    user.position = req.body.position
    user.registrationNumber = req.body.registrationNumber
    user.vatNumber = req.body.vatNumber
    user.bankgiro = req.body.bankgiro
    await user.save()

    req.user = user
    res.render('admin/edit-profile', {
      pageTitle: 'Mina uppgifter',
      path: '/profile',
      user: req.user,
      validationErrors: [],
      inputData: null,
      successMessage: 'Dina uppgifter är nu sparade!'
    })
  } catch(e) {
    next(new Error(e))
  }
}
