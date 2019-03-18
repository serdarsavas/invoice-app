const { validationResult } = require('express-validator/check')

const createInvoice = require('../pdf/convert')
const User = require('../models/user')
const Invoice = require('../models/invoice')

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
    await createInvoice(req)
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
