import combineRoutes from 'koa-combine-routers'
import publicRouter from './modules/publicRouter.js'
import loginRouter from './modules/loginRouter.js'
import userRouter from './modules/userRouter.js'
// 合并路由
export default combineRoutes(publicRouter, loginRouter, userRouter)
