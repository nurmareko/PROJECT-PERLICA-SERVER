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
    user: process.env.REPORT_MAILER_EMAIL,
    pass: process.env.REPORT_MAILER_APP_PASSWORD,
  },
})

function sendCustomerReportEmail(customerEmail, customerName, orderId, message) {
  const mailOptions = {
    from: process.env.REPORT_MAILER_EMAIL,
    to: `${process.env.AUTH_MAILER_EMAIL}`,
    subject: 'Keluhan dari Customer',
    html: `
      <p>Halo Admin,</p>
      <p>Kami ingin menginformasikan bahwa ada keluhan baru yang diterima dari seorang customer. Mohon untuk segera menindaklanjuti keluhan ini.</p>
      <p><strong>Detail Keluhan:</strong></p>
      <ul>
        <li><strong>Nama Customer:</strong> ${customerName}</li>
        <li><strong>Email Customer:</strong> ${customerEmail}</li>
        <li><strong>ID Pesanan:</strong> ${orderId}</li>
        <li><strong>Pesan:</strong> ${message}</li>
      </ul>
      <p>Segera lakukan investigasi dan berikan solusi untuk menyelesaikan masalah ini.</p>
      <p>Terima kasih atas perhatian dan kerjasamanya.</p>
      <p>Salam hormat,</p>
      <p>Tim Support Airport Taxi Sharing</p>
    `,
  }

  const notificationOptions = {
    from: process.env.REPORT_MAILER_EMAIL,
    to: customerEmail,
    subject: 'Notifikasi Keluhan Terkirim',
    html: `
      <p>Halo,</p>
      <p>Kami ingin menginformasikan bahwa sebuah keluhan telah berhasil dikirimkan ke admin. Berikut adalah detail keluhan yang dikirim:</p>
      <ul>
        <li><strong>Nama Customer:</strong> ${customerName}</li>
        <li><strong>Email Customer:</strong> ${customerEmail}</li>
        <li><strong>ID Pesanan:</strong> ${orderId}</li>
        <li><strong>Pesan:</strong> ${message}</li>
      </ul>
      <p>Terima kasih telah menggunakan sistem kami. Anda akan mendapatkan update lebih lanjut setelah keluhan ditindaklanjuti.</p>
      <p>Salam hormat,</p>
      <p>Tim Support Airport Taxi Sharing</p>
    `,
  }

  return Promise.all([
    new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          reject(error)
        }
        else {
          resolve(info)
        }
      })
    }),
    new Promise((resolve, reject) => {
      transporter.sendMail(notificationOptions, (error, info) => {
        if (error) {
          reject(error)
        }
        else {
          resolve(info)
        }
      })
    }),
  ])
}

function sendDriverReportEmail(driverEmail, driverName, orderId, message) {
  const adminMailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: process.env.AUTH_MAILER_EMAIL,
    subject: 'Keluhan dari Driver',
    html: `
      <p>Halo Admin,</p>
      <p>Kami ingin menginformasikan bahwa ada keluhan baru yang diterima dari seorang driver. Mohon untuk segera menindaklanjuti keluhan ini.</p>
      <p><strong>Detail Keluhan:</strong></p>
      <ul>
        <li><strong>Nama Driver:</strong> ${driverName}</li>
        <li><strong>Email Driver:</strong> ${driverEmail}</li>
        <li><strong>ID Pesanan:</strong> ${orderId}</li>
        <li><strong>Pesan:</strong> ${message}</li>
      </ul>
      <p>Segera lakukan investigasi dan berikan solusi untuk menyelesaikan masalah ini.</p>
      <p>Terima kasih atas perhatian dan kerjasamanya.</p>
      <p>Salam hormat,</p>
      <p>Tim Support</p>
    `,
  }

  const driverNotificationOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: driverEmail,
    subject: 'Notifikasi Keluhan Terkirim',
    html: `
      <p>Halo,</p>
      <p>Kami ingin menginformasikan bahwa keluhan Anda telah berhasil dikirimkan ke admin. Berikut adalah detail keluhan yang dikirim:</p>
      <ul>
        <li><strong>Nama Driver:</strong> ${driverName}</li>
        <li><strong>Email Driver:</strong> ${driverEmail}</li>
        <li><strong>ID Pesanan:</strong> ${orderId}</li>
        <li><strong>Pesan:</strong> ${message}</li>
      </ul>
      <p>Terima kasih telah menggunakan sistem kami. Anda akan mendapatkan update lebih lanjut setelah keluhan ditindaklanjuti.</p>
      <p>Salam hormat,</p>
      <p>Tim Support</p>
    `,
  }

  return Promise.all([
    new Promise((resolve, reject) => {
      transporter.sendMail(adminMailOptions, (error, info) => {
        if (error) {
          reject(error)
        }
        else {
          resolve(info)
        }
      })
    }),
    new Promise((resolve, reject) => {
      transporter.sendMail(driverNotificationOptions, (error, info) => {
        if (error) {
          reject(error)
        }
        else {
          resolve(info)
        }
      })
    }),
  ])
}

export { sendCustomerReportEmail, sendDriverReportEmail }
