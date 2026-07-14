import send from '../config/MailConfig';
import { getValue } from '../config/RedisConfig';
import User from '../model/User';
import moment from 'moment';
import { cheackCode } from '../common/utils';
class loginController {
  constructor() {}
  //忘记密码
  async forget(ctx) {
    const { body } = ctx.request;
    const sid = body.sid;
    const code = body.code;
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code);
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
    const sid = body.sid; // 图片验证码K值
    const code = body.code; // 图片验证码
    //此处省略很多判断逻辑,测试数据库注册逻辑
    const user = new User({
      username: body.username,
      name: body.name,
      password: body.password,
    });
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code);
    if (result) {
      //写库
      const result = await user.save();
      ctx.body = {
        code: 200,
        data: result,
        msg: '注册成功',
      };
    } else {
      ctx.body = {
        code: 401,
        msg: '图片验证码错误，请检查',
      };
    }
  }
  //登录
  async login(ctx) {
    // 接受用户数据
    const { body } = ctx.request;
    const sid = body.sid; // 图片验证码K值
    const code = body.code; // 图片验证码
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code);
    if (result) {
      //查询数据库
      const user = await User.findOne({ username: body.username });
      if (!user) {
        ctx.body = {
          code: 404,
          msg: '请检查账号！',
        };
        return;
      }
      if (user.password === body.password) {
        ctx.body = {
          code: 200,
          msg: '登录成功',
        };
      } else {
        ctx.body = {
          code: 404,
          msg: '用户名或者密码错误',
        };
      }
    } else {
      ctx.body = {
        code: 401,
        msg: '图片验证码错误，请检查',
      };
    }
  }
}
export default new loginController();
