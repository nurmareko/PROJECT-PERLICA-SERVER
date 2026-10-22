import process from 'node:process'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'

dotenv.config()

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

function sendOTPRegisterCustomerByEmail(email, otp, name) {
  const mailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: email,
    subject: 'Verifikasi Email Pendaftaran Customer',
    html: `
            <p>Hai ${name},</p>
            <p>Terima kasih telah mendaftar!</p>
            <p>Berikut adalah Kode OTP Anda untuk verifikasi:</p>
            <h1 style="text-align:center; font-size: 2em;  color: #555;">${otp}</h1>
            <p>Masukkan kode ini dalam aplikasi untuk menyelesaikan proses verifikasi.</p>
            <p>Harap jangan berikan kode ini kepada siapapun untuk menjaga keamanan akun Anda.</p>
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

function sendOTPRegisterDriverByEmail(email, otp, name) {
  const mailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: email,
    subject: 'Verifikasi Email Pendaftaran Driver',
    html: `
            <p>Hai ${name},</p>
            <p>Terima kasih telah mendaftar!</p>
            <p>Berikut adalah Kode OTP Anda untuk verifikasi:</p>
            <h1 style="text-align:center; font-size: 2em;  color: #555;">${otp}</h1>
            <p>Masukkan kode ini dalam aplikasi untuk menyelesaikan proses verifikasi.</p>
            <p>Harap jangan berikan kode ini kepada siapapun untuk menjaga keamanan akun Anda.</p>
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

export { sendOTPRegisterCustomerByEmail, sendOTPRegisterDriverByEmail }
