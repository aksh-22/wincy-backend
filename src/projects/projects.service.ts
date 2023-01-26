import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { OrganisationsService } from 'src/organisations/organisations.service';
import { UsersService } from 'src/users/users.service';
import { UtilsService } from 'src/utils/utils.service';
import * as mongoose from 'mongoose';
import { TasksService } from 'src/tasks/tasks.service';
import { BugsService } from 'src/bugs/bugs.service';
import { SystemService } from 'src/system/system.service';
import { ActivitiesService } from 'src/activities/activities.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { InvoicesService } from 'src/invoices/invoices.service';
import { Project_Type } from './enum/project.enum';
const activityType = 'Project';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel('Project') private readonly projectModel: Model<any>,
    @InjectModel('Attachment') private readonly attachmentModel: Model<any>,
    @InjectModel('Section') private readonly sectionModel: Model<any>,
    @InjectModel('PaymentPhase') private readonly paymentPhaseModel: Model<any>,
    private readonly systemService: SystemService,
    private readonly utilsService: UtilsService,
    @Inject(forwardRef(() => OrganisationsService))
    private readonly orgService: OrganisationsService,
    private readonly usersService: UsersService,
    private readonly tasksService: TasksService,
    private readonly bugsService: BugsService,
    private actsService: ActivitiesService,
    private invoiceService: InvoicesService,
    private readonly notifyService: NotificationsService,
  ) {}

  //================================================//

  async createProject(user, dto, logo, orgId) {
    if (user.type != 'Admin') {
      dto.client = undefined;
      dto.clientCountry = undefined;
      dto.clientEmail = undefined;
      dto.amountNote = undefined;
      dto.amount = undefined;
      dto.paymentMode = undefined;
      dto.currency = undefined;
    }
    dto.clientData = {
      name: dto.client
        ? await this.utilsService.encryptData(dto.client)
        : undefined,
      country: dto.clientCountry
        ? await this.utilsService.encryptData(dto.clientCountry)
        : undefined,
      email: dto.clientEmail
        ? await this.utilsService.encryptData(dto.clientEmail)
        : undefined,
    };
    dto.paymentInfo = {
      note: dto.amountNote
        ? await this.utilsService.encryptData(dto.amountNote)
        : undefined,
      amount: dto.amount
        ? await this.utilsService.encryptData(dto.amount)
        : undefined,
      paymentMode: dto.paymentMode
        ? await this.utilsService.encryptData(dto.paymentMode)
        : undefined,
      currency: dto.currency
        ? await this.utilsService.encryptData(dto.currency)
        : undefined,
    };

    let project = new this.projectModel(dto);
    project.createdBy = user._id;
    project.organisation = orgId;
    if (logo) {
      project.logo = await this.utilsService.uploadFileS3(
        logo,
        ConfigService.keys.FOLDER_PROJECT_LOGO,
      );
    }
    project = await project.save();
    const org = await this.orgService.getOrganisation({ _id: orgId });
    org.projects.push(project._id);
    await org.save();

    this.utilsService.createBasicInfoActs(
      user._id,
      'Create',
      'Project',
      undefined,
      { title: project.title },
      undefined,
      { _id: project._id },
      project._id,
    );

    return {
      message: 'Project created successfully',
      data: { project },
      status: 'Successful',
    };
  }

  //=================================================//

  async updateProject(user, dto, logo, projectId, orgId) {
    let project;
    if (user.type == 'Member+' || user.type == 'Member++') {
      project = await this.projectModel.findOne({ _id: projectId }).exec();
    } else {
      project = await this.getProjectSensitivePopu({ _id: projectId });
    }
    if (!project || String(project?.organisation) != orgId) {
      throw new HttpException(
        "Given set of Project and Organisation doesn't add up or doesn't exists at all",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      user.type == 'Member+' &&
      project.projectHead &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'User is not authorised to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }

    // let oldDto = {};

    // for(const [key, value] of Object.entries(dto)){
    //   if(value !== undefined){
    //     oldDto[key] = project[key];
    //   }
    // }

    const oldPorject = JSON.parse(JSON.stringify(project));
    const platforms = [];
    const technologies = [];
    if (dto.platforms) {
      const systemPlatforms = await this.systemService.getPlatforms({});
      const sysplat = [];
      systemPlatforms.forEach((element) => {
        sysplat.push(element.platform);
      });
      dto.platforms.forEach((element) => {
        if (sysplat.includes(element)) {
          platforms.push(element);
        }
      });
      project.platforms = platforms;
    }

    project.onHoldReason =
      dto.onHoldReason !== undefined ? dto.onHoldReason : project.onHoldReason;
    if (dto.technologies) {
      const systemTechs = await this.systemService.getTechnologies();
      const systech = [];
      systemTechs.forEach((element) => {
        systech.push(element.technology);
      });
      dto.technologies.forEach((element) => {
        if (systech.includes(element)) {
          technologies.push(element);
        }
      });
      project.technologies = technologies;
    }
    if (logo) {
      if (project.logo) {
        await this.utilsService.deleteFileS3(
          project.logo,
          ConfigService.keys.FOLDER_PROJECT_LOGO,
        );
      }
      project.logo = await this.utilsService.uploadFileS3(
        logo,
        ConfigService.keys.FOLDER_PROJECT_LOGO,
      );
      dto.logo = project.logo;
    }
    if (user.type == 'Admin') {
      project.clientData.name = dto.client
        ? await this.utilsService.encryptData(dto.client)
        : project.clientData?.name;
      project.clientData.country = dto.clientCountry
        ? await this.utilsService.encryptData(dto.clientCountry)
        : project.clientData?.country;
      project.clientData.email = dto.clientEmail
        ? await this.utilsService.encryptData(dto.clientEmail)
        : project.clientData?.email;

      project.paymentInfo.note = dto.amountNote
        ? await this.utilsService.encryptData(dto.amountNote)
        : project.paymentInfo.amountNote;
      project.paymentInfo.amount = dto.amount
        ? await this.utilsService.encryptData(dto.amount)
        : project.paymentInfo.amount;
      project.paymentInfo.paymentMode = dto.paymentMode
        ? await this.utilsService.encryptData(dto.paymentMode)
        : project.paymentInfo.paymentMode;
      project.paymentInfo.currency = dto.currency
        ? await this.utilsService.encryptData(dto.currency)
        : project.paymentInfo.currency;
    }

    project.title = dto.title ? dto.title : project.title;
    project.description = dto.description
      ? dto.description
      : project.description;
    project.category = dto.category ? dto.category : project.category;
    project.status = dto.status ? dto.status : project.status;

    if (dto.completedAt) {
      project.completedAt = new Date(dto.completedAt);
      project.status = 'Completed';
    } else if (dto.status == 'Completed') {
      project.completedAt = Date.now();
      project.status = 'Completed';
    }

    project.awardedAt = dto.awardedAt
      ? new Date(dto.awardedAt)
      : project.awardedAt;
    project.startedAt = dto.startedAt
      ? new Date(dto.startedAt)
      : project.startedAt;
    project.dueDate = dto.dueDate ? new Date(dto.dueDate) : project.dueDate;
    project.expectedDuration = dto.expectedDuration
      ? parseInt(dto.expectedDuration)
      : project.expectedDuration;
    project.lastUpdatedBy = user._id;

    project = await project.save({ new: true });
    project = await project
      .populate('team')
      .populate('projectHead')
      .execPopulate();
    project = await this.decryptProjectData(project);

    this.utilsService.createBasicInfoActs(
      user._id,
      'Update',
      'Project',
      dto,
      undefined,
      oldPorject,
      project,
      projectId,
    );

    return {
      message: 'Project successfully updated',
      status: 'Successful',
      data: { project },
    };
  }

  //==================================================//

  async runThisQuery(projectId, orgId) {
    const project = await this.projectModel.findOne({ _id: projectId });
    await this.usersService.updateUsers(
      {
        $and: [
          {
            $or: [{ _id: project.projectHead }, { _id: { $in: project.team } }],
          },
          { 'projects.organisation': orgId },
        ],
      },
      { $pull: { 'projects.$.projects': projectId } },
      { multi: true },
    );

    return true;
  }

  //==================================================//

  async getAppProject(args, projections) {
    const project = await this.projectModel.findOne(args, projections).exec();
    return project;
  }

  //==================================================//

  async getProjectSensitive(args) {
    const project = await this.projectModel
      .findOne(args)
      .select('+paymentInfo')
      .select('+clientData')
      .select('+createdBy')
      .exec();
    return project;
  }

  async getProjectSensitivePopu(args) {
    const project = await this.projectModel
      .findOne(args)
      .select('+paymentInfo')
      .select('+clientData')
      .select('+createdBy')
      .populate('team', ['name', 'profilePicture'])
      .populate('projectHead', ['name', 'profilePicture'])
      .populate('createdBy', ['name', 'profilePicture'])
      .populate('lastUpdatedBy', ['name', 'profilePicture'])
      .exec();
    return project;
  }
  //==================================================//

  async getProject(user, projectId, orgId) {
    let project;
    if (['Admin'].includes(user.type)) {
      project = await this.projectModel
        .findOne({ _id: projectId, organisation: orgId })
        .populate('team', ['name', 'profilePicture'])
        .populate('projectHead', ['name', 'profilePicture'])
        .populate('createdBy', ['name', 'profilePicture'])
        .populate('lastUpdatedBy', ['name', 'profilePicture'])
        .select([
          '+paymentInfo',
          '+credentials',
          '+clientData',
          '+createdBy',
          '+lastUpdatedBy',
        ])
        .lean();
    } else {
      project = await this.projectModel
        .findOne({ _id: projectId })
        .populate('team', ['name', 'profilePicture'])
        .populate('projectHead', ['name', 'profilePicture'])
        .select(['+credentials'])
        .lean();

      const team = [];
      project.team?.forEach((element) => {
        team.push(String(element._id));
      });
      project.projectHead
        ? team.push(String(project.projectHead._id))
        : undefined;

      if (!team.includes(String(user._id)) && user.type != 'Member++') {
        throw new HttpException(
          'You are not authorised to perform this task',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    project = await this.decryptProjectData(project);

    const count = await this.tasksService.getMilestoneCount([project._id]);
    const { todosCount, tasksCount } = await this.tasksService.getTasksCount(
      projectId,
    );
    project = { ...project, milestoneCount: count[`${String(project._id)}`] };
    return {
      status: 'Successful',
      data: { project, tasksCount, todosCount },
      message: '',
    };
  }

  async addAttachments(
    user,
    orgId,
    projectId,
    folder,
    attachments,
    storageLink,
    name,
  ) {
    let project = await this.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );
    if (!project) {
      throw new HttpException(
        'Given set of organisation and project does not exist!',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      user.type == 'Member+' &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'You are not authorised Perform this task!!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const proAttach = [];
    if (attachments?.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        proAttach.push({
          type: 'Folder',
          name: attachments[i].originalname,
          attachment: await this.utilsService.uploadFileS3(
            attachments[i],
            ConfigService.keys.FOLDER_PROJECT_ATTACHMENT,
          ),
          folder,
          createdBy: user._id,
          project: project._id,
        });
      }
    } else if (storageLink) {
      proAttach.push({
        type: 'StorageLink',
        name: name || 'undefined',
        storageLink,
        folder,
        createdBy: user._id,
        project: projectId,
      });
    } else if (folder) {
      proAttach.push({
        type: 'Folder',
        folder,
        name: folder,
        createdBy: user._id,
        project: project._id,
      });
    }
    attachments = await this.attachmentModel.insertMany(proAttach);

    // const activities = [];
    // proAttach.forEach(ele => {
    //   activities.push({
    //     operation: "Create",
    //     type: activityType,
    //     createdBy: user._id,
    //     field: "Attachment",
    //     description: ele.type == "StorageLink" ? `Attachment: ${ele.name} added to project: ${project.title}.` : `Folder: ${ele.name} created in project: ${project.title}.`,
    //     project: project._id,
    //   })
    // })

    // this.actsService.createActivity(activities);

    attachments.forEach((element) => {
      element._doc.createdBy = {
        name: user.name,
        email: user.email,
        userType: user.userType,
        profilePicture: user.profilePicture,
      };
    });

    return {
      status: 'Successful',
      data: { attachments },
      message: 'Files uploaded successfully.',
    };
  }

  async removeAttachments(user, projectId, orgId, dto) {
    let project = await this.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );
    if (!project) {
      throw new HttpException(
        'Given set of organisation and project does not exist!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.type == 'Member+' &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'You are not authorised Perform this task!!',
        HttpStatus.BAD_REQUEST,
      );
    }

    let attachments;
    if (dto.folder) {
      attachments = await this.attachmentModel.find({
        project: projectId,
        folder: dto.folder,
      });
    } else if (dto.storageLinks) {
      attachments = await this.attachmentModel.find({
        _id: dto.storageLinks,
        project: projectId,
      });
    }

    for (let j = 0; j < attachments?.length; j++) {
      if (attachments[j].attachment) {
        await this.utilsService.deleteFileS3(
          attachments[j].attachment,
          ConfigService.keys.FOLDER_PROJECT_ATTACHMENT,
        );
      }
    }
    if (dto.folder) {
      const folder = await this.attachmentModel
        .findOne({ _id: dto.folder, type: 'Folder' })
        .exec();
      this.attachmentModel
        .deleteMany({
          project: projectId,
          folder: folder.folder,
        })
        .exec();
    } else if (dto.attachments) {
      await this.attachmentModel.deleteMany({
        project: projectId,
        _id: { $in: dto.attachments },
      });
    } else if (dto.storageLinks?.length > 0) {
      this.attachmentModel
        .deleteMany({
          project: projectId,
          _id: { $in: dto.storageLinks },
        })
        .exec();
    }

    // if(dto.folder && attachments[0].folder){
    //   this.actsService.createActivity([{
    //     operation: "Update",
    //     type: activityType,
    //     createdBy: user._id,
    //     field: "Attachments",
    //     description: `Folder: ${attachments[0].folder}, along with ${attachments.length} files inside got deleted.`,
    //     project: project._id,
    //   }])
    // }
    // else if(dto.storageLinks){
    //   const activities = [];
    //   for(let i=0; i < attachments.length; i++){
    //     activities.push({
    //       operation: "Update",
    //         type: activityType,
    //         createdBy: user._id,
    //         field: "Attachments",
    //         description: `Attachment: ${attachments[i].name}, got deleted.`,
    //         project: project._id,
    //     })
    //   }

    //   this.actsService.createActivity(activities);
    // }

    return {
      status: 'Successful',
      data: {},
      message: 'Files deleted Successfully.',
    };
  }

  async renameAndUpdateAttachment(
    user,
    orgId,
    projectId,
    attachmentId,
    name,
    storageLink,
  ) {
    let project = await this.getAppProject(
      { _id: projectId, organisation: orgId },
      {},
    );
    if (!project) {
      throw new HttpException(
        'Given set of organisation and project does not exist!',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      user.type == 'Member+' &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        'You are not authorised Perform this task!!',
        HttpStatus.BAD_REQUEST,
      );
    }

    let attachment = await this.attachmentModel
      .findOne({ _id: attachmentId, project: projectId })
      .exec();
    if (!attachment) {
      throw new HttpException(
        'No such attachment exists!',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (attachment.type == 'Folder') {
      this.attachmentModel
        .updateMany(
          {
            folder: attachment.name,
            project: mongoose.Types.ObjectId(projectId),
          },
          { $set: { folder: name } },
        )
        .exec();
      // this.actsService.createActivity([{
      //   operation: "Update",
      //   type: activityType,
      //   createdBy: user._id,
      //   field: "Folder",
      //   from: attachment.folder,
      //   to: name,
      //   description: `Project info for folder name changed from ${attachment.folder} to ${name}.`,
      //   project: project._id,
      // }])
      attachment.folder = name;
    }

    if (attachment.type == 'StorageLink' && storageLink) {
      // this.actsService.createActivity([{
      //   operation: "Update",
      //   type: activityType,
      //   createdBy: user._id,
      //   field: "StorageLink",
      //   from: attachment.storageLink,
      //   to: storageLink,
      //   description: `Storage-Link changed for ${attachment.name}.`,
      //   project: project._id,
      // }])
      attachment.storageLink = storageLink;
    }

    if (name && attachment.type == 'StorageLink') {
      // this.actsService.createActivity([{
      //   operation: "Update",
      //   type: activityType,
      //   createdBy: user._id,
      //   field: "StorageLink Name",
      //   from: attachment.name,
      //   to: name,
      //   description: `Storage-Link's name changed from ${attachment.name} to ${name}.`,
      //   project: project._id,
      // }])
    }
    attachment.name = name || attachment.name;

    attachment = await attachment.save({ new: true });

    return { data: { attachment }, message: '', success: true };
  }

  async decryptProjectData(project) {
    if (project.clientData) {
      project.clientData.name = project.clientData.name
        ? await this.utilsService.decryptData(project.clientData?.name)
        : undefined;
      project.clientData.country = project.clientData.country
        ? await this.utilsService.decryptData(project.clientData?.country)
        : undefined;
      project.clientData.email = project.clientData.email
        ? await this.utilsService.decryptData(project.clientData?.email)
        : undefined;
    }
    if (project.credentials) {
      project.credentials.forEach((element) => {
        element.platform = element.platform
          ? this.utilsService.decryptData(element.platform)
          : undefined;
        element.username = element.username
          ? this.utilsService.decryptData(element.username)
          : undefined;
        element.password = element.password
          ? this.utilsService.decryptData(element.password)
          : undefined;
        element.key = element.key
          ? this.utilsService.decryptData(element.key)
          : undefined;
      });
    }
    if (project.paymentInfo) {
      project.paymentInfo.amount = project.paymentInfo.amount
        ? await this.utilsService.decryptData(project.paymentInfo.amount)
        : undefined;
      project.paymentInfo.note = project.paymentInfo.note
        ? await this.utilsService.decryptData(project.paymentInfo.note)
        : undefined;
      project.paymentInfo.paymentMode = project.paymentInfo.paymentMode
        ? await this.utilsService.decryptData(project.paymentInfo.paymentMode)
        : undefined;
      project.paymentInfo.currency = project.paymentInfo.currency
        ? await this.utilsService.decryptData(project.paymentInfo.currency)
        : undefined;
    }

    return project;
  }

  //==================================================//

  async getProjectAttachments(user, projectId, orgId) {
    let project = await this.getAppProject({ _id: projectId }, {});
    if (!project || String(project.organisation) != orgId) {
      throw new HttpException(
        'Given set of organisation and project does not exist!',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      !['Admin', 'Member++'].includes(user.type) &&
      !(await this.utilsService.projectAssociation(project, String(user._id)))
    ) {
      throw new HttpException(
        'you are not authorised see this information!',
        HttpStatus.FORBIDDEN,
      );
    }

    const attachments = await this.attachmentModel.aggregate([
      { $match: { project: mongoose.Types.ObjectId(projectId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      {
        $project: {
          'createdBy.sessions': 0,
          'createdBy.password': 0,
          'createdBy.accountDetails': 0,
          'createdBy.projects': 0,
        },
      },
      {
        $group: {
          _id: { folder: '$folder' },
          attachments: { $push: '$$ROOT' },
        },
      },
    ]);
    return { status: 'Successful', data: { attachments }, message: '' };
  }

  //==================================================//

  async getMyProjects(user, orgId, status, projectType) {
    const fields = [
      'title',
      'logo',
      'startedAt',
      'dueDate',
      'team',
      'projectHead',
      'technologies',
      'projectType',
    ];
    const projections = {};
    const projectList = [];
    let users = [];
    fields.forEach((element) => {
      projections[element] = 1;
    });
    let projects;
    if (['Admin', 'Member++'].includes(user.type)) {
      projects = await this.projectModel
        .find(
          {
            organisation: orgId,
            status,
            projectType:
              projectType === Project_Type.DEVELOPMENT
                ? [undefined, projectType]
                : projectType,
          },
          projections,
        )
        .sort({ _id: -1 });
    } else {
      projects = await this.projectModel
        .find(
          {
            organisation: orgId,
            status,
            projectType:
              projectType === Project_Type.DEVELOPMENT
                ? [undefined, projectType]
                : projectType,
            $or: [{ team: user._id }, { projectHead: user._id }],
          },
          projections,
        )
        .sort({ _id: -1 });
    }

    projects.forEach((element) => {
      if (element.team.length > 0) {
        users.push(...element.team);
      }
      if (element.projectHead) {
        users.push(element.projectHead);
      }
      projectList.push(element._id);
    });

    const count = await this.tasksService.getMilestoneCount(projectList);

    users = [...new Set(users)];

    users = await this.usersService.getMultUsers(
      { _id: { $in: users } },
      { name: 1, profilePicture: 1 },
    );

    for (let i = 0; i < projects.length; i++) {
      let teamFull = [];
      let team = [];
      if (projects[i].team.length > 0) {
        projects[i].team.forEach((element1) => {
          team.push(String(element1));
        });
      }
      const { todosCount, tasksCount } = await this.tasksService.getTasksCount(
        projects[i]._id,
      );

      users.forEach((element1) => {
        if (team.includes(String(element1._id))) {
          teamFull.push(element1);
        } else if (String(projects[i].projectHead) == String(element1._id)) {
          projects[i].projectHead = element1;
        }
      });
      let a = todosCount;
      let b = tasksCount;
      projects[i].team = teamFull;
      projects[i]._doc.todosCount = a;
      projects[i]._doc.tasksCount = b;
      projects[i]._doc.milestoneCount = {};
      projects[i]._doc.milestoneCount = count[String(projects[i]._id)];
    }

    return { message: '', data: { projects }, status: 'Successful' };
  }

  //==================================================//

  async getUsersProjectSelection(user, orgId, projectId) {
    const project = await this.projectModel.findOne({ _id: projectId });
    if (
      project &&
      user.type == 'Member+' &&
      String(project.projectHead) != String(user._id)
    ) {
      throw new HttpException(
        "Either you are not authorised to perform this task or given data don't match up",
        HttpStatus.FORBIDDEN,
      );
    }
    const org = await this.orgService.getOrganisation({ _id: orgId });
    if (!org) {
      throw new HttpException(
        'No such organisation exists!',
        HttpStatus.BAD_REQUEST,
      );
    }
    let users = [...org.users, org.owner];
    users = await this.usersService.getMultUsers(
      { _id: { $in: users } },
      { name: 1, profilePicture: 1, userType: 1, email: 1 },
    );

    return { message: '', data: { users }, status: 'Successful' };
  }

  //==================================================//

  async deleteProject(user, orgId, projectId) {
    const project = await this.getAppProject({ _id: projectId }, {});

    if (!project) {
      throw new HttpException(
        'No such project exists in provided organisation!!',
        HttpStatus.BAD_REQUEST,
      );
    }
    this.projectModel.deleteOne({ _id: projectId, organisation: orgId }).exec();
    this.bugsService.deleteBugsApp({ project: projectId });
    this.tasksService.deleteTasksApp({ project: projectId });
    this.tasksService.deleteMilestonesApp({ project: projectId });
    let remove = [project.projectHead, ...(project.team || [])];
    remove = remove.filter(Boolean);

    await this.usersService.updateUsers(
      {
        $and: [
          {
            _id: { $in: remove },
          },
          { 'userType.organisation': orgId },
        ],
      },
      { $pull: { 'projects.$.projects': projectId } },
      { multi: true },
    );

    this.utilsService.createBasicInfoActs(
      user._id,
      'Delete',
      'Project',
      undefined,
      { title: project.title },
      { _id: project._id },
      undefined,
      projectId,
    );

    return {
      success: true,
      data: {},
      message: 'Project successfully deleted.',
    };
  }

  //==================================================//

  async getProjectUserMinimised(user, orgId) {
    let filter = {};
    if (['Admin', 'Member++'].includes(user.type)) {
      filter = { organisation: orgId };
    } else {
      filter = {
        organisation: orgId,
        $or: [{ team: user._id }, { projectHead: user._id }],
      };
    }
    const projects = await this.projectModel
      .find(filter, { _id: 1, title: 1, logo: 1, platforms: 1 })
      .exec();
    return { data: { projects }, success: true, message: '' };
  }
  //==================================================//

  async deleteProjects(projects) {
    const delTasks = await this.tasksService.deleteTasksApp({
      project: { $in: projects },
    });
    const delBugs = await this.bugsService.deleteBugsApp({
      project: { $in: projects },
    });
    const delMileStones = await this.tasksService.deleteMilestonesApp({
      project: { $in: projects },
    });
    const delProjects = await this.projectModel
      .deleteMany({ _id: { $in: projects } })
      .exec();

    return { delProjects, delTasks, delMileStones, delBugs };
  }
  //==================================================//

  async assignProject(user, team, projectHead, orgId, projectId) {
    //1. make sure project is associated with given organisation
    let project = await this.getAppProject({ _id: projectId }, {});
    if (!project || String(project.organisation) != orgId) {
      throw new HttpException('Invalid Project', HttpStatus.BAD_REQUEST);
    }
    //2. see Member+ is project head as well, and if he is then dto.projectHead = undefined
    if (user.type == 'Member+') {
      if (String(user._id) != String(project.projectHead)) {
        throw new HttpException(
          'You are not Authorized to perform this task',
          HttpStatus.BAD_REQUEST,
        );
      }
      // else {
      //   if (projectHead) {
      //     projectHead = undefined;
      //   }
      // }
    }
    const oldProject = JSON.parse(JSON.stringify(project));

    //3. create add and remove arrays to see where we need to add the reference and where we need to remove it from
    let prevTeamFull = [project.projectHead, ...(project.team || [])];
    prevTeamFull = prevTeamFull.filter(Boolean); // Old team with all the user ids

    if (!projectHead && team && team.includes(String(project.projectHead))) {
      team.splice(team.indexOf(project.projectHead), 1); // removes project-head from input team array if it's there
    } else if (projectHead && team && team.includes(projectHead)) {
      team.splice(team.indexOf(projectHead), 1); // removes new project-head if he also is in the team
    } else if (projectHead && !team) {
      team = project.team.map((x) => String(x));
      if (team.includes(projectHead)) {
        team.splice(team.indexOf(projectHead), 1);
      }
    }

    team = team ? [...new Set(team)] : undefined;

    let currTeamFull = [
      projectHead !== undefined
        ? projectHead !== ''
          ? projectHead
          : undefined
        : project.projectHead
        ? String(project.projectHead)
        : undefined,
      ...team,
    ];
    currTeamFull = currTeamFull.filter(Boolean);
    currTeamFull = [...new Set(currTeamFull)];

    const remove = [];
    const add = [];
    const currTeamObj = {};
    const prevTeamObj = {};
    let removeHeadTeam;

    prevTeamFull.forEach((x) => {
      prevTeamObj[`${String(x._id)}`] = `${String(x._id)}`;
    });
    currTeamFull.forEach((x) => {
      currTeamObj[x] = x;
    });

    if (projectHead && team == undefined && prevTeamObj[`${projectHead}`]) {
      removeHeadTeam = true;
    }
    Object.keys(prevTeamObj).forEach((x) => {
      if (!currTeamObj[x]) {
        remove.push(mongoose.Types.ObjectId(x));
      }
    });
    currTeamFull.forEach((x) => {
      if (!prevTeamObj[`${x}`]) {
        add.push(mongoose.Types.ObjectId(x));
      }
    });

    //4. remove project references from the bugs and tasks according to remove array, but not from the completed tasks
    await this.bugsService.updateBugsApp(
      {
        project: projectId,
        isCompleted: false,
        assignee: { $in: remove },
      },
      { $set: { assignee: undefined } },
      { multi: true },
    );
    await this.tasksService.updateTasksApp(
      {
        status: { $ne: 'Completed' },
        project: projectId,
        assignee: { $in: remove },
      },
      { $set: { assignee: undefined } },
      { multi: true },
    );
    //5. remove project's reference from the user
    await this.usersService.updateUsers(
      {
        $and: [
          {
            _id: { $in: remove },
          },
          { 'userType.organisation': orgId },
        ],
      },
      { $pull: { 'projects.$.projects': projectId } },
      { multi: true },
    );

    //6. add dto.projectHead to the team if he is not member+
    const users = await this.usersService.getMultUsers(
      {
        _id: { $in: currTeamFull },
        'userType.organisation': orgId,
      },
      {},
    );

    let detailedHeadNew;
    const detailedTeamObj = {};
    let removedUsers = {};
    const updatedTeam = [];
    const detailedTeam = [];
    const activities = [];
    if (remove.length > 0) {
      const removedUsersDetailed = await this.usersService.getMultUsers(
        { _id: { $in: remove } },
        { name: 1 },
      );
      removedUsersDetailed.forEach((ele) => {
        removedUsers[`${String(ele._id)}`] = ele;
        // activities.push({
        //   operation: "Update",
        //   type: activityType,
        //   createdBy: user._id,
        //   field: "ProjectHead",
        //   description: `${ele.name} removed from the project.`,
        //   project: project._id,
        //   to: ele._id,
        // })
      });
    }
    users.forEach((ele) => {
      if (String(ele._id) == projectHead) {
        ele.userType.forEach((element) => {
          if (String(element.organisation) == orgId) {
            if (['Member+', 'Member++', 'Admin'].includes(element.userType)) {
              detailedHeadNew = {
                _id: String(ele._id),
                profilePicture: ele.profilePicture,
                name: ele.name,
              };
            } else {
              projectHead = undefined;
              let objState = {
                _id: String(ele._id),
                profilePicture: ele.profilePicture,
                name: ele.name,
              };
              detailedTeam.push(objState);
              detailedTeamObj[String(ele._id)] = objState;
            }
          }
        });
      } else if (team && !team.includes(String(ele._id))) {
      } else {
        updatedTeam.push(String(ele._id));
        let objState = {
          _id: String(ele._id),
          profilePicture: ele.profilePicture,
          name: ele.name,
        };
        detailedTeam.push(objState);
        detailedTeamObj[String(ele._id)] = objState;
      }
      if (add.includes(String(ele._id))) {
        // activities.push({
        //   operation: "Update",
        //   type: activityType,
        //   createdBy: user._id,
        //   field: "ProjectHead",
        //   description: `${ele.name} added to the project.`,
        //   project: project._id,
        //   from: ele._id,
        // })
      }
    });

    const oldProjectHead = project.projectHead;
    project.projectHead =
      projectHead !== undefined
        ? projectHead !== ''
          ? projectHead
          : undefined
        : project.projectHead;

    if (String(project.projectHead) != String(oldProjectHead)) {
      let description;
      let from;
      let to;
      if (oldProjectHead && project.projectHead) {
        from = oldProjectHead;
        to = project.projectHead;
        description = `Project-Head changed from ${
          removedUsers[String(oldProjectHead)]
            ? removedUsers[String(oldProjectHead)].name
            : detailedTeamObj[String(oldProjectHead)].name
        } to ${detailedHeadNew.name}`;
      } else if (!oldProjectHead && project.projectHead) {
        to = project.projectHead;
        description = `New Project-Head: ${detailedHeadNew.name} added to the project.`;
      } else if (oldProjectHead && !project.projectHead) {
        from = oldProjectHead;
        description = `${
          removedUsers[String(oldProjectHead)].name
        } removed from Project-Head designation.`;
      }
      this.actsService.createActivity([
        {
          operation: 'Update',
          type: activityType,
          createdBy: user._id,
          field: 'ProjectHead',
          description,
          project: project._id,
          from,
          to,
        },
      ]);
    }
    if (removeHeadTeam) {
      for (let i = 0; i < updatedTeam.length; i++) {
        if (String(updatedTeam[i]) == projectHead) {
          updatedTeam.splice(updatedTeam.indexOf(i, 1));
          break;
        }
      }
    }
    if (team) {
      project.team = updatedTeam;
    }
    project = await project.save({ new: true });
    this.actsService.createActivity(activities);

    this.utilsService.createAssigneeActs(
      user._id,
      project._id,
      'Project',
      [...oldProject.team, oldProject.projectHead],
      [...project.team, project.projectHead],
      project._id,
    );
    let data;
    if (projectHead && !team) {
      data = { projectHead: detailedHeadNew };
    } else if (team && !projectHead) {
      data = { team: updatedTeam };
    } else if (team && projectHead) {
      data = { team: updatedTeam, projectHead: detailedHeadNew };
    }
    return {
      status: 'Successful',
      data,
      message: 'Project assigned succesfully.',
    };
  }

  async updateCredentials(
    admin,
    orgId,
    projectId,
    removeCredentials,
    addCredentials,
    updateCredentials,
  ) {
    let project = await this.projectModel
      .findOne({ _id: projectId, organisation: orgId })
      .exec();
    if (!project) {
      throw new HttpException(
        "Given combination of Project and organisation doesn't exists!",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      admin.type == 'Member+' &&
      String(project.projectHead) != String(admin._id)
    ) {
      throw new HttpException(
        'You are not authorised to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const activities = [];
    if (addCredentials) {
      addCredentials = addCredentials.map((x) => {
        activities.push({
          operation: 'Update',
          type: activityType,
          createdBy: admin._id,
          field: 'Credentials',
          description: `Credentials for ${x.platform} platform added to project.`,
          project: project._id,
        });
        return {
          platform: x.platform
            ? this.utilsService.encryptData(x.platform)
            : undefined,
          username: x.username
            ? this.utilsService.encryptData(x.username)
            : undefined,
          password: x.password
            ? this.utilsService.encryptData(x.password)
            : undefined,
          key: x.key ? this.utilsService.encryptData(x.key) : undefined,
        };
      });
      if (project.credentials) {
        project.credentials.push(...addCredentials);
      } else {
        project.crdentials = addCredentials;
      }
    } else if (removeCredentials) {
      for (let i = 0; i < project.credentials.length; i++) {
        if (removeCredentials.includes(String(project.credentials[i]._id))) {
          project.credentials.splice(i, 1);
          i--;
          activities.push({
            operation: 'Update',
            type: activityType,
            createdBy: admin._id,
            field: 'Credentials',
            description: `Credentials for platform: ${project.credentials[i].platform} got deleted.`,
            project: project._id,
          });
        }
      }
    } else if (updateCredentials) {
      const updateCredObj = {};
      updateCredentials.forEach((element) => {
        updateCredObj[element._id] = element;
      });
      for (let i = 0; i < project.credentials.length; i++) {
        if (updateCredObj[String(project.credentials[i]._id)]) {
          project.credentials[i].platform = updateCredObj[
            String(project.credentials[i]._id)
          ].platform
            ? this.utilsService.encryptData(
                updateCredObj[String(project.credentials[i]._id)].platform,
              )
            : project.credentials[i].platform;
          project.credentials[i].username = updateCredObj[
            String(project.credentials[i]._id)
          ].username
            ? this.utilsService.encryptData(
                updateCredObj[String(project.credentials[i]._id)].username,
              )
            : project.credentials[i].username;
          project.credentials[i].password = updateCredObj[
            String(project.credentials[i]._id)
          ].password
            ? this.utilsService.encryptData(
                updateCredObj[String(project.credentials[i]._id)].password,
              )
            : project.credentials[i].password;
          project.credentials[i].key = updateCredObj[
            String(project.credentials[i]._id)
          ].key
            ? this.utilsService.encryptData(
                updateCredObj[String(project.credentials[i]._id)].key,
              )
            : project.credentials[i].key;
          activities.push({
            operation: 'Update',
            type: activityType,
            createdBy: admin._id,
            field: 'Credentials',
            description: `Credentials for platform: ${this.utilsService.decryptData(
              project.credentials[i].platform,
            )} got updated.`,
            project: project._id,
          });
        }
      }
    }

    project.lastUpdatedBy = admin._id;
    project = await project.save({ new: true });
    // this.actsService.createActivity(activities);
    if (project.credentials) {
      project.credentials.forEach((element) => {
        element.platform = element.platform
          ? this.utilsService.decryptData(element.platform)
          : undefined;
        element.username = element.username
          ? this.utilsService.decryptData(element.username)
          : undefined;
        element.password = element.password
          ? this.utilsService.decryptData(element.password)
          : undefined;
        element.key = element.key
          ? this.utilsService.decryptData(element.key)
          : undefined;
      });
    }
    return {
      data: { credentials: project.credentials },
      message: 'Credentials updated Successfully.',
      success: true,
    };
  }

  async getSections(projectId, platformId) {
    const sectionsDb = await this.sectionModel
      .find({ project: projectId, platform: platformId })
      .populate('platform', ['platform'])
      .exec();
    let sections = [];
    sectionsDb.forEach((ele) => {
      sections.push(...ele.sections);
    });
    return { data: sections, message: '', success: true };
  }

  async saveSection(user, projectId, platformId, section) {
    let platSections = await this.sectionModel
      .findOne({ project: projectId, platform: platformId })
      .exec();

    if (!platSections || !platSections?.sections?.includes(section)) {
      // this.actsService.createActivity([{
      //     operation: "Update",
      //     type: activityType,
      //     createdBy: user._id,
      //     field: "Section",
      //     description: `section: ${section} added to project.`,
      //     project: projectId,
      // }])
    }
    if (platSections) {
      if (!platSections.sections.includes(section)) {
        platSections.sections.push(section);
        platSections.lastUpdatedBy = user._id;
        await platSections.save();
        return {
          data: { sections: platSections },
          message: 'Section added successfully.',
          success: true,
        };
      }
    } else {
      platSections = new this.sectionModel({
        sections: [section],
        platform: platformId,
        project: projectId,
        lastUpdatedBy: user._id,
      });
    }
    platSections = platSections.save({ new: true });
    return {
      data: { sections: platSections },
      message: 'Section added successfully.',
      success: true,
    };
  }

  async deleteSection(user, projectId, platformId, section) {
    let platSections = await this.sectionModel
      .findOne({ project: projectId, platform: platformId })
      .exec();

    if (platSections) {
      const index = platSections.sections.indexOf(section);
      if (index != -1) {
        // this.actsService.createActivity([{
        //     operation: "Update",
        //     type: activityType,
        //     createdBy: user._id,
        //     field: "Section",
        //     description: `Section: ${platSections.sections[index]} got deleted.`,
        //     project: projectId,
        // }])
        platSections.sections.splice.push(index);
        platSections.lastUpdatedBy = user._id;
        platSections = await platSections.save();
      }
    }

    return { data: { sections: platSections }, message: '', success: true };
  }

  async getMultiProjectsApp(args, projections) {
    return await this.projectModel.find(args, projections).exec();
  }

  async updateRoleChanges(orgId, userId) {
    const projects = await this.projectModel.updateMany(
      { organisation: orgId, projectHead: userId },
      { $set: { projectHead: undefined }, $push: { team: userId } },
    );
    return;
  }

  async createPaymentPhase(user, orgId, projectId, dto) {
    if (
      await this.paymentPhaseModel
        .findOne({ title: dto.title, project: projectId })
        .exec()
    ) {
      throw new HttpException(
        'A payment phase alraedy exists with the same title!',
        HttpStatus.BAD_REQUEST,
      );
    }

    let paymentPhase = new this.paymentPhaseModel({
      title: dto.title,
      project: projectId,
      organisation: orgId,
      description: dto.description,
      createdBy: user._id,
      currency: dto.currency
        ? this.utilsService.encryptData(String(dto.currency))
        : undefined,
      amount:
        dto.amount !== undefined
          ? this.utilsService.encryptData(String(dto.amount))
          : undefined,
    });
    paymentPhase = await paymentPhase.save();

    paymentPhase = await this.utilsService.decryptPaymentPhase(paymentPhase);

    this.invoiceService.clearRaisedInvoice(projectId, paymentPhase._id);

    return {
      data: { paymentPhase },
      message: 'Payment-Phase created successfully.',
      success: true,
    };
  }

  async updatePaymentPhase(projectId, paymentPhaseId, dto) {
    let paymentPhase = await this.paymentPhaseModel
      .findOne({ _id: paymentPhaseId, project: projectId })
      .exec();
    if (!paymentPhase) {
      throw new HttpException(
        'No such payment phase exists!',
        HttpStatus.BAD_REQUEST,
      );
    }

    paymentPhase.title = dto.title ? dto.title : paymentPhase.title;
    paymentPhase.description = dto.description
      ? dto.description
      : paymentPhase.description;
    paymentPhase.currency = dto.currency
      ? await this.utilsService.encryptData(dto.currency)
      : paymentPhase.currency;
    paymentPhase.amount = dto.amount
      ? await this.utilsService.encryptData(dto.amount)
      : paymentPhase.amount;

    paymentPhase = await paymentPhase.save({ new: true });

    paymentPhase = await this.utilsService.decryptPaymentPhase(paymentPhase);
    return {
      data: { paymentPhase },
      message: 'Payment-Phase updated successfully.',
      success: true,
    };
  }

  async updatePaymentPhaseMilestone(
    orgId,
    projectId,
    milestoneIds,
    paymentPhaseId,
    isCompleted,
    newMilestones,
    removeMilestones,
  ) {
    let paymentPhase;
    if (newMilestones?.length > 0) {
      paymentPhase = await this.paymentPhaseModel
        .findOne({
          organisation: orgId,
          project: projectId,
          _id: paymentPhaseId,
        })
        .exec();
    } else {
      paymentPhase = await this.paymentPhaseModel
        .findOne({
          organisation: orgId,
          project: projectId,
          'milestoneStatus.milestone': { $elemMatch: { $in: milestoneIds } },
        })
        .exec();
    }

    if (!paymentPhase) {
      return;
    }
    if (newMilestones?.length > 0) {
      const milestoneObj = [];
      newMilestones.forEach((ele) => {
        milestoneObj.push({
          milestone: mongoose.Types.ObjectId(ele),
          isCompleted: false,
        });
      });
      paymentPhase = await this.paymentPhaseModel
        .findOneAndUpdate(
          { project: projectId, _id: paymentPhase._id },
          {
            $push: {
              milestoneStatus: { $each: milestoneObj },
              milestones: newMilestones,
            },
          },
          { new: true },
        )
        .exec();
    } else if (removeMilestones?.length > 0) {
      paymentPhase = await this.paymentPhaseModel
        .findOneAndUpdate(
          { project: projectId, _id: paymentPhase._id },
          {
            $pull: {
              'milestoneStatus.milestone': { $in: removeMilestones },
              milestones: newMilestones,
            },
          },
          { new: true },
        )
        .exec();
    } else if (isCompleted !== undefined) {
      paymentPhase = await this.paymentPhaseModel
        .findOneAndUpdate(
          {
            project: projectId,
            _id: paymentPhase._id,
            milestoneStatus: {
              $elemMatch: { milestone: { $in: milestoneIds } },
            },
          },
          { $set: { 'milestoneStatus.$.isCompleted': isCompleted } },
          { new: true },
        )
        .exec();
    }

    let flag = true;
    for (let i = 0; i < paymentPhase.milestoneStatus.length; i++) {
      if (paymentPhase.milestoneStatus[i].isCompleted === false) {
        flag = false;
        break;
      }
    }

    if (flag === true) {
      paymentPhase.status = 'Completed';
      this.invoiceService.raiseInvoice(orgId, projectId, paymentPhase._id);
    } else {
      if (paymentPhase.status === 'Completed') {
        this.invoiceService.clearRaisedInvoice(projectId, paymentPhase._id);
      }
      paymentPhase.status = 'Pending';
    }

    paymentPhase = await paymentPhase.save({ new: true });
    paymentPhase = await this.utilsService.decryptPaymentPhase(paymentPhase);
    if (paymentPhase.milestones) {
      paymentPhase._doc.progress = await this.tasksService.getMilestoneStatusCountPaymentPhase(
        paymentPhase.milestones,
      );
    }

    return paymentPhase;
  }

  async deletePaymentPhases(orgId, projectId, paymentPhaseIds) {
    const invoices = await this.invoiceService.getInvoiceApp(
      { paymentPhase: { $in: paymentPhaseIds }, organisation: orgId },
      {},
    );
    if (invoices.length > 0) {
      throw new HttpException(
        'Delete all the Invoices associated with this phase!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const deleted = await this.paymentPhaseModel
      .deleteMany({ _id: { $in: paymentPhaseIds } })
      .exec();

    return {
      data: { deleted },
      message: 'Payment-Phases deleted successfully.',
      success: true,
    };
  }

  async getPaymentPhases(orgId, projectId) {
    let paymentPhases = await this.paymentPhaseModel
      .find({ organisation: orgId, project: projectId })
      .populate('milestones')
      .lean();
    for (let ele of paymentPhases) {
      ele = await this.utilsService.decryptPaymentPhase(ele);
      ele.milestoneIds = [];
      ele.milestones.forEach((ele1) => {
        ele.milestoneIds.push(ele1._id);
      });

      ele.progress = await this.tasksService.getMilestoneStatusCountPaymentPhase(
        ele.milestoneIds,
      );
    }
    return { data: { paymentPhases }, success: true, message: '' };
  }

  async searchProjectText(orgId, projectId, text) {
    const project = await this.projectModel
      .findOne({ _id: projectId, organisation: orgId })
      .exec();
    if (!project) {
      throw new HttpException(
        'Project does not exist in this organisation!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const milestones = await this.tasksService.searchMilestoneText(
      projectId,
      text,
    );
    const modules = await this.tasksService.searchModuleText(projectId, text);
    const tasks = await this.tasksService.searchTaskText(projectId, text);
    const bugs = await this.bugsService.searchBugText(projectId, text);

    return {
      data: { milestones, modules, tasks, bugs },
      success: true,
      message: '',
    };
  }
}
