import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel('Activity') private readonly activityModel: Model<any>,
  ){}

  async createActivity(data: Object[]){
    const activities = await this.activityModel.insertMany(data);
    return activities;
  }

  async getActivities(filter){
    const activities = await this.activityModel.find(filter).sort({createdAt: -1}).populate('createdBy', ['name', 'profilePicture']).exec();
    return {data: {activities}, message: "", success: true};
  }

  async compareDocs(dto, ){}
}
