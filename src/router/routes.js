import combineRoutes from 'koa-combine-routers';
import publicRouter from './modules/publicRouter.js';

// 合并路由
export default combineRoutes(publicRouter);
