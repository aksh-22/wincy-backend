import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { AddSalaryDto } from './dto/add-salary.dto';
import { UpdateSalaryDto } from './dto/update-salary.dto';
import { Salary, SalaryDocument } from './schema/salary.schema';

@Injectable()
export class SalaryService {
  constructor(
    @InjectModel(Salary.name) private salaryModel: Model<SalaryDocument>,
  ) {}

  async addSalary(dto: AddSalaryDto, createdBy) {
    try {
      if (dto.data.length === 0) {
        throw new NotAcceptableException('Invalid data');
      }
      for (let i = 0; i < dto.data.length; i++) {
        const { userId, startDate, endDate, salary } = dto.data[i];
        const model = await new this.salaryModel();
        model.userId = userId;
        model.startDate = startDate;
        model.endDate = endDate;
        model.salary = salary;
        model.createdBy = createdBy;
        await model.save();
      }
      return { message: 'Salary has been added succesfully' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async viewSalary(id) {
    try {
      const salaries = await this.salaryModel
        .aggregate([
          {
            $match: {
              userId: new ObjectId(id),
            },
          },

          {
            $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'user_detail',
            },
          },
          {
            $unwind: {
              path: '$user_detail',
              preserveNullAndEmptyArrays: true,
            },
          },

          {
            $project: {
              _id: 1,
              userId: 1,
              startDate: 1,
              endDate: 1,
              salary: 1,

              createdAt: 1,

              'user_detail._id': 1,
              'user_detail.name': 1,
              'user_detail.email': 1,
            },
          },

          // {
          //   $group: {
          //     _id: '$user_detail._id',
          //     user_detail: { $first: '$user_detail' },
          //     salaries: { $push: '$$ROOT' },
          //   },
          // },
          // {
          //   $project: {
          //     _id: '$salaries._id',
          //     userId: '$salaries.userId',
          //     startDate: '$salaries.startDate',
          //     endDate: '$salaries.endDate',
          //     salary: '$salaries.salary',
          //     createdAt: '$salaries.createdAt',
          //     user_detail: 1,
          //   },
          // },
        ])
        .sort({ _id: -1 });

      return { message: 'Salary view', data: { salaries } };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async updateSalary(id, dto: UpdateSalaryDto) {
    try {
      const { startDate, endDate, salary } = dto;
      const data = await this.salaryModel.findById(id);
      if (!data) {
        throw new NotFoundException('Invalid Id');
      }
      if (startDate) data.startDate = startDate;
      if (endDate) data.endDate = endDate;
      if (salary) data.salary = salary;

      await data.save();
      return { message: 'Updated successfully' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async deleteSalary(id) {
    try {
      const data = await this.salaryModel.findByIdAndDelete(id);
      if (!data) {
        throw new NotFoundException('Invalid Id');
      }
      return { message: 'Deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async salaryDetail(id) {
    return await this.salaryModel
      .find({
        userId: id,
      })
      .sort({ _id: -1 });
  }
}
