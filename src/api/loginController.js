import send from '../config/MailConfig';
import User from '../model/User';
import moment from 'moment';
class loginController {
  constructor() {}
  //忘记密码
  async forget(ctx) {
    const { body } = ctx.request;
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
