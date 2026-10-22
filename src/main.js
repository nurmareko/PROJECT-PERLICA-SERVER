import { networkInterfaces } from 'node:os'
import process from 'node:process'
import winston from 'winston'
import { web } from './application/web.js'
import 'dotenv/config'

const port = Number(process.env.PORT ?? 3001)
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535')
}

const bannerLogger = winston.createLogger({
  format: winston.format.printf(({ message }) => message),
  transports: [new winston.transports.Console()],
})

const art = (`
  ⢔⠰⢡⠱⢜⢰⢉⠼⢰⠩⢔⢱⠱⣪⣴⣶⣶⣶⣏⢔⢑⢬⠱⢬⠱⢜⠨⠱⢩⢔⠡⠵⢘⢱⢡⢑⠸⣑⣭⣴⣭⣔⢩⢚⠱⢫⢜⢣⠝⡼
  ⠄⠇⠕⢍⠌⡅⠱⠜⣅⠳⣉⠔⣱⣿⢿⣽⢿⣯⣟⡷⡍⠔⢍⠴⠅⠎⡍⠕⠵⠌⠥⠝⢍⠔⠥⡁⣴⣿⣟⣿⣿⣿⣷⣍⠕⠍⡼⠥⢟⠐
  ⠅⡃⢝⠤⢑⡉⠥⢙⢔⠙⡄⠅⢹⣿⣿⣯⣿⣽⣞⠷⣛⣞⣭⣬⣥⣵⣜⣙⣰⣭⣥⣽⣜⣁⡅⢸⣳⣻⣞⣿⣷⡿⣟⣿⠈⡑⢴⠡⢕⠩
  ⠔⡁⠇⡅⠇⡔⠍⡅⢖⠡⢅⠃⠊⡿⣵⢯⣟⢞⣵⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡻⢞⣿⢾⡿⣟⠟⠠⢅⠣⠕⠅⢇
  ⢄⠱⠡⢍⠱⢠⠃⡕⠌⢥⠈⠥⢥⣾⡹⠎⣵⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣎⠞⣯⢽⡋⠔⢠⠃⢥⠑⢍⠆
  ⢀⡃⠇⡍⠆⡅⢊⠴⠍⠆⡍⠂⣾⣯⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣽⣿⣿⣷⣿⣿⣷⣿⣿⣿⣿⣷⣜⣺⣇⠩⢄⢃⠖⣍⠆⡍
  ⠰⡈⢕⢸⢁⠜⠁⡈⢤⠱⡐⣸⠿⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡄⢖⡈⢆⠱⡘⠤
  ⠒⡑⢋⢆⢓⠀⢣⠙⢤⠓⣰⣿⣪⣿⣿⣿⣿⣿⣿⡿⣿⣻⣿⣿⣿⣿⣶⣭⣶⣿⣿⣿⣿⣿⡟⣿⣿⣿⣿⣿⣿⣗⢤⣣⢢⠱⢌⢡⠑⡌
  ⢘⠰⡉⣌⠢⢁⠄⠧⣌⢡⣿⠃⡛⣫⣻⢏⢿⣿⡗⣰⣻⣿⣿⢿⢋⣂⣉⣛⣉⡩⠻⣿⣿⣿⡟⡎⢿⣯⣷⢻⣿⡻⣷⢹⡆⢳⢈⠆⡱⢈
  ⢄⠱⡐⠤⣁⠇⡜⢢⢤⣿⣿⢆⢱⢳⡿⢸⢸⡿⢄⢳⡹⣛⡿⣏⢾⡽⣯⢿⣽⣻⠇⣿⣟⡿⠏⡗⠸⣿⣿⡞⣷⢳⡈⢆⣿⣀⢍⡲⢡⠌
  ⢠⡑⢡⢒⢅⢚⠍⠂⣿⣿⡽⢧⠸⡌⡓⠆⢧⡘⢢⠎⠓⠬⢑⠩⠄⢻⣽⣻⢾⠝⠠⠱⢊⣩⠞⠡⡙⠜⡼⢀⠿⠇⣇⣾⣿⡆⠼⢐⠣⠞
  ⢤⠑⢣⠜⢢⢅⢋⣶⣿⣯⡟⣭⢒⠝⠈⡑⠒⠉⠒⠂⠑⠛⠋⠛⠛⠿⠶⠻⠟⠲⠒⠒⠚⠂⠈⠀⠀⠈⠁⠎⢈⠞⣸⣽⣻⣿⡎⢅⠳⢅
  ⠤⡙⠤⣍⡑⢂⣾⣿⣟⡷⣙⠆⡏⢠⢸⡁⠠⣴⡾⠟⢛⣛⣛⢿⣳⡄⠀⠀⢀⣰⡿⠻⠟⠿⣟⣧⣖⡀⠀⢀⠘⣌⢳⡽⣻⣿⣿⡈⢕⡊
  ⢢⡑⢱⢂⢥⣿⣿⣟⡯⢳⢌⡙⢠⣑⠈⠁⠀⣟⠍⢠⣤⢤⣤⣄⠻⠃⢘⣯⠈⠿⢁⣩⢬⣍⠐⠌⢿⠁⢀⠊⢄⢨⠓⣼⣻⣿⣿⣧⢅⠎
  ⢂⠘⡅⣲⣿⣿⡿⡯⣕⠃⢶⡀⡕⣬⢱⢂⠀⠈⠾⣯⣝⣳⣟⠾⠇⢠⡷⣻⣄⠰⢛⣯⢷⢯⡟⣦⠋⠀⠀⡰⢌⡂⢍⢆⢷⣻⣿⣿⣇⠎
  ⢢⢱⣼⣿⣿⣿⡽⠱⣦⣍⡘⢷⣔⠔⢣⢍⠲⣐⠀⠌⣌⡡⣬⣴⣸⢿⡝⢻⣝⡷⣦⢬⣉⣌⠩⢀⠐⡤⢣⡑⢎⡔⡈⢜⠲⣹⢿⣿⣿⣎
  ⢂⣾⣿⣿⣟⡿⡜⢣⠔⢈⡿⣻⣞⣷⡁⢎⠱⣌⠱⡒⠤⠙⠒⢯⡟⣯⢷⡾⡽⣯⠽⠋⡚⣀⠒⢬⡑⢜⡡⢜⠢⡜⢡⠈⢧⢹⣻⢿⣿⣿
  ⣾⣿⣿⣿⣏⠷⡘⡅⣈⠎⠻⣵⡻⠞⠃⡈⠐⢆⢓⣤⠠⠢⠀⠀⢸⣈⠧⡩⠅⠀⠒⡩⠔⡌⡍⢒⡌⠦⣑⠌⡑⢈⣄⢂⠱⢊⣽⣻⣿⣿
  ⣿⣿⣿⡿⣜⢣⠱⢀⠦⣙⠐⠤⠁⢄⣠⣶⣿⣆⣾⠇⠀⡀⠈⠀⠈⣿⠻⠉⠀⠀⠄⠀⣈⡰⢉⠴⢘⠴⡁⢐⢰⠡⢂⠃⠌⢣⢖⣻⢿⣾
  ⣿⣿⣟⡷⡘⢬⠁⢎⠴⠐⠍⡐⠘⣿⣿⣿⣿⣿⣿⠀⠐⠀⢁⠔⠒⢁⠀⢀⠂⡐⠀⣸⣿⡇⠡⠕⣌⠲⢀⠅⢆⡑⠬⢌⡁⠪⡜⣹⢿⣿
  ⣿⣿⣯⡓⣍⠂⠜⠈⢄⠡⠔⠰⢩⠘⣿⣿⣿⡟⠁⠀⠠⢀⠘⢄⣒⠜⠀⠀⡐⠀⣰⣿⣿⣷⢡⠱⢄⠹⠄⢈⠒⠴⡈⢄⡑⢤⠣⡝⣿⣿
  ⣿⣿⣇⠳⠤⢁⠇⠉⠴⠡⠍⡁⢆⠔⡘⢿⣿⣿⢦⡀⠁⡀⠀⣠⠀⠀⡀⠂⠄⠀⠻⣿⣿⣿⠠⢱⢈⠵⡉⢆⢄⡁⠅⠡⠌⡀⢣⡙⣷⣿
  ⣿⣿⡎⡵⣉⠐⠌⠑⢬⢑⠠⠘⣐⠆⠑⡄⠈⠄⠿⣷⣀⢠⣾⣿⡆⠀⠠⢐⣀⣤⣶⣿⣿⣿⡆⡑⢊⢖⠩⠔⢢⢘⢡⢓⡘⠄⠣⣜⣳⣿
  ⣿⡿⡜⡴⢠⠈⡅⠅⠒⠌⢆⠡⢄⠔⡩⠄⢂⠀⠀⠀⠀⠉⠉⠙⠛⠒⠛⠛⠛⠛⠛⢿⣿⣿⣧⠡⢃⠎⢥⠉⡆⠜⡄⢣⠘⡄⢳⠰⣯⣿
  ⣽⣙⠣⡜⠤⡘⢠⠣⣑⠌⡠⠈⠄⠡⢐⠰⡈⠆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣽⣿⣿⡆⢅⡚⢤⠓⡌⠒⡌⡅⣊⠘⡤⢛⣼⣿
  `)

const networkAddress = networkInterfaces()['Wi-Fi']?.find(address =>
  address.family === 'IPv4' && !address.internal,
)?.address

const details = [
  `  Local:        http://localhost:${port}`,
  networkAddress
    ? `  Network:      http://${networkAddress}:${port}`
    : '  Network:      Wi-Fi unavailable',
  `  Environment:  ${process.env.NODE_ENV ?? 'development (default)'}`,
  '',
]

web.listen(port, () => {
  bannerLogger.info(`${art}\n${details.join('\n')}`)
})
