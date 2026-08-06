import nodemailer from 'nodemailer'
import 'dotenv/config'
import config from './index'
import qs from 'qs'
async function send (sendInfo) {
  // 邮箱服务基本配置
  const transporter = nodemailer.createTransport({
    host: 'smtp.126.com',
    port: 465, // 一般是465 SSL
    secure: true, // 465端口需要修改为true  use STARTTLS (upgrade connection to TLS after connecting)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })
  // 邮件标题
  let subject = ''
  let text = ''
  let content = ''
  let buttonText = ''
  let showButton = false
  const baseUrl = config.baseUrl
  let router = ''
  if (sendInfo.user !== '' && sendInfo.type === 'emailCode') {
    // 注册验证码
    subject = `您好${sendInfo.user}《Fluff轻羽技术社区》验证码`
    text = `您在Fluff轻羽技术社区的验证码是${sendInfo.code},验证码过期时间:${sendInfo.expire}`
    content = `
    <div>您好，${sendInfo.user}开发者，您的验证码是：</div>
    <div style="font-size:30px;color:#009e94;margin:20px 0;">
      ${sendInfo.code}
    </div>
    <div>验证码过期时间：${sendInfo.expire}</div>
  `
    router = ''
  } else if (sendInfo.type === 'email') {
    // 修改新邮箱确认链接
    subject = '《Fluff轻羽技术社区》确认修改账号邮箱链接'
    text = `您在Fluff轻羽技术社区的修改了账号邮箱,重置链接过期时间:${sendInfo.expire}`
    content = `
    <div>您好，${sendInfo.user}开发者，请点击下面按钮确认修改邮箱：</div>
  `
    buttonText = '确认修改邮箱'
    showButton = true
    router = 'confirm'
  } else {
    // 修改密码链接
    subject = '《Fluff轻羽技术社区》重置密码链接'
    text = `您在Fluff轻羽技术社区的修改了账号密码,重置链接过期时间:${sendInfo.expire}`
    content = `
    <div>
      您好，${sendInfo.user}开发者，重置链接有效时间30分钟，
      请在${sendInfo.expire}之前重置您的密码：
    </div>
  `
    buttonText = '立即重置密码'
    showButton = true
    router = 'reset'
  }
  const url = `${baseUrl}/${router}?` + qs.stringify(sendInfo.data)

  // 发送邮件
  const info = await transporter.sendMail({
    from: `"Fluff轻羽技术社区" ${process.env.SMTP_USER}`, // sender address
    to: sendInfo.email, // list of recipients
    subject, // 邮件标题
    text, // plain text body
    html: `  <div
    style="border: 1px solid #dcdcdc;color: #676767;width: 600px; margin: 0 auto; padding-bottom: 50px;position: relative;">
    <div
      style="height: 60px; background: #393d49; line-height: 60px; color: #58a36f; font-size: 18px;padding-left: 10px;">
     Fluff轻羽技术社区——欢迎来到官方社区</div>
    <div style="padding: 25px">
     ${content}
      ${
      showButton
        ? `
        <a href="${url}"
        style="padding:10px 20px;color:#fff;background:#009e94;display:inline-block;margin:15px 0;">
          ${buttonText}
        </a>
        `
        : ''
    }
      <div style="padding: 5px; background: #f2f2f2;">如果该邮件不是由你本人操作，请勿进行激活！否则你的邮箱将会被他人绑定。</div>
    </div>
    <div
      style="background: #fafafa; color: #b4b4b4;text-align: center; line-height: 45px; height: 45px; position: absolute; left: 0; bottom: 0;width: 100%;">
      系统邮件，请勿直接回复</div>
  </div>` // HTML body
  })

  return ('MessageId:', info.messageId)
}
// 执行函数，捕获异常
export default send
