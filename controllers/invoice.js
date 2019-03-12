const convertHtmlToPdf = require('../pdf/convert')

exports.getStartPage = (req, res) => {
  res.render('invoice/start')
}

exports.getNewInvoice = (req, res) => {
  res.render('invoice/new-invoice')
}

exports.postNewInvoice = (req, res) => {
  convertHtmlToPdf(req)
  res.redirect('/')
}


