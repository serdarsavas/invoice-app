const path = require('path')
const { promisify } = require('util')
const { readFile } = require('fs')
const Invoice = require('../models/invoice')

const ejs = require('ejs')
const puppeteer = require('puppeteer')

const convertInvoiceToPdf = async (invoice, request) => {
  const _readFile = promisify(readFile)

  const template = await _readFile(
    path.resolve('views/invoice', 'pdf.ejs'),
    'utf-8'
  )
  const html = ejs.render(template, {
    invoice,
    user: request.user,
  })
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.setContent(html)
  await page.emulateMedia('screen')
  await page.pdf({
    path: __dirname + `/uploads/faktura-${invoice.invoiceNumber}.pdf`,
    format: 'A4'
  })
  await browser.close()
}

const createInvoice = async request => {
  const numRows = request.body.description.length
  let rows = []
  let totalCost = 0
  for (let i = 0; i < numRows; i++) {
    let quantity = Math.ceil(Number(request.body.quantity[i]))
    let price = Number(request.body.price[i])
    rows.push({
      description: request.body.description[i],
      quantity: quantity,
      unit: request.body.unit[i],
      price: price,
      amount: quantity * price
    })
    totalCost += quantity * price
  }
  const invoice = new Invoice({
    invoiceNumber: request.body.invoiceNumber,
    assignmentNumber: request.body.assignmentNumber,
    recipient: {
      authority: request.body.authority,
      refPerson: request.body.refPerson,
      street: request.body.street,
      zip: request.body.zip,
      city: request.body.city
    },
    rows: rows,
    totalBeforeVAT: totalCost,
    VAT: 25,
    totalAfterVAT: totalCost * 1.25,
    owner: request.user._id
  })
  await invoice.save()
  await convertInvoiceToPdf(invoice, request)
}

module.exports = createInvoice
