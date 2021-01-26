const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.HOSTMT,
    port: process.env.PORTMT,
    auth: {
      user: process.env.USERMT,
      pass: process.env.PASSMT,
    },
  });

  // const transporter = nodemailer.createTransport({
  // service: 'Gmail',
  // auth: {
  //   user: process.env.EMAIL_ID,
  //   pass: process.env.EMAIL_PASSWORD,
  // },
  // Activate in gmail: "less secure app" option
  // })

  // 2) Define the email options
  const mailOptions = {
    from: 'Venkatesh Dharavath <venkatesh@natours.io>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
