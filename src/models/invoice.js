const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true
    },
    assignmentNumber: String,
    recipient: {
      authority: {
        type: String,
        required: true,
        trim: true
      },
      refPerson: {
        type: String,
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
        date: {
          type: String,
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
        },
        hasVAT: Boolean,
        VAT: {
          type: Number,
          required: true,
          trim: true
        }
      }
    ],
    totalBeforeVAT: Number,
    totalAfterVAT: Number,
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Invoice", invoiceSchema);
