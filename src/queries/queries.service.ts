import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { query } from 'express';
import { Model } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ProjectsService } from 'src/projects/projects.service';
import { UtilsService } from 'src/utils/utils.service';

@Injectable()
export class QueriesService {
  constructor(
    @InjectModel('Query') private readonly queryModel: Model<any>,
    @InjectModel('Reply') private readonly replyModel: Model<any>,
    private readonly projectsService: ProjectsService,
    private readonly utilsService: UtilsService,
    private readonly notifyService: NotificationsService,
  ) {}

  async createQuery(user, orgId, projectId, attachments, dto) {
    const project = await this.projectsService.getAppProject(
      { organisation: orgId, _id: projectId },
      {},
    );

    if(!project) {
      throw new HttpException('No such project exists.', HttpStatus.BAD_REQUEST);
    }

    if (!['Admin', 'Member++'].includes(user.type)) {
      const projectAssociation = await this.utilsService.projectAssociation(
        project,
        user._id,
      );
      if (!projectAssociation) {
        throw new HttpException(
          'User is not associated with this project!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let query = new this.queryModel(dto);

    query.createdBy = user._id;
    query.attachments = [];
    query.project = projectId;

    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        query.attachments.push(
          await this.utilsService.uploadFileS3(
            attachments[i],
            ConfigService.keys.FOLDER_QUERY_ATTACHMENT,
          ),
        );
      }
    }

    query = await query.save();

    query._doc.createdBy = {
      name: user.name,
      profilePicture: user.profilePicture,
      email: user.email,
      _id: user._id,
    };

    this.utilsService.createBasicInfoActs(user._id, "Create", "Query", undefined, {title: query.title}, undefined, {_id: query._id}, projectId);
    this.notifyService.createNotifications({
      description: `New query added to project \"${project.title}\" `,
      module: "Query",
      organisation: orgId,
      project: project._id,
      accessLevel: "Member",
      users: [...project.team, project.projectHead],
      meta: {
        projectName: project.title,
        queryTitle: query.title,
        queryId: query._id,
      }
    })
    return {
      message: 'Query created successfully.',
      data: { query },
      success: true,
    };
  }

  async updateQuery(user, orgId, projectId, queryId, attachments, dto) {
    const project = await this.projectsService.getAppProject(
      { organisation: orgId, _id: projectId },
      {},
    );

    if(!project) {
      throw new HttpException('No such project exists.', HttpStatus.BAD_REQUEST);
    }

    if(dto.deleteAttachments) {
      dto.deleteAttachments = JSON.parse(dto.deleteAttachments);
    }

    let query = await this.queryModel
      .findOne({ _id: queryId, createdBy: user._id })
      .populate('createdBy')
      .exec();

    const oldQuery = JSON.parse(JSON.stringify(query));

    query.title = dto.title ? dto.title : query.title;
    query.status = dto.status ? dto.status : query.status;
    query.description = dto.description ? dto.description : query.description;
    if (dto.deleteAttachments?.length > 0) {
      const attachmentsObj = {};
      dto.deleteAttachments.forEach((ele) => {
        attachmentsObj[ele] = true;
      });

      for (let i = 0; i < dto.deleteAttachments.length; i++) {
        this.utilsService.deleteFileS3(
          dto.deleteAttachments[i],
          ConfigService.keys.FOLDER_QUERY_ATTACHMENT,
        );
      }

      for (let i = 0; i < query.attachments.length; i++) {
        if (attachmentsObj[query.attachments[i]]) {
          query.attachments.splice(i, 1);
          i--;
        }
      }
    }

    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        query.attachments.push(
          await this.utilsService.uploadFileS3(
            attachments[i],
            ConfigService.keys.FOLDER_QUERY_ATTACHMENT,
          ),
        );
      }
    }

    query = await query.save({ new: true });

    if(attachments.length > 0 || dto.deleteAttachments?.length > 0) {
      this.utilsService.createAttachmentActivities(user._id, "Query", attachments, dto.deleteAttachments, undefined, query, projectId);
    }
    dto.deleteAttachments = undefined;
    this.utilsService.createBasicInfoActs(user._id, "Update", "Query", dto, undefined, oldQuery, query, projectId);

    return {
      message: 'Query updated successfully.',
      success: true,
      data: { query },
    };
  }

  async deleteQueries(user, orgId, projectId, queries){
    const project = await this.projectsService.getAppProject({_id: projectId, organisation: orgId}, {});
    if (!['Admin', 'Member++'].includes(user.type)) {
      const projectAssociation = await this.utilsService.projectAssociation(
        project,
        user._id,
      );
      if (!projectAssociation) {
        throw new HttpException(
          'User is not associated with this project!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let deleted;
    let queriesFull;
    if(String(project.projectHead) == String(user._id) || ['Admin', 'Member++'].includes(user.type)) {
      queriesFull = await this.queryModel.find({_id: {$in: queries}, project: projectId}).exec();
      deleted = await this.queryModel.deleteMany({_id: {$in: queries}, project: projectId}).exec();
    }
    else {
      queriesFull = await this.queryModel.find({_id: {$in: queries}, project: projectId, createdBy: user._id}).exec();
      deleted = await this.queryModel.deleteMany({_id: {$in: queries}, project: projectId, createdBy: user._id}).exec();
    }

    const queryIds = [];

    queriesFull.forEach(ele => {
      queryIds.push(ele._id)
      this.utilsService.createBasicInfoActs(user._id, "Delete", "Query", undefined, {title: ele.title}, {_id: ele._id}, undefined, projectId);

    })

    this.replyModel.deleteMany({query: {$in: queryIds}}).exec();

    return {data: {deleted}, success: true, message: 'Queries got deleted successfully.'}
  }

  async getQueries(user, orgId, projectId, status) {
    const project = await this.projectsService.getAppProject(
      {_id: projectId, organisation: orgId},
      {},
    );
    if(!project) {
      throw new HttpException('No such project exists.', HttpStatus.BAD_REQUEST);
    }

    let filter;
    if(status) {
      filter = {project: projectId, status};
    }
    else {
      filter = {project: projectId};
    }
    const queries = await this.queryModel.find(filter).sort({_id:-1}).populate('createdBy').lean();

    for(let i = 0; i< queries.length; i++) {
      queries[i].count = await this.replyModel.find({query: queries[i]._id}).countDocuments().exec();
    }

    return {data: {queries}, message: '', success: true};
  }

  async addReply(user, orgId, projectId, queryId, attachments, dto) {
    const project = await this.projectsService.getAppProject(
      { organisation: orgId, _id: projectId },
      {},
    );

    const query = await this.queryModel.findOne({_id: queryId}).exec();

    if(!project || !query) {
      throw new HttpException('No such query exists!', HttpStatus.BAD_REQUEST);
    }

    if (!['Admin', 'Member++'].includes(user.type)) {
      const projectAssociation = await this.utilsService.projectAssociation(
        project,
        user._id,
      );
      if (!projectAssociation) {
        throw new HttpException(
          'User is not associated with this project!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let reply = new this.replyModel(dto);

    reply.createdBy = user._id;
    reply.query = queryId;
    reply.attachments = [];

    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        reply.attachments.push(
          await this.utilsService.uploadFileS3(
            attachments[i],
            ConfigService.keys.FOLDER_REPLY_ATTACHMENT,
          ),
        );
      }
    }

    reply = await reply.save();

    reply._doc.createdBy = {
      name: user.name,
      profilePicture: user.profilePicture,
      email: user.email,
      _id: user._id,
    };

    this.utilsService.createBasicInfoActs(user._id, "Create", "Query-Response", undefined, {title: reply.title}, undefined, {_id: reply._id}, projectId);
    this.notifyService.createNotifications({
      description: `New reply added to Query in Project \"${project.title}\"`,
      module: "Query",
      organisation: orgId,
      project: project._id,
      accessLevel: "Member",
      users: [...project.team, project.projectHead],
      meta: {
        projectName: project.title,
        QueryTitle: query.title,
        QueryId: query._id,
      }
    })
    return {
      message: 'Reply created successfully.',
      data: { reply },
      success: true,
    };
  }

  async updateReply(user, orgId, projectId, replyId, attachments, dto) {
    const project = await this.projectsService.getAppProject(
      { organisation: orgId, _id: projectId },
      {},
    );

    if(!project) {
      throw new HttpException('No such project exists.', HttpStatus.BAD_REQUEST);
    }

    let reply = await this.replyModel
      .findOne({ _id: replyId, createdBy: user._id })
      .populate('createdBy')
      .exec();

    const oldReply = JSON.parse(JSON.stringify(reply._doc));
    reply.description = dto.description ? dto.description : reply.description;

    if(dto.deleteAttachments) {
      dto.deleteAttachments = JSON.parse(dto.deleteAttachments);
    }

    if (dto.deleteAttachments?.length > 0) {
      const attachmentsObj = {};
      dto.deleteAttachments.forEach((ele) => {
        attachmentsObj[ele] = true;
      });

      for (let i = 0; i < dto.deleteAttachments.length; i++) {
        this.utilsService.deleteFileS3(
          dto.deleteAttachments[i],
          ConfigService.keys.FOLDER_REPLY_ATTACHMENT,
        );
      }

      for (let i = 0; i < reply.attachments.length; i++) {
        if (attachmentsObj[reply.attachments[i]]) {
          reply.attachments.splice(i, 1);
          i--;
        }
      }
    }

    if (attachments.length > 0) {
      for (let i = 0; i < attachments.length; i++) {
        reply.attachments.push(
          await this.utilsService.uploadFileS3(
            attachments[i],
            ConfigService.keys.FOLDER_REPLY_ATTACHMENT,
          ),
        );
      }
    }

    reply = await reply.save({ new: true });

    if(attachments.length > 0 || dto.deleteAttachments?.length > 0) {
      this.utilsService.createAttachmentActivities(user._id, "Query-Response", attachments, dto.deleteAttachments, undefined, reply, projectId);
    }
    dto.deleteAttachments = undefined;

    this.utilsService.createBasicInfoActs(user._id, "Update", "Query-Response", dto, undefined, oldReply, reply, projectId);

    return {
      message: 'Reply updated successfully.',
      success: true,
      data: { reply },
    };
  }

  async getReplies(user, orgId, projectId, queryId) {
    const project = await this.projectsService.getAppProject(
      { organisation: orgId, _id: projectId },
      {},
    );

    const query = await this.queryModel.findOne({_id: queryId, project: projectId}).exec();

    if(!project || !query) {
      throw new HttpException('No such query exists!', HttpStatus.BAD_REQUEST);
    }

    if (!['Admin', 'Member++'].includes(user.type)) {
      const projectAssociation = await this.utilsService.projectAssociation(
        project,
        user._id,
      );
      if (!projectAssociation) {
        throw new HttpException(
          'User is not associated with this project!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const replies = await this.replyModel.find({query: queryId}).populate('createdBy').exec();

    return {data: {replies}, message: '', success: true};
  }

  async deleteReplies(user, orgId, projectId, replies){
    const project = await this.projectsService.getAppProject({_id: projectId, organisation: orgId}, {});
    if (!['Admin', 'Member++'].includes(user.userType)) {
      const projectAssociation = await this.utilsService.projectAssociation(
        project,
        user._id,
      );
      if (!projectAssociation) {
        throw new HttpException(
          'User is not associated with this project!',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    let deleted;
    let deletedDetailed;
    if(String(project.projectHead) == String(user._id) || ['Admin', 'Member++'].includes(user.userType)) {
      deletedDetailed = await this.replyModel.find({_id: {$in: replies}}).exec();
      deleted = await this.replyModel.deleteMany({_id: {$in: replies}}).exec();
    }
    else {
      deletedDetailed = await this.replyModel.find({_id: {$in: replies}, createdBy: user._id}).exec();
      deleted = await this.replyModel.deleteMany({_id: {$in: replies}, createdBy: user._id}).exec();
    }

    deletedDetailed.forEach(ele => {
      this.utilsService.createBasicInfoActs(user._id, "Delete", "Query-Response", undefined, {title: ele.title}, {_id: ele._id}, undefined, projectId);
    })

    return {data: {deleted}, success: true, message: 'Queries got deleted successfully.'}
  }
}
