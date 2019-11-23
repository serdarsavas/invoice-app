const path = require("path");
const { promisify } = require("util");
const { readFile, unlink } = require("fs");

const ejs = require("ejs");
const puppeteer = require("puppeteer");
const { sendPdfMail } = require("../email/email");

const _readFile = promisify(readFile);
const FILE_PATH = path.resolve(__dirname, "invoice.pdf");

const viewPdf = response => {
  response.sendFile(FILE_PATH, err => {
    if (err) {
      throw new Error(err);
    } else {
      unlink(FILE_PATH, err => {
        if (err) {
          throw new Error(err);
        }
      });
    }
  });
};

const downloadPdf = (invoice, response) => {
  response.download(
    FILE_PATH,
    `faktura${
      invoice.invoiceNumber
    }-${invoice.recipient.authority.toLowerCase()}-${invoice.updatedAt
      .toISOString()
      .substring(0, 10)}`,
    err => {
      if (err) {
        throw new Error(err);
      } else {
        unlink(FILE_PATH, err => {
          if (err) throw new Error(err);
        });
      }
    }
  );
};

const emailPdf = async (invoice, user) => {
  try {
    const file = await _readFile(FILE_PATH);
    sendPdfMail({
      to: user.email,
      from: {
        email: "serdar.savas@botkyrka.se",
        name: "Serdar Savas"
      },
      subject: `Faktura nr ${invoice.invoiceNumber} från Fakturameistern!`,
      content: [
        {
          type: "text/html",
          value: `<p>Hej ${
            user.name.split(" ")[0]
          }! Bifogad finns fakturan du nyss skapade i Fakturameistern.</p>`
        }
      ],
      attachments: [
        {
          content: Buffer.from(file).toString("base64"),
          type: "application/pdf",
          filename: `faktura-${invoice.invoiceNumber}.pdf`,
          disposition: "attachment"
        }
      ]
    });
    unlink(FILE_PATH, err => {
      if (err) throw new Error(err);
    });
  } catch (e) {
    throw new Error(e);
  }
};

const convertInvoiceToPdf = async (invoice, user) => {
  try {
    const template = await _readFile(__dirname + "/pdf.ejs", "utf-8");
    if (!template) {
      throw new Error();
    }
    const html = await ejs.render(
      template,
      {
        invoice,
        user
      },
      true
    );

    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();
    await page.setContent(html);
    await page.emulateMedia("screen");
    await page.pdf({
      displayHeaderFooter: true,
      path: FILE_PATH,
      format: "A4",
      height: "297mm",
      width: "210mm",
      headerTemplate: '<span class="pageNumber"></span>',
      footerTemplate: `
        <div style="border-top: 1px solid rgb(64, 64, 64); margin: 0 auto; display: flex; justify-content: space-around; font-size: 9px; font-family: 'Helvetica'; width: 90%; ">
          <p>
            <span style="font-weight: bold;">Adress</span><br />
            ${user.street} <br/>
            ${user.zip} ${user.city}
          </p>
          <p>
            <span style="font-weight: bold;">Bankgiro</span><br />
            ${user.bankgiro}
          </p>
          <p>
            <span style="font-weight: bold;">Telefon</span><br />
            ${user.phone}
          </p>
          <p>
            <span style="font-weight: bold;">Epost</span><br />
            ${user.email}
          </p>
          <p>
            <span style="font-weight: bold;">Organisationsnummer</span><br />
            ${user.registrationNumber}<br />
            Godkänd för F-skatt
          </p>
        </div>`,
      margin: {
        bottom: "200px",
        top: "50px",
        right: "20px",
        left: "20px"
      }
    });
    await browser.close();
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = {
  convertInvoiceToPdf,
  emailPdf,
  viewPdf,
  downloadPdf
};
