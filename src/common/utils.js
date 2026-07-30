import { getValue } from '../config/RedisConfig'
import config from '../config'
import jwt from 'jsonwebtoken'
// 校验图片验证码
const cheackCode = async (key, value) => {
  const redisData = await getValue(key)
  if (redisData != null) {
    if (redisData.toLowerCase() === value.toLowerCase()) {
      return true
    } else {
      return false
    }
  } else {
    return false
  }
}

// 解析token
const getJWTpPayload = token => {
  return jwt.verify(token.split(' ')[1], config.JWT_SECRET)
}
export { cheackCode, getJWTpPayload }
