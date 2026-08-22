import svgCaptcha from 'svg-captcha'
import { setValue } from '../config/RedisConfig'
import User from '../model/User'
import SignRecord from '../model/Sign'
class PublicController {
  async getCaptcha (ctx) {
    const svg = svgCaptcha.create()
    const body = ctx.request.query
    // 保存验证码10分钟
    setValue(body.sid, svg.text, 10 * 60)
    ctx.body = {
      code: 200,
      data: svg.data
    }
  }

  // 获取用签到排行
  async getHotSignRecord (ctx) {
    // 0-总签到榜，1-最新签到
    const params = ctx.query
    const page = params.page ? parseInt(params.page) : 0
    const limit = params.limit ? parseInt(params.limit) : 10
    const index = params.index ? params.index : '0'
    let result
    let total = 0
    if (index === '0') {
      // 总签到榜
      result = await User.getTotalSign(page, limit)
      total = await User.getTotalSignCount()
    } else if (index === '1') {
      // 今日签到
      result = await SignRecord.getTopSign(page, limit)
      total = await SignRecord.getTopSignCount()
    } else if (index === '2') {
      // 最新签到
      result = await SignRecord.getLatestSign(page, limit)
      total = await SignRecord.getSignCount()
    }
    ctx.body = {
      code: 200,
      data: result,
      total,
      msg: '获取签到排行成功'
    }
  }
}
export default new PublicController()
