import svgCaptcha from 'svg-captcha';
class publicController {
  async getCaptcha(ctx) {
    const svg = svgCaptcha.create();
    ctx.body = {
      code: 200,
      msg: svg.data,
    };
  }
}
export default new publicController();
