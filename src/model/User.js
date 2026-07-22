import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema
const UserSchema = new Schema({
  username: { type: String, index: { unique: true }, sparse: true },
  password: { type: String },
  name: { type: String },
  created: { type: Date },
  updated: { type: Date },
  favs: { type: Number, default: 100 },
  gender: { type: String, default: '' },
  roles: { type: Array, default: ['user'] },
  pic: { type: String, default: '/img/header.jpg' },
  mobile: { type: String, match: /^1[3-9](\d{9})$/, default: '' },
  status: { type: String, default: '0' },
  regmark: { type: String, default: '' },
  location: { type: String, default: '' },
  isVip: { type: String, default: '0' },
  count: { type: Number, default: 0 },
})
// 保存的时候创建时间
UserSchema.pre('save', function () {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
})
// 更新的时候
UserSchema.pre('update', function () {
  this.updated = moment().format('YYYY-MM-DD HH:mm:ss')
})
// 重复注册一个邮箱，在数据库层面阻止重复注册
// UserSchema.post('save', function (error, doc, next) {
//   if (error.name === 'MonError' && error.code === 11000) {
//     next(new Error('Error:Monngoose has a duplicate key'))
//   } else {
//     next(error)
//   }
// })

UserSchema.post('save', function (error, doc, next) {
  if (error.code === 11000) {
    error.status = 400
    error.message = '用户名已存在'
  }
  next(error)
})
UserSchema.statics = {
  // 通过用户ID查询用户信息
  findByID: function (id) {
    return this.findOne({ _id: id }, {
      // 不需要显示
      password: 0,
      username: 0,
      mobile: 0
    })
  },
}
const UserModel = mongoose.model('users', UserSchema)

export default UserModel
