import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateEodDto } from './dto/createEod.dto';
import { UpdateEodDto } from './dto/updateEod.dto';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { Eod, EodDocument } from './schema/eod.schema';

import { Query } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';

@Injectable()
export class EodService {
  constructor(
    @InjectModel(Eod.name) private EodModel: Model<EodDocument>,
    @InjectModel('User') private readonly userModel: Model<any>,
    @InjectModel('Project') private readonly projectModel: Model<any>,
  ) {}

  async create(createEodDto: CreateEodDto, userId: any, userType: string) {
    try {
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      const eod = await this.EodModel.find({
        createdBy: new ObjectId(userId),
        createdAt: {
          $gte: currentDate,
          $lt: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000),
        },
      });

      let hour = 0;
      let minute = 0;

      createEodDto.data.forEach((el) => {
        hour += el.duration.hour;
        minute += el.duration.min / 60;
      });

      for (let i = 0; i < eod.length; i++) {
        hour += eod[i].duration.hour;
        minute += eod[i].duration.min / 60;
      }

      const total = hour + minute;

      if (total <= 24) {
        for (let i = 0; i < createEodDto.data.length; i++) {
          const { project, description, duration, screenName } =
            createEodDto.data[i];

          const model = new this.EodModel();

          if (userType === 'Member') {
            const getProject = await this.projectModel.findOne({
              _id: new ObjectId(project),
              team: { $in: new ObjectId(userId) },
            });
            if (!getProject) {
              throw new HttpException(
                'Invalid Project Id',
                HttpStatus.BAD_REQUEST,
              );
            }
          } else if (userType === 'Member+') {
            const getProject = await this.projectModel.findOne({
              _id: new ObjectId(project),
              // team: { $in: new ObjectId(userId) },
              $or: [
                { projectManagers: { $in: new ObjectId(userId) } },
                { team: { $in: new ObjectId(userId) } },
              ],
            });
            if (!getProject) {
              throw new HttpException(
                'Invalid Project Id',
                HttpStatus.BAD_REQUEST,
              );
            }
          }

          model.project = new ObjectId(project);
          model.description = description;
          model.screenName = screenName;
          if (!(duration.min <= 60))
            throw new HttpException(
              'Minutes should be less or equal to 60 min',
              HttpStatus.BAD_REQUEST,
            );
          if (duration.hour === 0 && duration.min === 0)
            throw new HttpException(
              'Select Appropriate Duration Time',
              HttpStatus.BAD_REQUEST,
            );
          model.duration = duration;
          model.createdBy = userId;
          const userEod = await model.save();
        }

        return {
          success: true,
          message: 'Eod added successfully.',
        };
      } else {
        throw new HttpException(
          'You can not add data more than 24 hours',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async showEod(
    userId: any,
    userType: string,
    query,
    startDate,
    endDate,
    projectId,
    member,
    search,
  ) {
    try {
      const resPerPage = 10;
      const currentPage = Number(query.page) || 1;
      const skip = resPerPage * (currentPage - 1);

      const ags: any[] = [
        {
          $lookup: {
            from: 'projects',
            localField: 'project',
            foreignField: '_id',
            as: 'project_detail',
          },
        },
        {
          $unwind: {
            path: '$project_detail',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user_detail',
          },
        },
        {
          $unwind: '$user_detail',
        },

        {
          $project: {
            _id: 1,
            description: 1,
            duration: 1,
            screenName: 1,
            project: 1,
            createdAt: 1,
            createdBy: 1,

            'project_detail._id': 1,
            'project_detail.title': 1,

            'user_detail._id': 1,
            'user_detail.name': 1,
            'user_detail.profilePicture': 1,
          },
        },
      ];

      if (userType === 'Member') {
        let filterProject = [];

        if (projectId) {
          filterProject = projectId.map((val) => {
            return new ObjectId(val);
          });
        } else {
          filterProject = await this.projectModel.distinct('_id', {
            team: { $in: userId },
          });
        }

        const countFilter = { project: { $in: filterProject } };
        if (projectId && member && startDate && endDate) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (projectId && startDate && endDate) {
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (member && startDate && endDate) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (startDate && endDate) {
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (projectId && member) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
        } else if (member) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
        } else if (search) {
          countFilter['screenName'] = { $regex: search, $options: 'i' };
        }
        ags.push({ $match: countFilter });
      } else if (userType === 'Member+') {
        let filterProject = [];

        if (projectId) {
          filterProject = projectId.map((val) => {
            return new ObjectId(val);
          });
        } else {
          filterProject = await this.projectModel.distinct('_id', {
            team: { $in: userId },
          });
        }

        const countFilter = { project: { $in: filterProject } };
        if (projectId && member && startDate && endDate) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (projectId && startDate && endDate) {
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (member && startDate && endDate) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (startDate && endDate) {
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (projectId && member) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
        } else if (member) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
        }
        ags.push({ $match: countFilter });
      } else {
        const countFilter = {};
        if (projectId && member && startDate && endDate) {
          const project = projectId;
          const filterProject = project.map((val) => {
            return new ObjectId(val);
          });
          countFilter['project'] = { $in: filterProject };
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (projectId && startDate && endDate) {
          const project = projectId;
          const filterProject = project.map((val) => {
            return new ObjectId(val);
          });
          countFilter['project'] = { $in: filterProject };
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (member && startDate && endDate) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (startDate && endDate) {
          const date1 = new Date(startDate);
          const date2 = new Date(endDate);
          date2.setHours(23, 59, 59, 999);
          countFilter['createdAt'] = {
            $gte: date1,
            $lte: date2,
          };
        } else if (projectId && member) {
          const project = projectId;
          const filterProject = project.map((val) => {
            return new ObjectId(val);
          });
          countFilter['project'] = { $in: filterProject };
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
        } else if (member) {
          const user = member;
          const filterUser = user.map((val) => {
            return new ObjectId(val);
          });
          countFilter['user_detail._id'] = { $in: filterUser };
        } else if (projectId) {
          const project = projectId;
          const filterProject = project.map((val) => {
            return new ObjectId(val);
          });
          countFilter['project'] = { $in: filterProject };
        } else if (search) {
          countFilter['screenName'] = { $regex: search, $options: 'i' };
        }
        ags.push({ $match: countFilter });
      }
      const eodDetail = await this.EodModel.aggregate(ags)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(skip + resPerPage);

      ags.push({
        $count: 'totalCount',
      });

      const count = await this.EodModel.aggregate(ags);

      const countt = count?.[0]?.totalCount;
      const totalPages = Math.ceil(countt / resPerPage);
      const hasNextPage = currentPage < totalPages;
      const hasPreviousPage = currentPage > 1;

      return {
        success: true,
        data: {
          totalPages,
          currentPage,
          hasNextPage,
          hasPreviousPage,
          eodDetail,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async update(userId: string, userType: string, updateEodDto: UpdateEodDto) {
    try {
      let data;
      if (userType === 'Admin') {
        data = await this.EodModel.findOne({
          _id: updateEodDto.eodId,
        });
      } else if (userType === 'Member++') {
        data = await this.EodModel.findOne({
          _id: updateEodDto.eodId,
        });
      } else {
        data = await this.EodModel.findOne({
          createdBy: userId,
          _id: updateEodDto.eodId,
        });
      }

      // const data = await this.EodModel.findOne({
      //   createdBy: userId,
      //   _id: updateEodDto.eodId,
      // });

      if (!data) {
        throw new UnauthorizedException('No Data found for this user');
      }

      const createDate = new Date(data.createdAt);

      const month = createDate.getMonth();
      const month1 = month + 1;
      const year = createDate.getFullYear();
      const day = createDate.getDate();
      const createdAtDate = year + '-' + '' + month1 + '-' + day;

      const currentDate = new Date();
      const mnth2 = currentDate.getMonth();
      const month3 = mnth2 + 1;
      const year3 = currentDate.getFullYear();
      const day3 = currentDate.getDate();
      const todayDate = year3 + '-' + '' + month3 + '-' + day3;

      if (createdAtDate === todayDate) {
        if (updateEodDto.project) {
          const getProject = await this.projectModel.findById({
            _id: updateEodDto.project,
          });

          if (!getProject) {
            throw new HttpException('No Project found', HttpStatus.BAD_REQUEST);
          }
          const projectId = getProject._id;
          data.project = projectId;
        }
        if (updateEodDto.description)
          data.description = updateEodDto.description;

        if (updateEodDto.duration) {
          if (!(updateEodDto.duration.min <= 60))
            throw new HttpException(
              'Minutes should be less or equal to 60 min',
              HttpStatus.BAD_REQUEST,
            );

          data.duration = updateEodDto.duration;
        }

        if (updateEodDto.screenName) data.screenName = updateEodDto.screenName;

        data.updatedBy = new ObjectId(userId);
        data.lastUpdated = new Date();

        const updateEod = await data.save();
        return {
          success: true,
          message: 'updated successfully.',
          data: { updateEod },
        };
      } else {
        throw new HttpException(
          'You can edit only on same day',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw error;
    }
  }

  // async allEodUpdates(query, startDate, endDate, projectId, member) {
  //   try {
  //     const resPerPage = 10;
  //     const currentPage = Number(query.page) || 1;

  //     const skip = resPerPage * (currentPage - 1);

  //     let countFilter = {};

  //     const ags: any[] = [
  //       {
  //         $lookup: {
  //           from: 'projects',
  //           localField: 'project',
  //           foreignField: '_id',
  //           as: 'project_detail',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$project_detail',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'createdBy',
  //           foreignField: '_id',
  //           as: 'user_detail',
  //         },
  //       },
  //       {
  //         $unwind: '$user_detail',
  //       },

  //       {
  //         $project: {
  //           _id: 1,
  //           description: 1,
  //           duration: 1,
  //           screenName: 1,
  //           project: 1,
  //           createdAt: 1,

  //           'project_detail._id': 1,
  //           'project_detail.title': 1,
  //           'user_detail._id': 1,
  //           'user_detail.name': 1,
  //           'user_detail.profilePicture': 1,
  //         },
  //       },
  //     ];

  //     if (startDate && endDate && projectId && member) {
  //       const date1 = new Date(startDate);
  //       const date2 = new Date(endDate);
  //       date2.setHours(23, 59, 59, 999);
  //       const project = projectId;
  //       const filterProject = [];
  //       project.map((val) => {
  //         filterProject.push(new ObjectId(val));
  //       });
  //       const user = member;
  //       const filterUser = [];
  //       user.map((val) => {
  //         filterUser.push(new ObjectId(val));
  //       });
  //       countFilter = {
  //         createdAt: {
  //           $gte: date1,
  //           $lte: date2,
  //         },
  //         project: { $in: filterProject },
  //         'user_detail._id': { $in: filterUser },
  //       };
  //     } else if (startDate && endDate && member) {
  //       const date1 = new Date(startDate);
  //       const date2 = new Date(endDate);
  //       date2.setHours(23, 59, 59, 999);
  //       const user = member;
  //       const filterUser = [];
  //       user.map((val) => {
  //         filterUser.push(new ObjectId(val));
  //       });
  //       countFilter = {
  //         createdAt: {
  //           $gte: date1,
  //           $lte: date2,
  //         },
  //         'user_detail._id': { $in: filterUser },
  //       };
  //     } else if (startDate && endDate && projectId) {
  //       const date1 = new Date(startDate);
  //       const date2 = new Date(endDate);
  //       date2.setHours(23, 59, 59, 999);
  //       const project = projectId;
  //       const filterProject = [];
  //       project.map((val) => {
  //         filterProject.push(new ObjectId(val));
  //       });
  //       countFilter = {
  //         createdAt: {
  //           $gte: date1,
  //           $lte: date2,
  //         },
  //         project: { $in: filterProject },
  //       };
  //     } else if (projectId && member) {
  //       const project = projectId;
  //       const filterProject = [];
  //       project.map((val) => {
  //         filterProject.push(new ObjectId(val));
  //       });
  //       const user = member;
  //       const filterUser = [];
  //       user.map((val) => {
  //         filterUser.push(new ObjectId(val));
  //       });
  //       countFilter = {
  //         project: { $in: filterProject },
  //         'user_detail._id': { $in: filterUser },
  //       };
  //     } else if (startDate && endDate) {
  //       const date1 = new Date(startDate);
  //       const date2 = new Date(endDate);
  //       date2.setHours(23, 59, 59, 999);
  //       countFilter = {
  //         createdAt: {
  //           $gte: date1,
  //           $lte: date2,
  //         },
  //       };
  //     } else if (projectId) {
  //       const project = projectId;
  //       const filterProject = [];
  //       project.map((val) => {
  //         filterProject.push(new ObjectId(val));
  //       });
  //       countFilter = {
  //         project: { $in: filterProject },
  //       };
  //     } else if (member) {
  //       const user = member;
  //       const filterUser = [];
  //       user.map((val) => {
  //         filterUser.push(new ObjectId(val));
  //       });
  //       countFilter = {
  //         'user_detail._id': { $in: filterUser },
  //       };
  //     }

  //     ags.push({ $match: countFilter });

  //     const eodDetail = await this.EodModel.aggregate(ags)
  //       .sort({ _id: -1 })
  //       // .sort({ createdAt: -1 })
  //       .skip(skip)
  //       .limit(skip + resPerPage)
  //       .group({
  //         _id: {
  //           month: { $month: '$createdAt' },
  //           day: { $dayOfMonth: '$createdAt' },
  //           year: { $year: '$createdAt' },
  //         },
  //         eodDetail: { $push: '$$ROOT' },
  //       })
  //       .sort({
  //         '_id.year': -1,
  //         '_id.month': -1,
  //         '_id.day': -1,
  //       });
  //     ags.push({
  //       $count: 'totalCount',
  //     });

  //     const count = await this.EodModel.aggregate(ags);
  //     const countt = count?.[0]?.totalCount;
  //     const totalPages = Math.ceil(countt / resPerPage);
  //     const hasNextPage = currentPage < totalPages;
  //     const hasPreviousPage = currentPage > 1;

  //     return {
  //       success: true,
  //       data: {
  //         totalPages,
  //         currentPage,
  //         hasNextPage,
  //         hasPreviousPage,
  //         eodDetail,
  //       },
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async allEodUpdates(query, startDate, endDate, projectId, member) {
    try {
      const resPerPage = 10;
      const currentPage = Number(query.page) || 1;

      const skip = resPerPage * (currentPage - 1);

      let countFilter = {};

      const ags: any[] = [
        {
          $lookup: {
            from: 'projects',
            localField: 'project',
            foreignField: '_id',
            as: 'project_detail',
          },
        },
        {
          $unwind: {
            path: '$project_detail',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'user_detail',
          },
        },
        {
          $unwind: '$user_detail',
        },

        {
          $project: {
            _id: 1,
            description: 1,
            duration: 1,
            screenName: 1,
            project: 1,
            createdAt: 1,

            'project_detail._id': 1,
            'project_detail.title': 1,
            'user_detail._id': 1,
            'user_detail.name': 1,
            'user_detail.profilePicture': 1,
          },
        },
      ];

      if (startDate && endDate && projectId && member) {
        const date1 = new Date(startDate);
        const date2 = new Date(endDate);
        date2.setHours(23, 59, 59, 999);
        const project = projectId;
        const filterProject = project.map((val) => {
          return new ObjectId(val);
        });
        const user = member;
        const filterUser = user.map((val) => {
          return new ObjectId(val);
        });
        countFilter = {
          createdAt: {
            $gte: date1,
            $lte: date2,
          },
          project: { $in: filterProject },
          'user_detail._id': { $in: filterUser },
        };
      } else if (startDate && endDate && member) {
        const date1 = new Date(startDate);
        const date2 = new Date(endDate);
        date2.setHours(23, 59, 59, 999);
        const user = member;
        const filterUser = user.map((val) => {
          return new ObjectId(val);
        });
        countFilter = {
          createdAt: {
            $gte: date1,
            $lte: date2,
          },
          'user_detail._id': { $in: filterUser },
        };
      } else if (startDate && endDate && projectId) {
        const date1 = new Date(startDate);
        const date2 = new Date(endDate);
        date2.setHours(23, 59, 59, 999);
        const project = projectId;
        const filterProject = project.map((val) => {
          return new ObjectId(val);
        });
        countFilter = {
          createdAt: {
            $gte: date1,
            $lte: date2,
          },
          project: { $in: filterProject },
        };
      } else if (projectId && member) {
        const project = projectId;
        const filterProject = project.map((val) => {
          return new ObjectId(val);
        });
        const user = member;
        const filterUser = user.map((val) => {
          return new ObjectId(val);
        });
        countFilter = {
          project: { $in: filterProject },
          'user_detail._id': { $in: filterUser },
        };
      } else if (startDate && endDate) {
        const date1 = new Date(startDate);
        const date2 = new Date(endDate);
        date2.setHours(23, 59, 59, 999);
        countFilter = {
          createdAt: {
            $gte: date1,
            $lte: date2,
          },
        };
      } else if (projectId) {
        const project = projectId;
        const filterProject = project.map((val) => {
          return new ObjectId(val);
        });

        countFilter = {
          project: { $in: filterProject },
        };
      } else if (member) {
        const user = member;
        const filterUser = user.map((val) => {
          return new ObjectId(val);
        });
        countFilter = {
          'user_detail._id': { $in: filterUser },
        };
      }

      ags.push({ $match: countFilter });

      const eodDetail = await this.EodModel.aggregate(ags)
        .sort({ _id: -1 })
        // .sort({ createdAt: -1 })
        .skip(skip)
        .limit(skip + resPerPage);
      // .group({
      //   _id: {
      //     month: { $month: '$createdAt' },
      //     day: { $dayOfMonth: '$createdAt' },
      //     year: { $year: '$createdAt' },
      //   },
      //   eodDetail: { $push: '$$ROOT' },
      // })
      // .sort({
      //   '_id.year': -1,
      //   '_id.month': -1,
      //   '_id.day': -1,
      // });
      ags.push({
        $count: 'totalCount',
      });

      const count = await this.EodModel.aggregate(ags);
      const countt = count?.[0]?.totalCount;
      const totalPages = Math.ceil(countt / resPerPage);
      const hasNextPage = currentPage < totalPages;
      const hasPreviousPage = currentPage > 1;

      return {
        success: true,
        data: {
          totalPages,
          currentPage,
          hasNextPage,
          hasPreviousPage,
          eodDetail,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async delete(id, userId, userType) {
    try {
      let data;
      if (userType === 'Admin') {
        data = await this.EodModel.findOneAndDelete({
          _id: id,
        });
      } else if (userType === 'Member++') {
        data = await this.EodModel.findOneAndDelete({
          _id: id,
        });
      } else {
        await this.EodModel.findOneAndDelete({
          _id: id,
          createdBy: userId,
        });
      }
      // const data = await this.EodModel.findOneAndDelete({
      //   _id: id,
      //   createdBy: userId,
      // });

      // if (!data) {
      //   throw new HttpException('No Data found', HttpStatus.BAD_REQUEST);
      // }
      return { status: 'success', message: 'Eod deleted succesfully' };
    } catch (error) {
      throw error;
    }
  }

  // async showEod(
  //   userId: any,
  //   userType: string,
  //   query,
  //   startDate,
  //   endDate,
  //   projectId,
  //   member,
  // ) {
  //   try {
  //     const resPerPage = 10;
  //     const currentPage = Number(query.page) || 1;
  //     const skip = resPerPage * (currentPage - 1);

  //     const ags: any[] = [
  //       {
  //         $lookup: {
  //           from: 'projects',
  //           localField: 'project',
  //           foreignField: '_id',
  //           as: 'project_detail',
  //         },
  //       },
  //       {
  //         $unwind: {
  //           path: '$project_detail',
  //         },
  //       },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'createdBy',
  //           foreignField: '_id',
  //           as: 'user_detail',
  //         },
  //       },
  //       {
  //         $unwind: '$user_detail',
  //       },

  //       {
  //         $project: {
  //           _id: 1,
  //           description: 1,
  //           duration: 1,
  //           screenName: 1,
  //           project: 1,
  //           createdAt: 1,
  //           createdBy: 1,

  //           'project_detail._id': 1,
  //           'project_detail.title': 1,

  //           'user_detail._id': 1,
  //           'user_detail.name': 1,
  //           'user_detail.profilePicture': 1,
  //         },
  //       },
  //     ];

  //     let filterProject = [];

  //     if (projectId) {
  //       filterProject = projectId.map((val) => {
  //         return new ObjectId(val);
  //       });
  //     } else {
  //       filterProject = await this.projectModel.distinct('_id', {
  //         team: { $in: userId },
  //       });
  //     }

  //     const countFilter = { project: { $in: filterProject } };
  //     if (projectId && member && startDate && endDate) {
  //       const user = member;
  //       const filterUser = user.map((val) => {
  //         return new ObjectId(val);
  //       });
  //       countFilter['user_detail._id'] = { $in: filterUser };
  //       const date1 = new Date(startDate);
  //       const date2 = new Date(endDate);
  //       date2.setHours(23, 59, 59, 999);
  //       countFilter['createdAt'] = {
  //         $gte: date1,
  //         $lte: date2,
  //       };
  //     } else if (projectId && startDate && endDate) {
  //       const date1 = new Date(startDate);
  //       const date2 = new Date(endDate);
  //       date2.setHours(23, 59, 59, 999);
  //       countFilter['createdAt'] = {
  //         $gte: date1,
  //         $lte: date2,
  //       };
  //     } else if (member && startDate && endDate) {
  //       const user = member;
  //       const filterUser = user.map((val) => {
  //         return new ObjectId(val);
  //       });
  //       countFilter['user_detail._id'] = { $in: filterUser };
  //       const date1 = new Date(startDate);
  //       const date2 = new Date(endDate);
  //       date2.setHours(23, 59, 59, 999);
  //       countFilter['createdAt'] = {
  //         $gte: date1,
  //         $lte: date2,
  //       };
  //     } else if (startDate && endDate) {
  //       const date1 = new Date(startDate);
  //       const date2 = new Date(endDate);
  //       date2.setHours(23, 59, 59, 999);
  //       countFilter['createdAt'] = {
  //         $gte: date1,
  //         $lte: date2,
  //       };
  //     } else if (projectId && member) {
  //       const user = member;
  //       const filterUser = user.map((val) => {
  //         return new ObjectId(val);
  //       });
  //       countFilter['user_detail._id'] = { $in: filterUser };
  //     } else if (member) {
  //       const user = member;
  //       const filterUser = user.map((val) => {
  //         return new ObjectId(val);
  //       });
  //       countFilter['user_detail._id'] = { $in: filterUser };
  //     }

  //     ags.push({ $match: countFilter });

  //     const eodDetail = await this.EodModel.aggregate(ags)
  //       .sort({ _id: -1 })
  //       .skip(skip)
  //       .limit(skip + resPerPage);

  //     ags.push({
  //       $count: 'totalCount',
  //     });

  //     const count = await this.EodModel.aggregate(ags);
  //     const countt = count?.[0]?.totalCount;
  //     const totalPages = Math.ceil(countt / resPerPage);
  //     const hasNextPage = currentPage < totalPages;
  //     const hasPreviousPage = currentPage > 1;

  //     return {
  //       success: true,
  //       data: {
  //         totalPages,
  //         currentPage,
  //         hasNextPage,
  //         hasPreviousPage,
  //         eodDetail,
  //       },
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }
}
