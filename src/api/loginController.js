import send from '../config/MailConfig';
import { getValue } from '../config/RedisConfig';
import User from '../model/User';
import moment from 'moment';
class loginController {
  constructor() {}
  //忘记密码
  async forget(ctx) {
    const { body } = ctx.request;
    const sid = body.sid;
    const code = body.code;

    // 校验图片验证码
    const cheackCode = async (key, value) => {
      const redisData = await getValue(key);
      if (redisData != null) {
        if (redisData.toLowerCase() === value.toLowerCase()) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    };
    const result = await cheackCode(sid, code);
    // console.log(sid, code);

    if (result) {
      try {
        //这里的body.username应该查询数据库然后再发送邮件
        const result = await send({
          code: '1234',
          expire: moment().add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss'),
          email: body.username,
          user: 'Geek极客',
        });
        ctx.body = {
          code: 200,
          data: result,
          msg: '邮件发送成功',
        };
      } catch (error) {
        console.log(error);
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '图片验证码错误，请检查',
      };
    }
  }
  //注册
  async reg(ctx) {
    // 接受用户数据
    const { body } = ctx.request;

    //此处省略很多判断逻辑,测试数据库注册逻辑
    const user = new User({
      username: body.username,
      name: body.name,
      password: body.password,
    });
    //写库
    const result = await user.save();
    ctx.body = {
      code: 200,
      data: result,
      msg: '注册成功',
    };
  }
}
export default new loginController();
