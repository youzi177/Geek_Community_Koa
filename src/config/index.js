import 'dotenv/config'
import path from 'path'
const DB_URL = process.env.DB_URL
const REDIS = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
}
const JWT_SECRET = process.env.JWT_SECRET
// 如果是开发的就使用baseUrlPro否则baseUrlDev
const baseUrl = process.env.NODE_ENV === 'production' ? process.env.baseUrlPro : process.env.baseUrlDev
// webpack编译后public就是磁盘上的
// const uploadPath = process.env.NODE_ENV === 'production' ? process.env.uploadPathPro : path.join(path.resolve(__dirname, '../../public'))
const uploadPath =
  process.env.NODE_ENV === 'production'
    ? process.env.uploadPathPro
    : path.join(process.cwd(), 'public')
export default { DB_URL, REDIS, JWT_SECRET, baseUrl, uploadPath }
