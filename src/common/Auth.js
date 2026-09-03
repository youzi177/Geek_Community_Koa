import { getJWTPayload } from './utils'
export default async (ctx, next) => {
  // console.log(ctx.state.user)
  const auth = ctx.header.authorization
  if (auth) { // headers 有可能会是 undefine、null、空字符串
    let obj
    try {
      obj = await getJWTPayload(auth)
    } catch (error) {
      error.status = 401
      ctx.throw(error)
    }
    if (obj._id) {
      ctx._id = obj._id
    }
  }
  await next()
}
