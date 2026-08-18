import { getValue } from '../config/RedisConfig'
import config from '../config'
import jwt from 'jsonwebtoken'
import path from 'path'
import fs from 'fs'
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
const getJWTPayload = token => {
  return jwt.verify(token.split(' ')[1], config.JWT_SECRET)
}

const getStats = (path) => {
  return new Promise((resolve) => {
    fs.stat(path, (err, stats) => err ? resolve(false) : resolve(stats))
  })
}
const mkdir = (dir) => {
  return new Promise((resolve) => {
    fs.mkdir(dir, err => err ? resolve(false) : resolve(true))
  })
}
const dirExists = async (dir) => {
  const isExists = await getStats(dir)
  // 如果该路径存在且不是文件，返回 true
  if (isExists && isExists.isDirectory()) {
    return true
  } else if (isExists) {
    // 路径存在，但是是文件，返回 false
    return false
  }
  // 如果该路径不存在
  const tempDir = path.parse(dir).dir
  // 循环遍历，递归判断如果上级目录不存在，则产生上级目录
  const status = await dirExists(tempDir)
  if (status) {
    const result = await mkdir(dir)
    console.log('TCL: dirExists -> result', result)
    return result
  } else {
    return false
  }
}
/**
 * 重新命名
 * @param {*} obj 一个对象
 * @param {*} key 要修改的值
 * @param {*} newval 新值
 */
const rename = (obj, key, newkey) => {
  if (Object.keys(obj).indexOf(key) !== 1) {
    obj[newkey] = obj[key]
    delete obj[key]
  }
  return obj
}
export { cheackCode, getJWTPayload, dirExists, rename }
