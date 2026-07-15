import send from '../config/MailConfig';
import { getValue } from '../config/RedisConfig';
import User from '../model/User';
import moment from 'moment';
import { cheackCode } from '../common/utils';
import jsonwebtoken from 'jsonwebtoken';
import config from '../config';
import bcrypt from 'bcryptjs';
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
    // 这里msg是返回前端显示的格式
    const msg = {};
    // 接受用户数据
    const { body } = ctx.request;
    const sid = body.sid; // 图片验证码K值
    const code = body.code; // 图片验证码
    // 验证图片验证码的时效性、正确性
    const result = await cheackCode(sid, code);
    // 判断注册用户是否被注册
    let check = true;
    if (result) {
      //查询邮箱username是否注册
      const user1 = await User.findOne({ username: body.username });
      if (user1 !== null && typeof user1.username !== 'undefined') {
        // 这里的username对应前端的username，方便显示在对应位置
        msg.username = '此邮箱已经被注册,请登录';
        check = false;
      }
      //查询昵称name是否注册
      const user2 = await User.findOne({ name: body.name });
      if (user2 !== null && typeof user2.name !== 'undefined') {
        msg.name = '此昵称已经被使用，请修改';
        check = false;
      }
      if (check) {
        // 给密码加密，bcrypt
        body.password = await bcrypt.hash(body.password, 10);
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
        return;
      }
    } else {
      msg.code = '图片验证码错误，请检查';
    }
    ctx.body = {
      code: 500,
      msg: msg,
    };
  }
  //登录
  async login(ctx) {
    // 接受用户数据
    const { body } = ctx.request;
    const sid = body.sid; // 图片验证码K值
    const code = body.code; // 图片验证码
    // 验证图片验证码的时效性、正确性
    let result = await cheackCode(sid, code);
    //验证码通过
    if (result) {
      const user = await User.findOne({ username: body.username });

      //查询没有该账号
      if (!user) {
        ctx.body = {
          code: 404,
          msg: '请检查账号！',
        };
        return;
      }
      //验证账户名或者密码是否正确
      let chekuserPasword = '';
      // 解密比对
      if (await bcrypt.compare(body.password, user.password)) {
        chekuserPasword = true;
      }
      //验证用户密码
      if (chekuserPasword) {
        // 生成Tonken,有效期1d=>1天
        const token = jsonwebtoken.sign(
          { _id: '_xiaofeng' },
          config.JWT_SECRET,
          {
            expiresIn: '1d',
          },
        );
        ctx.body = {
          code: 200,
          token: token,
          msg: '登录成功',
        };
      } else {
        //用户名密码错误
        ctx.body = {
          code: 404,
          msg: '用户名或者密码错误',
        };
      }
    } else {
      //验证码不通过
      ctx.body = {
        code: 401,
        msg: '图片验证码错误，请检查',
      };
    }
  }
}
export default new loginController();
