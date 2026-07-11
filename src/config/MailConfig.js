import nodemailer from 'nodemailer';
async function send(sendInfo) {
  // 邮箱服务基本配置
  const transporter = nodemailer.createTransport({
    host: 'smtp.126.com',
    port: 465, //一般是465 SSL
    secure: true, //465端口需要修改为true  use STARTTLS (upgrade connection to TLS after connecting)
    auth: {
      user: 'XXXX126.com',
      pass: 'XXX',
    },
  });
  // const sendInfo = {
  //   code: '1234',
  //   expire: '2026-07-11',
  //   email: '1770813141@qq.com',
  //   user: 'Geek极客',
  // };
  // 邮件标题(测试的，后续会用真实数据)
  let subject = '';
  if (sendInfo.user !== '') {
    subject = `您好${sendInfo.user}《Geek极客社区》验证码`;
  } else {
    subject = '《Geek极客社区》验证码';
  }
  //邮件的连接：(测试的，后续会用真实数据)
  const url = 'https://github.com/youzi177';
  //发送邮件
  const info = await transporter.sendMail({
    from: '"Geek极客社区" <XXXX126.com>', // sender address
    to: sendInfo.email, // list of recipients
    subject: subject, // 邮件标题
    text: `您在Geek极客社区的验证码是${sendInfo.code},验证码过期时间:${sendInfo.expire}`, // plain text body
    html: `  <div
    style="border: 1px solid #dcdcdc;color: #676767;width: 600px; margin: 0 auto; padding-bottom: 50px;position: relative;">
    <div
      style="height: 60px; background: #393d49; line-height: 60px; color: #58a36f; font-size: 18px;padding-left: 10px;">
      Geek极客社区——欢迎来到官方社区</div>
    <div style="padding: 25px">
      <div>您好，${sendInfo.user}开发者，重置链接有效时间30分钟，请在${sendInfo.expire}之前重置您的密码：</div>
      <a href="${url}"
        style="padding: 10px 20px; color: #fff; background: #009e94; display: inline-block;margin: 15px 0;">立即重置密码</a>
      <div style="padding: 5px; background: #f2f2f2;">如果该邮件不是由你本人操作，请勿进行激活！否则你的邮箱将会被他人绑定。</div>
    </div>
    <div
      style="background: #fafafa; color: #b4b4b4;text-align: center; line-height: 45px; height: 45px; position: absolute; left: 0; bottom: 0;width: 100%;">
      系统邮件，请勿直接回复</div>
  </div>`, // HTML body
  });

  return ('MessageId:', info.messageId);
}
//执行函数，捕获异常
export default send;
