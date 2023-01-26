import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UtilsService } from 'src/utils/utils.service';
import * as mongoose from 'mongoose';
import { SystemService } from 'src/system/system.service';
import { UsersService } from 'src/users/users.service';
import * as moment from 'moment';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel('Lead') private readonly leadModel: Model<any>,
    @InjectModel('LeadActivity') private readonly leadActModel: Model<any>,
    @InjectModel('LeadSort') private readonly leadSortModel: Model<any>,
    private readonly utilsService: UtilsService,
    private readonly sysService: SystemService,
    private readonly usersService: UsersService,
  ) {}

  async createLead(user, orgId, dto) {
    dto.name = dto.name ? this.utilsService.encryptData(dto.name) : undefined;
    dto.domain = dto.domain || undefined;
    dto.leadName = dto.leadName
      ? this.utilsService.encryptData(dto.leadName)
      : undefined;
    dto.email = dto.email
      ? this.utilsService.encryptData(dto.email)
      : undefined;
    dto.country = dto.country
      ? this.utilsService.encryptData(dto.country)
      : undefined;
    dto.contactNumber = dto.contactNumber
      ? this.utilsService.encryptData(dto.contactNumber)
      : undefined;
    dto.description = dto.description
      ? this.utilsService.encryptData(dto.description)
      : undefined;
    dto.budgetExpectation = dto.budgetExpectation
      ? this.utilsService.encryptData(dto.budgetExpectation)
      : undefined;
    dto.budgetProposed = dto.budgetProposed
      ? this.utilsService.encryptData(dto.budgetProposed)
      : undefined;
    dto.currency = dto.currency
      ? this.utilsService.encryptData(dto.currency)
      : undefined;
    dto.proposalLink = dto.proposalLink
      ? this.utilsService.encryptData(dto.proposalLink)
      : undefined;
    dto.dateContactedFirst = dto.dateContactedFirst
      ? new Date(dto.dateContactedFirst)
      : undefined;
    dto.nextFollowUp = dto.nextFollowUp
      ? new Date(dto.nextFollowUp)
      : undefined;
    dto.settledFor = this.utilsService.encryptData('0');
    if (dto.status && dto.status == 'Awarded') {
      dto.settledFor = dto.settledFor
        ? this.utilsService.encryptData(dto.settledFor)
        : this.utilsService.encryptData('0');
    }
    if (dto.managedBy) {
      const manager = await this.usersService.getUser({
        _id: dto.managedBy,
        'userType.organisation': orgId,
        'userType.userType': { $in: ['Admin', 'Member++'] },
      });

      if (!manager) {
        dto.managedBy = undefined;
      }
    }

    let lead = new this.leadModel(dto);
    lead.createdBy = user._id;
    lead.organisation = orgId;

    lead = await lead.save();
    lead = await this.getDecryptedLead(lead);
    return {
      message: 'Lead created Successfully',
      data: { lead: lead },
      success: true,
    };
  }

  async updateLead(user, orgId, dto, leadId) {
    let lead = await this.leadModel.findOne({ _id: leadId });
    if (String(lead.organisation) != orgId) {
      throw new HttpException(
        'Given set of lead and organisation does not exist!',
        HttpStatus.BAD_REQUEST,
      );
    }
    lead.name = dto.name ? this.utilsService.encryptData(dto.name) : lead.name;
    lead.leadName = dto.leadName
      ? this.utilsService.encryptData(dto.leadName)
      : lead.leadName;
    lead.email = dto.email
      ? this.utilsService.encryptData(dto.email)
      : lead.email;
    lead.country = dto.country
      ? this.utilsService.encryptData(dto.country)
      : lead.country;
    lead.contactNumber = dto.contactNumber
      ? this.utilsService.encryptData(dto.contactNumber)
      : lead.contactNumber;
    lead.proposalLink = dto.proposalLink
      ? this.utilsService.encryptData(dto.proposalLink)
      : undefined;
    lead.reference = dto.reference ? dto.reference : lead.reference;
    lead.domain = dto.domain ? dto.domain : lead.domain;
    lead.platforms = dto.platforms || lead.platforms;
    lead.description = dto.description
      ? this.utilsService.encryptData(dto.description)
      : lead.description;
    lead.budgetExpectation = dto.budgetExpectation
      ? this.utilsService.encryptData(dto.budgetExpectation)
      : lead.budgetExpectation;
    lead.currency = dto.currency
      ? this.utilsService.encryptData(dto.currency)
      : lead.currency;
    lead.budgetProposed = dto.budgetProposed
      ? this.utilsService.encryptData(dto.budgetProposed)
      : lead.budgetProposed;
    lead.durationExpectation = dto.durationExpectation
      ? dto.durationExpectation
      : lead.durationExpectation;
    lead.durationProposed = dto.durationProposed
      ? dto.durationProposed
      : lead.durationProposed;
    lead.dateContactedFirst = dto.dateContactedFirst
      ? new Date(dto.dateContactedFirst)
      : lead.dateContactedFirst;
    lead.nextFollowUp = dto.nextFollowUp
      ? new Date(dto.nextFollowUp)
      : lead.nextFollowUp;
    lead.lastUpdatedBy = user._id;
    lead.isFavourite =
      dto.isFavourite !== undefined ? dto.isFavourite : lead.isFavourite;
    if (dto.settledFor) {
      if (!dto.status && lead.status == 'Awarded') {
        lead.settledFor = await this.utilsService.encryptData(dto.settledFor);
      } else if (dto.status && dto.status == 'Awarded') {
        lead.settledFor = await this.utilsService.encryptData(dto.settledFor);
      }
    }

    if (dto.managedBy) {
      const manager = await this.usersService.getUser({
        _id: dto.managedBy,
        'userType.organisation': orgId,
        'userType.userType': { $in: ['Admin', 'Member++'] },
      });

      if (!manager) {
        dto.managedBy = undefined;
      } else {
        lead.managedBy = dto.managedBy;
      }
    }
    lead.status = dto.status ? dto.status : lead.status;

    lead = await lead.save({ new: true });

    lead = await this.getDecryptedLead(lead);

    return {
      message: 'Lead updated successfully',
      data: { lead: lead },
      success: true,
    };
  }

  async getDecryptedLead(lead) {
    lead.name = lead.name
      ? this.utilsService.decryptData(lead.name)
      : lead.name;
    lead.leadName = lead.leadName
      ? this.utilsService.decryptData(lead.leadName)
      : lead.leadName;
    lead.email = lead.email
      ? this.utilsService.decryptData(lead.email)
      : lead.email;
    lead.country = lead.country
      ? this.utilsService.decryptData(lead.country)
      : lead.country;
    lead.contactNumber = lead.contactNumber
      ? this.utilsService.decryptData(lead.contactNumber)
      : lead.contactNumber;
    lead.platforms = lead.platforms || lead.platforms;
    lead.description = lead.description
      ? this.utilsService.decryptData(lead.description)
      : lead.description;
    lead.budgetExpectation = lead.budgetExpectation
      ? this.utilsService.decryptData(lead.budgetExpectation)
      : lead.budgetExpectation;
    lead.currency = lead.currency
      ? this.utilsService.decryptData(lead.currency)
      : lead.currency;
    lead.budgetProposed = lead.budgetProposed
      ? this.utilsService.decryptData(lead.budgetProposed)
      : lead.budgetProposed;
    lead.settledFor = lead.settledFor
      ? this.utilsService.decryptData(lead.settledFor)
      : lead.settledFor;
    lead.proposalLink = lead.proposalLink
      ? this.utilsService.decryptData(lead.proposalLink)
      : lead.proposalLink;

    return lead;
  }

  async getLeads(orgId, status) {
    // const leads = await this.leadModel.find({organisation: orgId, status}).select({dateContactedFirst: 1, nextFollowUp: 1, country: 1, email: 1, name: 1, status: 1, isFavourite: 1}).populate('createdBy').exec();
    const leads = await this.leadModel.aggregate([
      {
        $match: { organisation: mongoose.Types.ObjectId(orgId), status },
      },
      {
        $lookup: {
          from: 'leadsorts',
          localField: '_id',
          foreignField: 'lead',
          as: 'sequence',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'managedBy',
          foreignField: '_id',
          as: 'managedBy',
        },
      },
      {
        $sort: { 'sequence.sequence': 1 },
      },
      {
        $project: {
          dateContactedFirst: 1,
          nextFollowUp: 1,
          country: 1,
          email: 1,
          name: 1,
          status: 1,
          isFavourite: 1,
          sequence: 1,
          'managedBy.name': 1,
          'managedBy.profilePicture': 1,
        },
      },
    ]);
    const decryptedLeads = [];
    for (let i = 0; i < leads.length; i++) {
      decryptedLeads.push(await this.getDecryptedLead(leads[i]));
    }
    return { message: '', data: { leads: decryptedLeads }, success: true };
  }

  async getLead(orgId, leadId) {
    let lead = await this.leadModel
      .findOne({ organisation: orgId, _id: leadId })
      .populate('managedBy')
      .exec();
    if (!lead) {
      throw new HttpException('No such lead exists.', HttpStatus.BAD_REQUEST);
    }
    lead = await this.getDecryptedLead(lead);
    return { data: { lead: lead }, message: '', success: true };
  }

  async deleteLead(orgId, leadId) {
    const ifDeleted = await this.leadModel.deleteOne({
      _id: leadId,
      organisation: orgId,
    });
    if (ifDeleted.ok == 0) {
      throw new HttpException('No Such lead Exists!!', HttpStatus.BAD_REQUEST);
    }
    return { success: true, message: 'Lead Deleted Successfully', data: {} };
  }

  async createLeadActivity(admin, orgId, dto, leadId) {
    const lead = await this.leadModel
      .findOne({ _id: leadId, organisation: orgId })
      .exec();
    if (!lead) {
      throw new HttpException('No such lead exists!', HttpStatus.BAD_REQUEST);
    }
    dto.lead = leadId;
    dto.createdBy = admin._id;
    dto.organisation = orgId;

    let activity = new this.leadActModel(dto);

    activity = await activity.save();

    return {
      data: activity,
      message: 'Activity created successfully.',
      success: true,
    };
  }

  async updateLeadActivity(admin, orgId, dto, leadActId) {
    let leadAct = await this.leadActModel
      .findOne({ _id: leadActId, organisation: orgId })
      .exec();

    if (!leadAct) {
      throw new HttpException(
        'No such activity exists!',
        HttpStatus.BAD_REQUEST,
      );
    }

    leadAct.activity = dto.activity ? dto.activity : leadAct.activity;
    leadAct.date = dto.date ? new Date(dto.date) : leadAct.date;
    leadAct.lastUpdatedBy = admin._id;

    leadAct = leadAct.save({ new: true });

    return {
      data: { activity: leadAct },
      message: 'Activity saved successfully.',
      success: true,
    };
  }

  async deleteLeadActivities(admin, orgId, leadActIds: String[]) {
    const deleted = await this.leadActModel.deleteMany({
      _id: { $in: leadActIds },
      organisation: orgId,
    });
    if (deleted.n > 0) {
      return {
        data: { deleted },
        message: 'Activities deleted successfully.',
        success: true,
      };
    } else {
      throw new HttpException('No activity got deleted!', 500);
    }
  }

  async getLeadActivities(orgId, leadId) {
    const activities = await this.leadActModel
      .find({ organisation: orgId, lead: leadId })
      .sort({ date: -1, createdAt: -1 })
      .populate('createdBy')
      .exec();
    return { data: { activities }, message: '', success: true };
  }

  async getLeadsBydate(orgId, date) {
    const leads = await this.leadModel
      .find({
        organisation: orgId,
        nextFollowUp: new Date(date),
        status: 'Active',
      })
      .populate('createdBy', 'managedBy')
      .exec();

    const decryptedLeads = [];
    for (let i = 0; i < leads.length; i++) {
      decryptedLeads.push(await this.getDecryptedLead(leads[i]));
    }

    return { data: { leads: decryptedLeads }, message: '', success: true };
  }

  async getFavouriteLeads(orgId) {
    const leads = await this.leadModel
      .find({ organisation: orgId, isFavourite: true })
      .populate('managedBy')
      .exec();

    const decryptedLeads = [];
    for (let i = 0; i < leads.length; i++) {
      decryptedLeads.push(await this.getDecryptedLead(leads[i]));
    }

    return { data: { leads: decryptedLeads }, message: '', success: true };
  }

  async getTotalLeadsDash(orgId, from, to) {
    from = from ? new Date(from) : from;
    to = to ? new Date(to) : to;

    const filter = {};

    filter['organisation'] = mongoose.Types.ObjectId(orgId);
    if (from || to) {
      const date = { $lte: undefined, $gte: undefined };
      if (from) {
        date.$lte = to;
      }
      if (to) {
        date.$gte = from;
      }

      filter['dateContactedFirst'] = date;
    }

    let leads = await this.leadModel.aggregate([
      {
        $match: filter,
      },
      {
        $group: {
          _id: '$reference',
          count: { $sum: 1 },
        },
      },
    ]);

    // return {data: {leads}, message: '', success: true};
    return leads;
  }

  async getTotalSalesDash(orgId, from, to) {
    from = from ? new Date(from) : from;
    to = to ? new Date(to) : to;

    const filter = {};

    filter['organisation'] = mongoose.Types.ObjectId(orgId);
    filter['status'] = 'Awarded';
    if (from || to) {
      const date = { $lte: undefined, $gte: undefined };
      if (from) {
        date.$lte = to;
      }
      if (to) {
        date.$gte = from;
      }

      filter['dateContactedFirst'] = date;
    }

    const leads = await this.leadModel
      .find(filter, { settledFor: 1, currency: 1 })
      .exec();

    const sysCurr = await this.sysService.getCurrencies();
    const currObj = {};
    sysCurr.forEach((element) => {
      currObj[element.currency] = element.usdEquivalent;
    });

    let sales = 0;
    let currency;
    for (let i = 0; i < leads.length; i++) {
      currency = leads[i].currency
        ? await this.utilsService.decryptData(leads[i].currency)
        : 'USD';
      sales +=
        parseFloat(
          leads[i].settledFor
            ? await this.utilsService.decryptData(leads[i].settledFor)
            : '0',
        ) * currObj[currency];
    }

    // return {data: {sales}, message: '', success: true};
    return sales;
  }

  async getTotalAwardedLead() {
    const leads = await this.leadModel.find();
    let awarded = 0;
    let lastAwardedLead: any = {};

    leads.forEach((el, i) => {
      if (el.status === 'Awarded') {
        awarded += 1;

        if (Object.keys(lastAwardedLead).length === 0) {
          lastAwardedLead = el;
        } else {
          if (moment(el.updatedAt).isAfter(lastAwardedLead.updatedAt)) {
            lastAwardedLead = el;
          }
        }
      }
    });

    if (Object.keys(lastAwardedLead).length > 0) {
      let name;
      name = await this.utilsService.decryptData(lastAwardedLead.name);
      lastAwardedLead.name = name;
      lastAwardedLead = {
        name: lastAwardedLead.name,
        status: lastAwardedLead.status,
        updatedAt: lastAwardedLead.updatedAt,
      };
    }

    return { awarded, lastAwardedLead };
  }

  async dashBoard(orgId, from, to) {
    const sales = await this.getTotalSalesDash(orgId, from, to);
    const leadsCount = await this.getTotalLeadsDash(orgId, from, to);

    const { awarded, lastAwardedLead } = await this.getTotalAwardedLead();
    return {
      data: { sales, leadsCount, awarded, lastAwardedLead },
      message: '',
      success: true,
    };
  }

  async pendingFollowUps(user, orgId) {
    const leads = await this.leadModel
      .find({
        managedBy: user._id,
        organisation: orgId,
        date: { $lte: new Date() },
        status: { $in: ['Active', 'Idle'] },
      })
      .exec();

    const decryptedLeads = [];
    for (let i = 0; i < leads.length; i++) {
      decryptedLeads.push(await this.getDecryptedLead(leads[i]));
    }

    return { data: { leads: decryptedLeads }, message: '', success: true };
  }

  async sortLeads(leads, orgId) {
    const filteredLeads = await this.leadModel
      .find({ _id: { $in: Object.keys(leads) }, organisation: orgId })
      .exec();

    const leadSequences = {};
    filteredLeads.forEach((element) => {
      leadSequences[String(element._id)] = leads[`${String(element._id)}`];
    });

    const sorts = await this.leadSortModel
      .find({ lead: { $in: Object.keys(leadSequences) } })
      .exec();

    for (let i = 0; i < sorts.length; i++) {
      sorts[i].sequence = leadSequences[String(sorts[i].lead)];
      leadSequences[String(sorts[i].lead)] = undefined;
      sorts[i].save();
    }

    const x = [];
    const leadIds = Object.keys(leadSequences);
    for (let i = 0; i < leadIds.length; i++) {
      if (leadSequences[`${leadIds[i]}`] != undefined) {
        x.push({
          lead: leadIds[i],
          sequence: leads[`${leadIds[i]}`],
        });
      }
    }

    await this.leadSortModel.insertMany(x);

    return { data: {}, success: true, message: '' };
  }
}
