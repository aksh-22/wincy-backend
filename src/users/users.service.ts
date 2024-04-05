/* eslint-disable prettier/prettier */
import {
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { Model } from 'mongoose';
import { ConfigService } from 'src/config/config.service';
import { OrganisationsService } from 'src/organisations/organisations.service';
import { SalaryService } from 'src/salary-management/salary.service';
import { SystemService } from 'src/system/system.service';
import { UtilsService } from 'src/utils/utils.service';
import { v4 as uuidv4 } from 'uuid';
import { UpdateOtherData, UpdateProfileDto } from './dto/updateUser.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') private readonly userModel: Model<any>,
    private systemService: SystemService,
    private jwtService: JwtService,
    private salaryService: SalaryService,
    private utilsService: UtilsService,
    @Inject(forwardRef(() => OrganisationsService))
    private organisationsService: OrganisationsService,
  ) {}

  //==============================================//

  async signup(dto, profilePic) {
    try {
      dto.password = await bcrypt.hash(dto.password, 12);
      if (profilePic) {
        dto.profilePicture = await this.utilsService.uploadFileS3(
          profilePic,
          ConfigService.keys.FOLDER_PROFILE_PIC,
        );
      }
      const user = new this.userModel(dto);
      const payload = {
        sub: user._id,
        sessionId: uuidv4(),
      };
      user.sessions = [payload.sessionId];
      await user.save();

      const access_token = this.jwtService.sign(payload);
      const platforms = await this.systemService.getPlatforms({});
      const technologies = await this.systemService.getTechnologies();
      return {
        message: 'Signup Successfully',
        data: { user, access_token, technologies, platforms },
        status: 'Successful',
      };
    } catch (error) {
      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  //===================================================//

  async signupAndJoinOrg(dto, profilePic, token) {
    const data = this.jwtService.verify(token);
    const isRequest = await this.organisationsService.checkInvitation(
      data.email,
      data.orgId,
    );
    if (!isRequest) {
      throw new HttpException(
        'Invitation revoked by the organiation, please ask for a new Invitation!',
        HttpStatus.BAD_REQUEST,
      );
    }
    const org = await this.organisationsService.getOrganisation({
      _id: data.orgId,
    });
    if (!org) {
      throw new HttpException(
        'No such Organisations, Invalid Invitation!',
        HttpStatus.BAD_REQUEST,
      );
    }
    dto.password = await bcrypt.hash(dto.password, 12);
    let user = new this.userModel(dto);
    user.email = data.email;
    user.userType = [
      {
        organisation: data.orgId,
        userType: data.userType,
        designation: data.designation,
      },
    ];
    const payload = {
      sub: user._id,
      sessionId: uuidv4(),
    };
    user.sessions = [payload.sessionId];
    if (profilePic) {
      user.profilePicture = await this.utilsService.uploadFileS3(
        profilePic,
        ConfigService.keys.FOLDER_PROFILE_PIC,
      );
    }
    user = await user.save({ new: true });
    org.users.push(user._id);
    await org.save();
    await this.organisationsService.revokeInvitation(data.email, data.orgId);
    const access_token = this.jwtService.sign(payload);
    const platforms = await this.systemService.getPlatforms({});
    const technologies = await this.systemService.getTechnologies();
    return {
      data: { user, access_token, technologies, platforms },
      message: '',
      success: true,
    };
  }

  //===================================================//

  async updateProfile(user, dto: UpdateProfileDto, profilePic) {
    if (profilePic) {
      if (user.profilePic) {
        await this.utilsService.deleteFileS3(
          user.profilePic,
          ConfigService.keys.FOLDER_PROFILE_PIC,
        );
      }
      user.profilePicture = await this.utilsService.uploadFileS3(
        profilePic,
        ConfigService.keys.FOLDER_PROFILE_PIC,
      );
    }
    user.dateOfBirth = dto.dob ? dto.dob : user.dateOfBirth;
    user.name = dto.name ? dto.name : user.name;
    user.phoneNumber = dto.phoneNumber || user.phoneNumber;
    if (dto.ifsc) {
      if (!user.accountDetails) {
        user.accountDetails = {};
      }
      user.accountDetails.ifsc = this.utilsService.encryptData(dto.ifsc);
    }
    if (dto.accountNumber) {
      if (!user.accountDetails) {
        user.accountDetails = {};
      }
      user.accountDetails.accountNumber = this.utilsService.encryptData(
        dto.accountNumber,
      );
    }
    if (dto.bankName) {
      if (!user.accountDetails) {
        user.accountDetails = {};
      }
      user.accountDetails.bankName = this.utilsService.encryptData(
        dto.bankName,
      );
    }
    if (dto.branchName) {
      if (!user.accountDetails) {
        user.accountDetails = {};
      }
      user.accountDetails.branchName = this.utilsService.encryptData(
        dto.branchName,
      );
    }

    if (dto.officialEmail) {
      user.officialEmail = dto.officialEmail;
    }

    if (dto.personalEmail) {
      user.personalEmail = dto.personalEmail;
    }

    if (dto.residentialAddress) {
      user.residentialAddress = dto.residentialAddress;
    }

    if (dto.permanentAddress) {
      user.permanentAddress = dto.permanentAddress;
    }

    if (dto.terminationDate) {
      user.terminationDate = dto.terminationDate;
    }

    if (dto.pan) {
      user.pan = this.utilsService.encryptData(dto.pan);
    }

    if (dto.aadhaar) {
      user.aadhaar = this.utilsService.encryptData(dto.aadhaar);
    }

    if (dto.employeeCode) user.employeeCode = dto.employeeCode;
    if (dto.bondStartDate) user.bondStartDate = dto.bondStartDate;
    if (dto.bondEndDate) user.bondEndDate = dto.bondEndDate;

    const updatedUser = await user.save({ new: true });
    if (updatedUser.accountDetails) {
      if (updatedUser.accountDetails.ifsc) {
        updatedUser.accountDetails.ifsc = this.utilsService.decryptData(
          updatedUser.accountDetails.ifsc,
        );
      }
      if (updatedUser.accountDetails.accountNumber) {
        updatedUser.accountDetails.accountNumber =
          this.utilsService.decryptData(
            updatedUser.accountDetails.accountNumber,
          );
      }
      if (updatedUser.pan) {
        updatedUser.pan = this.utilsService.decryptData(updatedUser.pan);
      }
      if (updatedUser.aadhaar) {
        updatedUser.aadhaar = this.utilsService.decryptData(
          updatedUser.aadhaar,
        );
      }
    }
    if (user?.type !== 'Admin') {
      user.terminationDate = undefined;
    }
    updatedUser.sessions = undefined;
    return updatedUser;
  }

  //==================================================//

  async getUser(args) {
    const user = await this.userModel.findOne(args).exec();
    return user;
  }

  //=================================================//

  async getUserSelect(args) {
    const user = await this.userModel
      .findOne(args)
      .select('+password +sessions')
      .exec();
    return user;
  }

  //=================================================//
  async getMultUsers(args, projections) {
    const users = await this.userModel.find(args, projections).exec();
    return users;
  }

  //=================================================//

  async updateUsers(filter, update, options) {
    await this.userModel.updateMany(filter, update, options);
    return true;
  }

  //=================================================//

  async getProfile(user) {
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
      if (user.accountDetails.branchName) {
        user.accountDetails.branchName = this.utilsService.decryptData(
          user.accountDetails.branchName,
        );
      }
      if (user.accountDetails.bankName) {
        user.accountDetails.bankName = this.utilsService.decryptData(
          user.accountDetails.bankName,
        );
      }
    }
    if (user.pan) {
      user.pan = this.utilsService.decryptData(user.pan);
    }
    if (user.aadhaar) {
      user.aadhaar = this.utilsService.decryptData(user.aadhaar);
    }

    user.sessions = undefined;
    user.password = undefined;
    user.verified = undefined;
    return { data: { user }, message: '', success: true };
  }

  async getUserProfile(id) {
    try {
      const user = await this.userModel.findById(id);
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
        if (user.accountDetails.branchName) {
          user.accountDetails.branchName = this.utilsService.decryptData(
            user.accountDetails.branchName,
          );
        }
        if (user.accountDetails.bankName) {
          user.accountDetails.bankName = this.utilsService.decryptData(
            user.accountDetails.bankName,
          );
        }
      }
      if (user.pan) {
        user.pan = this.utilsService.decryptData(user.pan);
      }
      if (user.aadhaar) {
        user.aadhaar = this.utilsService.decryptData(user.aadhaar);
      }

      user.sessions = undefined;
      user.password = undefined;
      user.verified = undefined;

      const salaryDetail = await this.salaryService.salaryDetail(user._id);

      user.salaryDetail = salaryDetail;

      return { data: { user }, message: '', success: true };
    } catch (error) {
      console.error('error in getUserProfile', error);

      throw new InternalServerErrorException(error);
    }
  }

  async updateUser(id, dto: UpdateOtherData) {
    try {
      const { employeeCode, bondStartDate, bondEndDate } = dto;
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException();
      }
      if (user.dateOfBirth && typeof user.dateOfBirth === 'string') {
        user.dateOfBirth = moment(user.dateOfBirth);
      }
      if (employeeCode) user.employeeCode = employeeCode;
      if (bondStartDate) user.bondStartDate = bondStartDate;
      if (bondEndDate) user.bondEndDate = bondEndDate;
      await user.save;
      return { data: { user }, message: 'Updated Successfully', success: true };
    } catch (error) {
      console.error('error in updateUser', error);

      throw new HttpException(error, HttpStatus.BAD_REQUEST);
    }
  }

  async archiveUser(id: string) {
    try {
      const user = await this.userModel.findById(id);
      user.isDeleted = !user.isDeleted;
      await user.save();
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async fixUser() {
    try {
      const users = await this.userModel.updateMany({}, { dateOfBirth: null });
      // for (let index = 0; index < users.length; index++) {
      //   const user = users[index];
      //   if (user.dateOfBirth && typeof user.dateOfBirth === 'string') {
      //     // user.dateOfBirth = moment(new Date(user.dateOfBirth));
      //   }
      //   await user.save();
      // }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
