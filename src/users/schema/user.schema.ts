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
});

export const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    profilePicture: String,
    dateOfBirth: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    phoneNumber: String,
    sessions: { type: [String], select: false },
    passwordUpdatedAt: { type: Date },
    projects: [{ type: UserProjectSchema, default: undefined }],
    userType: [{ type: User_TypeSchema, default: undefined }],
    permission: { type: Object },
    verified: { typr: Boolean, deafult: false },
    accountDetails: { type: UserBankAccountSchema, default: undefined },
    oneSignalPlayerId: { type: String },
  },
  {
    timestamps: true,
    autoIndex: true,
  },
);
