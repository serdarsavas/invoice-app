const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendMail = async msg => {
  try {
    await sgMail.send(msg)
    console.log('Email sent successfully!')
  } catch (e) {
    console.log(e)
  }
}
module.exports = sendMail
