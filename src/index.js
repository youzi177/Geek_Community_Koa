import Koa from 'koa';
import router from './router/routes';
import { koaBody } from 'koa-body';
import cors from '@koa/cors';
import json from 'koa-json';
import helmet from 'koa-helmet';
import statics from 'koa-static';
import path from 'path';
import compose from 'koa-compose';
import compress from 'koa-compress';
import JWT from 'koa-jwt';
import config from './config/index';
import ErrorHandle from './common/ErrorHandle';
const app = new Koa();

//process.env.NODE_ENV 不等于 'production'那就是true，就是开发模式，否则生产模式
const isDevMode = process.env.NODE_ENV !== 'production';
// 开发模式为3000端口，生产模式为12006
const port = !isDevMode ? '12006' : '3000';
console.log(config.JWT_SECRET);

//定义公开的路径
const jwt = JWT({ secret: config.JWT_SECRET }).unless({
  path: [/^\/public/, /^\/login/],
});
// 中间件
// compose集合中间件
const middleware = compose([
  koaBody(),
  cors(),
  json(),
  helmet(),
  ErrorHandle,
  jwt,
  statics(path.join(__dirname, '../public')),
]);
app.use(middleware);
app.use(router());
// 生产模式压缩中间件
if (!isDevMode) {
  app.use(compress());
}
// 监听3000端口
app.listen(port, () => {
  console.log(`The server is runing at: ${port}`);
});
