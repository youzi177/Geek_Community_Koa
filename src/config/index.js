import 'dotenv/config';
const DB_URL = process.env.DB_URL;
const REDIS = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
};
export default { DB_URL, REDIS };
