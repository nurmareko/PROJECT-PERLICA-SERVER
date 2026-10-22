import process from 'node:process'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config({ quiet: true })

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.AUTH_MAILER_EMAIL,
    pass: process.env.AUTH_MAILER_APP_PASSWORD,
  },
})

function sendOTPForgotPasswordCustomerByEmail(email, otp, name) {
  const mailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: email,
    subject: 'Verifikasi Email Reset Password',
    html: `
            <p>Hai ${name},</p>
            <p>Kami menerima permintaan untuk mereset password Anda. Gunakan kode verifikasi berikut:</p>
            <h1 style="text-align:center; font-size: 2em; color: #555;">${otp}</h1>
            <p>Masukkan kode ini di dalam aplikasi untuk menyelesaikan proses verifikasi.</p>
            <p>Harap tidak memberikan kode ini kepada siapa pun demi keamanan akun Anda.</p>
            <p>Jika Anda tidak meminta reset password, Anda dapat mengabaikan email ini.</p>
            <p>Terima kasih!</p>
        `,
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error)
      }
      else {
        resolve(info)
      }
    })
  })
}

function sendOTPForgotPasswordDriverByEmail(email, otp, name) {
  const mailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: email,
    subject: 'Verifikasi Email Reset Password',
    html: `
            <p>Hai ${name},</p>
            <p>Kami menerima permintaan untuk mereset password Anda. Gunakan kode verifikasi berikut:</p>
            <h1 style="text-align:center; font-size: 2em; color: #555;">${otp}</h1>
            <p>Masukkan kode ini di dalam aplikasi untuk menyelesaikan proses verifikasi.</p>
            <p>Harap tidak memberikan kode ini kepada siapa pun demi keamanan akun Anda.</p>
            <p>Jika Anda tidak meminta reset password, Anda dapat mengabaikan email ini.</p>
            <p>Terima kasih!</p>
        `,
  }

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        reject(error)
      }
      else {
        resolve(info)
      }
    })
  })
}

export {
  sendOTPForgotPasswordCustomerByEmail,
  sendOTPForgotPasswordDriverByEmail,
}
