const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator/check");

const pdfHandler = require("../pdf/pdf");
const Invoice = require("../models/invoice");

//Helpers

const getInvoiceRows = req => {
  const numRows = req.body.description.length;
  let rows = [];

  if (numRows > 1) {
    for (let i = 0; i < numRows; i++) {
      const quantity = Number(req.body.quantity[i]);
      const price = Number(req.body.price[i]);
      const hasVAT = req.body.hasVAT[i] === "VAT";

      rows.push({
        description: req.body.description[i],
        date: req.body.date[i],
        quantity: quantity,
        unit: req.body.unit[i],
        price: price,
        amount: Math.ceil(quantity) * price,
        hasVAT,
        VAT: hasVAT ? Math.ceil(quantity) * price * 0.25 : 0
      });
    }

    return rows;
  }

  const quantity = Number(req.body.quantity[0]);
  const price = Number(req.body.price[0]);
  const hasVAT = req.body.hasVAT === "VAT";

  rows.push({
    description: req.body.description[0],
    date: req.body.date[0],
    quantity: quantity,
    unit: req.body.unit[0],
    price: price,
    amount: Math.ceil(quantity) * price,
    hasVAT,
    VAT: hasVAT ? Math.ceil(quantity) * price * 0.25 : 0
  });

  return rows;
};

const getTotalBeforeVAT = rows => {
  const total = rows.reduce((sum, row) => {
    return sum + Number(row.amount);
  }, 0);
  return total.toFixed(2);
};
const getTotalAfterVAT = rows => {
  const total = rows.reduce((sum, row) => {
    return sum + Number(row.amount) + Number(row.VAT);
  }, 0);
  return total.toFixed(2);
};

const createInvoice = async req => {
  const rows = getInvoiceRows(req);
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
    totalBeforeVAT: getTotalBeforeVAT(rows),
    totalAfterVAT: getTotalAfterVAT(rows),
    owner: req.user
  });
  try {
    await invoice.save();
    return invoice;
  } catch (e) {
    throw new Error(e);
  }
};

const getUniqueRecipients = async user => {
  try {
    const invoices = await Invoice.find({ owner: user });
    if (!invoices) {
      return [];
    }
    const allRecipients = invoices.map(invoice => invoice.recipient);
    const uniqueRecipients = [];
    const map = new Map();
    for (const recipient of allRecipients) {
      if (!map.has(recipient.authority)) {
        map.set(recipient.authority, true);
        uniqueRecipients.push({
          authority: recipient.authority,
          refPerson: recipient.refPerson,
          street: recipient.street,
          zip: recipient.zip,
          city: recipient.city
        });
      }
    }
    return uniqueRecipients;
  } catch (e) {
    throw new Error(e);
  }
};

//Exports

exports.getAddInvoice = async (req, res, next) => {
  try {
    const recipients = await getUniqueRecipients(req.user);
    res.render("admin/add-invoice", {
      pageTitle: "Ny faktura",
      path: "/add",
      recipients,
      invoiceId: null,
      inputData: null,
      validationErrors: [],
      successMessage: null
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.getRecipientData = async (req, res, next) => {
  try {
    const recipients = await getUniqueRecipients(req.user);
    const data = JSON.stringify(recipients);
    res.send(data);
  } catch (e) {
    next(new Error(e));
  }
};

exports.postSaveInvoice = async (req, res, next) => {
  const errors = validationResult(req);

  try {
    const recipients = await getUniqueRecipients(req.user);
    if (!errors.isEmpty()) {
      return res.render("admin/add-invoice", {
        pageTitle: "Ny faktura",
        path: "/add",
        recipients,
        invoiceId: null,
        inputData: req.body,
        validationErrors: errors.array({ onlyFirstError: true }),
        successMessage: null
      });
    }

    const invoice = await createInvoice(req);

    res.render("admin/add-invoice", {
      pageTitle: "Ny faktura",
      path: "/add",
      recipients,
      invoiceId: invoice._id.toString(),
      inputData: req.body,
      validationErrors: [],
      successMessage: "Fakturan är sparad!"
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.postEmailInvoice = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/add-invoice", {
      path: "/add",
      pageTitle: "Ny faktura",
      recipients: [],
      invoiceId: req.body.invoiceId,
      inputData: req.body,
      validationErrors: errors.array({ onlyFirstError: true }),
      successMessage: null
    });
  }
  try {
    const invoiceId = req.body.invoiceId;
    let invoice;
    if (!invoiceId) {
      invoice = await createInvoice(req);
    } else {
      const rows = getInvoiceRows(req);
      invoice = await Invoice.findByIdAndUpdate(invoiceId, {
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
        totalBeforeVAT: getTotalBeforeVAT(rows),
        totalAfterVAT: getTotalAfterVAT(rows)
      });
      await invoice.save();
    }
    await pdfHandler.convertInvoiceToPdf(invoice, req.user);
    await pdfHandler.emailPdf(invoice, req.user);
    return res.redirect("/admin/invoices");
  } catch (e) {
    next(new Error(e));
  }
};

exports.getEditInvoice = async (req, res, next) => {
  const invoiceId = req.params.invoiceId;
  try {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new Error();
    }
    res.render("admin/edit-invoice", {
      pageTitle: "Redigera faktura",
      path: "/invoices",
      invoice,
      inputData: null,
      validationErrors: [],
      successMessage: null
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.postEditInvoice = async (req, res, next) => {
  const errors = validationResult(req);

  try {
    const invoice = await Invoice.findById(req.body.invoiceId);
    if (!errors.isEmpty()) {
      return res.render("admin/edit-invoice", {
        pageTitle: "Redigera faktura",
        path: "/invoices",
        invoice: invoice,
        inputData: req.body,
        validationErrors: errors.array({ onlyFirstError: true }),
        successMessage: null
      });
    }
    const rows = getInvoiceRows(req);

    invoice.invoiceNumber = req.body.invoiceNumber;
    invoice.assignmentNumber = req.body.assignmentNumber;
    invoice.recipient.authority = req.body.authority;
    invoice.recipient.refPerson = req.body.refPerson;
    invoice.recipient.street = req.body.street;
    invoice.recipient.zip = req.body.zip;
    invoice.recipient.city = req.body.city;
    invoice.rows = rows;
    invoice.totalBeforeVAT = getTotalBeforeVAT(rows);
    invoice.totalAfterVAT = getTotalAfterVAT(rows);

    await invoice.save();

    res.render("admin/edit-invoice", {
      pageTitle: "Redigera faktura",
      path: "/invoices",
      invoice,
      inputData: null,
      validationErrors: [],
      successMessage: "Ändringarna är sparade!"
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.getInvoiceFolders = async (req, res, next) => {
  try {
    const recipients = await getUniqueRecipients(req.user);
    if (!recipients.length > 0) {
      return res.render("admin/invoice-folders", {
        path: "/invoices",
        pageTitle: "Fakturor",
        recipients: recipients
      });
    }
    recipients.sort((a, b) =>
      a.authority.toLowerCase() > b.authority.toLowerCase() ? 1 : -1
    );
    res.render("admin/invoice-folders", {
      path: "/invoices",
      pageTitle: "Fakturor",
      recipients: recipients
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.getInvoices = async (req, res, next) => {
  const folderName = req.params.folderName;

  try {
    const documents = await Invoice.find({
      owner: req.user,
      "recipient.authority": folderName
    });
    const invoices = [...documents].reverse();
    res.render("admin/invoices", {
      path: "",
      pageTitle: "Fakturor",
      invoices
    });
  } catch (e) {
    next(new Error(e));
  }
};

exports.getViewInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) {
      throw new Error();
    }
    await pdfHandler.convertInvoiceToPdf(invoice, req.user);
    await pdfHandler.viewPdf(res);
  } catch (e) {
    next(new Error(e));
  }
};

exports.getDownloadInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.invoiceId);
    if (!invoice) {
      throw new Error();
    }
    await pdfHandler.convertInvoiceToPdf(invoice, req.user);
    pdfHandler.downloadPdf(invoice, res);
  } catch (e) {
    next(new Error(e));
  }
};

exports.postDeleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.body.invoiceId);
    res.redirect(`/admin/invoices/${invoice.recipient.authority}`);
  } catch (e) {
    next(new Error(e));
  }
};

exports.getEditProfile = (req, res) => {
  res.render("admin/edit-profile", {
    pageTitle: "Mina uppgifter",
    path: "/profile",
    user: req.user,
    validationErrors: [],
    inputData: null,
    successMessage: null
  });
};

exports.postEditProfile = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-profile", {
      pageTitle: "Mina uppgifter",
      path: "/profile",
      user: req.user,
      validationErrors: errors.array({ onlyFirstError: true }),
      inputData: req.body,
      successMessage: null
    });
  }

  const user = req.user;

  try {
    const isNewPassword = await bcrypt.compare(
      req.body.password,
      user.password
    );

    if (isNewPassword) {
      user.password = await bcrypt.hash(req.body.password, 8);
    }
    user.name = req.body.name;
    user.email = req.body.email;
    user.phone = req.body.phone;
    user.street = req.body.street;
    user.zip = req.body.zip;
    user.city = req.body.city;
    user.position = req.body.position;
    user.registrationNumber = req.body.registrationNumber;
    user.vatNumber = req.body.vatNumber;
    user.bankgiro = req.body.bankgiro;
    await user.save();

    req.user = user;
    res.render("admin/edit-profile", {
      pageTitle: "Mina uppgifter",
      path: "/profile",
      user: req.user,
      validationErrors: [],
      inputData: null,
      successMessage: "Dina uppgifter är nu sparade!"
    });
  } catch (e) {
    next(new Error(e));
  }
};
