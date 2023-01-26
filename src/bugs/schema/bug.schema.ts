import * as mongoose from 'mongoose';

export const CommentSchema = new mongoose.Schema({
  text: {type: String, trim: true},
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  createdAt: {type: Date},
})

export const BugSchema = new mongoose.Schema({
  sNo: Number,
  title: {
    type: String, 
    required: true,
    index: {
      text: true
    }
  },
  description:{
    type: String,
    index: {text: true}
  },
  attachments: [String],
  driveUrls: [String],
  priority: {type: String, enum: ["High", "Medium", "Low"], default: "Medium"},
  status: {type: String, enum: ["Open", "InProgress", "InReview", "Done", "BugPersists"], default: "Open"},
  comments: [{ type: CommentSchema, default: undefined}],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  completedOn: Date,
  project: {type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  task: {type: mongoose.Schema.Types.ObjectId, ref: 'Task'},
  platform: String,
  section: String,
  reOpenCount: {type: Number, default: 0},
  failedReviewCount: {type: Number, default: 0},
},{
  timestamps: true,
})

// import {ActivitySchema} from '../../activities/schema/activity.schema';

// const Act = mongoose.model('Activity', ActivitySchema);

// const fun = async function(){
//   const y = new Act({type: "Something", field: "Bug"});
//   console.log(await y.save());
// }

// BugSchema.pre('save', async function(this) {
//   // console.log("here");
//   // const x = this.modifiedPaths({includeChildren: true});
//   // console.log(x);
//   // console.log(this.getChanges());
//   // console.log(this.get(x[0]));  // giving "split" undefined error
//   // console.log(this);
//   const x = this;
//   // fun();
//   // const y = new Act({type: "Something", field: "Bug"});
//   // console.log(await y.save());

//   // console.log("here => ", await x.collection.findOne({}));
// })
// // BugSchema.pre('init', function() {
// //   this._original = this.toObject();
// //   console.log('preInit =>', this);
// // })

// // BugSchema.post('init', function(doc) {
// //   doc._original = this.toObject();
// //   doc.changes = this.getChanges();
// //   doc.modifiedPaths = this.modifiedPaths({includeChildren: true});
// //   // doc.changes = 
// //   // fun();
// //   // console.log('postInit =>', this);

// // })


// BugSchema.post('save', function(){
//   // fun();
// })

// BugSchema.virtual('activity', function(){
//   console.log("World");
//   fun()
// })
