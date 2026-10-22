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

async function sendDriverAccountActivationEmail(email, name) {
  const mailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: email,
    subject: 'Aktivasi Akun Driver Anda',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="text-align:center; color: #007BFF;">Akun Driver Anda Sudah Aktif!</h2>
        <p>Hai ${name},</p>
        <p>Selamat! Akun Anda sebagai driver telah berhasil diaktifkan dan sekarang siap digunakan.</p>
        <p>Anda sekarang dapat masuk ke aplikasi kami dan mulai menerima pesanan.</p>
        <p>Jika Anda memiliki pertanyaan atau membutuhkan bantuan lebih lanjut, jangan ragu untuk menghubungi tim dukungan kami.</p>
        <p>Terima kasih telah bergabung dengan kami. Kami berharap Anda memiliki pengalaman yang luar biasa sebagai bagian dari komunitas kami!</p>
        <p>Salam hangat,</p>
        <p>Tim Dukungan Kami</p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return info
  }
  catch (error) {
    throw new Error(`Error sending email: ${error.message}`)
  }
}

async function sendDriverAccountDeactivationEmail(email, name, reason) {
  const mailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: email,
    subject: 'Akun Driver Anda Telah Dinonaktifkan',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="text-align:center; color: #FF0000;">Akun Driver Anda Telah Dinonaktifkan</h2>
        <p>Hai ${name},</p>
        <p>Kami ingin memberitahukan bahwa akun Anda sebagai driver telah dinonaktifkan.</p>
        ${reason ? `<p>Alasan: ${reason}</p>` : ''}
        <p>Jika Anda memiliki pertanyaan atau membutuhkan klarifikasi lebih lanjut, jangan ragu untuk menghubungi tim dukungan kami.</p>
        <p>Terima kasih atas kerjasama Anda. Kami berharap dapat bekerja sama kembali di masa mendatang.</p>
        <p>Salam hangat,</p>
        <p>Tim Dukungan Kami</p>
      </div>
    `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return info
  }
  catch (error) {
    throw new Error(`Error sending email: ${error.message}`)
  }
}

async function sendCustomerAccountDeactivationEmail(email, name, reason) {
  const mailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: email,
    subject: 'Akun Anda Telah Dinonaktifkan',
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="text-align:center; color: #FF0000;">Akun Anda Telah Dinonaktifkan</h2>
          <p>Hai ${name},</p>
          <p>Kami ingin memberitahukan bahwa akun Anda telah dinonaktifkan.</p>
          ${reason ? `<p>Alasan: ${reason}</p>` : ''}
          <p>Jika Anda memiliki pertanyaan atau membutuhkan klarifikasi lebih lanjut, jangan ragu untuk menghubungi tim dukungan kami.</p>
          <p>Terima kasih atas kerjasama Anda. Kami berharap dapat melayani Anda kembali di masa mendatang.</p>
          <p>Salam hangat,</p>
          <p>Tim Dukungan Kami</p>
        </div>
      `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return info
  }
  catch (error) {
    throw new Error(`Error sending email: ${error.message}`)
  }
}

async function sendCustomerAccountActivationEmail(email, name) {
  const mailOptions = {
    from: process.env.AUTH_MAILER_EMAIL,
    to: email,
    subject: 'Akun Anda Telah Diaktifkan',
    html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="text-align:center; color: #00FF00;">Akun Anda Telah Diaktifkan</h2>
          <p>Hai ${name},</p>
          <p>Kami dengan senang hati memberitahukan bahwa akun Anda telah diaktifkan.</p>
          <p>Anda sekarang dapat mengakses semua fitur dan layanan kami.</p>
          <p>Jika Anda memiliki pertanyaan atau membutuhkan bantuan lebih lanjut, jangan ragu untuk menghubungi tim dukungan kami.</p>
          <p>Terima kasih telah menjadi bagian dari komunitas kami.</p>
          <p>Salam hangat,</p>
          <p>Tim Dukungan Kami</p>
        </div>
      `,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    return info
  }
  catch (error) {
    throw new Error(`Error sending email: ${error.message}`)
  }
}

export {
  sendCustomerAccountActivationEmail,
  sendCustomerAccountDeactivationEmail,
  sendDriverAccountActivationEmail,
  sendDriverAccountDeactivationEmail,
}
