import { getValue } from '../config/RedisConfig'
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
export { cheackCode }
