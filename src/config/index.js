import 'dotenv/config'
const DB_URL = process.env.DB_URL
const REDIS = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
}
const JWT_SECRET = process.env.JWT_SECRET
// 如果是开发的就使用baseUrlPro否则baseUrlDev
const baseUrl = process.env.NODE_ENV === 'production' ? process.env.baseUrlPro : process.env.baseUrlDev
export default { DB_URL, REDIS, JWT_SECRET, baseUrl }
