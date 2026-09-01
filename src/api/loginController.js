import send from '../config/MailConfig'
import { v4 as uuidv4 } from 'uuid'
import User from '../model/User'
import moment from 'moment'
import { cheackCode } from '../common/utils'
import jsonwebtoken from 'jsonwebtoken'
import config from '../config'
import bcrypt from 'bcryptjs'
import SignModel from '../model/Sign'
import { setValue, getValue } from '../config/RedisConfig'
import { getJWTPayload } from '../common/utils'
class LoginController {
  // 忘记密码
  async forget (ctx) {
    const { body } = ctx.request
    const sid = body.sid
    const code = body.code
    // 查看这个账号是不是注册的
    const user = await User.findOne({ username: body.username })
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code)
    if (result) {
      // 没有注册的账号
      if (!user) {
        ctx.body = {
          code: 404,
          msg: '请检查账号！'
        }
        return
      }
      try {
        // redis存key和token
        const key = uuidv4()
        setValue(
          key,
          jsonwebtoken.sign({ _id: user._id }, config.JWT_SECRET, {
            expiresIn: '30m'
          }),
          30 * 60
        )
        // 这里的body.username应该查询数据库然后再发送邮件
        const result = await send({
          type: 'reset',
          cede: '', // 注册的时候才需要
          data: {
            key,
            username: body.username
          },
          expire: moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
          email: body.username,
          user: user.name ? user.name : body.username
        })
        ctx.body = {
          code: 200,
          data: result,
          msg: '邮件发送成功'
        }
      } catch (error) {
        console.log(error)
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '图片验证码错误，请检查'
      }
    }
  }

  // 注册邮箱验证码---正在开发中，
  async emailCode (ctx) {
    const { body } = ctx.request
    // 确认用户名存在
    if (body.username === 'null' && typeof body.username === 'undefined') {
      ctx.body = {
        code: 500,
        msg: '用户名不能为空'
      }
      return
    }
    // 确认用户是否一直在发验证码
    const redisData = await getValue(body.username)
    if (redisData !== null) {
      ctx.body = {
        code: 500,
        msg: '请不要重复发送验证码'
      }
      return
    }
    // 查询邮箱username是否注册
    const user1 = await User.findOne({ username: body.username })
    if (user1 !== null && typeof user1.username !== 'undefined') {
      const msg = {}
      // 这里的username对应前端的username，方便显示在对应位置
      msg.username = '此邮箱已经被注册,请登录'
      ctx.body = {
        code: 500,
        msg
      }
      return
    }
    try {
      // 这里时随机生成的验证码，需要字符串化才能存到redis
      const uid = (Math.floor(Math.random() * (9999 - 1000 + 1) + 1000)).toString()
      const result = await send({
        type: 'emailCode',
        code: uid, // 验证码
        expire: moment().add(5, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        email: body.username
      }, true)
      // 保存验证码5分钟，k是用户名，uid是验证码
      setValue(body.username, uid, 5 * 60)
      ctx.body = {
        code: 200,
        data: result,
        msg: '邮件发送成功'
      }
    } catch (e) {
      console.log(e)
    }
  }

  // 注册
  async reg (ctx) {
    // 这里msg是返回前端显示的格式
    const msg = {}
    // 接受用户数据
    const { body } = ctx.request
    const sid = body.sid // 图片验证码K值
    const code = body.code // 图片验证码
    // const emailCode = body.emailCode // 邮件验证码
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code)
    // 验证邮箱验证码的时效性、正确性
    // const result1 = await cheackCode(body.username, emailCode)
    // 判断注册用户是否被注册
    let check = true
    if (result) {
      // 查询邮箱username是否注册
      const user1 = await User.findOne({ username: body.username })
      if (user1 !== null && typeof user1.username !== 'undefined') {
        // 这里的username对应前端的username，方便显示在对应位置
        msg.username = '此邮箱已经被注册,请登录'
        check = false
      }
      // 查询昵称name是否注册
      const user2 = await User.findOne({ name: body.name })
      if (user2 !== null && typeof user2.name !== 'undefined') {
        msg.name = '此昵称已经被使用，请修改'
        check = false
      }
      if (check) {
        // 给密码加密，bcrypt
        body.password = await bcrypt.hash(body.password, 10)
        const user = new User({
          username: body.username,
          name: body.name,
          password: body.password
        })
        // 写库
        const result = await user.save()
        ctx.body = {
          code: 200,
          data: result,
          msg: '注册成功'
        }
        // 注册成功之后应该把邮箱验证码删除掉，不让一直用
        // await deleteValue(body.username)
        return
      }
    } else {
      msg.code = '图片验证码错误，请检查'
    }
    ctx.body = {
      code: 401,
      msg
    }
  }

  // 登录
  async login (ctx) {
    // 接受用户数据
    const { body } = ctx.request
    const sid = body.sid // 图片验证码K值
    const code = body.code // 图片验证码
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code)
    // 验证码通过
    if (result) {
      const user = await User.findOne({ username: body.username })
      // console.log('🚀 ~ LoginController ~ login ~ user:', user)
      // 查询没有该账号
      if (!user) {
        ctx.body = {
          code: 404,
          msg: '用户名或者密码错误'
        }
        return
      }

      // 验证账户名或者密码是否正确
      let chekuserPasword = ''
      // 解密比对
      if (await bcrypt.compare(body.password, user.password)) {
        chekuserPasword = true
      }
      // 验证用户密码
      if (chekuserPasword) {
        // 剔除敏感数据,这需要注意顺序，user为空不能toJSON
        const userobj = user.toJSON()
        const arr = ['password', 'username']
        arr.map((item) => {
          return delete userobj[item]
        })

        // 生成Tonken,有效期1d=>1天
        const token = jsonwebtoken.sign(
          { _id: userobj._id },
          config.JWT_SECRET,
          {
            expiresIn: '1d'
          }
        )
        // 加入isSign用户是否签到属性
        const signRecord = await SignModel.findByUid(userobj._id)// 查询有没有签到记录
        if (signRecord !== null) {
          if (moment(signRecord.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
            userobj.isSign = true
          } else {
            // 有签到记录但是今天没有签到
            userobj.isSign = false
          }
          // 返回签到的时间
          userobj.lastSign = signRecord.created
          console.log(userobj.lastSign)
        } else {
          // 没有签到记录
          userobj.isSign = false
        }
        ctx.body = {
          code: 200,
          token,
          data: userobj,
          msg: '登录成功'
        }
      } else {
        // 用户名密码错误
        ctx.body = {
          code: 404,
          msg: '用户名或者密码错误'
        }
      }
    } else {
      // 验证码不通过
      ctx.body = {
        code: 401,
        msg: '图片验证码错误，请检查'
      }
    }
  }

  // 密码重置
  async reset (ctx) {
    const { body } = ctx.request
    // console.log('🚀 ~ LoginController ~ reset ~ body:', body)
    const sid = body.sid
    const code = body.code
    const msg = {}
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code)
    // 验证图片验证码
    if (!result) {
      msg.code = ['图片验证码错误，请检查']
      ctx.body = {
        code: 401,
        msg
      }
      return
    }
    // 验证参数
    if (!body.key) {
      ctx.body = {
        code: 500,
        msg: '请求参数异常，请重新获取链接'
      }
      return
    }

    const token = await getValue(body.key)
    if (token) {
      body.password = await bcrypt.hash(body.password, 5)// 给密码加密
      const obj = await getJWTPayload('Bearer ' + token)
      console.log('obj._id', obj._id)
      // 更新密码
      await User.updateOne(
        // ctx._id 是因为koa中间件
        { _id: obj._id },
        {
          password: body.password
        }
      )
      ctx.body = {
        code: 200,
        msg: '更新用户密码成功'
      }
    } else {
      ctx.body = {
        code: 500,
        msg: '链接已经失效'
      }
    }
  }
}
export default new LoginController()
