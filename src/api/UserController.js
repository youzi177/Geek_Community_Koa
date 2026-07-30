import SignModel from '../model/Sign'
import { getJWTPayload } from '../common/utils'
import UserModel from '../model/User'
import moment from 'moment'
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
      ...result
    }
  }
}
export default new UserController()
