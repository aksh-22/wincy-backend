import * as mongoose from 'mongoose';
import { permissionArray } from 'src/auth/permission.enum';

export const User_TypeSchema = new mongoose.Schema({
  organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation' },
  userType: {
    type: String,
    enum: ['Admin', 'Member++', 'Member+', 'Member', 'Client'],
  },
  designation: String,
});

export const Permission_TypeSchema = new mongoose.Schema(
  {
    organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation' },
    permission: [
      {
        type: String,
        enum: permissionArray,
      },
    ],
    designation: String,
  },
  { strict: false },
);

// export const permissionSchema = new mongoose.Schema({
//   type:String
// })

export const UserProjectSchema = new mongoose.Schema({
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  organisation: { type: mongoose.Schema.Types.ObjectId, ref: 'Organisation' },
});

export const UserBankAccountSchema = new mongoose.Schema({
  ifsc: { type: String },
  accountNumber: { type: String },
  bankName: { type: String, default: '' },
  branchName: { type: String, default: '' },
});

export const AddressSchema = new mongoose.Schema({
  address: { type: String },
  state: { type: String },
  city: { type: String },
  country: { type: String },
  pinCode: { type: String },
  houseNumber: { type: String },
});

export const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    dateOfBirth: {
      type: Number,
    },
    phoneNumber: String,
    profilePicture: String,
    password: {
      type: String,
      required: true,
      select: false,
    },
    sessions: { type: [String], select: false },
    passwordUpdatedAt: { type: Date },
    projects: [{ type: UserProjectSchema, default: undefined }],
    userType: [{ type: User_TypeSchema, default: undefined }],
    permission: { type: Object },
    verified: { typr: Boolean, deafult: false },
    accountDetails: { type: UserBankAccountSchema, default: undefined },
    oneSignalPlayerId: { type: String },
    officialEmail: {
      type: String,
      unique: true,
    },
    personalEmail: {
      type: String,
      unique: true,
    },
    residentialAddress: [
      {
        type: AddressSchema,
        default: {},
      },
    ],
    permanentAddress: [
      {
        type: AddressSchema,
        default: {},
      },
    ],
    pan: {
      type: String,
      default: '',
    },
    aadhaar: {
      type: String,
      default: '',
    },
    joiningDate: {
      type: Number,
      default: '',
    },
    terminationDate: {
      type: Number,
      default: '',
    },

    employeeCode: {
      type: String,
    },
    bondStartDate: {
      type: Number,
    },
    bondEndDate: {
      type: Number,
    },
    isDeleted: { type: Boolean, default: false },

    salaryDetail: { type: Object },
  },
  {
    timestamps: true,
    autoIndex: true,
  },
);
