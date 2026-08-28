import websocket from 'ws'
import { getJWTPayload } from '../common/utils'
import Comments from '../model/Comments'
class WebSocketServer {
  constructor (config = {}) {
    const defaultConfig = {
      port: 3001,
      timeInterval: 30 * 1000,
      isAuth: true
    }
    // 最终配置
    const finalConfig = { ...defaultConfig, ...config }
    this.wss = {}
    this.interval = finalConfig.timeInterval
    this.isAuth = finalConfig.isAuth
    this.port = finalConfig.port
    this.options = config.options || {}
  }

  init () {
    this.wss = new websocket.Server({ port: this.port, ...this.options })
    // 连接信息
    this.wss.on('connection', (ws) => {
      ws.isAuth = true
      // 监听客户端发送的消息
      ws.on('message', (msg) => {
        this.onMessage(ws, msg)
      })
      // 客户端断开
      ws.on('close', () => {
        this.onClose(ws)
      })
    })
  }

  //
  onMessage (ws, msg) {
    // 用户鉴权->token->_id
    // 心跳检测
    // 消息发送
    const msgObj = JSON.parse(msg)
    const events = {
      // 用户鉴权
      auth: async () => {
        console.log(msgObj.message)
        try {
          // 鉴权成功后广播消息
          const obj = await getJWTPayload(msgObj.message)

          if (obj) {
            ws.isAuth = true
            ws._id = obj._id
            const num = await Comments.getTotal(obj._id)
            ws.send(JSON.stringify({
              event: 'message',
              message: num
            }))
            // ws.send(JSON.stringify({
            //   event: 'auth',
            //   message: 'auth is ok'
            // }))
          }
        } catch (error) {
          ws.send(JSON.stringify({
            event: 'noauth',
            message: 'auth is no'
          }))
        }
      },
      // 心跳检测
      heartbeat: () => {
        if (msgObj.message === 'pong') {
          ws.isAlive = true
        }
      },
      // 消息发送
      message: () => {
        // 鉴权拦截
        if (!ws.isAuth && this.isAuth) {
          return
        }
        // 消息广播
        this.wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN && client._id === ws._id) {
            client.send(msg)
          }
        })
      }
    }
    events[msgObj.event]()
  }

  // 点对点的消息发送
  send (uid, msg) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client._id === uid) {
        client.send(msg)
      }
    })
  }

  // 广播消息->推送系统消息
  broadcast (msg) {
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        // client？
        this.send(msg)
      }
    })
  }

  //
  onClose (ws) {

  }

  // 心跳检测
  heartbeat () {
    clearInterval(this.interval)
    this.interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        // 如果还是false，客户端没有返回，终止连接
        if (!ws.isAlive) {
          return ws.terminate()
        }
        // 主动发送心跳检测请求
        // 当客户端返回了消息之后，主动设置flag为在线
        ws.isAlive = false
        ws.send(
          JSON.stringify({
            event: 'heartbeat',
            message: 'ping',

          })
        )
      })
    }, this.timeInterval)
  }
}
export default WebSocketServer
