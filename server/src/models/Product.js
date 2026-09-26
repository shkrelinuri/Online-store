const mongoose = require('mongoose')

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 1000 },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true, trim: true },
    colors: [{ type: String, trim: true }],
    sizes: [{ type: String, trim: true }],
    stock: { type: Number, required: true, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
)

module.exports = mongoose.model('Product', productSchema)
