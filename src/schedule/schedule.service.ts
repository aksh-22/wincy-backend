import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Query } from 'express-serve-static-core';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import {
  CreateScheduleDto,
  PermitStatus,
  Status,
  Type,
} from './dto/createSchedule.dto';
import { Schedule, ScheduleDocument } from './schema/schedule.schema';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectModel(Schedule.name)
    private readonly ScheduleModel: Model<ScheduleDocument>,
    @InjectModel('User') private readonly userModel: Model<any>,
  ) {}

  async create(createScheduleDto: CreateScheduleDto, userId: any, date) {
    try {
      if (!date) {
        throw new HttpException('Date is required!', HttpStatus.BAD_REQUEST);
      }
      const data = date;
      for (let i = 0; i < data.length; i++) {
        const dateExist = await this.ScheduleModel.find({
          requestedBy: userId,
        });
        for (let z = 0; z < dateExist.length; z++) {
          if (dateExist[z].date.toISOString().substring(0, 10) === data[i]) {
            throw new HttpException(
              'Date is already present!',
              HttpStatus.BAD_REQUEST,
            );
          }
        }

        const model = new this.ScheduleModel();
        if (data[i] >= new Date().toISOString().substring(0, 10)) {
          model.date = data[i];

          model.type = createScheduleDto.type;
          if (
            createScheduleDto.type === Type.EARLY_GOING ||
            createScheduleDto.type === Type.LATE_COMING
          ) {
            if (!createScheduleDto.time)
              throw new HttpException(
                'Time is required!',
                HttpStatus.BAD_REQUEST,
              );
            model.time = createScheduleDto.time;
          } else if (createScheduleDto.type === Type.BREAK) {
            if (!createScheduleDto.time || !createScheduleDto.duration) {
              throw new HttpException(
                'Time and Duration is required!',
                HttpStatus.BAD_REQUEST,
              );
            }
            if (!(createScheduleDto.duration.min <= 60))
              throw new HttpException(
                'Minutes should be less or equal to 60 min',
                HttpStatus.BAD_REQUEST,
              );

            model.time = createScheduleDto.time;
            model.duration = createScheduleDto.duration;
          }
          model.reason = createScheduleDto.reason;
          model.requestedBy = userId;

          const userSchedule = await model.save();
        } else {
          throw new HttpException('Date is invalid!', HttpStatus.BAD_REQUEST);
        }
      }
      return {
        success: true,
        message: 'Schedule send successfully.',
      };
    } catch (error) {
      throw error;
    }
  }

  async showSchedules(userId, query) {
    try {
      const resPerPage = 10;
      const currentPage = Number(query.page) || 1;
      const skip = resPerPage * (currentPage - 1);
      const schedules = await this.ScheduleModel.find({
        requestedBy: userId,
        authorizedBy: { $exists: false },
      })
        .select('-__v -updatedAt -authorizedBy')
        .sort({ _id: -1 })
        .limit(skip + resPerPage)
        .skip(skip)
        .exec();

      // const approvedSchedules = await this.ScheduleModel.aggregate([
      //   {
      //     $match: {
      //       requestedBy: userId,
      //     },
      //   },
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'authorizedBy',
      //       foreignField: '_id',
      //       as: 'authorized_by',
      //     },
      //   },
      //   {
      //     $project: {
      //       _id: 1,
      //       date: 1,
      //       status: 1,
      //       type: 1,
      //       time: 1,
      //       duration: 1,
      //       reason: 1,
      //       createdAt: 1,

      //       'authorized_by._id': 1,
      //       'authorized_by.name': 1,
      //       'authorized_by.profilePicture': 1,
      //     },
      //   },
      //   { $sort: { _id: -1 } },
      // ]);

      return {
        sucess: true,
        msg: 'Schedules list',
        // data: { schedules, approvedSchedules },
        data: { schedules },
      };
    } catch (error) {
      throw error;
    }
  }

  async showUserSchedules() {
    try {
      const schedules = await this.ScheduleModel.aggregate([
        {
          $match: {
            authorizedBy: { $exists: false },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'requestedBy',
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
            date: 1,
            type: 1,
            reason: 1,
            status: 1,
            createdAt: 1,

            'user_detail._id': 1,
            'user_detail.name': 1,
          },
        },
        { $sort: { _id: -1 } },
      ]);
      return {
        sucess: true,
        msg: 'Users Schedule list',
        data: { schedules },
      };
    } catch (error) {
      throw error;
    }
  }

  async permitSchedule(id: string, userId: any, permitStatus: PermitStatus) {
    try {
      const schedule = await this.ScheduleModel.findById({ _id: id });

      const scheduleDate = schedule.date.toISOString().substring(0, 10);
      const createdAtDate = schedule.createdAt.toISOString().substring(0, 10);

      if (!schedule) {
        throw new HttpException('Schedule id not found', HttpStatus.NOT_FOUND);
      }
      if (schedule.authorizedBy != null && createdAtDate <= scheduleDate) {
        schedule.status = Status.PENDING;
        schedule.authorizedBy = null;
      } else {
        if (createdAtDate <= scheduleDate) {
          schedule.status = permitStatus.status;
          schedule.authorizedBy = userId;
        } else {
          throw new HttpException('can not update now', HttpStatus.NOT_FOUND);
        }
      }
      await schedule.save();
      return {
        success: true,
        data: { schedule },
      };
    } catch (error) {
      throw error;
    }
  }

  async scheduleDetails(query: Query) {
    try {
      const resPerPage = 10;
      const currentPage = Number(query.page) || 1;
      const skip = resPerPage * (currentPage - 1);

      const count = await this.ScheduleModel.countDocuments();
      const totalPages = Math.ceil(count / resPerPage);

      const hasNextPage = currentPage < totalPages;
      const hasPreviousPage = currentPage > 1;

      const schedules = await this.ScheduleModel.aggregate([
        { $sort: { _id: -1 } },
        { $limit: skip + resPerPage },
        { $skip: skip },
        {
          $lookup: {
            from: 'users',
            localField: 'requestedBy',
            foreignField: '_id',
            as: 'user_detail',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'authorizedBy',
            foreignField: '_id',
            as: 'authorized_by',
          },
        },
        {
          $project: {
            _id: 1,
            date: 1,
            type: 1,
            reason: 1,
            status: 1,
            time: 1,
            duration: 1,
            createdAt: 1,

            'user_detail._id': 1,
            'user_detail.name': 1,
            'user_detail.profilePicture': 1,
            'authorized_by._id': 1,
            'authorized_by.name': 1,
            'authorized_by.profilePicture': 1,
          },
        },
      ]);
      return {
        sucess: true,
        msg: 'Users Schedule list',
        data: {
          count,
          // hasNextPage,
          // hasPreviousPage,
          totalPages,
          currentPage,
          schedules,
        },
      };
    } catch (error) {
      return error;
    }
  }

  // async scheduleFilter(query) {
  //   try {
  //     if (
  //       query.fromDate &&
  //       query.toDate &&
  //       query.userId &&
  //       query.status &&
  //       query.type &&
  //       query.authorizedId
  //     ) {
  //       const userId = new ObjectId(query.userId);
  //       const authorizedId = new ObjectId(query.authorizedId);
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         {
  //           $sort: { _id: -1 },
  //         },
  //         {
  //           $match: {
  //             $and: [
  //               {
  //                 requestedBy: userId,
  //               },
  //               {
  //                 authorizedBy: authorizedId,
  //               },
  //               {
  //                 status: query.status,
  //               },
  //               {
  //                 type: query.type,
  //               },
  //               {
  //                 date: {
  //                   $gte: new Date(query.fromDate),
  //                   $lte: new Date(query.toDate),
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,
  //             year: { $year: '$date' },
  //             month: { $month: '$date' },
  //             day: { $dayOfMonth: '$date' },

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     } else if (
  //       query.fromDate &&
  //       query.toDate &&
  //       query.userId &&
  //       query.status &&
  //       query.type
  //     ) {
  //       const userId = new ObjectId(query.userId);

  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         {
  //           $sort: { _id: -1 },
  //         },
  //         {
  //           $match: {
  //             $and: [
  //               {
  //                 requestedBy: userId,
  //               },

  //               {
  //                 status: query.status,
  //               },
  //               {
  //                 type: query.type,
  //               },
  //               {
  //                 date: {
  //                   $gte: new Date(query.fromDate),
  //                   $lte: new Date(query.toDate),
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,
  //             year: { $year: '$date' },
  //             month: { $month: '$date' },
  //             day: { $dayOfMonth: '$date' },

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //             'authorized_by.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     } else if (
  //       query.fromDate &&
  //       query.toDate &&
  //       query.userId &&
  //       query.status
  //     ) {
  //       const userId = new ObjectId(query.userId);
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         {
  //           $sort: { _id: -1 },
  //         },
  //         {
  //           $match: {
  //             $and: [
  //               {
  //                 requestedBy: userId,
  //               },
  //               {
  //                 status: query.status,
  //               },

  //               {
  //                 date: {
  //                   $gte: new Date(query.fromDate),
  //                   $lte: new Date(query.toDate),
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,
  //             year: { $year: '$date' },
  //             month: { $month: '$date' },
  //             day: { $dayOfMonth: '$date' },

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //             'authorized_by.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     } else if (query.fromDate && query.toDate && query.userId) {
  //       const userId = new ObjectId(query.userId);
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         {
  //           $sort: { _id: -1 },
  //         },
  //         {
  //           $match: {
  //             $and: [
  //               {
  //                 requestedBy: userId,
  //               },

  //               {
  //                 date: {
  //                   $gte: new Date(query.fromDate),
  //                   $lte: new Date(query.toDate),
  //                 },
  //               },
  //             ],
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,
  //             year: { $year: '$date' },
  //             month: { $month: '$date' },
  //             day: { $dayOfMonth: '$date' },

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //             'authorized_by.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     } else if (query.fromDate && query.toDate) {
  //       const resPerPage = 3;
  //       const currentPage = Number(query.page) || 1;
  //       const skip = resPerPage * (currentPage - 1);

  //       const count = await this.ScheduleModel.count({ date: query.fromDate });
  //       const totalPages = Math.ceil(count / resPerPage);

  //       const hasNextPage = currentPage < totalPages;
  //       const hasPreviousPage = currentPage > 1;
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         // { $sort: { _id: -1 } },
  //         {
  //           $match: {
  //             date: {
  //               $gte: new Date(query.fromDate),
  //               $lte: new Date(query.toDate),
  //             },
  //           },
  //         },
  //         { $sort: { _id: -1 } },
  //         { $limit: skip + resPerPage },
  //         { $skip: skip },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,
  //             year: { $year: '$date' },
  //             month: { $month: '$date' },
  //             day: { $dayOfMonth: '$date' },

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     } else if (query.userId) {
  //       const userId = new ObjectId(query.userId);
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         {
  //           $sort: { _id: -1 },
  //         },
  //         {
  //           $match: {
  //             requestedBy: userId,
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //             'authorized_by.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     } else if (query.status) {
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         {
  //           $sort: { _id: -1 },
  //         },
  //         {
  //           $match: {
  //             status: query.status,
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //             'authorized_by.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     } else if (query.type) {
  //       const resPerPage = 3;
  //       const currentPage = Number(query.page) || 1;
  //       const skip = resPerPage * (currentPage - 1);

  //       const count = await this.ScheduleModel.count({ type: query.type });

  //       const totalPages = Math.ceil(count / resPerPage);

  //       const hasNextPage = currentPage < totalPages;
  //       const hasPreviousPage = currentPage > 1;
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         // { $sort: { _id: -1 } },
  //         {
  //           $match: {
  //             type: query.type,
  //           },
  //         },
  //         { $sort: { _id: -1 } },
  //         { $limit: skip + resPerPage },
  //         { $skip: skip },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //             'authorized_by.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return {
  //         success: true,
  //         data: {
  //           count,
  //           hasNextPage,
  //           hasPreviousPage,
  //           totalPages,
  //           currentPage,
  //           scheduleDetail,
  //         },
  //       };
  //     } else if (query.authorizedId) {
  //       const userId = new ObjectId(query.authorizedId);
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         {
  //           $sort: { _id: -1 },
  //         },
  //         {
  //           $match: {
  //             authorizedBy: userId,
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },

  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },

  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             requestedBy: 1,
  //             createdAt: 1,

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //             'authorized_by.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     } else {
  //       const scheduleDetail = await this.ScheduleModel.aggregate([
  //         { $sort: { _id: -1 } },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'requestedBy',
  //             foreignField: '_id',
  //             as: 'user_detail',
  //           },
  //         },
  //         {
  //           $lookup: {
  //             from: 'users',
  //             localField: 'authorizedBy',
  //             foreignField: '_id',
  //             as: 'authorized_by',
  //           },
  //         },
  //         {
  //           $project: {
  //             _id: 1,
  //             date: 1,
  //             type: 1,
  //             reason: 1,
  //             status: 1,
  //             time: 1,
  //             duration: 1,
  //             createdAt: 1,

  //             'user_detail._id': 1,
  //             'user_detail.name': 1,
  //             'user_detail.profilePicture': 1,
  //             'authorized_by._id': 1,
  //             'authorized_by.name': 1,
  //             'authorized_by.profilePicture': 1,
  //           },
  //         },
  //       ]);
  //       return { success: true, scheduleDetail };
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async scheduleFilter(query) {
    try {
      if (query.fromDate && query.toDate && query.userId) {
        const userId = new ObjectId(query.userId);
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              $and: [
                {
                  requestedBy: userId,
                },

                {
                  date: {
                    $gte: new Date(query.fromDate),
                    $lte: new Date(query.toDate),
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.fromDate && query.toDate) {
        const resPerPage = 10;
        const currentPage = Number(query.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        const count = await this.ScheduleModel.count({ date: query.fromDate });

        const totalPages = Math.ceil(count / resPerPage);

        const hasNextPage = currentPage < totalPages;
        const hasPreviousPage = currentPage > 1;
        const scheduleDetail = await this.ScheduleModel.aggregate([
          // { $sort: { _id: -1 } },
          {
            $match: {
              date: {
                $gte: new Date(query.fromDate),
                $lte: new Date(query.toDate),
              },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: skip + resPerPage },
          { $skip: skip },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.userId) {
        const userId = new ObjectId(query.userId);
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              requestedBy: userId,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.status) {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              status: query.status,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.type) {
        const resPerPage = 10;
        const currentPage = Number(query.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        const count = await this.ScheduleModel.count({ type: query.type });

        const totalPages = Math.ceil(count / resPerPage);

        const hasNextPage = currentPage < totalPages;
        const hasPreviousPage = currentPage > 1;
        const scheduleDetail = await this.ScheduleModel.aggregate([
          // { $sort: { _id: -1 } },
          {
            $match: {
              type: query.type,
            },
          },
          { $sort: { _id: -1 } },
          { $limit: skip + resPerPage },
          { $skip: skip },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return {
          success: true,
          data: {
            count,
            // hasNextPage,
            // hasPreviousPage,
            totalPages,
            currentPage,
            scheduleDetail,
          },
        };
      } else if (query.authorizedId) {
        const userId = new ObjectId(query.authorizedId);
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              authorizedBy: userId,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          { $sort: { _id: -1 } },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },
          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              time: 1,
              duration: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      }
    } catch (error) {
      throw error;
    }
  }

  async userscheduleFilter(query, userId: any) {
    try {
      if (
        query.fromDate &&
        query.toDate &&
        query.status &&
        query.type &&
        query.authorizedId
      ) {
        const authorizedId = new ObjectId(query.authorizedId);
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              $and: [
                {
                  requestedBy: userId,
                },
                {
                  authorizedBy: authorizedId,
                },
                {
                  status: query.status,
                },
                {
                  type: query.type,
                },
                {
                  date: {
                    $gte: new Date(query.fromDate),
                    $lte: new Date(query.toDate),
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.fromDate && query.toDate && query.status && query.type) {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              $and: [
                {
                  requestedBy: userId,
                },

                {
                  status: query.status,
                },
                {
                  type: query.type,
                },
                {
                  date: {
                    $gte: new Date(query.fromDate),
                    $lte: new Date(query.toDate),
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.fromDate && query.toDate && query.status) {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              $and: [
                {
                  requestedBy: userId,
                },
                {
                  status: query.status,
                },

                {
                  date: {
                    $gte: new Date(query.fromDate),
                    $lte: new Date(query.toDate),
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.fromDate && query.toDate) {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              $and: [
                {
                  requestedBy: userId,
                },

                {
                  date: {
                    $gte: new Date(query.fromDate),
                    $lte: new Date(query.toDate),
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.fromDate && query.toDate) {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              requestedBy: userId,
              date: {
                $gte: new Date(query.fromDate),
                $lte: new Date(query.toDate),
              },
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,
              year: { $year: '$date' },
              month: { $month: '$date' },
              day: { $dayOfMonth: '$date' },

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.status) {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              requestedBy: userId,
              status: query.status,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.type) {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              requestedBy: userId,
              type: query.type,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else if (query.authorizedId) {
        const authorizedId = new ObjectId(query.authorizedId);
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $sort: { _id: -1 },
          },
          {
            $match: {
              authorizedBy: authorizedId,
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },

          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              requestedBy: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      } else {
        const scheduleDetail = await this.ScheduleModel.aggregate([
          {
            $match: {
              requestedBy: userId,
            },
          },
          { $sort: { _id: -1 } },
          {
            $lookup: {
              from: 'users',
              localField: 'requestedBy',
              foreignField: '_id',
              as: 'user_detail',
            },
          },
          {
            $lookup: {
              from: 'users',
              localField: 'authorizedBy',
              foreignField: '_id',
              as: 'authorized_by',
            },
          },
          {
            $project: {
              _id: 1,
              date: 1,
              type: 1,
              reason: 1,
              status: 1,
              time: 1,
              duration: 1,
              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.profilePicture': 1,
              'authorized_by._id': 1,
              'authorized_by.name': 1,
              'authorized_by.profilePicture': 1,
            },
          },
        ]);
        return { success: true, scheduleDetail };
      }
    } catch (error) {
      throw error;
    }
  }

  // async countStatus() {
  //   try {
  //     let totalLeaveRequest = 0;
  //     let totalWfhRequest = 0;
  //     let totalEarlyRequest = 0;
  //     let totalBreakRequest = 0;
  //     let totalLateRequest = 0;
  //     const data = await this.ScheduleModel.aggregate([
  //       {
  //         $group: {
  //           _id: { type: '$type', status: '$status' },
  //           count: { $sum: 1 },
  //         },
  //       },
  //       { $sort: { count: -1 } },
  //     ]);

  //     const leave = [];
  //     const wfh = [];
  //     for (let i = 0; i < data.length; i++) {
  //       if (
  //         data[i]._id.type === 'Leave_Full_Day' ||
  //         data[i]._id.type === 'Leave_First_Half' ||
  //         data[i]._id.type === 'Leave_Second_Half'
  //       ) {
  //         leave.push(data[i].count);
  //       } else if (
  //         data[i]._id.type === 'WFH_Full_Day' ||
  //         data[i]._id.type === 'WFH_First_Half' ||
  //         data[i]._id.type === 'WFH_Second_Half'
  //       ) {
  //         wfh.push(data[i].count);
  //       } else if (data[i]._id.type === 'Late_Coming') {
  //         totalLateRequest = data[i].count;
  //       } else if (data[i]._id.type === 'Early_Going') {
  //         totalEarlyRequest = data[i].count;
  //       } else if (data[i]._id.type === 'Break') {
  //         totalBreakRequest = data[i].count;
  //       }
  //     }
  //     totalLeaveRequest = leave.reduce((accumulator, curValue) => {
  //       return accumulator + curValue;
  //     }, 0);
  //     totalWfhRequest = wfh.reduce((accumulator, curValue) => {
  //       return accumulator + curValue;
  //     }, 0);

  //     return {
  //       totalLeaveRequest,
  //       totalWfhRequest,
  //       totalLateRequest,
  //       totalEarlyRequest,
  //       totalBreakRequest,
  //       data,
  //     };
  //   } catch (error) {
  //     throw error;
  //   }
  // }

  async test(query) {
    try {
      const data = await this.ScheduleModel.find({
        // type: { $in: ['Leave_Second_Half', 'WFH_Full_Day'] },
        requestedBy: { $in: [new ObjectId(query.userId)] },
      });
      return data;
    } catch (error) {
      throw error;
    }
  }

  async countStatus() {
    try {
      const data = await this.ScheduleModel.aggregate([
        {
          $group: {
            _id: { status: '$status', type: '$type' },
            count: { $sum: 1 },
          },
        },
      ]);

      return {
        data,
      };
    } catch (error) {
      throw error;
    }
  }
}
