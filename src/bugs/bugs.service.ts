import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Model} from 'mongoose';
import { ActivitiesService } from 'src/activities/activities.service';
import { ConfigService } from 'src/config/config.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ProjectsService } from 'src/projects/projects.service';
import { SystemService } from 'src/system/system.service';
import { TasksService } from 'src/tasks/tasks.service';
import { UtilsService } from 'src/utils/utils.service';
const activityType = "Bug";

enum StatusHierarchy{
  "Open",
  "InProgress",
  "BugPersists",
  "InReview",
  "Done"
}

@Injectable()
export class BugsService {
  constructor(
    @InjectModel('Bug') private readonly bugModel: Model<any>,
    @InjectModel('BugReport') private readonly bugReportModel: Model<any>,
    @InjectModel('Counter') private readonly counterModel: Model<any>,
    private readonly actsService: ActivitiesService,
    private readonly utilsSrvice: UtilsService,
    private readonly sysService: SystemService,
    @Inject(forwardRef(() => ProjectsService))private readonly projectsService: ProjectsService,
    private readonly notifyService: NotificationsService,
    @Inject(forwardRef(() => TasksService))private readonly tasksService: TasksService,
  ){}

  //====================================================//

  async createBug(user, dto, projectId, attachments){
    const proAttach = [];
    if (attachments?.length > 0){
      for(let i=0; i<attachments.length; i++){
        proAttach.push(await this.utilsSrvice.uploadFileS3(attachments[i], ConfigService.keys.FOLDER_BUG_ATTACHMENT));
      }
    }
    dto.attachments = [...proAttach];
    const project = await this.projectsService.getAppProject({_id: projectId}, {});
    if(!project){
      throw new HttpException("No such Project Exists", HttpStatus.BAD_REQUEST);
    }
    let isValidUser = await this.utilsSrvice.projectAssociation(project, String(user._id));
    if(["Member++","Admin"].includes(user.type)){
      isValidUser = true;
    }
    if(!isValidUser){
      throw new HttpException("You are not authorised to perform this task", HttpStatus.BAD_REQUEST);
    }
    let counter = await this.counterModel.findOne({project: projectId});
    if(dto.platform){
      if(!project.platforms?.includes(dto.platform)){
        dto.platform = undefined;
      }
    }
    if(dto.assignees){
      dto.assignees = JSON.parse(dto.assignees);
      const team = project.team?.filter(ele => String(ele));
      project.projectHead ? team.push(String(project.projectHead)) : null;
      const validAssignees = dto.assignees.filter(ele => team.includes(ele));
      dto.assignees = validAssignees;
    }
    if(dto.platform){
      if(!project.platforms?.includes(dto.platform)){
        dto.platform = undefined;
      }
      
    }
    if(dto.platform && dto.section){
      const platform = (await this.sysService.getPlatforms({platform: dto.platform}))[0];
      const sections = await this.projectsService.getSections(projectId, platform._id);
      if(!sections.data.includes(dto.section)){
        dto.section = undefined;
      }
    }

    let bug = new this.bugModel(dto);
    bug.createdBy = user._id;
    bug.project = projectId;
    if(dto.taskId) {
      // this.tasksService.updateTasksApp({_id: dto.taskId}, {$set:{status: "ReviewFailed"}}, {});
      let task = await this.tasksService.getTask({_id: dto.taskId});
      const updateStatus = await this.tasksService.updateTaskStatus(user, task, "ReviewFailed", undefined);
      task = updateStatus.task;
      task = await task.save({new: true});
      if(updateStatus && updateStatus.updateMilestone) {
        this.tasksService.updateMilestoneStatus(user._id, task.milestone);
      }
      bug.task = dto.taskId;
    }
    bug.task = dto.taskId;

    if(!counter){
      counter = new this.counterModel({project: projectId});
      counter = await counter.save();
    }
    bug.sNo = counter.sequence;
    bug = await bug.save();
    bug = await this.getBugPopulated({_id: bug._id});

    this.utilsSrvice.createBasicInfoActs(user._id, "Create", "Bug", undefined, {title: bug.title}, undefined, {_id: bug._id}, projectId);
    if(dto.assignees && dto.assignees.length > 0) {
      this.notifyService.createNotifications({
        description: `You have been assigned a new Bug in Project \"${project.title}\".`,
        module: "Bug",
        organisation: project.organisation,
        project: project._id,
        accessLevel: "Member",
        users: dto.assignees,
        meta: {
          projectName: project.title,
          bugTitle: bug.title,
          bugId: bug._id,
        }
      })
    }
    counter.sequence = counter.sequence + 1;
    await counter.save();
    return {data: {bug}, message: "Bug created successfully.", success: true};
  }

  //====================================================//

  async updateBug(user, dto, bugId){
    let bug = await this.bugModel.findOne({_id: bugId});
    const project = await this.projectsService.getAppProject({_id: bug.project}, {});

    const oldBug = JSON.parse(JSON.stringify(bug._doc));
    if(!bug){
      throw new HttpException("No such Bug Exists", HttpStatus.BAD_REQUEST);
    }

    // updates availbale for creater of bug and authoritative people

    if( !['Admin', 'Member++'].includes(user.type) && (project.projectHead) != String(user._id) && String(user._id) != String(bug.createdBy)) {
      let err = true;
      for(let i=0; i < bug.assignees.length; i++) {
        if(String(bug.assignees[i]) == String(user._id)){
          err = false
          dto = {status: dto.status, assignees : dto.assignees, comment: dto.comment};
          break;
        }
      }
      if(err) {
        throw new HttpException('You are not authorised to perform this task!', HttpStatus.BAD_REQUEST);
      }
    }

    let oldDto = {};

    for(const [key, value] of Object.entries(dto)){
      if(value !== undefined){
        oldDto[key] = bug[key];
      }
    }
    
    bug.title = dto.title ? dto.title : bug.title;
    bug.description = dto.description ? dto.description : bug.description;
    bug.priority = dto.priority ? dto.priority : bug.priority;
    if(dto.platform && dto.platform !== bug.platform){
      if(project.platforms?.includes(dto.platform)){
        bug.platform = dto.platform;
        bug.section = undefined;
      }
      else{
        dto.platform = undefined;
      }
    }
    if(dto.section && bug.platform){
      const platform = (await this.sysService.getPlatforms({platform: bug.platform}))[0];
      const sections = await this.projectsService.getSections(project._id, platform._id);
      if(sections.data.includes(dto.section)){
        bug.section = dto.section;
      }
    }
    bug.driveUrls = dto.driveUrls ? dto.driveUrls : bug.driveUrls;
    if(dto.taskId) {
      // this.tasksService.updateTasksApp({_id: dto.taskId}, {$set:{status: "ReviewFailed"}}, {})
      bug.task = dto.taskId;
      let task = await this.tasksService.getTask({_id: dto.taskId});
      const updateStatus = await this.tasksService.updateTaskStatus(user, task, "ReviewFailed", undefined);
      task = updateStatus.task;
      task = await task.save({new: true});
      if(updateStatus && updateStatus.updateMilestone) {
        this.tasksService.updateMilestoneStatus(user._id, task.milestone);
      }
    }
    if(dto.status){
      const x = StatusHierarchy[`${dto.status}`];
      const y = StatusHierarchy[`${bug.status}`];
      if(x == 3 && y == 1){
        this.actsService.createActivity([{type:"Bug", operation: "Update", field: "status", from: bug.status, to:dto.status, createdBy: user._id, createdAt: new Date(), bug: bugId, project: bug.project}]);
      }
      else if((x != y + 1) && (x !=y - 1) && (x != y - 4)){
        dto.status = undefined;
      }
      else{
        if(dto.status == "BugPersists" && bug.status == "InReview"){
          bug.failedReviewCount += 1;
        }
        else if(dto.status == "Open" && bug.status == "Done"){
          // this.tasksService.updateTasksApp({_id: bug.task}, {$set:{status: "ReviewFailed"}}, {});
          if(bug.task) {
            let task = await this.tasksService.getTask({_id: bug.task});
            const updateStatus = await this.tasksService.updateTaskStatus(user, task, "ReviewFailed", undefined);
            task = updateStatus.task;
            task = await task.save({new: true});
            if(updateStatus && updateStatus.updateMilestone) {
              this.tasksService.updateMilestoneStatus(user._id, task.milestone);
            }
          }
          bug.reOpenCount += 1;
        }
      }
      await this.actsService.createActivity([{type:"Bug", operation: "Update", field: "status", from: bug.status, to:dto.status, createdBy: user._id, createdAt: new Date(), bug: bugId, project: bug.project}]);
      bug.status = dto.status;
    }

    // updates available for assignee of the bug
    if(dto.assignees && dto.assignees.length != 0){
      const team = project.team?.filter(ele => String(ele));
      project.projectHead ? team.push(String(project.projectHead)) : null;
      const validAssignees = dto.assignees.filter(ele => team.includes(ele));
      this.utilsSrvice.createAssigneeActs(user._id, bug._id, "Bug", bug.assignees, validAssignees, project._id);
      const oldAssigneesObj = {};
      const add = [];
      bug.assignees.forEach(ele => {
        oldAssigneesObj[String(ele)] = true;
      });
  
      validAssignees.forEach(ele => {
        if(!oldAssigneesObj[String(ele)]){
          add.push(ele);
        }
      });
      if(add.length > 0){
        this.notifyService.createNotifications({
          description: `You have been assigned a new Bug in Project \"${project.title}\".`,
          module: "Bug",
          organisation: project.organisation,
          project: project._id,
          accessLevel: "Member",
          users: validAssignees,
          meta: {
            projectName: project.title,
            bugTitle: bug.title,
            bugId: bug._id,
          }
        })
      }
      bug.assignees = validAssignees;

    } else if(dto.assignees){
      throw new HttpException("Bug needs atleast one assignee!", HttpStatus.BAD_REQUEST);
    }

    if(dto.comment){
      bug.comments.unshift({
        text: dto.comment,
        createdBy: user._id,
        createdAt: new Date,
      })
    }

    bug = await bug.save({new: true});
    if(dto.status == 'Done' && bug.task) {
      const bugCount = await this.getBugsCountForTask(bug.task);
      if(!(bugCount?.data?.bugs) || bugCount?.data?.bugs["total"] - bugCount?.data?.bugs["totalDone"] == 0) {
        // this.tasksService.updateTasksApp({_id: bug.task}, {$set:{status: "WaitingForReview"}}, {});
        if(bug.task){
          let task = await this.tasksService.getTask({_id: bug.task})
          const updateStatus = await this.tasksService.updateTaskStatus(user, task, "WaitingForReview", undefined);
          task = updateStatus.task;
          task = await task.save({new: true});
          if(updateStatus && updateStatus.updateMilestone) {
            this.tasksService.updateMilestoneStatus(user._id, task.milestone);
          }
        }
      }
    }
    else if(dto.status !== "Done" && bug.status === "Done" && bug.task) {
      if(bug.task) {
        let task = await this.tasksService.getTask({_id: bug.task});
        const updateStatus = await this.tasksService.updateTaskStatus(user, task, "ReviewFailed", undefined);
        task = updateStatus.task;
        task = await task.save({new: true});
        if(updateStatus && updateStatus.updateMilestone) {
          this.tasksService.updateMilestoneStatus(user._id, task.milestone);
        }
      }
    }

    this.utilsSrvice.createBasicInfoActs(user._id, "Update", "Bug", {...dto, assignees : undefined}, undefined, oldBug, bug, project._id);
    bug = await this.getBugPopulated({_id: bug._id});

    return {data: {bug}, message: "Bug updated successfully.", success: true};
  }

  //====================================================//

  async deleteBugs(user, bugs, projectId, orgId){
    const project = await this.projectsService.getAppProject({_id: projectId}, {organisation: 1, projectHead: 1});
    if(String(project.organisation) != orgId){
      throw new HttpException("Given set of project and organisation doen't match up!", HttpStatus.BAD_REQUEST);
    }
    let filter;
    if(["Admin", "Member++"].includes(user.type) || String(user._id) == String(project.projectHead)){
      filter = {_id: bugs, project: projectId};
    }
    else {
      filter = {_id: bugs, project: projectId, createdBy: user._id};
    }

    const bugsDetailed  = await this.bugModel.find(filter).exec();

    let deleted = await this.bugModel.deleteMany(filter).exec();

    if(deleted.n == 0){
      throw new HttpException("No bugs got deleted!", HttpStatus.NOT_IMPLEMENTED);
    }

    for(let ele of bugsDetailed) {
      if(ele.task) {
        const bugCount = await this.getBugsCountForTask(ele.task);
        if(!(bugCount?.data?.bugs) || bugCount?.data?.bugs["total"] - bugCount?.data?.bugs["totalDone"] == 0) {
          // this.tasksService.updateTasksApp({_id: ele.task}, {$set:{status: "WaitingForReview"}}, {});
          let task = await this.tasksService.getTask({_id: ele.task})
          const updateStatus = await this.tasksService.updateTaskStatus(user, task, "WaitingForReview", undefined);
          task = updateStatus.task;
          task = await task.save({new: true});
          if(updateStatus && updateStatus.updateMilestone) {
            this.tasksService.updateMilestoneStatus(user._id, task.milestone);
          }
          // let task = await this.tasksService.getTask({_id: dto.taskId});
          // const updateStatus = await this.tasksService.updateTaskStatus(user, task, "ReviewFailed", undefined);
          // task = updateStatus.task;
          // task = await task.save({new: true});
          // if(updateStatus && updateStatus.updateMilestone) {
          //   this.tasksService.updateMilestoneStatus(user._id, task.milestone);
          // }
        }
      }

      this.utilsSrvice.createBasicInfoActs(user._id, "Delete", "Bug", undefined, {title: ele.title}, {_id: ele._id}, undefined, projectId);
    }
    // bugsDetailed.forEach(ele => {
     
    // })

    return {success: true, message: "Bugs got deleted successfully.", data: {}};
  }

  //====================================================//

  async createBugReport(user, dto, projectId){
    const project = await this.projectsService.getAppProject({_id: projectId}, {});
    if(!project){
      throw new HttpException("No such Project Exists", HttpStatus.BAD_REQUEST);
    }

    const dateToday = this.utilsSrvice.dateToday();
    const bugs = await this.bugModel.find({isCompleted: true, pickedBy: user._id, completedOn: dateToday}).exec();
    if(bugs.length == 0){
      new HttpException("Please, mark your bugs as completed before submitting report", HttpStatus.BAD_REQUEST);
    }
    if(dto.platform){
      if(project.platforms.includes(dto.platform)){
        dto.platform = undefined;
      }
    }

    let bugReport = new this.bugReportModel(dto);
    bugReport.createdBy = user._id;
    bugReport.date = dateToday;
    bugReport.bugs = [];
    bugs.forEach(element => {
      bugReport.bugs.push(String(element._id))
    })
    bugReport.project = projectId;
    bugReport = await bugReport.save({new: true});

    project.consumedTime = project.consumedTime + bugReport.consumedTime;
    await project.save();
    return bugReport;
  }

  //====================================================//

  async updateBugReport(user, dto, bugReportId){
    let bugReport = await this.bugReportModel.findOne({_id: bugReportId});
    const project = await this.projectsService.getAppProject({_id: bugReport.project}, {});
    if(!bugReport || String(user._id) != String(bugReport.createdBy)){
      throw new HttpException("Given Set of BugReport and User doesn't exists!", HttpStatus.BAD_REQUEST); 
    }
    project.consumedTime = project.consumedTime - bugReport.consumedTime + dto.consumedTime;
    bugReport.consumedTime = dto.consumedTime;

    bugReport = await bugReport.save({new: true});
    await project.save();

    return bugReport;
  }

  //====================================================//

  async getProjectBugs(user, projectId, orgId, platform, pageSize, pageNo){
    const project = await this.projectsService.getAppProject({_id: projectId}, {});
    if(String(project.organisation) != orgId){
      throw new HttpException("Provided project is not associated with given organisation!!", HttpStatus.BAD_REQUEST);
    }
    if(! (await this.utilsSrvice.projectAssociation(project, String(user._id))) && !(["Admin", "Member++"].includes(user.type))){
      throw new HttpException("You are not authorised to perform this task!!", HttpStatus.BAD_REQUEST);
    }

    const count = await this.bugModel.find({project: projectId, platform}).countDocuments();
    const bugs = await this.bugModel.aggregate([
      {
        $match: {"project": mongoose.Types.ObjectId(projectId), platform}
      },
      {
        $lookup : {
          from: "users",
          localField: "assignees",
          foreignField: "_id",
          as: "assignees"
        }
      },
      {
        $lookup : {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $lookup: {
          from: "tasks",
          localField: "task",
          foreignField: "_id",
          as: "task"
        }
      },
      {
        $addFields: {
          "severityValue": {"$indexOfArray": [["Major", "Minor", "Critical", "Blocker"], "$severity"]},
          "priorityValue": {"$indexOfArray": [["High", "Medium", "Low"], "$priority"]},
          "statusValue": {"$indexOfArray": [["Open", "InProgress", "InReview", "Done"], "$status"]},
        },
      },
      {
        $sort : { "statusValue": 1, "priorityValue": 1},
      },
      {
        $project: {
          "assignees.sessions":0,
          "assignees.password":0,
          "assignees.projects":0,
          "assignees.userType":0,
          "assignees.createdAt":0,
          "assignees.updatedAt":0,
          "assignees.accountDetails":0,
          "assignees.verified":0,
          "createdBy.sessions":0,
          "createdBy.password":0,
          "createdBy.projects":0,
          "createdBy.userType":0,
          "createdBy.createdAt":0,
          "createdBy.updatedAt":0,
          "createdBy.accountDetails":0,
          "createdBy.verified": 0
        }
      },
    ]);
    return {message: "", data:{bugs, count}, status: "Successful"};
  }
  //====================================================//

  async updateBugsApp(filter, update, options){
    await this.bugModel.updateMany(filter, update, options);
    return true;
  }
  //====================================================//

  async getMyBugs(user, projectId, orgId){
    const project = await this.projectsService.getAppProject({_id: projectId}, {});
    if(!project || String(project.organisation) != orgId){
      throw new HttpException("No such project exists associated with mentioned organisation!!", HttpStatus.BAD_REQUEST);
    }

    const bugs = await this.bugModel.aggregate([
      {
        $match: {$or:[{createdBy: user._id}, {assignee: user._id}], project: mongoose.Types.ObjectId(projectId)},
      },
      {
        $addFields: {
          "priorityValue": {"$indexOfArray": [["High", "Medium", "Low"], "$priority"]},
          "statusValue": {"$indexOfArray": [["Open", "InProgress", "InReview", "Done"], "$status"]},
        },
      },
      {
        $sort: {"isCompleted": 1, "statusValue":1, "priorityValue": 1, "_id": -1},
      },
      {
        $lookup: {
          from: "users",
          localField: "assignees",
          foreignField: "_id",
          as: "assignees"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $project: {
          "assignees.sessions": 0,
          "assignees.password": 0,
          "assignees.accountDetails": 0,
          "assignees.projects": 0,
          "createdBy.sessions": 0,
          "createdBy.password": 0,
          "createdBy.accountDetails": 0,
          "createdBy.projects": 0,
        }
      },
      {
        $group: {
          _id: "$platform",
          bugs:{$push: "$$ROOT"},
        }
      }
    ]);

    return {success: true, message: "", data: {bugs}};
  }
  //====================================================//

  async getSingleBug(bugId, projectId, orgId){
    const bug = await this.bugModel.findOne({_id:bugId}).exec();
    if(String(bug.project) != projectId){
      throw new HttpException("Given bug is not associated with provided project! ", HttpStatus.BAD_REQUEST);
    }
    const project = await this.projectsService.getAppProject({_id:projectId, organisation: orgId}, {});

    if(project.organisation != orgId){
      throw new HttpException("Given project is not associated with the provided organisation!", HttpStatus.BAD_REQUEST);
    }
    return {data: {bug}, message: "", success: true};
  }
  //====================================================//

  async deleteBugsApp(args){
    return await this.bugModel.deleteMany(args).exec();
  }

  //====================================================//

  async getBugPopulated(args){
    const bug = await this.bugModel.aggregate([{
      $match: args
    },
    {
      $lookup: {
        from: "users",
        localField: "assignees",
        foreignField: "_id",
        as: "assignees"
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "createdBy",
        foreignField: "_id",
        as: "createdBy"
      }
    },
    {
      $lookup: {
        from: "tasks",
        localField: "task",
        foreignField: "_id",
        as: "task"
      }
    },
    {
      $project: {
        "assignees.sessions": 0,
        "assignees.password": 0,
        "assignees.accountDetails": 0,
        "assignees.projects": 0,
        "createdBy.sessions": 0,
        "createdBy.password": 0,
        "createdBy.accountDetails": 0,
        "createdBy.projects": 0,
      }
    },
  ])
    return bug;
  }

  //====================================================//

  async addBugAttachments(user, bugId, attachments){
    let bug = await this.bugModel.findOne({_id: bugId});
    // const project = await this.projectsService.getAppProject({_id: bug.project}, {});
 
    if(!bug){
      throw new HttpException("No such Bug Exists", HttpStatus.BAD_REQUEST);
    }

    if(String(user._id) == String(bug.createdBy) || ["Admin", "Member++"].includes(user.type)){
      const proAttach = [];
      if (attachments?.length > 0){
        for(let i=0; i<attachments.length; i++){
          proAttach.push(await this.utilsSrvice.uploadFileS3(attachments[i], ConfigService.keys.FOLDER_BUG_ATTACHMENT));
        }
      }
      if(bug.attachments){bug.attachments.push(...proAttach)}
      else{bug.attachments = [...proAttach]}
      await bug.save();

      this.actsService.createActivity([{
        operation: "Update",
        type: activityType,
        createdBy: user._id,
        field: "Attachments",
        description: `${attachments.length} Attachments added to Bug with S.No.- ${bug.sNo}.`,
        bug: bug._id,
        meta: {added: true},
        project: bug.project,
      }])
    }

    return {message: "Files successfully added to the Bug.", data: {attachments:bug.attachments}, success: true}

  }

  async removeBugAtachments(user, bugId, attachments) {
    let bug = await this.bugModel.findOne({_id: bugId});
    // const project = await this.projectsService.getAppProject({_id: bug.project}, {});

    if(!bug){
      throw new HttpException("No such Bug Exists", HttpStatus.BAD_REQUEST);
    }

    if(String(user._id) == String(bug.createdBy) || ["Admin", "Member++"].includes(user.type)){
      for(let i=0; i< attachments.length; i++){
        this.utilsSrvice.deleteFileS3(attachments[i], ConfigService.keys.FOLDER_BUG_ATTACHMENT);
        let j =0;
        for(j=0; j < bug.attachments.length; j++){
          if(bug.attachments[j] == attachments[i]){
            bug.attachments.splice(j, 1);
            break;
          }
        }
      }
    }

    bug = await bug.save();

    this.actsService.createActivity([{
      operation: "Update",
      type: activityType,
      createdBy: user._id,
      field: "Attachments",
      description: `${attachments.length} Attachments deleted from Bug with S.No.- ${bug.sNo}.`,
      bug: bug._id,
      meta: {deleted: true},
      project: bug.project
    }])
    return {message: "Files sucessfully deleted", success: true, data: {attachments: bug.attachments}};
  }

  async getBugsCount(projectId){
    const bugs = await this.bugModel.aggregate([
      {
        $match: {project: mongoose.Types.ObjectId(projectId)}
      },
      {
        $group: {
          _id: {platform: "$platform", status: "$status"},
          count: {$sum: 1},
        }
      }
    ])
    const count = {"total":0, "done":0};
    bugs.forEach(ele => {
      if(ele._id.platform){
        if(!count[`${ele._id.platform}`]){
          count[`${ele._id.platform}`] = {total: 0, done: 0};
        }
        if(ele._id.status == "Done"){
          count[`${ele._id.platform}`].done += ele.count;
          count.done += ele.count;
        }
        count[`${ele._id.platform}`].total += ele.count;
        count.total += ele.count;
      }
      else{
        if(!count["UnCategorised"]){
          count["UnCategorised"] = {total: 0, done: 0};
        }
        if(ele._id.status == "Done"){
          count["UnCategorised"].done += ele.count;
          count.done += ele.count;
        }
        count["UnCategorised"].total += ele.count;
        count.total += ele.count;
      }
    })

    return {data: {bugsCount:count}, message: "", success: true};
  }

  async getBugsCountForTask(taskId) {
    const bugs = await this.bugModel.aggregate([
      {
        $match: {
          task: mongoose.Types.ObjectId(taskId),
        },
      },
      {
        $project: {
          "done": {
            $cond: [{$eq: ["$status", "Done"]}, 1, 0]
          },
          "_id":1,
          "task":1,
          // "total": {$sum: 1},
          "totalDone": 1
        }
      },
      {
        $group : {
          _id: null,
          "total": {$sum: 1},
          "totalDone": {$sum: "$done"}
        }
      },
      // {
      //   $count: "total"
      // },
      // {
      //   $project: {
      //     "open": 1,
      //     "task": 1,
      //     "total": 1,
      //     "totalOpen":{$sum: "$open"},
      //   }
      // }
    ])

    return {data: {bugs: bugs[0]}, message: "", success: true};
  }

  async getBugsForTask(user, orgId, projectId, taskId) {
    const project = await this.projectsService.getAppProject({_id: projectId, organisation: orgId}, {})
    let task;
    if(project) {
      task = await this.tasksService.getTask({_id: taskId, project: projectId});
    }

    if(!task) {
      throw new HttpException("No such task exists!", HttpStatus.BAD_REQUEST);
    }

    const bugs = await this.getBugPopulated({task: mongoose.Types.ObjectId(taskId)});

    return {data: bugs, success: true, message: ''};
  }

  async searchBugText(projectId, text) {
    const result = await this.bugModel.find({project: projectId, $text: {$search: `${text}`, $caseSensitive: false, $diacriticSensitive: false}}).exec()
    return result;
  }
}
