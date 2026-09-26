const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['customer', 'owner'], default: 'customer' },
    addresses: [{
      id: { type: String, required: true },
      label: { type: String, trim: true, maxlength: 40 },
      recipient: { type: String, required: true, trim: true, maxlength: 80 },
      line1: { type: String, required: true, trim: true, maxlength: 120 },
      city: { type: String, required: true, trim: true, maxlength: 80 },
      postalCode: { type: String, required: true, trim: true, maxlength: 20 },
      country: { type: String, required: true, trim: true, maxlength: 60 },
    }],
  },
  { timestamps: true },
)

module.exports = mongoose.model('User', userSchema)
