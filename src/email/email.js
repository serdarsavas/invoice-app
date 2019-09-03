const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendPdfMail = async msg => {
  try {
    await sgMail.send(msg);
  } catch (e) {
    throw new Error(e);
  }
};

const sendResetMail = async user => {
  try {
    await sgMail.send({
      to: user.email,
      from: {
        email: 'ssavas@kth.se',
        name: 'Fakturameistern'
      },
      subject: 'Återställning av ditt lösenord',
      content: [
        {
          type: 'text/html',
          value: `<p>Hej ${
            user.name.split(' ')[0]
          }! Du begärde precis ett nytt lösenord.</p>
                  <p><a href="https://fakturameistern.herokuapp.com/reset/${
                    user.resetToken
                  }">Klicka här för att återställa ditt lösenord</a></p>`
        }
      ]
    });
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = {
  sendPdfMail,
  sendResetMail
};
