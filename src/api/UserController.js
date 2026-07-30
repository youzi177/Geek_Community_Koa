import SignModel from '../model/Sign'
import { getJWTpPayload } from '../common/utils'
import UserModel from '../model/User'
import moment from 'moment'
class UserController {
  // 用户签到
  async userSign (ctx) {
    let newRecord = {}// 保存用户的签到记录
    let result = {}
    // 1：取用户ID
    const obj = await getJWTpPayload(ctx.header.authorization)
    // 2：查询用户上一次的签到记录
    const record = await SignModel.findById(obj._id)
    const user = await UserModel.findByID(obj._id)
    // 3:判断签到逻辑
    if (record !== null) {
      // 有历史签到记录
      // 判断用户上次签到的时间是否与今天相同
      // 如果当前时间的日期与用户上一次签到的日期相同，说明用户已经签到
      const count = user.count// 用户签到的天数
      let fav = 0
      if (moment(record.created).format('YYYY-MM-DD') === moment().format('YYYY-MM-DD')) {
        ctx.body = {
          code: 500,
          favs: user.favs,
          count: user.count,
          msg: '用户已经签到'
        }
      } else {
        // 有上一次的签到记录，并且不与今天相同，进行连续签到的判断

        // 判断签到时间,用户上一次签到的时间是当前时间的前一天，说明在连续签到
        if (moment(record.lastSign).format('YYYY-MM-DD') === moment().subtract(1, 'days').format('YYYY-MM-DD')) {
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
          result = {
            favs: user.favs + fav,
            count: user.count + 1
          }
        } else {
          // 用户中断了连续签到
          fav = 5
          await UserModel.updateOne(
            { _id: obj._id },
            {
              $set: { count: 1 }, // 修改设置成1
              $int: { favs: fav }// 增加
            }
          )
          // 更新用户的签到记录
          newRecord = new SignModel({
            uid: obj._id,
            favs: fav,
            lastSign: record.created
          })
          await newRecord.save()
          result = {
            favs: user.favs + fav,
            count: 1
          }
        }
      }
    } else {
      // 也就是注册之后第一次签到
      // 无签到数据,那就写入数据，count签到修改为1天，favs增加5
      await UserModel.updateOne({
        _id: obj._id
      }, {
        $set: { count: 1 }, // 修改设置成1
        $int: { favs: 5 }// 增加
      })
      // 保存用户的签到记录
      newRecord = new SignModel({
        uid: obj._id,
        favs: 5,
        lastSign: moment().format('YYYY-MM-DD HH:mm:ss')
      })
      await newRecord.save()
      result = {
        favs: 5,
        count: 1
      }
    }
    ctx.body = {
      code: 200,
      msg: '请求成功',
      ...result
    }
  }
}
export default new UserController()
