const createInvoice = require('../pdf/convert')

exports.getStartPage = (req, res) => {
  res.render('invoice/start', {
    path: '/start',
    pageTitle: 'Hem'
  })
}

exports.getNewInvoice = (req, res) => {
  res.render('invoice/new-invoice', {
    path: '/new-invoice',
    pageTitle: 'Ny faktura',
  })
}

exports.postNewInvoice = async (req, res) => {
  await createInvoice(req)
  res.redirect('/start')
}


