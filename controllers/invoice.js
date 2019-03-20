const { validationResult } = require('express-validator/check')

const { convertInvoiceToPdf, emailPdf } = require('../pdf/pdf')
const User = require('../models/user')
const Invoice = require('../models/invoice')

const createInvoice = async req => {
  const numRows = req.body.description.length
  let rows = []
  let totalCost = 0
  for (let i = 0; i < numRows; i++) {
    let quantity = Math.ceil(Number(req.body.quantity[i]))
    let price = Number(req.body.price[i])
    rows.push({
      description: req.body.description[i],
      quantity: quantity,
      unit: req.body.unit[i],
      price: price,
      amount: (quantity * price).toFixed(2)
    })
    totalCost += (quantity * price).toFixed(2)
  }
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
    totalBeforeVAT: totalCost,
    VAT: 25,
    totalAfterVAT: (totalCost * 1.25).toFixed(2),
    owner: req.user._id
  })
  try {
    await invoice.save()
    return invoice
  } catch (e) {
    return console.log(e)
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



exports.getStartPage = (req, res) => {
  res.render('invoice/start', {
    path: '/start',
    pageTitle: 'Hem'
  })
}

exports.getNewInvoice = async (req, res) => {
  res.render('invoice/new-invoice', {
    errorMessage:'',
    path: '/new-invoice',
    pageTitle: 'Ny faktura',
    recipients: await getUniqueRecipients(req),
    recipient: null,
    input: null,
    numRows: []
  })
}

exports.postNewInvoice = async (req, res) => {
  const errors = validationResult(req)
  const input = { ...req.body }
  const numRows = req.body.description.length

  if (!errors.isEmpty()) {
    return res.status(422).render('invoice/new-invoice', {
      path: '/new-invoice',
      pageTitle: 'Ny faktura',
      errorMessage: errors.array()[0].msg,
      input,
      recipients: await getUniqueRecipients(req),
      recipient: null,
      numRows
    })
  }
  try {
    const invoice = await createInvoice(req)
    await convertInvoiceToPdf(invoice, req.user)
    await emailPdf(invoice, req.user)
    res.redirect('/start')
  } catch (e) {
    res.send(e)
  }
}

exports.postInvoiceRecipientData = async (req, res) => {
  const recipientAuthority = req.body.recipient
  try {
    const invoice = await Invoice.findOne({
      'recipient.authority': recipientAuthority
    })
    if (!invoice) {
      return res.status(422).render('invoice/new-invoice', {
        errorMessage: '',
        path: '/new-invoice',
        pageTitle: 'Ny faktura',
        recipients: await getUniqueRecipients(req),
        recipient: null,
        input: null,
        numRows: []
      })
    }
    const { recipient } = invoice
    res.render('invoice/new-invoice', {
      errorMessage: '',
      path: '/new-invoice',
      pageTitle: 'Ny faktura',
      recipients: await getUniqueRecipients(req),
      recipient,
      input: null,
      numRows: []
    })
  } catch (e) {
    return console.log(e)
  }
}

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ owner: req.user })
    res.render('invoice/invoices', {
      path: '/invoices',
      pageTitle: 'Gamla fakturor',
      invoices
    })
  } catch (e) {
    console.log(e)
  }
}

exports.postViewInvoice = async (req, res) => {

}
