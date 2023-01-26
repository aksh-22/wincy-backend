import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class SystemService {
  constructor(
    @InjectModel('Technology') private readonly techModel: Model<any>,
    @InjectModel('Platform') private readonly platformModel: Model<any>,
    @InjectModel('Currency') private readonly currencyModel: Model<any>,
    @InjectModel('Gateway') private readonly gatewayModel: Model<any>,
  ){}

  async getPlatforms(args){
    return await this.platformModel.find(args).exec();
  }

  async getTechnologies(){
    return await this.techModel.find().exec();
  }

  async getCurrencies() {
    return await this.currencyModel.find().exec();
  }

  async getGateways(args) {
    return await this.gatewayModel.find(args).exec();
  }
}
