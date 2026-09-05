import SignModel from '../model/Sign'
import { getJWTPayload } from '../common/utils'
import UserModel from '../model/User'
import UserCollect from '../model/UserCollect'
import Comments from '../model/Comments'
import moment from 'moment'
import send from '../config/MailConfig'
import { v4 as uuidv4 } from 'uuid'
import { getValue, setValue } from '../config/RedisConfig'
import jwt from 'jsonwebtoken'
import config from '../config'
import bcrypt from 'bcryptjs'
class UserController {
  // 用户签到
  async userSign (ctx) {
    let newRecord = {}// 保存用户的签到记录
    let result = {}
    // 1：取用户ID
    const obj = await getJWTPayload(ctx.header.authorization)
    // 2：查询用户上一次的签到记录
    // record 根据用户 id 查询这个用户最近一次的签到记录
    const record = await SignModel.findByUid(obj._id)// 查uid
    const user = await UserModel.findByID(obj._id)
    // 3:判断签到逻辑
    if (record !== null) {
      // 3.1有历史签到记录
      let count = user.count// 用户签到的天数
      let fav = 0
      // 3.3判断用户上次签到的时间是否与今天相同
      // 如果当前时间的日期与用户上一次签到的日期相同，说明用户已经签到
      if (moment(record.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        ctx.body = {
          code: 500,
          favs: user.favs,
          count: user.count,
          lastSign: newRecord.created, // 签到的时候也要返回签到时间
          msg: '用户已经签到'
        }
        return
      } else {
        // 3.4有上一次的签到记录，并且不与今天相同，进行连续签到的判断
        // 判断签到时间,用户上一次签到的时间是当前时间的前一天，说明在连续签到
        if (moment(record.created).format('YYYY-MM-DD') === moment().subtract(1, 'days').format('YYYY-MM-DD')) {
          count += 1// 临界情况，比如签到第4天，再次签到就是第5天，第五天应该是10积分
          // 连续签到的积分获得逻辑
          if (count < 5) {
            fav = 5
          } else if (count >= 5 && count < 15) {
            fav = 10
          } else if (count >= 15 && count < 30) {
            fav = 15
          } else if (count >= 30 && count < 100) {
            fav = 20
          } else if (count >= 100 && count < 365) {
            fav = 30
          } else if (count >= 365) {
            fav = 50
          }
          // 增加积分和签到天数
          await UserModel.updateOne(
            { _id: obj._id },
            {
              $inc: { favs: fav, count: 1 }
            }
          )
          // 返回数据
          result = {
            favs: user.favs + fav, // 返回总积分
            count: user.count + 1 // 因为user.count是旧数据所以是+1
          }
        } else {
          // 用户中断了连续签到
          fav = 5
          await UserModel.updateOne(
            { _id: obj._id },
            {
              $set: { count: 1 }, // 修改设置成1
              $inc: { favs: fav }// 增加
            }
          )
          // 返回数据
          result = {
            favs: user.favs + fav,
            count: 1
          }
        }
        // 无论是否连续签到，更新用户的签到记录
        newRecord = new SignModel({
          uid: obj._id,
          favs: fav,

        })
        await newRecord.save()
      }
    } else {
      // 3.2无历史签到数据
      // 无签到数据,那就写入数据，count签到修改为1天，favs增加5
      await UserModel.updateOne({
        _id: obj._id
      }, {
        $set: { count: 1 }, // 修改设置成1
        $inc: { favs: 5 }// 增加
      })
      // 保存用户的签到记录
      newRecord = new SignModel({
        uid: obj._id,
        favs: 5,

      })
      await newRecord.save()
      // 返回的签到数据
      result = {
        favs: user.favs + 5, // 返回总积分
        count: 1// 签到天数为1
      }
    }
    ctx.body = {
      code: 200,
      msg: '请求成功',
      ...result,
      lastSign: newRecord.created// 签到的时候也要返回签到时间
    }
  }

  // 更新用户基本信息接口
  async updateUserInfo (ctx) {
    const { body } = ctx.request
    // 用户登录的账号ID
    const obj = await getJWTPayload(ctx.header.authorization)
    // 用户登录的账号信息
    const user = await UserModel.findOne({ _id: obj._id })
    const msg = {}// veevadate错误信息
    let msg1 = ''
    // 判断用户是否修改了邮箱
    // 有传过来body.username，并且body.username不和登录的username登录一样，说明修改了username
    if (body.username && body.username !== user.username) {
      // 判断用户新邮箱是否有人注册
      const tmpUser = await UserModel.findOne({ username: body.username })
      if (tmpUser && tmpUser.password) {
        msg.username = '此邮箱已经被注册,请登录'
        ctx.body = {
          code: 501,
          msg
        }
        return
      }
      // 用户修改了邮箱
      // 发送reset邮件
      const key = uuidv4()
      // 30分钟（UUID、JWT30分钟，过期时间30分钟）
      setValue(key, jwt.sign({ _id: obj._id }, config.JWT_SECRET, {
        expiresIn: '30m'
      }), 30 * 60)
      await send({
        type: 'email',
        // 邮箱的链接需要的参数
        data: {
          key,
          username: body.username
        },
        code: '', // 注册的时候才需要
        expire: moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
        email: user.username, // 给用户原来的邮箱发信息
        user: user.name
      })
      msg1 = '更新基本资料成功，账号修改需要邮件确认，请查收邮件！'
    }
    // 判断用户是否修改了昵称
    // 有传过来body.name，并且body.name不和登录的name登录一样，说明修改了name
    if (body.name !== null && typeof body.name !== 'undefined' && body.name !== user.name) {
      // 判断用户新昵称是否有人注册
      const tmpUser = await UserModel.findOne({ name: body.name })
      if (tmpUser && tmpUser.password) {
        msg.name = '此昵称已经被使用，请修改'
        ctx.body = {
          code: 501,
          msg
        }
        return
      }
    }

    // 为了接口通用，但是又不想修改敏感数据，所以这里删除掉一些敏感字段，确保不能修改
    const arr = ['username', 'mobile', 'password']
    arr.map((item) => delete body[item])
    const result = await UserModel.updateOne({
      _id: obj._id
    }, body)
    //  matchedCount是更新一条，acknowledged是否成功
    if (result.matchedCount === 1 && result.acknowledged) {
      ctx.body = {
        code: 200,
        msg: msg1 === '' ? '更新成功' : msg1
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '更新失败'
      }
    }
  }

  // 更新用户名，当用户修改邮箱用户名后，点击邮件修改邮箱，就需要请求该接口
  async updateUsername (ctx) {
    const body = ctx.query
    if (body.key) {
      const token = await getValue(body.key)
      const obj = getJWTPayload('Bearer ' + token)
      await UserModel.updateOne({ _id: obj._id }, {
        username: body.username
      })
      ctx.body = {
        code: 200,
        msg: '更新用户名成功'
      }
    }
  }

  // 修改密码
  async changePassword (ctx) {
    const { body } = ctx.request
    const obj = await getJWTPayload(ctx.header.authorization)
    const user = await UserModel.findOne({
      _id: obj._id
    })
    // 判断当前密码是否与当前用户密码一致
    if (await bcrypt.compare(body.oldpwd, user.password)) {
      const newpasswd = await bcrypt.hash(body.newpwd, 5)
      await UserModel.updateOne({ _id: obj._id }, { $set: { password: newpasswd } })
      ctx.body = {
        code: 200,
        msg: '更新密码成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '更新密码错误，请检查输入当前密码是否正确！'
      }
    }
  }

  // 设置收藏
  async setCollect (ctx) {
    const params = ctx.query
    if (typeof ctx.header.authorization !== 'undefined' && ctx.header.authorization !== '') {
      const obj = await getJWTPayload(ctx.header.authorization)
      // 注意：ctx.query 里的值都是字符串
      const isFav = String(params.isFav).toLowerCase() === 'true'
      if (isFav) {
      // 用户收藏过贴子,点击就是取消收藏
        await UserCollect.deleteOne({ uid: obj._id, tid: params.tid })
        ctx.body = {
          code: 200,
          msg: '取消收藏成功'
        }
      } else {
        const newCollect = new UserCollect({
          uid: obj._id,
          tid: params.tid,
          title: params.title

        })
        const result = await newCollect.save()
        if (result.uid) {
          ctx.body = {
            code: 200,
            msg: '收藏成功'
          }
        }
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '非法操作'
      }
    }
  }

  // 获取收藏列表
  async getCollectByUid (ctx) {
    const params = ctx.query
    const obj = await getJWTPayload(ctx.header.authorization)
    const result = await UserCollect.getListByUid(
      obj._id,
      params.page,
      params.limit ? parseInt(params.limit) : 10
    )
    const total = await UserCollect.countByUid(obj._id)
    // console.log(result)

    if (result.length > 0) {
      ctx.body = {
        code: 200,
        data: result,
        total,
        msg: '查询列表成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '查询失败或者没有收藏'
      }
    }
  }

  // 获取用户基本信息
  async getBasinInfo (ctx) {
    // 后台管理通过header传递ID的，不能这样传
    // const obj = await getJWTPayload(ctx.header.authorization)
    // 获取客户端 IP
    let ip
    // 如果配置了代理且设置了 app.proxy = true，
    // ctx.ips 会按可信代理顺序返回 IP 数组，第一个通常是客户端真实 IP
    if (ctx.ips.length > 0) {
      ip = ctx.ips[0]
    } else {
    // 否则从 x-forwarded-for 头手动解析（注意可能存在伪造风险）
      const forwarded = ctx.headers['x-forwarded-for']
      ip = forwarded
        ? forwarded.split(',')[0].trim()
        : ctx.request.ip // 或 ctx.req.socket.remoteAddress
    }
    const params = ctx.query
    const uid = params.uid || ctx._id

    const user = await UserModel.findByID(uid)
    ctx.body = {
      code: 200,
      data: user,
      msg: '查询成功',
      ip
    }
  }

  // 获取历史消息
  // 记录评论之后，给作者发送消息
  async getMsg (ctx) {
    const params = ctx.query
    const page = params.page ? parseInt(params.page) : 0
    const limit = params.limit ? parseInt(params.limit) : 0
    // 方法1：嵌套查询-> aggregate
    const obj = await getJWTPayload(ctx.header.authorization)
    const result = await Comments.getMsgList(obj._id, page, limit)
    const num = await Comments.getTotal(obj._id)
    ctx.body = {
      code: 200,
      data: result,
      total: num
    }
    // 方法2：通过冗余换时间
  }

  // 设置已读消息
  async setMsg (ctx) {
    const params = ctx.query
    if (params.id) {
      const result = await Comments.updateOne({ _id: params.id }, { isRead: '1' })
      if (result.acknowledged) {
        ctx.body = {
          code: 200
        }
      }
    } else {
      // 设置所有消息已读
      const obj = await getJWTPayload(ctx.header.authorization)
      const result = await Comments.updateMany({ uid: obj._id }, { isRead: '1' })
      if (result.acknowledged) {
        ctx.body = {
          code: 200
        }
      }
    }
  }

  // 获取用户列表
  async getUsers (ctx) {
    const params = ctx.query
    const page = params.page ? parseInt(params.page) : 0
    const limit = params.limit ? parseInt(params.limit) : 0
    const sort = params.sort ? params.sort : 'created'
    const result = await UserModel.getList({}, sort, page, limit)
    const total = await UserModel.countList({})
    ctx.body = {
      code: 200,
      data: result,
      total
    }
  }

  // 管理员删除用户,存在问题，删除用户应该把关联数据删除
  async deleteUserById (ctx) {
    // const params = ctx.query
    const { body } = ctx.request
    // const user = await UserModel.findOne({ _id: params.id })
    const result = await UserModel.deleteMany({ _id: { $in: body.ids } })
    ctx.body = {
      code: 200,
      msg: '删除成功',
      data: result
    }
    // if (user) {

    // } else {
    //   ctx.body = {
    //     code: 500,
    //     msg: '用户不存在或者id信息错误',

    //   }
    // }
  }

  // 管理员更新用户信息
  async updateUserById (ctx) {
    const { body } = ctx.request
    // 校验用户是否存在
    const user = await UserModel.findOne({ _id: body._id })
    // 用户不存在
    if (!user) {
      ctx.body = {
        code: 500,
        msg: '用户不存在或者ID错误'
      }
      return
    }
    // 校验是否修改了username
    // 有传过来body.username，并且body.username不和登录的username登录一样，说明修改了username
    if (body.username && body.username !== user.username) {
      // 判断用户新邮箱是否有人注册
      const tmpUser = await UserModel.findOne({ username: body.username })
      if (tmpUser && tmpUser.password) {
        ctx.body = {
          code: 500,
          msg: '此邮箱已经被注册,请修改'
        }
        return
      }
    }
    // 判断用户是否修改了昵称
    // 有传过来body.name，并且body.name不和登录的name登录一样，说明修改了name
    if (body.name !== null && typeof body.name !== 'undefined' && body.name !== user.name) {
      // 判断用户新昵称是否有人注册
      const tmpUser = await UserModel.findOne({ name: body.name })
      if (tmpUser && tmpUser.password) {
        ctx.body = {
          code: 501,
          msg: '此昵称已经被使用，请修改'
        }
        return
      }
    }
    // 密码这里只要判断有没有传过来就行，有传就加密
    if (body.password) {
      body.password = await bcrypt.hash(body.password, 10)
    }
    // 为了接口通用，但是又不想修改敏感数据，所以这里删除掉一些敏感字段，确保不能修改
    const arr = ['mobile']
    arr.map((item) => delete body[item])
    const result = await UserModel.updateOne({
      _id: body._id
    }, body)
    //  matchedCount是更新一条，acknowledged是否成功
    if (result.matchedCount === 1 && result.acknowledged) {
      ctx.body = {
        code: 200,
        msg: '更新成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '更新失败'
      }
    }
    // ctx.body = {
    //   code: 200,
    //   msg: '更新成功'
    // }
  }

  // 异步校验用户名
  // 这里前端可以判断是否修改然后再请求接口
  // 而不是交由后端判断
  async checkUsername (ctx) {
    const params = ctx.query
    // 新增用户
    if (!params.id) {
      let result = 1
      const tmpUser = await UserModel.findOne({ username: params.username })
      if (tmpUser && tmpUser.password) {
        // 有人注册
        result = 0
      } else {
        // 没人注册
        result = 1
      }
      ctx.body = {
        code: 200,
        data: result,
        msg: '校验结果0失败1成功'
      }
      return
    }
    // 校验用户是否存在
    const user = await UserModel.findOne({ _id: params.id })
    // 用户不存在
    if (!user) {
      ctx.body = {
        code: 500,
        msg: '用户不存在或者ID错误'
      }
      return
    }
    // 校验是否修改了username
    // 有传过来body.username，并且body.username不和当前修改的username一样，说明修改了username
    let result = 1
    if (params.username && params.username !== user.username) {
      // 判断用户新邮箱是否有人注册
      const tmpUser = await UserModel.findOne({ username: params.username })
      if (tmpUser && tmpUser.password) {
        // 有人注册
        result = 0
      } else {
        // 没人注册
        result = 1
      }
      ctx.body = {
        code: 200,
        data: result,
        msg: '校验结果0失败1成功'
      }
    } else {
      // 没有修改
      ctx.body = {
        code: 200,
        data: result,
        msg: '没有修改邮箱，无需校验'
      }
    }
  }

  // 异步校验昵称
  // 这里前端可以判断是否修改然后再请求接口
  // 而不是交由后端判断
  async checkName (ctx) {
    const params = ctx.query
    // 新增用户
    if (!params.id) {
      let result = 1
      const tmpUser = await UserModel.findOne({ name: params.name })
      if (tmpUser && tmpUser.password) {
        // 有人注册
        result = 0
      } else {
        // 没人注册
        result = 1
      }
      ctx.body = {
        code: 200,
        data: result,
        msg: '校验结果0失败1成功'
      }
      return
    }
    // 校验用户是否存在
    const user = await UserModel.findOne({ _id: params.id })
    // 用户不存在
    if (!user) {
      ctx.body = {
        code: 500,
        msg: '用户不存在或者ID错误'
      }
      return
    }
    // 校验是否修改了name
    // 有传过来body.name，并且body.name不和当前修改的name一样，说明修改了name
    let result = 1
    if (params.name && params.name !== user.name) {
      // 判断用户新邮箱是否有人注册
      const tmpUser = await UserModel.findOne({ name: params.name })
      if (tmpUser && tmpUser.password) {
        // 有人注册
        result = 0
      } else {
        // 没人注册
        result = 1
      }
      ctx.body = {
        code: 200,
        data: result,
        msg: '校验结果0失败1成功'
      }
    } else {
      // 没有修改
      ctx.body = {
        code: 200,
        data: result,
        msg: '没有修改用户名，无需校验'
      }
    }
  }

  // 新增用户
  async addUser (ctx) {
    const { body } = ctx.request
    // 密码加密
    body.password = await bcrypt.hash(body.password, 10)
    const user = new UserModel(body)
    const result = await user.save()
    // 剔除敏感数据,这需要注意顺序，user为空不能toJSON
    const userobj = result.toJSON()
    const arr = ['password']
    arr.map((item) => {
      return delete userobj[item]
    })
    if (result) {
      ctx.body = {
        code: 200,
        data: userobj,
        msg: '添加用户成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '服务异常'
      }
    }
  }

  // 批量更新用户
  async updateUserBatchById (ctx) {
    const { body } = ctx.request
    const result = await UserModel.updateMany({ _id: { $in: body.ids } }, { $set: { ...body.settings } })
    ctx.body = {
      code: 200,
      data: result
    }
  }
}
export default new UserController()
