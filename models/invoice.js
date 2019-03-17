const mongoose = require('mongoose')

const Schema = mongoose.Schema

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: Number,
      required: true,
    },
    assignmentNumber: Number,
    recipient: {
      authority: {
        type: String,
        required: true,
        trim: true
      },
      refPerson: {
        type: String,
        required: true,
        trim: true
      },
      street: {
        type: String,
        required: true,
        trim: true
      },
      zip: {
        type: String,
        required: true,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      }
    },
    rows: [
      {
        description: {
          type: String,
          required: true,
          trim: true
        },
        quantity: {
          type: Number,
          required: true,
          trim: true
        },
        unit: {
          type: String,
          required: true,
          trim: true
        },
        price: {
          type: Number,
          required: true,
          trim: true
        },
        amount: {
          type: Number,
          required: true,
          trim: true
        }
      }
    ],
    totalBeforeVAT: Number,
    VAT: Number,
    totalAfterVAT: Number,
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('Invoice', invoiceSchema)
