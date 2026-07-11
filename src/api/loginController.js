import send from '../config/MailConfig';
import moment from 'moment';
class loginController {
  constructor() {}
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
}
export default new loginController();
