const mongoose = require('mongoose')

const Schema = mongoose.Schema

const userSchema = new Schema({
  
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  telephone: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: {
      type: String,
      required: true,
      trim: true
    },
    zip: {
      type: Number,
      reguired: true,
    },
    city: {
      type: String,
      required: true,
      trim: true
    }
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  vatNumber: {
    type: String,
    required: true,
    trim: true
  },
  bankgiro: {
    type: String,
    required: true,
    trim: true
  }
})

userSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'owner'
})

module.exports = mongoose.model('User', userSchema)
