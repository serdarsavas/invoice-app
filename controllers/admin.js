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
    console.log('Error')
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
    return console.log(e)
  }
}

//Exports

exports.getAddInvoice = async (req, res) => {
  res.render('admin/add-invoice', {
    path: '/add',
    pageTitle: 'Ny faktura',
    recipients: await getUniqueRecipients(req.user),
    recipient: null,
    validationErrors: null
  })
}

exports.postAddInvoice = async (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/add-invoice', {
      path: '/add',
      pageTitle: 'Ny faktura',
      recipients: await getUniqueRecipients(req.user),
      recipient: null,
      validationErrors: errors.array({ onlyFirstError: true })
    })
  }
  try {
    const invoice = await createInvoice(req)
    await pdfHandler.convertInvoiceToPdf(invoice, req.user)
    await pdfHandler.emailPdf(invoice, req.user)
    res.redirect('/admin/invoices')
  } catch (e) {
    res.send(e)
  }
}

exports.getEditInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
    res.render('admin/edit-invoice', {
      pageTitle: 'Redigera faktura',
      path: '/invoices',
      invoice,
      inputData: null
    })
  } catch (e) {
    console.log(e)
  }
}

exports.postEditInvoice = async (req, res) => {
  try {
    const invoiceId = req.body.invoiceId
    const invoice = await Invoice.findOne({ _id: invoiceId, owner: req.user })
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
      return res.render('admin/edit-invoice', {
        pageTitle: 'Redigera faktura',
        path: '/invoices',
        invoice,
        inputData: req.body,
        validationErrors: errors.array({ onlyFirstError: true })
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
    await pdfHandler.convertInvoiceToPdf(invoice, req.user)
    await pdfHandler.viewPdf(res)
  } catch (e) {
    console.log(e)
  }
}

exports.postInvoiceRecipientData = async (req, res) => {
  try {
    const authority = req.body.authority
    const invoice = await Invoice.findOne({ 'recipient.authority': authority })
    if (!invoice) {
      return res.status(422).render('admin/add-invoice', {
        path: '/add',
        pageTitle: 'Ny faktura',
        recipients: await getUniqueRecipients(req.user),
        validationErrors: null
      })
    }
    const { recipient } = invoice
    res.render('admin/add-invoice', {
      path: '/add',
      pageTitle: 'Ny faktura',
      recipients: await getUniqueRecipients(req.user),
      recipient,
      validationErrors: null
    })
  } catch (e) {
    return console.log(e)
  }
}

exports.getInvoiceFolders = async (req, res) => {
  try {
    const recipients = await getUniqueRecipients(req.user)
    recipients.sort((a, b) =>
      a.authority.toLowerCase() > b.authority.toLowerCase() ? 1 : -1
    )

    res.render('admin/invoice-folders', {
      path: '/invoices',
      pageTitle: 'Fakturor',
      recipients: recipients
    })
  } catch (e) {
    console.log(e)
  }
}

exports.getInvoices = async (req, res) => {

  try {
    const folderName = req.params.folderName
    
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
    console.log(e)
  }
}

exports.getViewInvoice = async (req, res) => {
  const invoiceId = req.params.invoiceId
  try {
    const invoice = await Invoice.findById(invoiceId)
    await pdfHandler.convertInvoiceToPdf(invoice, req.user)
    await pdfHandler.viewPdf(res)
  } catch (e) {
    console.log(e)
  }
}

exports.getDownloadInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
    await pdfHandler.convertInvoiceToPdf(invoice, req.user)
    pdfHandler.downloadPdf(invoice, res)
  } catch (e) {
    console.log(e)
  }
}

exports.postDeleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.body.invoiceId)
    res.redirect('/admin/invoices')
  } catch (e) {
    console.log(e)
    res.redirect('/admin/invoices')
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

exports.postEditProfile = async (req, res) => {
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
  try {
    const user = req.user
    const isNewPassword = await bcrypt.compare(req.body.password, user.password)
    if(isNewPassword) {
      user.password = await bcrypt.hash(req.body.password, 8)
    }
    user.name = req.body.name
    user.email = req.body.email
    user.password = req.body.password
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
  } catch (e) {
    console.log(e)
    res.redirect('/admin/invoices')
  }
}