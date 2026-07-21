// const { createClient } = require('redis');
// const config = require('./index');
import config from './index'
import { createClient } from 'redis'
// 创建redis
const client = createClient({
  socket: {
    host: config.REDIS.host,
    port: config.REDIS.port,
    connectTimeout: 5000, // 超时30秒
    // 重连策略
    reconnectStrategy: (retries, cause) => {
      // if (cause.code === 'ECONNREFUSED') {
      //   return new Error('Redis server refused connection')
      // }
      if (retries > 10) {
        return new Error('Redis retry exhausted')
      }
      // 重连间隔
      return Math.min(retries * 100, 3000)
    }
  },
  password: config.REDIS.password || undefined
})
// 监听事件
client.on('connect', () => {
  console.log('Redis 正在连接...')
})

client.on('ready', () => {
  console.log('Redis 已准备就绪，可以使用')
})

client.on('error', (err) => {
  console.error('Redis 连接错误:', err)
})

client.on('reconnecting', () => {
  console.log('Redis 正在重新连接...')
})
// 连接redis
// await client.connect()
try {
  await client.connect()
  console.log('Redis 连接成功')
} catch (err) {
  console.error('Redis 初次连接失败:', err.message)
}
// 设置值
const setValue = async (key, value, time) => {
  // 如果是空的，就直接返回，不存
  if (typeof value === 'undefined' || value === null || value === '') {
    return
  }
  // 如果是一个字符串，那就判断time是否存在，存在就设置过期时间，没有就直接set
  if (typeof value === 'string') {
    if (time) {
      client.set(key, value, {
        EX: time
      })
    } else {
      client.set(key, value)
    }
  }
  // 如果是一个对象，使用hSet，然后判断有没有设置过期时间，有的话再设置过期时间
  if (typeof value === 'object') {
    client.hSet(key, value)
    if (time) {
      await client.expire(key, time)
    }
  }
}

// 获取值
const getValue = async (key) => {
  // client里面取这个type
  const type = await client.type(key)
  // 判断是hash还是string，这两个的取值方式不一样
  if (type === 'hash') {
    return client.hGetAll(key)
  }
  if (type === 'string') {
    return client.get(key)
  }
}
// async function main() {
//   await client.connect();
//   await setValue('key', { name: '小封鸭', age: '18' }, 20);
//   const result = await getValue('key');
//   console.log(result);
// }

// main();
export { client, setValue, getValue }
