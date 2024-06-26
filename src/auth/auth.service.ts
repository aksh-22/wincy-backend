import { MailerService } from '@nestjs-modules/mailer';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { SystemService } from 'src/system/system.service';
import { UsersService } from 'src/users/users.service';
import { UtilsService } from 'src/utils/utils.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
    private readonly systemService: SystemService,
    private readonly utilsService: UtilsService,
    private readonly mailerService: MailerService,
    @InjectModel('PasswordReset') private readonly passResetModel: Model<any>,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.getUserSelect({ email });
    if (!user) {
      throw new HttpException(
        'Either Password or Email is wrong!',
        HttpStatus.FORBIDDEN,
      );
    }
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      return user;
    } else {
      return null;
    }
  }

  async login(user: any) {
    const payload = {
      sub: user._id,
      sessionId: uuidv4(),
    };
    const access_token = this.jwtService.sign(payload);
    if (!user.sessions) {
      user.sessions = [payload.sessionId];
    } else {
      user.sessions.push(payload.sessionId);
    }
    const platforms = await this.systemService.getPlatforms({});
    const technologies = await this.systemService.getTechnologies();
    user = await user.save();
    user.password = undefined;
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
      message: 'Logged in Successfully',
      data: {
        access_token,
        user,
        technologies,
        platforms,
      },
      status: 'Successful',
    };
  }

  async userLogout(user, token) {
    const payload = this.jwtService.verify(token);
    const index = user.sessions.indexOf(payload.sessionId);
    user.sessions.splice(index, 1);
    user.oneSignalPlayerId = undefined;
    await user.save();
    return {
      message: 'Logged out Successfully, current session deleted!!',
      data: {},
      status: 'Successful',
    };
  }

  async changePassword(user, newPass, currentPass) {
    const match = await bcrypt.compare(currentPass, user.password);

    if (match) {
      user.password = await bcrypt.hash(newPass, 12);
      user.passwordUpdatedAt = new Date();
      user.sessions = [];
      await user.save();
      return true;
    } else {
      throw new HttpException('Password is incorrect!', HttpStatus.FORBIDDEN);
    }
  }

  async resetPasswordMail(email) {
    try {
      const user = await this.usersService.getUser({ email });

      if (!user) {
        throw new HttpException('User does not exist!', HttpStatus.NOT_FOUND);
      }

      const passCode = String(Math.floor(Math.random() * 90000) + 10000);

      console.log('passCode', passCode);

      const encryptedCode = await bcrypt.hash(passCode, 12);

      const existingRequest = await this.passResetModel.findOne({
        userId: user._id,
      });

      if (existingRequest) {
        await this.passResetModel.deleteOne({ userId: user._id });
      }

      const newRequest = new this.passResetModel({
        userId: user._id,
        createdAt: new Date(),
        passCode: encryptedCode,
      });

      const send = await this.mailerService.sendMail({
        from: `wincy@pairroxz.in`,
        to: email,
        subject: `Reset Password`,
        text: 'Reset Password',
        html: `Pass Code: ${passCode}`,
      });
      await newRequest.save();

      return {
        message: 'Please enter pass code sent into your e-mail.',
        data: {},
        success: true,
      };
    } catch (error) {
      console.error('Error in reset pass', error);
      throw new HttpException('Something went wrong!', HttpStatus.BAD_REQUEST);
    }
  }

  async resetPassword(passCode: string, email, newPassword) {
    const user = await this.usersService.getUserSelect({ email });

    if (!user) {
      throw new HttpException('User does not exist!', HttpStatus.NOT_FOUND);
    }

    const request = await this.passResetModel.findOne({ userId: user._id });

    if (!request) {
      throw new HttpException(
        'No passwordReset request available',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!(await bcrypt.compare(passCode, request.passCode))) {
      throw new HttpException('Wrong PassCode!', HttpStatus.FORBIDDEN);
    }

    const expirationDate = new Date(request.createdAt.getTime() + 900000);
    const now = new Date();

    if (expirationDate < now) {
      await this.passResetModel.deleteOne({ userId: user._id });
      throw new HttpException(
        'resetPassword link expired, please generate another request',
        HttpStatus.FORBIDDEN,
      );
    }
    const hash = await bcrypt.hash(newPassword, 12);
    user.password = hash;
    user.sessions = [];
    user.passwordUpdatedAt = new Date();
    await user.save();

    await this.passResetModel.deleteOne({ userId: user._id });

    return true;
  }
}
