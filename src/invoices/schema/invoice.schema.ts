import * as mongoose from 'mongoose';

export const ServiceSchema = new mongoose.Schema({
  // description: String, //ENCRYPTED
  // quantity: String, //ENCRYPTED
  // rate: String, //ENCRYPTED
  amount: String, //ENCRYPTED
  paymentPhaseId: {
    type: mongoose.Types.ObjectId,
    ref: 'PaymentPhase',
  },
});

export const TaxSchema = new mongoose.Schema({
  taxName: String, //Encrypted
  taxedAmount: String, //Encrypted
});

export const DiscountSchema = new mongoose.Schema({
  discountName: String, //Encrypted
  discountedAmount: String, //Encrypted
});

export const InvoiceSchema = new mongoose.Schema(
  {
    sNo: { type: String, required: true },
    serialSequence: { type: Number },
    customer: { type: mongoose.Types.ObjectId, ref: 'Customer' },
    account: { type: mongoose.Types.ObjectId, ref: 'Account' },
    subsiduary: { type: mongoose.Types.ObjectId, ref: 'Subsiduary' },
    // field removed
    paymentPhase: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'PaymentPhase',
        unique: false,
      },
    ],
    // paymentPhaseIds: [
    //   {
    //     type: mongoose.Types.ObjectId,
    //     ref: 'PaymentPhase',
    //     unique: false,
    //   },
    // ],
    project: { type: mongoose.Types.ObjectId, ref: 'Project' },
    organisation: { type: mongoose.Types.ObjectId, ref: 'Organisation' },
    status: {
      type: String,
      enum: ['Unpaid', 'Partially Paid', 'Paid'],
      default: 'Unpaid',
    },
    paidAmount: { type: String }, //encrypted
    basicAmount: { type: String }, //encrypted
    finalAmount: { type: String }, //encrypted
    currency: { type: String }, //encrypted
    billTo: { type: String }, //encrypted
    taxes: [{ type: TaxSchema, default: undefined }],
    totalTaxes: String, //Encrypted
    discount: { type: DiscountSchema, default: undefined },
    raisedOn: { type: Date, required: true },
    // settledOn: {type: Date},
    dueDate: { type: Date },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    lastUpdatedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
    services: [{ type: ServiceSchema, default: undefined }],
    noteForClient: { type: String, trim: true },
    paymentTerms: { type: String, trim: true },
  },
  {
    timestamps: true,
  },
);
