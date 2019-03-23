const { validationResult } = require('express-validator/check')

const pdfHandler = require('../pdf/pdf')
const Invoice = require('../models/invoice')

//Helpers

const getInvoiceRows = req => {
  const numRows = req.body.description.length
  console.log('Req body:-------', req.body)
  let rows = []
  for (let i = 0; i < numRows; i++) {
    let quantity = Number(req.body.quantity[i])
    let price = Number(req.body.price[i])
    rows.push({
      description: req.body.description[i],
      quantity: quantity,
      unit: req.body.unit[i],
      price: price,
      amount: (Math.ceil(quantity) * price).toFixed(2)
    })
  }
  return rows
}

const getTotal = rows => {
  let total = 0
  rows.forEach(row => {
    total+= Number(row.amount)
  })
  return total
}

const createInvoice = async req => {
  const rows = getInvoiceRows(req)
  const total = getTotal(rows)
  const totalAfterVAT = (total * 1.25).toFixed(2)
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
    VAT: 25,
    totalAfterVAT: totalAfterVAT,
    owner: req.user._id
  })
  try {
    await invoice.save()
    return invoice
  } catch (e) {
    console.log('Error')
  }
}

const getUniqueRecipients = async (req, res) => {
  try {
    const invoices = await Invoice.find({ owner: req.user })
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

exports.getStartPage = (req, res) => {
  res.render('invoice/start', {
    path: '/start',
    pageTitle: 'Hem'
  })
}

exports.getNewInvoice = async (req, res) => {
  res.render('invoice/new', {
    errorMessage: '',
    path: '/new',
    pageTitle: 'Ny faktura',
    recipients: await getUniqueRecipients(req),
    recipient: null,
    oldInput: null
  })
}

exports.postNewInvoice = async (req, res) => {
  const errors = validationResult(req)
  const oldInput = { ...req.body }

  if (!errors.isEmpty()) {
    return res.status(422).render('invoice/new', {
      path: '/new',
      pageTitle: 'Ny faktura',
      errorMessage: errors.array()[0].msg,
      oldInput,
      recipients: await getUniqueRecipients(req),
      recipient: null
    })
  }
  try {
    const invoice = await createInvoice(req)
    await pdfHandler.convertInvoiceToPdf(invoice, req.user)
    await pdfHandler.emailPdf(invoice, req.user)
    res.redirect('/invoice/invoices')
  } catch (e) {
    res.send(e)
  }
}

exports.postInvoiceRecipientData = async (req, res) => {
  const recipientAuthority = req.body.recipientAuthority
  try {
    const invoice = await Invoice.findOne({
      'recipient.authority': recipientAuthority
    })
    if (!invoice) {
      return res.status(422).render('invoice/new', {
        errorMessage: '',
        path: '/new',
        pageTitle: 'Ny faktura',
        recipients: await getUniqueRecipients(req),
        recipient: null,
        oldInput: null,
      })
    }
    const { recipient } = invoice
    res.render('invoice/new', {
      errorMessage: '',
      path: '/new',
      pageTitle: 'Ny faktura',
      recipients: await getUniqueRecipients(req),
      recipient,
      oldInput: null
    })
  } catch (e) {
    return console.log(e)
  }
}

exports.getInvoices = async (req, res) => {
  try {
    const documents = await Invoice.find({ owner: req.user })
    const invoices = [...documents].reverse()

    res.render('invoice/invoices', {
      path: '/invoices',
      pageTitle: 'Mina fakturor',
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


exports.getEditInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId)
    res.render('invoice/edit', {
      pageTitle: 'Redigera',
      path: '/invoices',
      invoice,
      oldInput: null
    })
  } catch (e) {
    console.log(e)
  }
}

exports.postEditInvoice = async (req, res) => {
  try {
    const invoiceId = req.body.invoiceId
    const invoice = await Invoice.findOne({ _id: invoiceId, owner: req.user })
    if (!invoice) {
      return res.redirect('/start')
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
    invoice.totalAfterVAT = (total * 1.25).toFixed(2)
    await invoice.save()
    res.redirect('/invoice/invoices')
  } catch (e) {
    console.log(e)
  }
}

exports.postDeleteInvoice = async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.body.invoiceId)
    res.redirect('/invoice/invoices')
  } catch (e) {
    console.log(e)
    res.redirect('/start')
  }
}