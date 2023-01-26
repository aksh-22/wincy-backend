import { forwardRef, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { ProjectsService } from 'src/projects/projects.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel('Event') private readonly eventModel: Model<any>,
    @Inject(forwardRef(() => ProjectsService))private readonly projectsService: ProjectsService
  ){}

  async createPublicEvents(user, orgId, dto){
    let project;
    if(user.type == "Member+" && user.email != "info@pairroxz.com"){ //Extra permission given to info Pairroxz Id, should be removed in future.
      if(dto.project !== undefined && dto.category == "Meeting"){
        project = await this.projectsService.getAppProject({_id: dto.project, organisation: orgId},{});
        if(!project && String(project.projectHead) != String(user._id)){
          throw new HttpException("No such project exists!", HttpStatus.BAD_REQUEST);
        }
      }
      else{
        throw new HttpException("Member+ is authorised to add project level meetings only!", HttpStatus.BAD_REQUEST)
      }
    }
    if(dto.range === true && dto.dateFrom && dto.dateTo && !dto.date) {
      throw new HttpException('Please provide date range parameters!', HttpStatus.BAD_REQUEST);
    }

    let event = new this.eventModel({
      type: "Public",
      category: dto.category,
      title: dto.title,
      description: dto.description,
      date: dto.isRange  ? new Date(dto.dateTo) : new Date(dto.date),
      isRange: dto.isRange ,
      dateFrom: dto.isRange  ? new Date(dto.dateFrom) : undefined,
      dateTo: dto.isRange  ? new Date(dto.dateTo) : undefined,
      organisation: orgId,
      project: ["Meeting", "Milestone"].includes(dto.category) ? dto.project : undefined,
      milestone: dto.category == "Milestone" ? dto.milestone : undefined,
      users: dto.category == "Meeting" ? dto.users : undefined,
      createdBy: user._id,
    })

    event = await event.save();

    return {data: {event}, message: "Event saved successfully.", success: true};
  }

  async updatePublicEvent(user, orgId, eventId, dto){
    let event = await this.eventModel.findOne({organisation: orgId, _id: eventId}).exec();
    if(!event){
      throw new HttpException("No such event exists!", HttpStatus.BAD_REQUEST);
    }
    let project;
    if(user.type == "Member+" && user.email != "info@pairroxz.com"){
      if((dto.project !== undefined || event.project !== undefined) && event.category == "Meeting"){
        project = await this.projectsService.getAppProject({_id: dto.project, organisation: orgId},{});
        if(!project && String(project.projectHead) != String(user._id)){
          throw new HttpException("No such project exists!", HttpStatus.BAD_REQUEST);
        }
        dto.category = undefined;
      }
      else{
        throw new HttpException("Member+ is authorised to add project level meetings only!", HttpStatus.BAD_REQUEST)
      }
    }

    event.title = dto.title || event.title;
    event.description = dto.description !== undefined ? dto.description : event.description;
    event.date = dto.date ? new Date(dto.date) : event.date;
    if(dto.isRange === true || (dto.isRange === undefined && event.isRange === true)) {
      if(dto.dateTo) {
        event.dateTo = new Date(dto.dateTo);
        event.date = new Date(dto.dateTo);
      }
      event.dateFrom = dto.dateFrom ? new Date(dto.dateFrom) : event.dateFrom;
    }
    if(dto.isRange === false) {
      event.isRange = dto.isRange;
      event.date = new Date(dto.date);
      if(!dto.date) {
        throw new HttpException('Please, provide date of event in case of no range of dates.', HttpStatus.BAD_REQUEST);
      }
    }

    if(dto.category){
      if(event.category == "Meeting" && dto.category != "Meeting"){
        event.users = undefined;
      }
      event.category = dto.category;
    }
    
    event.project = event.category === "Meeting" ? dto.project : event.project;
    if(dto.users && event.category == "Meeting"){
      dto.users = [...new Set(dto.users)];
      event.users = [user._id];
      dto.users.forEach(element => {
        try{
          event.users.push(mongoose.Types.ObjectId(element));
        } catch{
          undefined;
        }
      });
    }

    event = await event.save({new: true});

    return {data: {event}, message: "Event updated successfully!", success: true}
  }

  async getPublicEvents(user, orgId, month, year){
    let filter;
    if(["Admin", "Member++"].includes(user.type)){
      filter = {type: "Public", organisation: mongoose.Types.ObjectId(orgId)};
    }
    else {
      const projects = await this.projectsService.getMultiProjectsApp({organisation: orgId, $or:[{team : user._id}, {projectHead: user._id}]}, {});
      const projectIds = projects.map(ele => ele._id);
      filter = {
        $or: [
          {type: "Public", category: "Milestone", organisation: mongoose.Types.ObjectId(orgId), project: {$in: projectIds}},
          {type: "Public", category: "Meeting", organisation: mongoose.Types.ObjectId(orgId), users: user._id},
          {type: "Public", category: "Event", organisation: mongoose.Types.ObjectId(orgId)},
          {type: "Public", category: "Holiday", organisation: mongoose.Types.ObjectId(orgId)},
        ]
      }
    }
    // const events = await this.eventModel.find({type: "Public", $or: [{organisation: orgId}, {organisation: orgId, users: user._id}]}).populate("createdBy", ["name", "profilePicture", "email"]).populate("users", ["name", "profilePicture", "email"]).exec();

    const events = await this.eventModel.aggregate([
      {
        $match: filter
      },
      {
        $project: { month : {$month: "$date"}, year: {$year: "$date"}, type: 1, category: 1, title: 1, description: 1, date: 1, createdBy: 1, lastUpdatedBy: 1, isRange: 1, dateFrom: 1, dateTo: 1}
      },
      {
        $match: {month, year}
      },
      {
        $lookup:{
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "lastUpdatedBy",
          foreignField: "_id",
          as: "lastUpdatedBy"
        }
      },
      {
        $project: {
          "createdBy.sessions":0,
          "createdBy.password":0,
          "createdBy.projects":0,
          "createdBy.userType":0,
          "createdBy.createdAt":0,
          "createdBy.updatedAt":0,
          "createdBy.accountDetails":0,
          "createdBy.verified": 0,
          "lastUpdatedBy.sessions":0,
          "lastUpdatedBy.password":0,
          "lastUpdatedBy.projects":0,
          "lastUpdatedBy.userType":0,
          "lastUpdatedBy.createdAt":0,
          "lastUpdatedBy.updatedAt":0,
          "lastUpdatedBy.accountDetails":0,
          "lastUpdatedBy.verified": 0,
          "createdBy.phoneNumber": 0,
          "lastUpdatedBy.phoneNumber": 0,
          "createdBy.dateOfBirth": 0,
          "lastUpdatedBy.dateOfBirth": 0,
          "createdBy.passwordUpdatedAt":0,
          "lastUpdatedBy.passwordUpdatedAt": 0 
        }
      }
    ])
    return {data: {"events": events}, message: "", success: true}
  }

  async deletePublicEvent(user, orgId, eventId){
    let deleted;
    if(user.type == "Member+"){
      deleted = await this.eventModel.deleteOne({type: "Public", organisation: orgId, _id: eventId, createdBy: user._id}).exec();
    } else {
      deleted = await this.eventModel.deleteOne({type: "Public", organisation: orgId, _id: eventId}).exec();
    }
    if(deleted.n < 1){
      throw new HttpException("Event did not get deleted! Please try again.", HttpStatus.BAD_REQUEST);
    }
    return {data: {deleted}, message: "Event deleted successfully.", success: true};
  }

  async createPrivateEvent(user, dto){
    if(dto.range === true && dto.dateFrom && dto.dateTo && !dto.date) {
      throw new HttpException('Please provide date range parameters!', HttpStatus.BAD_REQUEST);
    }

    let event = new this.eventModel({
      type: "Private",
      category: "Event",
      title: dto.title,
      description: dto.description,
      date: dto.isRange  ? new Date(dto.dateTo) : new Date(dto.date),
      isRange: dto.isRange ,
      dateFrom: dto.isRange  ? new Date(dto.dateFrom) : undefined,
      dateTo: dto.isRange  ? new Date(dto.dateTo) : undefined,
      createdBy: user._id,
    })

    event = await event.save();

    return {data: {event}, message: "Event saved successfully.", success: true};
  }

  async updatePrivateEvent(user, eventId, dto){
    let event = await this.eventModel.findOne({_id: eventId, type: "Private"}).populate("createdBy", ["name", "profilePicture"]).exec();

    if(!event) {
      throw new HttpException("No such event exists!", HttpStatus.BAD_REQUEST);
    }
    event.title = dto.title || event.title;
    event.description = dto.description !== undefined ? dto.description : event.description;
    if(dto.isRange === true || (dto.isRange === undefined && event.isRange === true)) {
      if(dto.dateTo) {
        event.dateTo = new Date(dto.dateTo);
        event.date = new Date(dto.dateTo);
      }
      event.dateFrom = dto.dateFrom ? new Date(dto.dateFrom) : event.dateFrom;
    }
    if(dto.isRange === false) {
      event.isRange = dto.isRange;
      event.date = new Date(dto.date);
      if(!dto.date) {
        throw new HttpException('Please, provide date of event in case of no range of dates.', HttpStatus.BAD_REQUEST);
      }
    }
    event.date = dto.date ? new Date(dto.date) : event.date;
    event = await event.save({new: true});

    return {data: {event}, message: "Event updated successfully.", success: true};
  }

  async getPrivateEvents(user, month, year){
    // const events = await this.eventModel.find({type: "Private", createdBy: user._id}).populate("createdBy", ["name", "profilePicture"]).exec();
    const events = await this.eventModel.aggregate([
      {
        $match: {type: "Private", createdBy: user._id}
      },
      {
        $project: { month : {$month: "$date"}, year: {$year: "$date"}, type: 1, category: 1, title: 1, description: 1, date: 1, createdBy: 1, lastUpdatedBy: 1, isRange: 1, dateFrom: 1, dateTo: 1}
      },
      {
        $match: {month, year}
      },
      {
        $lookup:{
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "lastUpdatedBy",
          foreignField: "_id",
          as: "lastUpdatedBy"
        }
      },
      {
        $project: {
          "createdBy.sessions":0,
          "createdBy.password":0,
          "createdBy.projects":0,
          "createdBy.userType":0,
          "createdBy.createdAt":0,
          "createdBy.updatedAt":0,
          "createdBy.accountDetails":0,
          "createdBy.verified": 0,
          "lastUpdatedBy.sessions":0,
          "lastUpdatedBy.password":0,
          "lastUpdatedBy.projects":0,
          "lastUpdatedBy.userType":0,
          "lastUpdatedBy.createdAt":0,
          "lastUpdatedBy.updatedAt":0,
          "lastUpdatedBy.accountDetails":0,
          "lastUpdatedBy.verified": 0,
          "createdBy.phoneNumber": 0,
          "lastUpdatedBy.phoneNumber": 0,
          "createdBy.dateOfBirth": 0,
          "lastUpdatedBy.dateOfBirth": 0,
          "createdBy.passwordUpdatedAt":0,
          "lastUpdatedBy.passwordUpdatedAt": 0 
        }
      }
    ])
    return {data: {"events":events}, message: "", success: true};
  }

  async deletePrivateEvent(user, eventId){
    const deleted = await this.eventModel.deleteOne({type: "Private", createdBy: user._id, _id: eventId}).exec();
    if(deleted.n < 1){
      throw new HttpException("Event did not get deleted!", HttpStatus.BAD_REQUEST);
    }
    return {data: {deleted}, message: "Event deleted successfully.", success: true};
  }

  async getMyEvents(user, orgId, month, year){
    const publicEvents = (await this.getPublicEvents(user, orgId, month, year)).data.events;
    const privateEvents = (await this.getPrivateEvents(user, month, year)).data.events;

    return {data: {"publicEvents": publicEvents, "privateEvents": privateEvents}, message: "", success: true};
  }

  async getSingleEvent(args, projections){
    return await this.eventModel.findOne(args, projections).exec();
  }
}
