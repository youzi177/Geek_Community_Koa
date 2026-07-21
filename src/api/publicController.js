import svgCaptcha from 'svg-captcha'
import { setValue } from '../config/RedisConfig'
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
}
export default new PublicController()
