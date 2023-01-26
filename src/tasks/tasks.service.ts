import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ProjectsService } from 'src/projects/projects.service';
import { UtilsService } from 'src/utils/utils.service';
import * as mongoose from 'mongoose';
import { EventsService } from 'src/events/events.service';
import { ActivitiesService } from 'src/activities/activities.service';
import { ConfigService } from 'src/config/config.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { BugsService } from 'src/bugs/bugs.service';

enum StatusHierarchy {
  'NotStarted',
  'Active',
  'OnHold',
  'WaitingForReview',
  'UnderReview',
  'ReviewFailed',
  'Completed',
}

@Injectable()
export class TasksService {
  constructor(
    @InjectModel('Milestone') private readonly milestoneModel: Model<any>,
    @InjectModel('Task') private readonly taskModel: Model<any>,
    @InjectModel('Todo') private readonly todoModel: Model<any>,
    @InjectModel('TodoSort') private readonly todoSortModel: Model<any>,
    @InjectModel('TaskSort') private readonly taskSortModel: Model<any>,
    @InjectModel('Module') private readonly moduleModel: Model<any>,
    @InjectModel('ModuleSort') private readonly moduleSortModel: Model<any>,
    @InjectModel('MilestoneSort')
    private readonly milestoneSortModel: Model<any>,
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly utilsService: UtilsService,
    private readonly actsService: ActivitiesService,
    private readonly notifyService: NotificationsService,
    @Inject(forwardRef(() => BugsService))
    private readonly bugsService: BugsService,
  ) {}

  //========================================================//

  async createMilestone(user, dto, orgId, projectId) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId },
      {},
    );
    if (
      user.type == 'Member+' &&
      project.projectHead &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'User is not authorised to perform this task.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!project || String(project?.organisation) != orgId) {
      throw new HttpException(
        "Given either Set of project and Organisation or one them doesn't exist!",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.type != 'Admin') {
      dto.amount = undefined;
      dto.currency = undefined;
    }

    let milestone = new this.milestoneModel(dto);
    milestone.project = project._id;
    milestone.createdBy = user._id;
    milestone.paymentInfo = {
      amount: dto.amount
        ? await this.utilsService.encryptData(dto.amount)
        : undefined,
      currency: dto.currency
        ? await this.utilsService.encryptData(dto.currency)
        : undefined,
    };
    milestone = await milestone.save();

    this.utilsService.createBasicInfoActs(
      user._id,
      'Create',
      'Milestone',
      undefined,
      { title: milestone.title },
      undefined,
      { _id: milestone._id },
      projectId,
    );
    this.notifyService.createNotifications({
      description: `New Milestone has been created in Project \"${project.title}\".`,
      module: 'Milestone',
      organisation: orgId,
      project: project._id,
      milestone: milestone._id,
      accessLevel: 'Member',
      users: [...project.team, project.projectHead],
      meta: {
        projectName: project.title,
        milestoneTitle: milestone.title,
      },
    });

    project.milestones.push(milestone._id);
    await project.save();

    return {
      message: 'Milestone created successfully',
      data: { milestone },
      success: true,
    };
  }

  //========================================================//

  async updateMilestone(user, dto, projectId, milestoneId) {
    let milestone = await this.milestoneModel
      .findOne({ _id: milestoneId })
      .select('+paymentInfo')
      .exec();
    if (String(milestone?.project) != projectId) {
      throw new HttpException(
        "Given Set of Project and Milestone doesn't add up or exist at all!",
        HttpStatus.BAD_REQUEST,
      );
    }
    const project = await this.projectsService.getAppProject(
      { _id: projectId },
      {},
    );
    if (
      user.type == 'Member+' &&
      project.projectHead &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'User is not authorised to perform this task.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const oldMilestone = JSON.parse(JSON.stringify(milestone._doc));

    milestone.title = dto.title ? dto.title : milestone.title;
    milestone.description = dto.description
      ? dto.description
      : milestone.description;
    let isCompleted = false;
    if (dto.status) {
      if (dto.status == 'Completed' && milestone.status != 'Completed') {
        milestone.completedOn = new Date();
        isCompleted = true;
      } else if (dto.status != 'Completed' && milestone.status == 'Completed') {
        milestone.completedOn = undefined;
      }
      milestone.status = dto.status;
    }
    if (dto.dueDate) {
      milestone.dueDate = new Date(dto.dueDate);
      const event = await this.eventsService.getSingleEvent(
        { milestone: milestoneId },
        {},
      );
      if (event) {
        event.dueDate = new Date(dto.duedate);
        event.save();
      } else {
        this.eventsService.createPublicEvents(user._id, project.organisation, {
          category: 'Milestone',
          project: project._id,
          milestone: milestoneId,
          date: dto.dueDate,
          title: `${milestone.title} -> Due Date`,
        });
      }
    }

    if (user.type != 'Admin') {
      dto.amount = undefined;
      dto.currency = undefined;
      dto.paymentMode = undefined;
      dto.settledOn = undefined;
      dto.isSettled = undefined;
    }
    milestone.dueDate = dto.dueDate ? new Date(dto.dueDate) : milestone.dueDate;
    milestone.paymentInfo.amount = dto.amount
      ? await this.utilsService.encryptData(dto.amount)
      : milestone.paymentInfo.amount;
    milestone.paymentInfo.currency = dto.currency
      ? await this.utilsService.encryptData(dto.currency)
      : milestone.paymentInfo.currency;
    milestone.paymentInfo.settledOn = dto.settledOn
      ? new Date(dto.settledOn)
      : milestone.paymentInfo.settledOn;
    milestone.paymentInfo.paymentMode = dto.paymentMode
      ? await this.utilsService.encryptData(dto.paymentMode)
      : milestone.paymentInfo.paymentMode;
    milestone.paymentInfo.isSettled =
      dto.isSettled !== undefined
        ? dto.isSettled
        : milestone.paymentInfo.isSettled;

    milestone.lastUpdatedBy = user._id;
    milestone = await milestone.save({ new: true, select: 'paymentInfo' });

    this.utilsService.createBasicInfoActs(
      user._id,
      'Update',
      'Milestone',
      dto,
      undefined,
      oldMilestone,
      milestone,
      projectId,
    );
    if (isCompleted) {
      this.projectsService.updatePaymentPhaseMilestone(
        project.organisation,
        milestone.project,
        milestone._id,
        undefined,
        true,
        undefined,
        undefined,
      );
    }
    if (milestone.paymentInfo) {
      milestone.paymentInfo.amount = milestone.paymentInfo.amount
        ? await this.utilsService.decryptData(milestone.paymentInfo.amount)
        : undefined;
      milestone.paymentInfo.paymentMode = milestone.paymentInfo.paymentMode
        ? await this.utilsService.decryptData(milestone.paymentInfo.paymentMode)
        : undefined;
      milestone.paymentInfo.currency = milestone.paymentInfo.currency
        ? await this.utilsService.decryptData(milestone.paymentInfo.currency)
        : undefined;
    }
    return {
      success: true,
      data: { milestone },
      message: 'Milestone Successfully updated',
    };
  }

  //========================================================//

  async getAppMilestone(args) {
    const milestone = await this.milestoneModel.findOne(args).exec();
    return milestone;
  }

  //========================================================//

  async getAppMilestoneSensitive(args) {
    const milestone = await this.milestoneModel
      .findOne(args)
      .select('+paymentInfo')
      .exec();
    return milestone;
  }

  //========================================================//

  async getMilestone(user, orgId, projectId, milestoneId) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );
    if (!project) {
      throw new HttpException(
        "Given set of organisation and project doesn't exist!",
        HttpStatus.BAD_REQUEST,
      );
    }
    let milestone;
    if (['Admin'].includes(user.type)) {
      milestone = await this.milestoneModel
        .findOne({ _id: milestoneId, project: projectId })
        .sort({ _id: -1 })
        .select('+paymentInfo')
        .populate('createdBy', ['name', 'profilePicture'])
        .populate('lastUpdatedBy', ['name', 'profilePicture'])
        .exec();
      if (milestone.paymentInfo) {
        milestone.paymentInfo.amount = milestone.paymentInfo.amount
          ? await this.utilsService.decryptData(milestone.paymentInfo.amount)
          : undefined;
        milestone.paymentInfo.paymentMode = milestone.paymentInfo.paymentMode
          ? await this.utilsService.decryptData(
              milestone.paymentInfo.paymentMode,
            )
          : undefined;
        milestone.paymentInfo.currency = milestone.paymentInfo.currency
          ? await this.utilsService.decryptData(milestone.paymentInfo.currency)
          : undefined;
      }
    } else {
      if (
        (await this.utilsService.projectAssociation(
          project,
          String(user._id),
        )) ||
        user.type == 'Member++'
      ) {
        milestone = await this.milestoneModel
          .findOne({ _id: milestoneId, project: projectId })
          .sort({ _id: -1 })
          .populate('createdBy', ['name', 'profilePicture'])
          .populate('lastUpdatedBy', ['name', 'profilePicture'])
          .exec();
      } else {
        throw new HttpException(
          'You are not authorized to see this data!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    if (!milestone) {
      throw new HttpException(
        "Given set of milestone and project doesn't exist!",
        HttpStatus.BAD_REQUEST,
      );
    }
    return { success: true, data: { milestone }, message: '' };
  }

  //========================================================//

  async getMilestoneCount(projects) {
    const count = {};
    const milestones = await this.milestoneModel.aggregate([
      { $match: { project: { $in: projects } } },
      {
        $group: {
          _id: { project: '$project', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);
    milestones.forEach((element) => {
      let project = String(element._id.project);
      if (!count[project]) {
        count[project] = {};
      }
      count[project][element._id.status] = element.count;
    });

    return count;
  }

  //========================================================//
  async getMilestoneStatusCountPaymentPhase(ids) {
    const count = {};
    const milestones = await this.milestoneModel.aggregate([
      { $match: { _id: { $in: ids } } },
      { $group: { _id: { status: '$status' }, count: { $sum: 1 } } },
    ]);
    milestones.forEach((element) => {
      // let project = String(element._id.project);
      // if(!count[project]){
      //   count[project] = {};
      // }
      count[element._id.status] = element.count;
    });
    return count;
  }

  //========================================================//

  async getTasksCount(projectId) {
    const count = {};
    const tasks = await this.taskModel.aggregate([
      { $match: { project: mongoose.Types.ObjectId(projectId) } },
      {
        $group: { _id: '$status', count: { $sum: 1 }, ids: { $push: '$_id' } },
      },
    ]);
    let ids = [];
    let tasksTotal = 0;
    let completedTasks = 0;
    const tasksCount = {};
    tasks.forEach((element) => {
      ids.push(...element.ids);
      tasksTotal += element.count;
      if (element._id == 'Completed') {
        completedTasks = element.count;
      }
    });
    tasksCount['completedTasks'] = completedTasks;
    tasksCount['tasksTotal'] = tasksTotal;

    const todos = await this.todoModel.aggregate([
      { $match: { task: { $in: ids } } },
      { $group: { _id: '$completed', count: { $sum: 1 } } },
    ]);
    const todosCount = {};
    let completedTodos = 0;
    let totalTodos = 0;
    todos.forEach((element) => {
      totalTodos += element.count;
      if (element._id) {
        completedTodos = element.count;
      }
    });

    todosCount['completedTodos'] = completedTodos;
    todosCount['totalTodos'] = totalTodos;

    return { todosCount, tasksCount };
  }

  //========================================================//

  async getProjectMilestones(user, orgId, projectId) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId },
      {},
    );
    if (project.organisation != orgId) {
      throw new HttpException(
        'No such set of Organisation and Project Exists',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!['Admin', 'Member++'].includes(user.type)) {
      if (
        !(await this.utilsService.projectAssociation(project, String(user._id)))
      ) {
        throw new HttpException(
          'You are not authorised to perform this task',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // const milestones = await this.milestoneModel.find({project: projectId},{"title":1, "description":1, "status":1, "dueDate": 1, "completedOn": 1}).sort({"status": 1, "_id": 1}).exec();

    const milestones = await this.milestoneModel.aggregate([
      {
        $match: { project: project._id },
      },
      {
        $lookup: {
          from: 'milestonesorts',
          localField: '_id',
          foreignField: 'milestone',
          as: 'sequence',
        },
      },
      {
        $sort: { 'sequence.sequence': 1, dueDate: 1 },
      },
      {
        $project: {
          title: 1,
          description: 1,
          status: 1,
          dueDate: 1,
          completedOn: 1,
          sequence: 1,
        },
      },
    ]);

    const milestoneList = [];
    milestones.forEach((element) => {
      milestoneList.push(element._id);
    });

    const taskCount = {};
    const moduleCount = {};
    const tasks = await this.taskModel.aggregate([
      { $match: { milestone: { $in: milestoneList } } },
      {
        $group: {
          _id: { milestone: '$milestone', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ]);
    const modules = await this.moduleModel.aggregate([
      { $match: { milestone: { $in: milestoneList } } },
      { $group: { _id: { milestone: '$milestone' }, count: { $sum: 1 } } },
    ]);

    tasks.forEach((element) => {
      let milestone = String(element._id.milestone);
      if (!taskCount[milestone]) {
        taskCount[milestone] = {};
      }
      taskCount[milestone][element._id.status] = element.count;
    });

    modules.forEach((element) => {
      let milestone = String(element._id.milestone);
      moduleCount[milestone] = element.count;
    });

    milestones.forEach((element) => {
      element.taskCount = taskCount[String(element._id)];
      element.moduleCount = moduleCount[String(element._id)] || 0;
    });
    return { message: '', data: { milestones }, success: true };
  }

  //========================================================//

  async sortMilestones(user, orgId, projectId, milestones) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );

    if (!project) {
      throw new HttpException(
        "Given set of parameters doesn't match up!",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!['Member++', 'Admin'].includes(user.type)) {
      if (String(user._id) != String(project.projectHead)) {
        throw new HttpException(
          'User is not authorised to perform this task',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const filteredMilestones = await this.milestoneModel
      .find({ _id: { $in: Object.keys(milestones) }, project: projectId })
      .exec();

    const milestoneSequences = {};
    filteredMilestones.forEach((element) => {
      milestoneSequences[String(element._id)] =
        milestones[`${String(element._id)}`];
    });

    const sorts = await this.milestoneSortModel
      .find({ milestone: { $in: Object.keys(milestoneSequences) } })
      .exec();

    for (let i = 0; i < sorts.length; i++) {
      sorts[i].sequence = milestoneSequences[String(sorts[i].milestone)];
      milestoneSequences[String(sorts[i].milestone)] = undefined;
      sorts[i].save();
    }

    const x = [];
    const milestoneIds = Object.keys(milestoneSequences);
    for (let i = 0; i < milestoneIds.length; i++) {
      if (milestoneSequences[`${milestoneIds[i]}`] != undefined) {
        x.push({
          milestone: milestoneIds[i],
          sequence: milestones[`${milestoneIds[i]}`],
        });
      }
    }

    await this.milestoneSortModel.insertMany(x);

    return { data: {}, success: true, message: '' };
  }
  //========================================================//

  async createTask(admin, dto, projectId, milestoneId, orgId) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId },
      {},
    );
    const milestone = await this.getAppMilestone({ _id: milestoneId });

    if (
      String(milestone.project) != projectId ||
      orgId != String(project.organisation)
    ) {
      throw new HttpException(
        "Given set of organisation, project and milestone doesn't add up!",
        HttpStatus.FORBIDDEN,
      );
    }

    if (
      String(admin.type) == 'Member+' &&
      String(project.projectHead) != String(admin._id)
    ) {
      throw new HttpException(
        'User not authorised to perform this task!',
        HttpStatus.FORBIDDEN,
      );
    }

    let parentTask;

    if (dto?.parent) {
      parentTask = await this.taskModel.findById(dto.parent);
      if (!parentTask) {
        throw new HttpException('Task not found!', HttpStatus.NOT_FOUND);
      }
    }

    const team = [];
    project.team?.forEach((element) => {
      team.push(String(element._id));
    });
    project.projectHead ? team.push(String(project.projectHead)) : undefined;

    let assignees = [];
    const assigneesStatus = [];
    let platforms;
    if (dto.assignees) {
      dto.assignees.forEach((element) => {
        if (team.includes(element)) {
          assignees.push(element);
          assigneesStatus.push({
            assignee: element,
            status: 'NotStarted',
          });
        }
      });
      dto.assignees = assignees;
      dto.assigneesStatus = assigneesStatus;
    }
    if (dto.platforms) {
      platforms = dto.platforms.filter((element) =>
        project.platforms.includes(element),
      );
      dto.platforms = platforms;
    }
    dto.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;

    let task = new this.taskModel(dto);
    if (dto.module) {
      const module = await this.moduleModel
        .findOne({ _id: dto.module, milestone: milestoneId })
        .exec();
      task.module = module._id;
    }
    task.createdBy = admin._id;
    task.milestone = milestone._id;
    task.project = projectId;
    task = await task.save();

    this.utilsService.createBasicInfoActs(
      admin._id,
      'Create',
      'Task',
      undefined,
      { title: task.title },
      undefined,
      { _id: task._id },
      projectId,
    );
    if (task.assignees && task.assignees.length > 0) {
      this.notifyService.createNotifications({
        description: `You have been assigned a new Task in Project \"${project.title}\".`,
        module: 'Task',
        organisation: project.organisation,
        project: project._id,
        milestone: task.milestone,
        accessLevel: 'Member',
        users: dto.assignees,
        meta: {
          projectName: project.title,
          taskTitle: task.title,
          taskId: task._id,
        },
      });
    }
    if (dto.parent) {
      parentTask.childTasks.push(task._id);
      const updateParentTask = await parentTask.save();
    }
    milestone.tasks.push(task._id);
    milestone.save();
    this.updateMilestoneStatus(admin._id, milestone._id);
    return {
      success: true,
      data: { task },
      message: 'Task Successfully created!',
    };
  }

  //========================================================//

  async updateTask(admin, dto, orgId, taskId) {
    let task = await this.getTask({ _id: taskId });
    const project = await this.projectsService.getAppProject(
      { _id: task.project },
      {},
    );

    if (!project || String(project.organisation) != orgId) {
      throw new HttpException(
        "Given set of organisation, project, milestone, and task doesn't add up",
        HttpStatus.BAD_REQUEST,
      );
    }

    const oldTask = JSON.parse(JSON.stringify(task._doc));

    const team = [];
    project.team?.forEach((element) => {
      team.push(String(element._id));
    });

    const isUserInTeam = team.includes(String(admin._id));
    if (admin.type == 'Member' || admin.type == 'Member+') {
      if (isUserInTeam) {
        if (!dto['myStatus'] && !dto['status']) {
          throw new HttpException(
            'You are not authorised to perform this operation!',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
    project.projectHead ? team.push(String(project.projectHead)) : undefined;

    if (!['Member++', 'Admin'].includes(admin.type)) {
      if (String(project.projectHead) != String(admin._id) && !isUserInTeam) {
        throw new HttpException(
          'User not authorised to perform this task!',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    let oldDto = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        oldDto[key] = task[key];
      }
    }

    // if(String(project.projectHead) != String(admin._id) && ! ["Member++", "Admin"].includes(admin.type)){
    //   dto.status = undefined;
    // }
    let updateStatus;
    if (dto.myStatus || dto.status) {
      updateStatus = await this.updateTaskStatus(
        admin,
        task,
        dto.status,
        dto.myStatus,
      );
      task = updateStatus.task;
    }

    task.onHoldReason =
      dto.onHoldReason !== undefined ? dto.onHoldReason : task.onHoldReason;

    if (
      String(project.projectHead) == String(admin._id) ||
      ['Member++', 'Admin'].includes(admin.type)
    ) {
      if (dto.platforms) {
        task.platforms = dto.platforms.filter((element) =>
          project.platforms.includes(element),
        );
      }
      if (dto.module) {
        const module = await this.moduleModel
          .findOne({ _id: dto.module, milestone: task.milestone })
          .exec();
        task.module = module._id || task.module;
      }
      task.title = dto.title ? dto.title : task.title;
      task.description = dto.description ? dto.description : task.description;
      task.dueDate =
        dto.dueDate !== undefined
          ? dto.dueDate === ''
            ? undefined
            : new Date(dto.dueDate)
          : task.dueDate;
      if (dto.status || dto.myStatus) {
        oldDto['status'] = task.status;
      }
      if (dto.assignees) {
        oldDto['assignees'] = undefined;
        const assigneesObj = {};
        dto.assignees.forEach((element) => {
          if (team.includes(element)) {
            assigneesObj[`${element}`] = 1;
          }
        });
        const removed = [];
        const removedStr = [];
        const oldAssigneesStr = []; // to get an array of old assignees and use includes if needed

        // create list of assignees thjat are being removed
        task.assignees.forEach((element) => {
          if (!assigneesObj[String(element)]) {
            removed.push(element);
            removedStr.push(String(element));
          }
          oldAssigneesStr.push(String(element));
        });
        task.assignees = Object.keys(assigneesObj);
        const assigneesStatus = task.assigneesStatus;
        const newAssignees = Object.keys(assigneesObj).filter(
          (ele) => !oldAssigneesStr.includes(ele),
        ); // to get the new assignees, so that we can create new status for them

        for (let i = 0; i < assigneesStatus.length; i++) {
          // remove status of assignees that are no longer in the task

          if (removedStr.includes(String(assigneesStatus[i].assignee))) {
            assigneesStatus.splice(i, 1);
            i--;
          }
        }

        // create status for new assignees
        newAssignees.forEach((ele) => {
          if (task.status != 'OnHold') {
            assigneesStatus.push({
              assignee: ele,
              status: 'NotStarted',
            });
          } else {
            assigneesStatus.push({
              assignee: ele,
              status: 'OnHold',
            });
          }
        });
        if (task.status != 'OnHold') {
          task.assigneesStatus = assigneesStatus;

          let notStarted = 0;
          let active = 0;
          let completed = 0;
          // assigneesStatus.forEach(element => {
          //   if(element.status == "Active") {

          //   }
          // });
          for (let i = 0; i < assigneesStatus.length; i++) {
            if (assigneesStatus[i].status === 'Active') {
              active += 1;
            } else if (assigneesStatus[i].status === 'NotStarted') {
              notStarted += 1;
            } else if (assigneesStatus[i].status === 'Completed') {
              completed += 1;
            }
          }

          if (active > 0) {
            task.status = 'Active';
          } else if (completed == assigneesStatus.length && completed != 0) {
            task.status = 'Completed';
          } else if (notStarted > 0) {
            if (notStarted != assigneesStatus.length) {
              task.status = 'Active';
            } else {
              task.status = 'NotStarted';
            }
          }
        }

        if (newAssignees && newAssignees.length > 0) {
          this.notifyService.createNotifications({
            description: `You have been assigned a new Task in Project \"${project.title}\".`,
            module: 'Task',
            organisation: project.organisation,
            project: project._id,
            milestone: task.milestone,
            accessLevel: 'Member',
            users: newAssignees,
            meta: {
              projectName: project.title,
              taskTitle: task.title,
              taskId: task._id,
            },
          });
        }

        this.utilsService.createAssigneeActs(
          admin._id,
          task._id,
          'Task',
          oldTask.assignees,
          task.assignees,
          project._id,
        );

        // delete to-do of all the assignees removed from the task
        // if(removed.length != 0){
        //   removed.forEach(ele => {
        //     activities.push({
        //       operation: "Update",
        //       type: "Task",
        //       createdBy: admin._id,
        //       field: "Assignees",
        //       from: ele,
        //       to: undefined,
        //       description: `Assignee has been removed from the task.`,
        //       task: task._id,
        //     })
        //   })
        //   this.todoModel.deleteMany({task: taskId, assignee: {$in: removed}}).exec();
        // }

        // if(newAssignees.length > 0){
        //   newAssignees.forEach(ele => {
        //     activities.push({
        //       operation: "Update",
        //       type: "Task",
        //       createdBy: admin._id,
        //       field: "Assignees",
        //       from: undefined,
        //       to: ele,
        //       description: `New assignee added to the task`,
        //       task: task._id,
        //     })
        //   })
        // }
      }
      if (dto.module) {
        const module = await this.moduleModel
          .findOne({ _id: dto.module, milestone: task.milestone })
          .exec();
        task.module = module?._id || task.module;
      }
      task.lastUpdatedBy = admin._id;
    }
    // let milestoneStatus;
    // let milestone;

    task = await task.save({ new: true });

    this.utilsService.createBasicInfoActs(
      admin._id,
      'Update',
      'Task',
      { ...dto, assignees: undefined },
      undefined,
      oldTask,
      task,
      project._id,
    );
    if (updateStatus && updateStatus.updateMilestone) {
      this.updateMilestoneStatus(admin._id, task.milestone);
    }
    task = await this.getTaskPopulated({ _id: task._id });
    return {
      success: true,
      data: { task },
      message: 'Task Successfully updated.',
    };
  }

  //========================================================//
  //========================================================//

  async updateTaskStatus(user, task, status, myStatus) {
    if (
      status == 'OnHold' ||
      (!status && task.status == 'OnHold') ||
      myStatus == 'OnHold'
    ) {
      myStatus = undefined;
    }
    if (['UnderReview', 'Completed', 'ReviewFailed'].includes(task.status)) {
      myStatus = undefined;
    }
    const oldStatus = task.status;
    if (status && task.status != status) {
      task.status = status;
      task.assigneesStatus.forEach((element) => {
        if (status == 'WaitingForReview') {
          element.status = 'Completed';
        } else if (!['UnderReview', 'ReviewFailed'].includes(task.status)) {
          element.status = status;
        }
      });

      if (task.status == 'Completed') {
        task.completedOn = this.utilsService.dateToday();
      }
    } else if (myStatus) {
      let notStarted = 0;
      let completed = 0;
      let active = 0;
      for (let i = 0; i < task.assigneesStatus.length; i++) {
        if (
          String(task.assigneesStatus[i].assignee) == String(user._id) &&
          task.assigneesStatus[i].status != myStatus
        ) {
          const myOldStatus = task.assigneesStatus[i].status;
          task.assigneesStatus[i].status = myStatus;
          this.utilsService.createBasicInfoActs(
            user._id,
            'Update',
            'Task',
            { myStatus },
            undefined,
            { assigneeStatus: myOldStatus },
            { assigneeStatus: myStatus },
            task.project,
          );
        }
        if (task.assigneesStatus[i].status == 'NotStarted') {
          notStarted += 1;
        }
        if (task.assigneesStatus[i].status == 'Completed') {
          completed += 1;
        }
        if (task.assigneesStatus[i].status == 'Active') {
          active += 1;
        }
      }

      if (notStarted > 0 && notStarted == task.assigneesStatus.length) {
        task.status = 'NotStarted';
      } else if (completed > 0 && completed == task.assigneesStatus.length) {
        // task.status = "Completed";
        task.status = 'WaitingForReview';
      } else if (task.assigneesStatus.length > 0) {
        task.status = 'Active';
      }
    }

    let updateMilestone = false;
    if (task.status != oldStatus) {
      updateMilestone = true;
      task.statusUpdatedBy = user._id;
    }

    return { updateMilestone, task };
  }
  //========================================================//

  async updateMilestoneStatus(userId, milestoneId) {
    //call it once our task has been saved.
    let milestoneStatus;
    let milestone;
    let oldMilestone;
    const tasks = await this.taskModel.aggregate([
      { $match: { milestone: mongoose.Types.ObjectId(milestoneId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const taskCounts = {};
    tasks.forEach((element) => {
      taskCounts[`${element._id}`] = element.count;
    });

    const cond1 =
      taskCounts['Active'] > 0 ||
      taskCounts['ReviewFailed'] > 0 ||
      taskCounts['UnderReview'] > 0 ||
      taskCounts['WaitingForReview'] > 0; //milestone: Active
    const cond2 =
      (taskCounts['NotStarted'] || 0) !== 0 &&
      (taskCounts['Completed'] || 0) !== 0; //milestone: Active
    const cond3 =
      (taskCounts['NotStarted'] || 0) !== 0 &&
      (taskCounts['Completed'] || 0) === 0; //milestone: NotStarted
    const cond4 =
      (taskCounts['NotStarted'] || 0) === 0 &&
      (taskCounts['Completed'] || 0) !== 0; //milestone: Completed

    if (cond1) {
      milestone = await this.milestoneModel
        .findOne({ _id: milestoneId, status: { $ne: 'Active' } })
        .exec();
      if (milestone) {
        oldMilestone = JSON.parse(JSON.stringify(milestone._doc));
        milestoneStatus = 'Active';
        milestone.status = milestoneStatus;
      }
      // milestone = await this.milestoneModel.findOneAndUpdate({_id: milestoneId, status: {$ne: "Active"}}, {$set: {"status": "Active", "completedOn": undefined}}).exec();
    } else if (cond1 || cond2) {
      milestone = await this.milestoneModel
        .findOne({ _id: milestoneId, status: { $ne: 'Active' } })
        .exec();
      if (milestone) {
        oldMilestone = JSON.parse(JSON.stringify(milestone._doc));
        milestoneStatus = 'Active';
        milestone.status = milestoneStatus;
      }
      // milestone = await this.milestoneModel.findOneAndUpdate({_id: milestoneId, status: {$ne: "Active"}}, {$set: {"status": "Active", "completedOn": undefined}}).exec();
    } else if (cond3) {
      milestone = await this.milestoneModel
        .findOne({ _id: milestoneId, status: { $ne: 'NotStarted' } })
        .exec();
      if (milestone) {
        oldMilestone = JSON.parse(JSON.stringify(milestone._doc));
        milestoneStatus = 'NotStarted';
        milestone.status = milestoneStatus;
      }
      // milestone = await this.milestoneModel.findOneAndUpdate({_id: milestoneId, status: {$ne: "NotStarted"}}, {$set: {"status": "NotStarted", "completedOn": undefined}}).exec();
    } else if (cond4) {
      milestone = await this.milestoneModel
        .findOne({ _id: milestoneId, status: { $ne: 'Completed' } })
        .exec();
      if (milestone) {
        oldMilestone = JSON.parse(JSON.stringify(milestone._doc));
        milestoneStatus = 'Completed';
        milestone.status = milestoneStatus;
        this.projectsService.updatePaymentPhaseMilestone(
          milestone.organisation,
          milestone.project,
          milestone._id,
          undefined,
          true,
          undefined,
          undefined,
        );
      }
      // milestone = await this.milestoneModel.findOneAndUpdate({_id: milestoneId, status: {$ne: "Completed"}}, {$set: {"status": "Completed", "completedOn": this.utilsService.dateToday()}}).exec();
    }

    if (!milestone) {
      return true;
    } else {
    }
    // if(milestoneStatus && milestone && milestone.status != milestoneStatus){
    //   this.actsService.createActivity([{
    //     operation: "Update",
    //     type: "Milestone",
    //     createdBy: userId,
    //     field: "Status",
    //     from: milestone.status,
    //     to: milestoneStatus,
    //     description: `Milestone updated for \"Status\", from ${milestone.status} to ${milestoneStatus}.`,
    //     milestone: milestone._id,
    //   }])
    // }
    milestone = await milestone.save({ new: true });

    this.utilsService.createBasicInfoActs(
      userId,
      'Update',
      'Milestone',
      { status: milestoneStatus },
      undefined,
      oldMilestone,
      milestone,
      milestone.project,
    );
    return true;
  }
  //========================================================//

  async getTask(args) {
    const task = await this.taskModel.findOne(args).exec();
    return task;
  }

  //========================================================//

  async getTaskPopulated(args) {
    const task = await this.taskModel
      .findOne(args)
      .populate('assignees', ['name', 'userType', 'profilePicture', 'email'])
      .populate('createdBy', ['name', 'userType', 'profilePicture', 'email'])
      .populate('statusUpdatedBy', [
        'name',
        'userType',
        'profilePicture',
        'email',
      ])
      .exec();
    return task;
  }

  //========================================================//

  async getMilestoneTasks(user, milestoneId, orgId) {
    const milestone = await this.milestoneModel
      .findOne({ _id: milestoneId })
      .exec();
    const project = await this.projectsService.getAppProject(
      { _id: milestone.project },
      {},
    );
    if (!milestone || !project || String(project?.organisation) != orgId) {
      throw new HttpException(
        "Given set of organisation, project and milestone don't add up!",
        HttpStatus.BAD_REQUEST,
      );
    }
    let tasks = [];
    if (
      this.utilsService.projectAssociation(project, String(user._id)) ||
      ['Admin', 'Member++'].includes(user.type)
    ) {
      tasks = await this.taskModel.aggregate([
        {
          $match: { milestone: milestone._id, parent: null },
        },
        {
          $addFields: {
            statusValue: {
              $indexOfArray: [['Active', 'NotStarted', 'Completed'], '$status'],
            },
          },
        },
        {
          $lookup: {
            from: 'tasksorts',
            localField: '_id',
            foreignField: 'task',
            as: 'sequence',
          },
        },
        {
          $sort: {
            'sequence.sequence': 1,
            dueDate: -1,
            statusValue: 1,
            _id: -1,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assignees',
            foreignField: '_id',
            as: 'assignees',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastUpdatedBy',
            foreignField: '_id',
            as: 'lastUpdatedBy',
          },
        },
        {
          $lookup: {
            from: 'modules',
            localField: 'module',
            foreignField: '_id',
            as: 'modules',
          },
        },
        {
          $project: {
            'assignees.sessions': 0,
            'assignees.password': 0,
            'assignees.accountDetails': 0,
            'assignees.projects': 0,
            'createdBy.sessions': 0,
            'createdBy.password': 0,
            'createdBy.accountDetails': 0,
            'createdBy.projects': 0,
            'lastUpdatedBy.sessions': 0,
            'lastUpdatedBy.password': 0,
            'lastUpdatedBy.accountDetails': 0,
            'lastUpdatedBy.projects': 0,
          },
        },
        {
          $group: { _id: '$modules._id', tasks: { $push: '$$ROOT' } },
        },
      ]);

      for (let ele of tasks) {
        for (let ele1 of ele.tasks) {
          ele1.bugCount = (
            await this.bugsService.getBugsCountForTask(ele1._id)
          )?.data?.bugs;
        }
      }
    }
    return { message: '', status: 'Successful', data: tasks };
  }

  async getMilestoneSubTasks(user, milestoneId, orgId, parentId) {
    const milestone = await this.milestoneModel
      .findOne({ _id: milestoneId })
      .exec();
    const project = await this.projectsService.getAppProject(
      { _id: milestone.project },
      {},
    );
    if (!milestone || !project || String(project?.organisation) != orgId) {
      throw new HttpException(
        "Given set of organisation, project and milestone don't add up!",
        HttpStatus.BAD_REQUEST,
      );
    }
    let tasks = [];
    if (
      this.utilsService.projectAssociation(project, String(user._id)) ||
      ['Admin', 'Member++'].includes(user.type)
    ) {
      tasks = await this.taskModel.aggregate([
        {
          $match: {
            milestone: milestone._id,
            parent: new Types.ObjectId(parentId),
          },
        },
        {
          $addFields: {
            statusValue: {
              $indexOfArray: [['Active', 'NotStarted', 'Completed'], '$status'],
            },
          },
        },
        {
          $lookup: {
            from: 'tasksorts',
            localField: '_id',
            foreignField: 'task',
            as: 'sequence',
          },
        },
        {
          $sort: {
            'sequence.sequence': 1,
            dueDate: -1,
            statusValue: 1,
            _id: -1,
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'assignees',
            foreignField: '_id',
            as: 'assignees',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'lastUpdatedBy',
            foreignField: '_id',
            as: 'lastUpdatedBy',
          },
        },
        {
          $lookup: {
            from: 'modules',
            localField: 'module',
            foreignField: '_id',
            as: 'modules',
          },
        },
        {
          $project: {
            'assignees.sessions': 0,
            'assignees.password': 0,
            'assignees.accountDetails': 0,
            'assignees.projects': 0,
            'createdBy.sessions': 0,
            'createdBy.password': 0,
            'createdBy.accountDetails': 0,
            'createdBy.projects': 0,
            'lastUpdatedBy.sessions': 0,
            'lastUpdatedBy.password': 0,
            'lastUpdatedBy.accountDetails': 0,
            'lastUpdatedBy.projects': 0,
          },
        },
        {
          $group: { _id: '$modules._id', tasks: { $push: '$$ROOT' } },
        },
      ]);

      for (let ele of tasks) {
        for (let ele1 of ele.tasks) {
          ele1.bugCount = (
            await this.bugsService.getBugsCountForTask(ele1._id)
          )?.data?.bugs;
        }
      }
    }
    return {
      message: '',
      status: 'Successful',
      data: { tasks: tasks?.[0]?.tasks },
    };
  }

  //========================================================//

  async getProjectTasks(user, orgId, projectId) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );
    if (!project) {
      throw new HttpException(
        'This project does not exists!',
        HttpStatus.BAD_REQUEST,
      );
    }
    let tasks;
    if (
      this.utilsService.projectAssociation(project, String(user._id)) ||
      ['Admin', 'Member++'].includes(user.type)
    ) {
      tasks = await this.taskModel.find({ project: projectId }).exec();
    }

    return { data: tasks, success: true, message: '' };
  }

  //========================================================//

  async sortTasks(user, orgId, milestoneId, tasks) {
    const milestone = await this.milestoneModel
      .findOne({ _id: milestoneId })
      .exec();
    const project = await this.projectsService.getAppProject(
      { _id: milestone.project, organisation: orgId },
      {},
    );
    if (!project) {
      throw new HttpException(
        "Given set of parameters doesn't match up!",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!['Member++', 'Admin'].includes(user.type)) {
      // const association = await this.utilsService.projectAssociation(project, String(user._id));
      // if(!association){
      //   throw new HttpException("User is not associated with this project!", HttpStatus.BAD_REQUEST);
      // }

      if (String(user._id) != String(project.projectHead)) {
        throw new HttpException(
          'User is not authorised to perform this task',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const filteredTasks = await this.taskModel
      .find({ _id: { $in: Object.keys(tasks) }, milestone: milestoneId })
      .exec();
    const taskSequences = {};
    filteredTasks.forEach((element) => {
      taskSequences[String(element._id)] = tasks[`${String(element._id)}`];
    });

    const sorts = await this.taskSortModel
      .find({ task: { $in: Object.keys(taskSequences) } })
      .exec();

    for (let i = 0; i < sorts.length; i++) {
      sorts[i].sequence = taskSequences[String(sorts[i].task)];
      taskSequences[String(sorts[i].task)] = undefined;
      sorts[i].save();
    }

    const x = [];
    const taskIds = Object.keys(taskSequences);
    for (let i = 0; i < taskIds.length; i++) {
      if (taskSequences[`${taskIds[i]}`] != undefined) {
        x.push({
          task: taskIds[i],
          sequence: tasks[`${taskIds[i]}`],
        });
      }
    }

    this.taskSortModel.insertMany(x);

    return { data: {}, message: '', success: true };
  }

  //========================================================//

  async myTasks(user, projectId, orgId, pageNo, pageSize) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId },
      {},
    );
    if (!project || String(project.organisation) != orgId) {
      throw new HttpException(
        'No such project exists associated with mentioned organisation!!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const tasks = await this.taskModel.aggregate([
      {
        $match: {
          $or: [{ assignees: user._id }],
          project: mongoose.Types.ObjectId(projectId),
        },
      },
      {
        $addFields: {
          statusValue: {
            $indexOfArray: [['Active', 'NotStarted', 'Completed'], '$status'],
          },
        },
      },
      {
        $sort: { statusValue: 1, _id: -1 },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignee',
          foreignField: '_id',
          as: 'assignee',
        },
      },
      {
        $project: {
          'createdBy.sessions': false,
          'createdBy.password': false,
          'createdBy.projects': false,
          'createdBy.accountDetails': false,
          'createdBy.passwordUpdatedAt': false,
          'assignee.sessions': false,
          'assignee.password': false,
          'assignee.projects': false,
          'assignee.accountDetails': false,
          'assignee.passwordUpdatedAt': false,
          'statusLastUpdatedBy.sessions': false,
          'statusLastUpdatedBy.password': false,
          'statusLastUpdatedBy.projects': false,
          'statusLastUpdatedBy.accountDetails': false,
          'statusLastUpdatedBy.passwordUpdatedAt': false,
        },
      },
    ]);
    const count = await this.taskModel
      .find({ assignee: user._id, project: projectId })
      .countDocuments();

    return { success: true, message: '', data: { tasks, count } };
  }

  //========================================================//

  async deleteTask(user, orgId, tasks, projectId) {
    let project = await this.projectsService.getAppProject(
      { _id: projectId },
      {},
    );

    if (!project || String(project.organisation) != orgId) {
      throw new HttpException(
        "Give set of organisation, project and task doesn't exist!",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !['Admin', 'Member++'].includes(user.type) &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'You are not authorised to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const tasksDetailed = await this.taskModel
      .find({ _id: { $in: tasks }, project: projectId })
      .exec();
    const milestoneObj = {};
    tasksDetailed.forEach((ele) => {
      if (!milestoneObj[String(ele.milestone)]) {
        milestoneObj[String(ele.milestone)] = true;
      }
      this.utilsService.createBasicInfoActs(
        user._id,
        'Delete',
        'Task',
        undefined,
        { title: ele.title },
        { _id: ele._id },
        undefined,
        projectId,
      );
      this.bugsService.updateBugsApp(
        { task: ele._id },
        { $set: { task: undefined } },
        {},
      );
    });

    const deleted = await this.taskModel.deleteMany({
      _id: { $in: tasks },
      project: projectId,
    });
    if (deleted.n > 0) {
      this.milestoneModel
        .updateMany(
          { project: projectId },
          { $pull: { tasks: { $in: tasks } } },
        )
        .exec();
    }
    for (let ele of Object.keys(milestoneObj)) {
      this.updateMilestoneStatus(user._id, ele);
    }

    return {
      message: 'Task successfully deleted.',
      status: 'Successful',
      data: {},
    };
  }

  //========================================================//

  async deleteMilestone(user, orgId, milestoneId) {
    let milestone = await this.milestoneModel
      .findOne({ _id: milestoneId })
      .exec();
    const project = await this.projectsService.getAppProject(
      { _id: milestone?.project },
      {},
    );
    if (!milestone || !project || String(project.organisation) != orgId) {
      throw new HttpException(
        "Given milestone and organisation don't match up!",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.type == 'Member+' &&
      project.projectHead &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'User is not authorised to perform this task.',
        HttpStatus.BAD_REQUEST,
      );
    }

    for (let i = 0; i < project.milestones.length; i++) {
      if (String(project.milestones[i]) == milestoneId) {
        project.milestones.splice(i, 1);
        break;
      }
    }
    const tasks = await this.taskModel
      .find({ milestone: milestoneId }, { _id: 1 })
      .exec();
    const taskIds = tasks.map((ele) => ele._id);
    this.todoModel.deleteMany({ task: taskIds }).exec();
    this.taskModel.deleteMany({ milestone: milestoneId }).exec();
    this.moduleModel.deleteMany({ milestone: milestoneId }).exec();
    this.milestoneModel.deleteOne({ _id: milestoneId }).exec();
    project.save();

    // create Activity
    this.utilsService.createBasicInfoActs(
      user._id,
      'Delete',
      'Milestone',
      undefined,
      { title: milestone.title },
      { _id: milestoneId },
      undefined,
      milestone.project,
    );

    //update PaymentPhase status
    this.projectsService.updatePaymentPhaseMilestone(
      project.organisation,
      project._id,
      milestoneId,
      undefined,
      undefined,
      undefined,
      true,
    );
    return {
      success: true,
      message: 'Milestone Succesfully deleted',
      data: {},
    };
  }

  //========================================================//

  async deleteTasksApp(args) {
    return await this.taskModel.deleteMany(args).exec();
  }

  //========================================================//

  async deleteMilestonesApp(args) {
    return await this.milestoneModel.deleteMany(args).exec();
  }

  //========================================================//

  async updateTasksApp(filter, update, options) {
    return await this.taskModel.updateMany(filter, update, options).exec();
  }

  //========================================================//

  async createTodo(user, orgId, projectId, dto, taskId) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );
    if (!project) {
      throw new HttpException(
        'No such project exists in this organisation!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const task = await this.taskModel.findOne({ _id: taskId }).exec();
    const team = [];
    task.assignees.forEach((element) => {
      team.push(String(element));
    });

    if (
      !['Admin', 'Member++'].includes(user.type) &&
      String(user._id) != String(project.projectHead) &&
      !team.includes(dto.assignee)
    ) {
      throw new HttpException(
        'User is not associated with the this project!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (dto.assignee) {
      if (!team.includes(dto.assignee)) {
        dto.assignee = undefined;
      }
    }
    let todo = new this.todoModel(dto);
    todo.project = projectId;
    todo.task = taskId;
    todo.createdBy = user._id;

    todo = await todo.save();

    this.utilsService.createBasicInfoActs(
      user._id,
      'Create',
      'To-do',
      undefined,
      { title: todo.title },
      undefined,
      { _id: todo._id },
      project._id,
    );

    return { data: { todo }, message: '', success: true };
  }

  //========================================================//

  async updateTodo(user, todoId, dto) {
    let todo = await this.todoModel.findOne({ _id: todoId });
    if (!todo) {
      throw new HttpException('No such To-Do exists!', HttpStatus.BAD_REQUEST);
    }

    if (
      String(todo.assignee) != String(user._id) &&
      String(todo.createdBy) != String(user._id)
    ) {
      throw new HttpException(
        'User is not authorised to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }

    let oldDto = {};

    for (const [key, value] of Object.entries(dto)) {
      if (value !== undefined) {
        oldDto[key] = todo[key];
      }
    }

    todo.title = dto.title != undefined ? dto.title : todo.title;
    todo.description =
      dto.description != undefined ? dto.description : todo.description;
    todo.completed =
      dto.completed != undefined &&
      (String(todo.assignee) != String(user._id)) != undefined
        ? dto.completed
        : todo.completed;
    if (dto.assignee) {
      const task = await this.taskModel.findOne({ _id: todo.task }).exec();
      const team = [];
      task.assignees.forEach((element) => {
        team.push(String(element));
      });
      if (!team.includes(dto.assignee)) {
        dto.assignee = undefined;
      }
    }

    // const activities : Array<Object> = [];
    // for(const [key, value] of Object.entries(dto)){
    //   if(value !== undefined && String(oldDto[key]) != String(todo[key])){
    //     activities.push({
    //       operation: "Update",
    //       type: "To-Do",
    //       createdBy: user._id,
    //       field: key,
    //       from: String(oldDto[key]),
    //       to: String(todo[key]),
    //       description: `Todo has been updated by ${user.name}, from ${String(oldDto[key])}, to ${String(todo[key])}.`,
    //       todo: todo._id,
    //     })
    //   }
    // }
    // this.actsService.createActivity(activities);

    todo = await todo.save({ new: true });

    return {
      success: true,
      message: 'ToDo successfully updated.',
      data: { todo },
    };
  }

  //========================================================//

  async getTaskTodos(user, projectId, taskId) {
    const team = [];
    const project = await this.projectsService.getAppProject(
      { _id: projectId },
      {},
    );
    project.team.forEach((element) => {
      team.push(String(element));
    });
    !project.projectHead || team.push(String(project.projectHead));

    if (
      !['Admin', 'Member++'].includes(user.type) &&
      !team.includes(String(user._id))
    ) {
      throw new HttpException(
        'User is not authorised to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const todos = await this.todoModel.aggregate([
      {
        $match: { task: mongoose.Types.ObjectId(taskId) },
      },
      {
        $lookup: {
          from: 'todoSorts',
          localField: '_id',
          foreignField: 'todo',
          as: 'sequence',
        },
      },
      {
        $sort: { 'sequence.sequence': 1, completed: 1 },
      },
      {
        $group: {
          _id: '$assignee',
          todos: { $push: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: '_id',
        },
      },
      {
        $project: {
          '_id.sessions': 0,
          '_id.password': 0,
          '_id.accountDetails': 0,
          '_id.projects': 0,
        },
      },
    ]);

    return { data: { todos }, success: true, message: '' };
  }

  //========================================================//

  async deleteTodo(user, todoId) {
    const todo = await this.todoModel.findOne({ _id: todoId }).exec();
    const deleted = await this.todoModel
      .deleteOne({
        _id: todoId,
        $or: [{ assignee: user._id }, { createdBy: user._id }],
      })
      .exec();
    if (deleted.n == 1) {
      this.todoSortModel.deleteOne({ todo: todoId }).exec();
      // this.utilsService.createBasicInfoActs(user._id, "Delete", "To-do", undefined, { title: todo.title}, {_id: todo._id}, undefined);
    }

    return {
      data: { deleted },
      message: 'To-Do deleted successfully.',
      success: true,
    };
  }

  //========================================================//

  async sortTodo(user, taskId, todos) {
    const filteredTodos = await this.todoModel
      .find({
        _id: { $in: Object.keys(todos) },
        task: taskId,
        assignee: user._id,
      })
      .exec();
    const todoSequences = {};
    filteredTodos.forEach((element) => {
      todoSequences[String(element._id)] = todos[`${String(element._id)}`];
    });

    const sorts = await this.todoSortModel
      .find({ todo: { $in: Object.keys(todoSequences) } })
      .exec();
    const add = [];
    for (let i = 0; i < sorts.length; i++) {
      sorts[i].sequence = todoSequences[String(sorts[i].todo)];
      todoSequences[String(sorts[i].todo)] = undefined;
      await sorts[i].save();
    }
    const x = [];

    const todoIds = Object.keys(todoSequences);
    for (let i = 0; i < todoIds.length; i++) {
      if (todoSequences[`${todoIds[i]}`] != undefined) {
        x.push({
          todo: todoIds[i],
          sequence: todos[`${todoIds[i]}`],
        });
      }
    }

    await this.todoSortModel.insertMany(x);

    return { data: {}, message: '', success: true };
  }

  //========================================================//

  async createModule(user, milestoneId, projectId, moduleName) {
    const milestone = await this.getAppMilestone({
      _id: milestoneId,
      project: projectId,
    });

    if (!milestone) {
      throw new HttpException(
        "Given  milestone and project doesn't match up!",
        HttpStatus.BAD_REQUEST,
      );
    }

    let module = new this.moduleModel({
      module: moduleName,
      milestone: milestoneId,
      project: projectId,
      createdBy: user._id,
    });

    module = await module.save();

    this.utilsService.createBasicInfoActs(
      user._id,
      'Create',
      'Module',
      undefined,
      { title: module.module },
      undefined,
      { _id: module._id },
      projectId,
    );

    return {
      data: { module },
      message: 'Module created successfully.',
      success: true,
    };
  }

  //========================================================//

  async updateModule(user, orgId, moduleId, moduleName) {
    let module = await this.moduleModel.findOne({ _id: moduleId }).exec();
    const project = await this.projectsService.getAppProject(
      { _id: module?.project, organisation: orgId },
      {},
    );

    if (!project) {
      throw new HttpException(
        "Given module doesn't exist!",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (user.type == 'Member+' && project.projectHead != String(user._id)) {
      throw new HttpException(
        'You are not authorised to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const oldModule = JSON.parse(JSON.stringify(module._doc));

    module.module = moduleName;

    module = await module.save({ new: true });

    if (module.module != moduleName) {
      this.utilsService.createBasicInfoActs(
        user._id,
        'Update',
        'Module',
        { module: moduleName },
        undefined,
        oldModule,
        module,
        project._id,
      );
    }

    return {
      data: { module },
      message: 'Module updated successfully.',
      success: true,
    };
  }

  //========================================================//

  async deleteModules(user, orgId, projectId, moduleIds) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );

    if (!project) {
      throw new HttpException(
        "Given project doesn't exist!",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.type == 'Member+' &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'User is not authorised to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }

    let modules = await this.moduleModel
      .find({ _id: { $in: moduleIds }, project: projectId })
      .exec();
    moduleIds = modules.map((ele) => ele._id);

    const tasks = await this.taskModel
      .find({ module: { $in: moduleIds } }, { _id: 1 })
      .exec();

    const taskIds = tasks.map((ele) => ele._id);
    this.moduleModel.deleteMany({ _id: { $in: moduleIds } }).exec();
    this.todoModel.deleteMany({ task: taskIds }).exec();
    this.taskModel.deleteMany({ _id: { $in: taskIds } }).exec();

    modules.forEach((ele) => {
      this.utilsService.createBasicInfoActs(
        user._id,
        'Delete',
        'Module',
        undefined,
        { title: ele.module },
        { _id: ele._id },
        undefined,
        projectId,
      );
    });

    return { data: {}, message: '', success: true };
  }

  //========================================================//

  async getModules(user, milestoneId) {
    // const modules = await this.moduleModel.find({milestone: milestoneId}).exec();
    const modules = await this.moduleModel.aggregate([
      {
        $match: { milestone: mongoose.Types.ObjectId(milestoneId) },
      },
      {
        $lookup: {
          from: 'modulesorts',
          localField: '_id',
          foreignField: 'module',
          as: 'sequence',
        },
      },
      {
        $sort: { 'sequence.sequence': 1, _id: -1 },
      },
    ]);

    return { data: { modules: modules }, message: '', success: true };
  }

  //========================================================//

  async sortModules(user, orgId, milestoneId, modules) {
    const milestone = await this.milestoneModel
      .findOne({ _id: milestoneId })
      .exec();
    const project = await this.projectsService.getAppProject(
      { _id: milestone.project, organisation: orgId },
      {},
    );

    if (!project) {
      throw new HttpException(
        "Given set of parameters doesn't match up!",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!['Member++', 'Admin'].includes(user.type)) {
      if (String(user._id) != String(project.projectHead)) {
        throw new HttpException(
          'User is not authorised to perform this task',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const filteredModules = await this.moduleModel
      .find({ _id: { $in: Object.keys(modules) }, milestone: milestoneId })
      .exec();

    const moduleSequences = {};
    filteredModules.forEach((element) => {
      moduleSequences[String(element._id)] = modules[`${String(element._id)}`];
    });

    const sorts = await this.moduleSortModel
      .find({ module: { $in: Object.keys(moduleSequences) } })
      .exec();

    for (let i = 0; i < sorts.length; i++) {
      sorts[i].sequence = moduleSequences[String(sorts[i].module)];
      moduleSequences[String(sorts[i].module)] = undefined;
      sorts[i].save();
    }

    const x = [];
    const moduleIds = Object.keys(moduleSequences);
    for (let i = 0; i < moduleIds.length; i++) {
      if (moduleSequences[`${moduleIds[i]}`] != undefined) {
        x.push({
          module: moduleIds[i],
          sequence: modules[`${moduleIds[i]}`],
        });
      }
    }

    await this.moduleSortModel.insertMany(x);

    return { data: {}, success: true, message: '' };
  }

  //========================================================//

  async moveTasks(user, orgId, dto) {
    const tasks = await this.taskModel.find({ _id: dto.tasks }).exec();
    const project = await this.projectsService.getAppProject(
      { _id: tasks[0]?.project, organisation: orgId },
      {},
    );

    if (!project) {
      throw new HttpException(
        "Given task and organisation doesn't match up!",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!['Admin', 'Member++'].includes(user.type)) {
      if (String(project.projectHead) != String(user._id)) {
        throw new HttpException(
          'You are not authorised to perform this task!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let status;
    const activities = [];
    if (dto.milestone) {
      const oldMilestone = await this.milestoneModel
        .findOne({ _id: tasks[0].milestone })
        .exec();
      const milestone = await this.milestoneModel
        .findOne({ _id: dto.milestone, project: project._id })
        .exec();
      if (!milestone) {
        throw new HttpException(
          'Milestone does not exist!',
          HttpStatus.BAD_REQUEST,
        );
      }
      const module = await this.moduleModel
        .findOne({ _id: dto.module, milestone: milestone._id })
        .exec();

      tasks.forEach((element) => {
        if (String(element.project) == String(project._id)) {
          activities.push({
            operation: 'Move',
            type: 'Task',
            createdBy: user._id,
            field: 'Milestone',
            from: element.milestone,
            to: dto.milestone,
            description: `Task moved from one milestone to another milestone.`,
            task: element._id,
            meta: {
              fromMilestone: oldMilestone.title,
              toMilestone: milestone.title,
              toModule: module.module,
            },
          });

          element.milestone = dto.milestone;
          element.module = module?._id;
          if ((element.status = 'Active')) {
            status = 'Active';
          }
          element.lastUpdatedBy = user._id;
          element.save();
        }
      });
    } else if (dto.module) {
      const milestone = await this.milestoneModel
        .findOne({ _id: tasks[0].milestone })
        .exec();
      const module = await this.moduleModel
        .findOne({ _id: dto.module, milestone: milestone._id })
        .exec();
      if (!module) {
        throw new HttpException(
          'Module does not exist!',
          HttpStatus.BAD_REQUEST,
        );
      }
      tasks.forEach((element) => {
        if (String(element.project) == String(project._id)) {
          activities.push({
            operation: 'Move',
            type: 'Task',
            createdBy: user._id,
            field: 'Module',
            from: element.module,
            to: module._id,
            description: `Task moved from one module to another module.`,
            task: element._id,
            meta: {
              fromModule: element.module,
              toModule: dto.module,
            },
          });
          element.module = dto.module;
          element.lastUpdatedBy = user._id;
          element.save();
        }
      });
    }

    this.actsService.createActivity(activities);

    return { data: {}, message: 'Tasks successfully moved.', success: true };
  }

  //========================================================//

  async copyTasks(user, orgId, dto) {
    const tasks = await this.taskModel.find({ _id: dto.tasks }).exec();
    const project = await this.projectsService.getAppProject(
      { _id: tasks[0]?.project, organisation: orgId },
      {},
    );

    if (!project) {
      throw new HttpException(
        "Given task and organisation doesn't match up!",
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!['Admin', 'Member++'].includes(user.type)) {
      if (String(project.projectHead) != String(user._id)) {
        throw new HttpException(
          'You are not authorised to perform this task!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let status;
    const activities = [];
    const newTasksToCopy = [];

    if (dto.milestone) {
      const oldMilestone = await this.milestoneModel
        .findOne({ _id: tasks[0].milestone })
        .exec();
      const milestone = await this.milestoneModel
        .findOne({ _id: dto.milestone, project: project._id })
        .exec();
      if (!milestone) {
        throw new HttpException(
          'Milestone does not exist!',
          HttpStatus.BAD_REQUEST,
        );
      }
      const module = await this.moduleModel
        .findOne({ _id: dto.module, milestone: milestone._id })
        .exec();

      for (let index = 0; index < tasks.length; index++) {
        const element = tasks[index];
        if (String(element.project) == String(project._id)) {
          activities.push({
            operation: 'Move',
            type: 'Task',
            createdBy: user._id,
            field: 'Milestone',
            from: element.milestone,
            to: dto.milestone,
            description: `Task copied from one milestone to another milestone.`,
            task: element._id,
            meta: {
              fromMilestone: oldMilestone.title,
              toMilestone: milestone.title,
              toModule: module.module,
            },
          });

          element.milestone = dto.milestone;
          element.module = module?._id;
          if ((element.status = 'Active')) {
            status = 'Active';
          }
          element.lastUpdatedBy = user._id;

          const tempNewTask = {
            title: element.title,
            description: element.description,
            status: 'NotStarted',
            createdBy: user._id,
            milestone: milestone._id,
            project: project._id,
            dueDate: undefined,
            module: module?._id,
            childTasks: element.childTasks,
          };

          newTasksToCopy.push(tempNewTask);

          // element.save();
        }
      }

      const newTasks = await this.taskModel.create(newTasksToCopy);
      this.copyChildTasks(
        newTasks,
        user._id,
        milestone._id,
        project._id,
        module._id,
      );
      const newTasksIds = newTasks.map((el) => el._id);
      milestone.tasks.push(newTasksIds);
      milestone.save();
    } else if (dto.module) {
      const milestone = await this.milestoneModel
        .findOne({ _id: tasks[0].milestone })
        .exec();
      const module = await this.moduleModel
        .findOne({ _id: dto.module, milestone: milestone._id })
        .exec();
      if (!module) {
        throw new HttpException(
          'Module does not exist!',
          HttpStatus.BAD_REQUEST,
        );
      }
      tasks.forEach((element) => {
        if (String(element.project) == String(project._id)) {
          activities.push({
            operation: 'Move',
            type: 'Task',
            createdBy: user._id,
            field: 'Module',
            from: element.module,
            to: module._id,
            description: `Task copied from one module to another module.`,
            task: element._id,
            meta: {
              fromModule: element.module,
              toModule: dto.module,
            },
          });
          const tempNewTask = {
            title: element.title,
            description: element.description,
            status: 'NotStarted',
            createdBy: user._id,
            milestone: milestone._id,
            project: project._id,
            dueDate: undefined,
            module: module?._id,
            childTasks: element.childTasks,
          };

          newTasksToCopy.push(tempNewTask);
          element.module = dto.module;
          element.lastUpdatedBy = user._id;
          // element.save();
        }
      });
      const newTasks = await this.taskModel.create(newTasksToCopy);
      this.copyChildTasks(
        newTasks,
        user._id,
        milestone._id,
        project._id,
        module._id,
      );

      const newTasksIds = newTasks.map((el) => el._id);
      console.log('newTasksIds', newTasksIds);
      milestone.tasks = [...newTasksIds, ...milestone.tasks];
      milestone.save();
    }

    this.actsService.createActivity(activities);

    return { data: {}, message: 'Tasks successfully moved.', success: true };
  }

  //========================================================//
  async copyChildTasks(newTasks, userId, milestoneId, projectId, moduleId) {
    const childTasksIds = {};

    for (let index = 0; index < newTasks.length; index++) {
      const element = newTasks[index];
      const parentId = element._id;
      if (element.childTasks.length) {
        const childTasks = await this.taskModel
          .find({ _id: element.childTasks })
          .exec();

        const newChildTasksToCopy = childTasks.map((el) => {
          return {
            title: el.title,
            description: el.description,
            status: 'NotStarted',
            createdBy: userId,
            milestone: milestoneId,
            project: projectId,
            dueDate: undefined,
            module: moduleId,
            parent: parentId,
          };
        });

        const newChildTasks = await this.taskModel.create(newChildTasksToCopy);

        let newChildTasksIds;

        if (newChildTasks?.length) {
          newChildTasksIds = newChildTasks.map((el) => el._id);
          childTasksIds[parentId] = newChildTasksIds;
          element.childTasks = newChildTasksIds;
          element.save();
        }
      }
    }

    return childTasksIds;
  }

  //========================================================//

  async moveModules(user, orgId, moduleIds, milestoneId) {
    const modules = await this.moduleModel.find({ _id: moduleIds }).exec();
    const project = await this.projectsService.getAppProject(
      { _id: modules[0]?.project, organisation: orgId },
      {},
    );

    if (!project) {
      throw new HttpException(
        'Module does not exist in given organisation!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const milestone = await this.milestoneModel
      .findOne({ _id: milestoneId, project: project._id })
      .exec();

    if (!milestone) {
      throw new HttpException(
        'Given data is incorect!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const oldMilestone = await this.milestoneModel
      .findOne({ _id: modules[0].milestone })
      .exec();

    const activities = [];
    const filteredModules = [];
    modules.forEach((ele) => {
      filteredModules.push(ele._id);

      activities.push({
        operation: 'Move',
        type: 'Module',
        createdBy: user._id,
        field: 'Milestone',
        from: ele.milestone,
        to: milestoneId,
        description: `Module moved from one milestone to another.`,
        meta: {
          fromMilestone: oldMilestone.title,
          toMilestone: milestone.title,
        },
        module: ele._id,
      });
      ele.milestone = milestoneId;
      ele.lastUpdatedBy = user._id;
      ele.save();
    });

    this.actsService.createActivity(activities);

    await this.taskModel.updateMany(
      { module: { $in: filteredModules } },
      { $set: { milestone: mongoose.Types.ObjectId(milestoneId) } },
    );

    return { data: {}, message: 'Modules moved successfully.', success: true };
  }

  //========================================================//

  async changeMultipleTasksData(
    user,
    orgId,
    projectId,
    tasks,
    dueDate,
    assignees,
    platforms,
  ) {
    const project = await this.projectsService.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );

    if (!project) {
      throw new HttpException(
        'Project does not exist in this organisation!',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      user.type == 'Member+' &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'User is not authorised to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const taskIds = tasks.map((element) => mongoose.Types.ObjectId(element));
    const setPara = {};

    if (dueDate) {
      setPara['dueDate'] = new Date(dueDate);
    }

    if (platforms) {
      const filteredPlatforms = platforms.map((ele) => {
        if (project.platform.includes(ele)) {
          return ele;
        }
      });
      setPara['platforms'] = filteredPlatforms;
    }
    const filteredAssignees = [];
    if (assignees) {
      for (let i = 0; i < assignees.length; i++) {
        if (await this.utilsService.projectAssociation(project, assignees[i])) {
          filteredAssignees.push(mongoose.Types.ObjectId(assignees[i]));
        }
      }
      if (filteredAssignees.length > 0) {
        setPara['assignees'] = filteredAssignees;
        const assigneesStatus = [];
        filteredAssignees.forEach((ele) => {
          assigneesStatus.push({
            assignee: ele,
            status: 'NotStarted',
          });
        });
        setPara['assigneesStatus'] = assigneesStatus;
      }
    }
    const tasksDetailedOld = await this.taskModel
      .find({ _id: { $in: taskIds }, project: project._id })
      .lean();
    const oldTasksObj = {};

    tasksDetailedOld.forEach((ele) => {
      oldTasksObj[ele._id] = ele;
    });

    await this.taskModel
      .updateMany(
        { _id: { $in: taskIds }, project: project._id },
        { $set: setPara },
      )
      .exec();

    const tasksDetailedNew = await this.taskModel
      .find(
        { _id: { $in: taskIds }, project: project._id },
        { dueDate: 1, platforms: 1, assignees: 1 },
      )
      .exec();

    tasksDetailedNew.forEach((ele) => {
      if (assignees) {
        this.utilsService.createAssigneeActs(
          user._id,
          ele._id,
          'Task',
          oldTasksObj[String(ele._id)].assignees,
          ele.assignees,
          projectId,
        );
      }
      if (dueDate || platforms) {
        this.utilsService.createBasicInfoActs(
          user._id,
          'Update',
          'Task',
          { ...setPara, assignees: undefined },
          undefined,
          oldTasksObj[String(ele._id)],
          ele,
          projectId,
        );
      }
    });

    return { data: {}, success: true, message: '' };
  }

  //========================================================//

  async updateTaskAttachments(
    user,
    orgId,
    taskId,
    removeAttachments,
    addAttachments,
  ) {
    let task = await this.getTaskPopulated({ _id: taskId });
    const project = await this.projectsService.getAppProject(
      { _id: task.project },
      {},
    );

    if (!project || String(project.organisation) != orgId) {
      throw new HttpException(
        "Given set of organisation, project, milestone, and task doesn't add up",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!['Member++', 'Admin'].includes(user.type)) {
      if (String(project.projectHead) != String(user._id)) {
        throw new HttpException(
          'User not authorised to perform this task!',
          HttpStatus.FORBIDDEN,
        );
      }
    }
    const proAttach = [];
    if (addAttachments?.length > 0) {
      for (let i = 0; i < addAttachments.length; i++) {
        proAttach.push(
          await this.utilsService.uploadFileS3(
            addAttachments[i],
            ConfigService.keys.FOLDER_BUG_ATTACHMENT,
          ),
        );
      }

      if (task.attachments) {
        task.attachments.push(...proAttach);
      } else {
        task.attachments = proAttach;
      }
    }

    if (removeAttachments) {
      removeAttachments = JSON.parse(removeAttachments);
      for (let i = 0; i < removeAttachments.length; i++) {
        this.utilsService.deleteFileS3(
          removeAttachments[i],
          ConfigService.keys.FOLDER_BUG_ATTACHMENT,
        );
        let j = 0;
        for (j = 0; j < task.attachments.length; j++) {
          if (task.attachments[j] == removeAttachments[i]) {
            task.attachments.splice(j, 1);
            break;
          }
        }
      }
    }

    task = await task.save({ new: true });

    return { data: { task }, success: true, message: '' };
  }

  //========================================================//

  async recalculateTaskMilestonStatus(user, task) {
    const taskStatus = task.status;
    let [active, completed, notStarted, onHold] = [0, 0, 0, 0];
    task.assigneesStatus.forEach((ele) => {
      if (ele.status == 'Active') {
        active += 1;
      } else if (ele.status == 'Completed') {
        completed += 1;
      } else if (ele.status == 'NotStarted') {
        notStarted += 1;
      } else if (ele.status == 'OnHold') {
        onHold += 1;
      }
    });

    if (notStarted > 0 && notStarted === task.assigneesStatus.length) {
      task.status = 'NotStarted';
    } else if (completed > 0 && completed === task.assigneesStatus.length) {
      task.status = 'Completed';
    } else if (onHold > 0 && onHold === task.assigneesStatus.length) {
      task.status = 'OnHold';
    } else if (task.assigneesStatus.length > 0) {
      task.status = 'Active';
    }

    if (taskStatus == task.status) {
      return;
    }

    await task.save();

    this.updateMilestoneStatus(user._id, task.milestone);
    return;
  }

  async searchMilestoneText(projectId, text) {
    const result = await this.milestoneModel
      .find({
        project: projectId,
        $text: {
          $search: `${text}`,
          $caseSensitive: false,
          $diacriticSensitive: false,
        },
      })
      .exec();
    return result;
  }

  async searchTaskText(projectId, text) {
    const result = await this.taskModel
      .find({
        project: projectId,
        $text: {
          $search: `${text}`,
          $caseSensitive: false,
          $diacriticSensitive: false,
        },
      })
      .exec();
    return result;
  }

  async searchModuleText(projectId, text) {
    const result = await this.moduleModel
      .find({
        project: projectId,
        $text: {
          $search: `${text}`,
          $caseSensitive: false,
          $diacriticSensitive: false,
        },
      })
      .exec();
    return result;
  }
}
