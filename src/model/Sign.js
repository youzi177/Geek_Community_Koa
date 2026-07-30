import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema
const SignSchema = new Schema({
  uid: { type: String, ref: 'users' },
  created: { type: Date },
  favs: { type: Number },
  lastSign: { type: Date }
})

SignSchema.pre('save', function () {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
})
//
SignSchema.static = {
  findbyuid: function (uid) {
    return this.findOne({ uid }).sort({ created: -1 })
  }
}
const SignModel = mongoose.model('Sign', SignSchema)

export default SignModel
