const createInvoice = require('../pdf/convert')

exports.getStartPage = (req, res) => {
  res.render('invoice/start')
}

exports.getNewInvoice = (req, res) => {
  res.render('invoice/new-invoice')
}

exports.postNewInvoice = async (req, res) => {
  await createInvoice(req)
  res.redirect('/start')
}


