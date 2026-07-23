import mongoose from '../config/DBHelpler'
import moment from 'moment'
const Schema = mongoose.Schema
const LinksSchema = new Schema({
  title: { type: String, default: '' },
  link: { type: String, default: '' },
  type: { type: String, default: 'link' },
  isTop: { type: String, default: '' },
  sort: { type: String, default: '' }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' } })
LinksSchema.pre('save', function () {
  this.created = moment().format('YYYY-MM-DD HH:mm:ss')
})
const LinksModel = mongoose.model('links', LinksSchema)

export default LinksModel
