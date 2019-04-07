const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendPdfMail = async msg => {
  try {
    await sgMail.send(msg)
    console.log('Email sent successfully!')
  } catch (e) {
    console.log(e)
  }
}

const sendResetMail = async (user) => {
  try {
    await sgMail.send({
      to: user.email,
      from: {
        email: 'serdar.savas@botkyrka.se',
        name: 'Fakturameistern'
      },
      subject: 'Återställning av ditt lösenord',
      content: [
        {
          type: 'text/html',
          value: `<p>Hej ${user.name.split(' ')[0]}! Du begärde precis ett nytt lösenord.</p>
                  <p><a href="http://localhost:3000/reset/${user.resetToken}">Klicka här för att återställa ditt lösenord</a></p>`
        }
      ]
    })
    console.log('Reset mail sent!')
  } catch (e) {
    console.log(e)
  }
} 

module.exports = {
  sendPdfMail,
  sendResetMail
}
