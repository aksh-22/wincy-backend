import { MailerService } from '@nestjs-modules/mailer';
import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as sendgrid from '@sendgrid/mail';
import { Model, Types } from 'mongoose';
import { Permission } from 'src/auth/permission.enum';
import { Hierarchy } from 'src/auth/roles.enum';
import { ConfigService } from 'src/config/config.service';
import { ProjectsService } from 'src/projects/projects.service';
import { UsersService } from 'src/users/users.service';
import { UtilsService } from 'src/utils/utils.service';
import { UpdatePermissionDto } from './dto/account.dto';
import { LinkCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { GetTeamDto } from './dto/team.dto';

@Injectable()
export class OrganisationsService {
  constructor(
    @InjectModel('Organisation') private readonly orgModel: Model<any>,
    @InjectModel('Invitation') private readonly invitationModel: Model<any>,
    @InjectModel('Subsiduary') private readonly subsiduaryModel: Model<any>,
    @InjectModel('Account') private readonly accountModel: Model<any>,
    @InjectModel('Customer') private readonly customerModel: Model<any>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => ProjectsService))
    private readonly projectsService: ProjectsService,
    private readonly jwtService: JwtService,
    private readonly utilsService: UtilsService,
    private readonly mailerService: MailerService,
  ) {}

  //===================================================//

  async createOrganisation(admin, dto) {
    const orgCount = await this.orgModel.find().countDocuments().exec();
    if (orgCount > 0) {
      throw new HttpException(
        "Pairroxz Technologies' inhouse product for it's inhouse use!",
        HttpStatus.BAD_REQUEST,
      );
    }
    dto.owner = admin._id;
    let org = new this.orgModel(dto);

    org = await org.save();
    if (!admin.userType) {
      admin.userType = [{ organisation: org._id, userType: 'Admin' }];
    } else {
      admin.userType.push({ organisation: org._id, userType: 'Admin' });
    }
    admin = await admin.save({ new: true });
    return {
      message: 'Organisation created successfully.',
      data: { organisation: org, user: admin },
      status: 'Successful',
    };
  }

  async getOrganisation(args) {
    return await this.orgModel.findOne(args).exec();
  }

  //=====================================================//

  async updateOrganisation(user, dto, orgId) {
    const organisation = await this.getOrganisation({ _id: orgId });
    organisation.name = dto.name ? dto.name : organisation.name;
    organisation.lastUpdatedBy = user._id;

    const updatedOrg = await organisation.save({ new: true });
    return updatedOrg;
  }

  //================================================//

  async sendInvitationLinkV3(req, dto, orgId, origin) {
    const admin = req.user;
    sendgrid.setApiKey(ConfigService.keys.SENDGRID_API_KEY);
    if (!(Hierarchy[admin.type] > Hierarchy[dto.userType])) {
      throw new HttpException(
        'You are not authorised to assign this role',
        HttpStatus.BAD_REQUEST,
      );
    }
    const user = await this.usersService.getUser({ email: dto.email });

    const org = await this.getOrganisation({ _id: orgId });
    const baseUrl = ConfigService.keys.DOMAIN;
    const payload = {
      orgId,
      email: dto.email,
      userType: dto.userType,
      designation: dto.designation,
    };
    const token = this.jwtService.sign(payload);

    let verificationLink;
    if (user) {
      user.userType.forEach((element) => {
        if (String(element.organisation) == orgId) {
          throw new HttpException(
            'User already exists in this organisation!',
            HttpStatus.BAD_REQUEST,
          );
        }
      });
      verificationLink = `${baseUrl}/organisations/join/${token}`;
    } else {
      verificationLink = `${baseUrl}/inviteRegistration/${token}`;
    }

    const invitation = await this.invitationModel
      .findOne({ organisation: orgId, sentTo: dto.email })
      .exec();
    if (!invitation) {
      await this.invitationModel.create({
        sentBy: admin._id,
        sentTo: dto.email,
        organisation: orgId,
        userType: dto.userType,
        designation: dto.designation,
      });
    } else {
      invitation.lastUpdatedAt = new Date();
    }
    /////////
    /////////
    //code to send verificationLink over the mail
    const msg = {
      to: `${dto.email}`,
      from: `workspace@pairroxz.com`,

      dynamicTemplateData: {
        subject: `Invitation to join organsiation : ${org.name}`,
        text: 'Invitation',
        senderName: admin.name,
        senderEmail: admin.email,
        invitationLink: verificationLink,
        organization: org.name,
      },
      templateId: ConfigService.keys.SENDGRID_INVITATION_TEMPLATE_ID,
    };

    ////////
    ////////
    const send = await this.mailerService.sendMail({
      from: `wincy@pairroxz.in`,
      to: dto.email,
      subject: `Invitation to join organization : ${org.name}`,
      html: `Link: ${verificationLink}`,
    });
    // await sendgrid.send(msg);

    return {
      message: 'The user has been sucessfully invited!',
      success: true,
      data: {
        sentTo: dto.email,
        userType: dto.userType,
        designation: dto.designation,
      },
    };
  }

  //================================================//

  async addToOrganisation(token) {
    const payload = this.jwtService.verify(token);
    const isRequest = await this.checkInvitation(payload.email, payload.orgId);
    let user = await this.usersService.getUser({ email: payload.email });
    if (!user) {
      throw new HttpException('No such user exists!', HttpStatus.BAD_REQUEST);
    }
    user.userType.forEach((element) => {
      if (String(element.organisation) == payload.orgId) {
        throw new HttpException(
          'You are already a member of the organisation!',
          HttpStatus.FORBIDDEN,
        );
      }
    });

    if (!isRequest) {
      throw new HttpException(
        'Invitation revoked by the organisation, please ask for a new Invitation!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const organisation = await this.getOrganisation({ _id: payload.orgId });
    if (user.userType) {
      user.userType.push({
        organisation: payload.orgId,
        userType: payload.userType,
        designation: payload.designation,
      });
    } else {
      user.userType = [
        {
          organisation: payload.orgId,
          userType: payload.userType,
          designation: payload.designation,
        },
      ];
    }
    organisation.users.push(user._id);
    user = await user.save();
    await organisation.save();
    await this.invitationModel.deleteOne({
      organisation: payload.orgId,
      sentTo: payload.email,
    });
    return {
      success: true,
      message: `Successfully  joined the Organisation: ${organisation.name}`,
      data: { user: user.userType[user.userType.length - 1], userId: user._id },
    };
  }

  //================================================//

  async removeMember(admin, userId, orgId) {
    const user = await this.usersService.getUser({ _id: userId });
    if (!user) {
      throw new HttpException('No such user exists!', HttpStatus.BAD_REQUEST);
    }
    let userType;
    let flag = 0;
    let index = -1;
    user.userType.forEach((element) => {
      index++;
      if (String(element.organisation) == orgId) {
        userType = element.userType;
        flag = 1;
      }
    });
    if (flag == 0) {
      throw new HttpException(
        'Mentioned user is not member of the organisation!',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!(Hierarchy[admin.type] > Hierarchy[userType])) {
      throw new HttpException(
        'You are not authorised to remove this user!',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.orgModel.updateOne({ _id: orgId }, { $pull: { users: userId } });
    user.userType.splice(index, 1);
    await user.save();

    ////////////////////////////////////////////////////////////////
    // need to remove user from all the projects, tasks and bugs
    ////////////////////////////////////////////////////////////////
    return {
      message: 'User removed from organisation successfully.',
      success: true,
      data: {},
    };
  }

  //================================================//

  async getMyOrganisations(user) {
    let orgs = [];
    user.userType.forEach((element) => {
      orgs.push(String(element.organisation));
    });
    orgs = await this.orgModel
      .find({ _id: { $in: orgs } })
      .sort({ _id: -1 })
      .exec();
    return { message: '', data: { organisations: orgs }, status: 'Successful' };
  }

  //================================================//

  //================================================//

  async makeAdmin(userId, orgId) {
    const data = {
      userId,
      orgId,
    };

    let user = await this.usersService.getUser({ _id: userId });

    let index;
    user.userType.findIndex((el, I) => {
      if (String(el.organisation) === orgId) {
        index = I;
      }
    });
    user.userType[index].userType = 'Admin';
    user = await user.save();
    return { message: 'ABC', data: { ...data, user }, status: 'Successful' };
  }

  //================================================//

  async changeRoles(admin, userId, orgId, dto) {
    let user = await this.usersService.getUser({ _id: userId });
    let flag = 0;

    if (admin.type === 'Admin' && String(admin._id) == userId) {
      throw new HttpException(
        'You are not Authorized to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      admin.type != 'Admin' &&
      !(Hierarchy[admin.type] > (Hierarchy[dto.userType] || 0))
    ) {
      throw new HttpException(
        'You are not Authorized to perform this task!',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (String(admin._id) == userId) {
      dto.userType = undefined;
    }
    user.userType.forEach((element) => {
      if (String(element.organisation) == orgId) {
        if (
          admin.type != 'Admin' &&
          !(Hierarchy[admin.type] > Hierarchy[element.userType])
        ) {
          throw new HttpException(
            'You are not Authorized to perform this task!',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (dto.userType === 'Member' && dto.userType !== element.userType) {
          this.projectsService.updateRoleChanges(orgId, userId);
        }
        element.userType =
          dto.userType !== element.userType ? dto.userType : element.userType;
        element.designation = dto.designation
          ? dto.designation
          : element.designation;
        flag = 1;
      }
    });
    if (flag == 0) {
      throw new HttpException(
        'Provided user and organisation are not associated.',
        HttpStatus.BAD_REQUEST,
      );
    }
    user = await user.save();
    if (user.accountDetails) {
      if (user.accountDetails.ifsc) {
        user.accountDetails.ifsc = this.utilsService.decryptData(
          user.accountDetails.ifsc,
        );
      }
      if (user.accountDetails.accountNumber) {
        user.accountDetails.accountNumber = this.utilsService.decryptData(
          user.accountDetails.accountNumber,
        );
      }
    }
    user.sessions = undefined;
    return {
      success: true,
      data: { user },
      message: 'User successfully updated.',
    };
  }

  //================================================//

  async myTeam(orgId, query: GetTeamDto) {
    const org = await this.orgModel.findById(orgId).exec();
    const {
      dateOfBirthStart,
      dateOfBirthEnd,
      bondEndDateStart,
      bondEndDateEnd,
      terminationDateStart,
      terminationDateEnd,
      joiningDateStart,
      joiningDateEnd,
      isDeleted = false,
      search,
    }: any = query || {};
    const filter = {
      $or: [{ _id: org.users }, { _id: org.owner }],
      ...(dateOfBirthStart &&
        dateOfBirthEnd && {
          dateOfBirth: {
            $gte: dateOfBirthStart,
            $lte: dateOfBirthEnd,
          },
        }),
      ...(bondEndDateStart &&
        bondEndDateEnd && {
          dateOfBirth: {
            $gte: bondEndDateStart,
            $lte: bondEndDateEnd,
          },
        }),
      ...(terminationDateStart &&
        terminationDateEnd && {
          dateOfBirth: {
            $gte: terminationDateStart,
            $lte: terminationDateEnd,
          },
        }),
      ...(joiningDateStart &&
        joiningDateEnd && {
          dateOfBirth: {
            $gte: joiningDateStart,
            $lte: joiningDateEnd,
          },
        }),
      isDeleted,
      name: { $regex: search, $options: 'i' },
    };
    const users = await this.usersService.getMultUsers(filter, {
      password: 0,
      createdAt: 0,
      updatedAt: 0,
      sessions: 0,
    });
    for (let i = 0; i < users.length; i++) {
      if (users[i].accountDetails) {
        if (users[i].accountDetails.ifsc) {
          users[i].accountDetails.ifsc = this.utilsService.decryptData(
            users[i].accountDetails.ifsc,
          );
        }
        if (users[i].accountDetails.accountNumber) {
          users[i].accountDetails.accountNumber = this.utilsService.decryptData(
            users[i].accountDetails.accountNumber,
          );
        }
      }
      users[i].sessions = undefined;
      users[i].password = undefined;
    }

    for (let i = 0; i < users.length; i++) {
      users[i]._doc.projects = await this.projectsService.getMultiProjectsApp(
        { $or: [{ team: users[i]._id }, { projectManagers: users[i]._id }] },
        { title: 1, logo: 1, platforms: 1 },
      );
    }
    return { data: { users }, message: '', success: true };
  }

  //================================================//

  async getOrgInvitations(orgId) {
    const invitations = await this.invitationModel
      .find({ organisation: orgId })
      .populate('sentBy', ['name', 'profilePicture', 'email'])
      .exec();
    return { success: true, message: '', data: { invitations } };
  }

  //================================================//

  async checkInvitation(sentTo, orgId) {
    const request = await this.invitationModel.findOne({
      organisation: orgId,
      sentTo,
    });
    if (request) {
      return true;
    }
    return false;
  }

  //================================================//

  async revokeInvitation(email, orgId) {
    await this.invitationModel
      .deleteOne({ sentTo: email, organisation: orgId })
      .exec();
    return {
      success: true,
      message: 'Invitation revoked Successfully',
      date: {},
    };
  }

  //================================================//

  async deleteOrganisation(orgId) {
    let organisation = await this.orgModel.findOne({ _id: orgId }).exec();
    const projects = await this.projectsService.deleteProjects(
      organisation.projects,
    );
    const users = await this.usersService.getMultUsers(
      { $or: [{ _id: organisation.users }, { _id: organisation.owner }] },
      {},
    );

    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < users[i].userType.length; j++) {
        if (String(users[i].userType[j].organisation) == orgId) {
          users[i].userType.splice(j, 1);
          break;
        }
      }
      for (let j = 0; j < users[i].projects.length; j++) {
        if (String(users[i].projects[j]?.organisation) == orgId) {
          users[i].projects.splice(j, 1);
          break;
        }
      }
      await users[i].save();
    }

    organisation = await this.orgModel.deleteOne({ _id: orgId }).exec();
    return {
      data: {
        projects: projects.delProjects,
        milestones: projects.delMileStones,
        tasks: projects.delTasks,
        bugs: projects.delBugs,
      },
      message: 'Organisation successfully deleted.',
      success: true,
    };
  }

  async addSubsiduary(user, orgId, dto) {
    let subsiduary = new this.subsiduaryModel({
      createdBy: user._id,
      title: dto.title,
      address: dto.address,
      gstNo: dto.gstNo,
      additionalInfo: dto.additionalInfo,
      organisation: orgId,
    });
    subsiduary = await subsiduary.save();

    return {
      data: { subsiduary },
      success: true,
      message: 'Subsiduary created successfully.',
    };
  }

  async updateSubsiduary(user, orgId, subsiduaryId, dto) {
    let subsiduary = await this.subsiduaryModel
      .findOne({ _id: subsiduaryId, organisation: orgId })
      .exec();

    subsiduary.title = dto.title !== undefined ? dto.title : subsiduary.title;
    (subsiduary.address =
      dto.address !== undefined ? dto.address : subsiduary.address),
      (subsiduary.gstNo =
        dto.gstNo !== undefined ? dto.gstNo : subsiduary.gstNo),
      (subsiduary.additionalInfo =
        dto.additionalInfo !== undefined
          ? dto.additionalInfo
          : subsiduary.additionalInfo),
      (subsiduary = await subsiduary.save({ new: true }));

    return {
      data: { subsiduary },
      success: true,
      message: 'Subsiduary updated successfully.',
    };
  }

  async deleteSubsiduaries(orgId, subsiduaries) {
    const deleted = await this.subsiduaryModel
      .deleteMany({ organisation: orgId, _id: subsiduaries })
      .exec();
    return {
      data: { deleted },
      message: 'Subsiduaries deleted successfully.',
      success: true,
    };
  }

  async getSubsiduaries(orgId) {
    const subsiduaries = await this.subsiduaryModel.aggregate([
      {
        $match: { organisation: Types.ObjectId(orgId) },
      },
    ]);
    return { data: { subsiduaries }, success: true };
  }

  async addCustomer(user, orgId, dto) {
    try {
      const oldCustomer = await this.customerModel.find({
        projects: { $in: dto?.projects },
      });
      if (oldCustomer.length) {
        throw new HttpException(
          'Project already has a client linked',
          HttpStatus.CONFLICT,
        );
      }

      let customer = new this.customerModel({
        createdBy: user._id,
        fullName: this.utilsService.encryptData(dto.fullName),
        email: this.utilsService.encryptData(dto.email),
        address: this.utilsService.encryptData(dto.address),
        projects: dto?.projects,
        phoneNumber: dto?.phoneNumber,
        country: dto?.country,
        organisation: orgId,
      });

      customer = await customer.save();

      customer = await this.utilsService.decryptCustomerData(customer);

      return {
        data: { customer },
        success: true,
        message: 'Customer created successfully.',
      };
    } catch (error) {
      console.error('error in addCustomer', error);
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async updateCustomer(orgId, customerId, dto: UpdateCustomerDto) {
    try {
      let customer = await this.customerModel
        .findOne({ _id: customerId, organisation: orgId })
        .exec();

      customer.fullName =
        dto.fullName !== undefined
          ? this.utilsService.encryptData(dto.fullName)
          : customer.fullName;
      customer.email =
        dto.email !== undefined
          ? this.utilsService.encryptData(dto.email)
          : customer.email;
      customer.address =
        dto.address !== undefined
          ? this.utilsService.encryptData(dto.address)
          : customer.address;

      customer['phoneNumber'] = dto?.phoneNumber;
      customer['country'] = dto?.country;

      if (dto.projects) {
        const pIds = [];
        dto.projects.forEach((el) => {
          if (el && !pIds.includes(el)) {
            pIds.push(el);
          }
        });
        customer['projects'] = pIds;
      }

      if (dto.isDelete) {
        const pIds = [];
        dto.projects.forEach((el) => {
          if (el && !pIds.includes(el)) {
            pIds.push(el);
          }
        });
        customer['projects'] = pIds;
      }

      customer = await customer.save({ new: true });

      customer = await this.utilsService.decryptCustomerData(customer);

      return {
        data: { customer },
        success: true,
        message: 'Customer updated successfully.',
      };
    } catch (error) {
      console.error('Error in updateCustomer', error);

      throw new BadRequestException(error);
    }
  }

  async linkCustomer(orgId: string, body: LinkCustomerDto) {
    try {
      let customer;
      if (body?.customerId) {
        customer = await this.customerModel.findOne({
          _id: body.customerId,
        });
        customer.projects.push(body.projectId);
        let p: any = customer.projects.filter(
          (el, i) => customer.projects.indexOf(el) === i,
        );
        customer.projects = p;
        await customer.save();
      }
      if (body?.customerIdToRemove) {
        const customerToRemove = await this.customerModel.findOne({
          _id: body.customerIdToRemove,
        });
        const i = customerToRemove.projects.indexOf(body?.projectId);
        if (i > -1) {
          customerToRemove.projects.splice(i, 1);
          await customerToRemove.save();
        }
      }
      return {
        data: { customer },
        success: true,
        message: 'Customer linked successfully.',
      };
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async deleteCustomers(orgId, customers) {
    const deleted = await this.customerModel
      .deleteMany({ organisation: orgId, _id: customers })
      .exec();
    return {
      data: { deleted },
      message: 'customers deleted successfully.',
      success: true,
    };
  }

  async getCustomers(organisation, projectId) {
    const filter = {
      organisation,
      ...(projectId && { projects: { $in: projectId } }),
    };
    const customers = await this.customerModel.find(filter).exec();

    for (let i = 0; i < customers.length; i++) {
      customers[i] = await this.utilsService.decryptCustomerData(customers[i]);
    }
    return { data: { customers }, success: true };
  }

  async addAccount(user, orgId, subId, dto) {
    const subsiduary = await this.subsiduaryModel
      .findOne({ _id: subId, organisation: orgId })
      .exec();
    if (!subsiduary) {
      throw new HttpException(
        'No subsiduary exists with given data!',
        HttpStatus.BAD_REQUEST,
      );
    }
    let account = new this.accountModel({
      createdBy: user._id,
      accountName:
        dto.accountName !== undefined
          ? await this.utilsService.encryptData(dto.accountName)
          : undefined,
      accountNumber:
        dto.accountNumber !== undefined
          ? await this.utilsService.encryptData(dto.accountNumber)
          : undefined,
      ifscCode:
        dto.ifscCode !== undefined
          ? await this.utilsService.encryptData(dto.ifscCode)
          : undefined,
      swiftCode:
        dto.swiftCode !== undefined
          ? await this.utilsService.encryptData(dto.swiftCode)
          : undefined,
      micrCode:
        dto.micrCode !== undefined
          ? await this.utilsService.encryptData(dto.micrCode)
          : undefined,
      additionalInfo:
        dto.additionalInfo !== undefined
          ? await this.utilsService.encryptData(dto.additionalInfo)
          : undefined,
      organisation: orgId,
      subsiduary: subId,
    });
    account = await account.save();
    account = await this.utilsService.decryptAccountData(account);

    return {
      data: { account },
      success: true,
      message: 'Account added successfully.',
    };
  }

  async updateAccount(user, orgId, accountId, dto) {
    let account = await this.accountModel
      .findOne({ _id: accountId, organisation: orgId })
      .exec();
    if (!account) {
      throw new HttpException(
        "Account with given details doesn't exist!",
        HttpStatus.BAD_REQUEST,
      );
    }

    account.accountName =
      dto.accountName !== undefined
        ? await this.utilsService.encryptData(dto.accountName)
        : account.accountName;
    account.accountNumber =
      dto.accountNumber !== undefined
        ? await this.utilsService.encryptData(dto.accountNumber)
        : account.accountNumber;
    account.ifscCode =
      dto.ifscCode !== undefined
        ? await this.utilsService.encryptData(dto.ifscCode)
        : account.ifscCode;
    account.swiftCode =
      dto.swiftCode !== undefined
        ? await this.utilsService.encryptData(dto.swiftCode)
        : account.swiftCode;
    account.micrCode =
      dto.micrCode !== undefined
        ? await this.utilsService.encryptData(dto.micrCode)
        : account.micrCode;

    account = account.save({ new: true });
    account = await this.utilsService.decryptAccountData(account);

    return {
      data: { account },
      success: true,
      message: 'Account updated successfully.',
    };
  }

  async getAccounts(orgId, subId) {
    let accounts;
    if (subId) {
      accounts = await this.accountModel
        .find({ subsiduary: subId, organisation: orgId })
        .exec();
    } else {
      accounts = await this.accountModel
        .find({ organisation: orgId })
        .populate('subsiduary')
        .exec();
    }
    for (let i = 0; i < accounts.length; i++) {
      accounts[i] = await this.utilsService.decryptAccountData(accounts[i]);
    }

    return { data: { accounts }, message: '', success: true };
  }

  async deleteAccounts(user, orgId, accountIds) {
    const deleted = await this.accountModel
      .deleteMany({ _id: { $in: accountIds }, organisation: orgId })
      .exec();

    return { data: deleted, success: true, message: '' };
  }

  async permissionManager(orgId: string, dto: UpdatePermissionDto) {
    const otherUserId = dto.user;
    const user = await this.usersService.getUser({ _id: otherUserId });
    user.permission = { ...user.permission, [orgId]: dto.permissions };
    user.save();
    return { data: user, success: true, message: '' };
  }

  async permissionList() {
    return {
      data: {
        list: Object.values(Permission),
      },
      success: true,
      message: '',
    };
  }
}
