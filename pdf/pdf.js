const path = require('path')
const { promisify } = require('util')
const { readFile, unlink } = require('fs')

const ejs = require('ejs')
const puppeteer = require('puppeteer')
const { sendPdfMail } = require('../emails/email')

const _readFile = promisify(readFile)
const FILE_PATH = path.resolve(__dirname, 'invoice.pdf')

const viewPdf = response => {
  response.sendFile(FILE_PATH, err => {
    if (err) {
      throw new Error(err)
    } else {
      unlink(FILE_PATH, err => {
        if (err) throw new Error(err)
      })
    }
  })
}

const downloadPdf = (invoice, response) => {
  response.download(FILE_PATH, 
    `faktura${invoice.invoiceNumber}-${invoice.recipient.authority.toLowerCase()}-${invoice.updatedAt.toISOString().substring(0, 10)}`, 
    (err) => {
      if (err) {
        throw new Error(err)
      } else {
        unlink(FILE_PATH, err => {
          if (err) throw new Error(err)
        })
      }
  })
}

const emailPdf = async (invoice, user) => {
  try {
    const file = await _readFile(FILE_PATH)
    sendPdfMail({
      to: user.email,
      from: {
        email: 'serdar.savas@botkyrka.se',
        name: 'Serdar Savas'
      },
      subject: `Faktura nr ${invoice.invoiceNumber} från Fakturameistern!`,
      content: [
        {
          type: 'text/html',
          value: `<p>Hej ${user.name.split(' ')[0]}! Bifogad finns fakturan du nyss skapade i Fakturameistern.</p>`
        }
      ],
      attachments: [
        {
          content: Buffer.from(file).toString('base64'),
          type: 'application/pdf',
          filename: `faktura-${invoice.invoiceNumber}.pdf`,
          disposition: 'attachment'
        }
      ]
    })
    unlink(FILE_PATH, err => {
      if (err) throw new Error(err)
    })
  } catch (e) {
    console.log(e)
  }
}

const convertInvoiceToPdf = async (invoice, user) => {
  try {
    const template = await _readFile(__dirname + '/pdf.ejs', 'utf-8')
    if (!template) {
      throw new Error('Could not find template')
    }
    const html = await ejs.render(template, {
      invoice,
      user
    }, true)
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.setContent(html)
    await page.emulateMedia('screen')
    await page.pdf({
      path: FILE_PATH,
      format: 'A4'
    })
    await browser.close()
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  convertInvoiceToPdf,
  emailPdf,
  viewPdf,
  downloadPdf
}
