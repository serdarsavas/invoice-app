const path = require('path')
const { promisify } = require('util')
const { readFile } = require('fs')

const ejs = require('ejs')
const puppeteer = require('puppeteer')

const convertHtmlToPdf = async request => {
  const _readFile = promisify(readFile)

  const template = await _readFile(path.resolve('views/invoice', 'pdf.ejs'), 'utf-8')
  const html = ejs.render(template, {
    address: request.body.recipient
  })
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  page.setContent(html)
  await page.emulateMedia('screen')
  await page.pdf({
    path: 'mypdf.pdf',
    format: 'A4'
  })
  console.log('done')
  await browser.close()
}

module.exports = convertHtmlToPdf
