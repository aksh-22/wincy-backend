import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as moment from 'moment';
import { ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';
import { Model } from 'mongoose';
import { SubmitBuildDataDto } from './dto/add-submission-data.dto';
import { CreateBuildDto } from './dto/create-build-data.dto';
import { UpdateBuildDto } from './dto/update-build-data.dto';
import { UpdateBuildSubmissionDto } from './dto/update-submission-data.dto';
import { BuildDataDocument, BuildDataModel } from './schema/buildData.schema';
import {
  BuildSubmissionDocument,
  BuildSubmissionModel,
} from './schema/buildSubmission.schema';
import { TasksService } from 'src/tasks/tasks.service';

@Injectable()
export class BuildService {
  constructor(
    @InjectModel(BuildDataModel.name)
    private readonly buildDataModel: Model<BuildDataDocument>,
    @InjectModel('buildsubmission')
    private readonly buildSubmissionModel: Model<BuildSubmissionDocument>,
    private readonly tasksService: TasksService,
  ) {}

  async getBuildData(orgId: string, projectId: string) {
    try {
      const $match = {
        organisation: new ObjectId(orgId),
        projectId: new ObjectId(projectId),
      };

      const lookup = [
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'user_detail',
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
      ];

      const unwind = [
        {
          $unwind: {
            path: '$createdBy',
            preserveNullAndEmptyArrays: true,
          },
        },
        // {
        //   $unwind: {
        //     path: '$user_detail',
        //     preserveNullAndEmptyArrays: true,
        //   },
        // },
      ];

      const $project = {
        _id: 1,
        submittedToBe: 1,
        createdAt: 1,
        title: 1,
        'user_detail.name': 1,
        'user_detail.profilePicture': 1,
        'createdBy.name': 1,
        'createdBy.profilePicture': 1,
      };

      const ags = [{ $match }, ...lookup, { $project }, ...unwind];

      const buildData = await this.buildDataModel.aggregate(ags);
      return {
        message: 'Build data list',
        data: { buildData },
      };
    } catch (error) {
      console.error('Error in getBuildData', error);

      throw new InternalServerErrorException(error);
    }
  }

  async create(createBuildDto: CreateBuildDto, user, orgId: string) {
    try {
      const newDoc = createBuildDto;
      // newDoc['taskData'] = createBuildDto.taskIds.map((taskId) => ({
      //   taskId: new mongoose.Types.ObjectId(taskId),
      // }));
      newDoc['createdBy'] = user?._id;
      newDoc['organisation'] = orgId;
      const buildData = await this.buildDataModel.create(newDoc);
      return {
        message: 'Build submission added successfully',
        data: { buildData },
      };
    } catch (error) {
      console.error('Error in create(buildData)', error);

      throw new InternalServerErrorException(error);
    }
  }

  async update(updateBuildDto: UpdateBuildDto, user, orgId: string) {
    try {
      const buildData = await this.buildDataModel.findOne({
        _id: updateBuildDto.buildDataId,
        organisation: orgId,
        createdBy: user?._id,
      });
      if (!buildData) {
        throw new NotFoundException('Build data not found');
      }
      for (const key in updateBuildDto) {
        if (Object.prototype.hasOwnProperty.call(updateBuildDto, key)) {
          buildData[key] = updateBuildDto[key];
        }
      }
      await buildData.save();
      return {
        message: 'Build data updated successfully',
        data: { buildData },
      };
    } catch (error) {
      console.error('Error in update(buildData)', error);

      throw new InternalServerErrorException(error);
    }
  }

  async getBuildDetails(user, orgId, buildDataId) {
    try {
      const $match = {
        _id: new mongoose.Types.ObjectId(buildDataId),
        organisation: new mongoose.Types.ObjectId(orgId),
        $or: [
          { createdBy: new mongoose.Types.ObjectId(user?._id) },
          {
            assignedTo: new mongoose.Types.ObjectId(user?._id),
          },
        ],
      };

      const lookup = [
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'assignedTo',
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
            from: 'tasks',
            localField: 'taskIds',
            foreignField: '_id',
            as: 'taskIds',
          },
        },
      ];

      const $project = {
        submittedToBe: 1,
        submittedData: 1,
        projectId: 1,
        organisation: 1,
        title: 1,
        'createdBy.name': 1,
        'createdBy.profilePicture': 1,
        'assignedTo.name': 1,
        'assignedTo.profilePicture': 1,
      };

      const unwind = [
        {
          $unwind: {
            path: '$createdBy',
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      const ags = [{ $match }, ...lookup, { $project }, ...unwind];

      const build = await this.buildDataModel.aggregate(ags);

      const buildSubmissions = await this.getBuildSubmission(build[0]._id);

      if (!build.length) {
        throw new NotFoundException('Data not found');
      }

      return {
        message: 'Build data details',
        data: { build: build[0], buildSubmissions },
      };
    } catch (error) {
      console.error('Error in getBuildDetails', error);
      throw new InternalServerErrorException(error);
    }
  }

  async deleteBuildData(user, orgId, buildDataId) {
    try {
      const buildData = await this.buildDataModel.deleteOne({
        _id: buildDataId,
        organisation: orgId,
        createdBy: user?._id,
      });
      if (buildData.deletedCount === 0) {
        throw new InternalServerErrorException('Something went wrong.');
      }
      return {
        message: 'Build data deleted successfully.',
        data: null,
      };
    } catch (error) {
      console.error('Error in deleteBuildData', error);
      throw new InternalServerErrorException(error);
    }
  }

  async addSubmission(
    submitBuildDataDto: SubmitBuildDataDto,
    user: any,
    orgId: string,
  ) {
    try {
      const buildData = await this.buildDataModel.findOne({
        _id: submitBuildDataDto.buildDataId,
        organisation: orgId,
      });
      if (!buildData) {
        throw new NotFoundException('Build data not found');
      }
      // const isSubmitted = buildData.submittedData.findIndex(
      //   (el: any) => String(el.submittedBy) === String(user?._id),
      // );
      // if (isSubmitted >= 0) {
      //   throw new NotAcceptableException(
      //     'You have submitted the response already.',
      //   );
      // }
      const submitData: any = {
        submittedBy: new mongoose.Types.ObjectId(user?._id),
        link: submitBuildDataDto.link,
        description: submitBuildDataDto.description,
        submittedAt: moment().unix(),
        updatedAt: moment().unix(),
        buildDataId: buildData?._id,
        taskData: [
          ...submitBuildDataDto.completedTasks.map((el) => ({
            taskId: new mongoose.Types.ObjectId(el),
            isCompleted: true,
          })),
          ...submitBuildDataDto.remainingTasks.map((el) => ({
            taskId: new mongoose.Types.ObjectId(el),
            isCompleted: false,
          })),
        ],
      };
      const submittedData = await this.buildSubmissionModel.create(submitData);
      buildData.submittedData.push(submittedData._id);
      await buildData.save();
      return {
        message: 'Submission added successfully',
        data: { submittedData },
      };
    } catch (error) {
      console.error('Error in addSubmission', error);

      throw new InternalServerErrorException(error);
    }
  }

  async getBuildSubmission(buildDataId) {
    try {
      const $match = {
        buildDataId: new mongoose.Types.ObjectId(buildDataId),
      };

      const lookup = [
        {
          $lookup: {
            from: 'users',
            localField: 'submittedBy',
            foreignField: '_id',
            as: 'submittedBy',
          },
        },
      ];

      const unwind = [
        {
          $unwind: {
            path: '$submittedBy',
            preserveNullAndEmptyArrays: true,
          },
        },
      ];

      const $project = {
        link: 1,
        description: 1,
        submittedAt: 1,
        updatedAt: 1,
        'submittedBy.name': 1,
        'submittedBy._id': 1,
        'submittedBy.profilePicture': 1,
        // 'taskData.description': 1,
        // 'taskData.isCompleted': 1,
        taskData: 1,
      };

      const ags = [{ $match }, ...lookup, ...unwind, { $project }];
      console.log('ags', JSON.stringify(ags, null, 2));
      const submission = await this.buildSubmissionModel.aggregate(ags);

      console.log('submission[0]', submission[0]);

      for (let index = 0; index < submission[0]?.taskData.length; index++) {
        const element = submission[0]?.taskData[index];
        const task = await this.tasksService.findById(
          element?.taskId,
          'status title',
        );
        console.log('task', task);
        element.taskId = task;
        console.log('element.taskId', element.taskId);
      }

      return submission[0];
    } catch (error) {
      console.error('Error in getBuildSubmission', error);
    }
  }

  async updateSubmission(
    updateBuildSubmissionDto: UpdateBuildSubmissionDto,
    user: any,
  ) {
    try {
      console.log(
        'updateBuildSubmissionDto.buildDataId',
        updateBuildSubmissionDto.buildDataId,
      );
      const submittedData = await this.buildSubmissionModel.findOne({
        _id: updateBuildSubmissionDto?.submissionId,
        buildDataId: new mongoose.Types.ObjectId(
          updateBuildSubmissionDto.buildDataId,
        ),
        ...(user?.type !== 'Admin' && { submittedBy: user._id }),
      });

      if (!submittedData) {
        throw new NotAcceptableException('Submission not found');
      }

      if (
        !updateBuildSubmissionDto?.description &&
        !updateBuildSubmissionDto?.link
      ) {
        await this.buildSubmissionModel.deleteOne({
          _id: updateBuildSubmissionDto.submissionId,
        });
        return {
          message: 'Your submission delete successfully.',
          data: null,
        };
      } else {
        for (const key in updateBuildSubmissionDto) {
          if (
            Object.prototype.hasOwnProperty.call(
              updateBuildSubmissionDto,
              key,
            ) &&
            key !== 'buildDataId'
          ) {
            submittedData[key] = updateBuildSubmissionDto[key];
          }
        }
        if (
          updateBuildSubmissionDto.completedTasks.length ||
          updateBuildSubmissionDto.remainingTasks.length
        ) {
          const taskData: any = [
            ...updateBuildSubmissionDto.completedTasks.map((el) => ({
              taskId: new mongoose.Types.ObjectId(el),
              isCompleted: true,
            })),
            ...updateBuildSubmissionDto.remainingTasks.map((el) => ({
              taskId: new mongoose.Types.ObjectId(el),
              isCompleted: false,
            })),
          ];
          submittedData.taskData = taskData;
        }
        await submittedData.save();
      }
      // updateBuildSubmissionDto?.completedTasks?.forEach((task) => {
      //   const cIndex = buildData.taskData.findIndex(
      //     (el: any) => String(el.taskId) === String(task?.taskId),
      //   );
      //   if (cIndex >= 0) {
      //     buildData.taskData[cIndex]['isCompleted'] = true;
      //     buildData.taskData[cIndex]['description'] = task?.description;
      //   } else {
      //     throw new NotFoundException('Task id not found');
      //   }
      // });
      // updateBuildSubmissionDto?.remainingTasks?.forEach((task) => {
      //   const cIndex = buildData.taskData.findIndex(
      //     (el: any) => String(el.taskId) === String(task?.taskId),
      //   );
      //   if (cIndex >= 0) {
      //     buildData.taskData[cIndex]['isCompleted'] = false;
      //     buildData.taskData[cIndex]['description'] = task?.description;
      //   } else {
      //     throw new NotFoundException('Task id not found');
      //   }
      // });

      return {
        message: 'Your submission updated successfully.',
        data: { submittedData },
      };
    } catch (error) {
      console.error('Error in addSubmission', error);

      throw new InternalServerErrorException(error);
    }
  }
}
