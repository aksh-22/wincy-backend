import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  Request,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { SignupAndJoinOrgDto, SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateProfileDto } from './dto/updateUser.dto';
import { PermissionGuard } from 'src/auth/permission.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Permission } from 'src/auth/permission.enum';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  //=======================================//

  //Tested
  @Post()
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      fileFilter: (req, profilePicture, cb) => {
        if (!profilePicture.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
          cb(new Error('File Format not Supported...!!!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async signup(@Body() dto: SignupDto, @UploadedFile() profilePicture) {
    return await this.usersService.signup(dto, profilePicture);
  }

  //=======================================//

  // Tested
  @Post(':token')
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      fileFilter: (req, profilePicture, cb) => {
        if (!profilePicture.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
          cb(new Error('File Format not Supported...!!!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async signupAndJoinOrg(
    @UploadedFile() profilePicture,
    @Param('token') token: string,
    @Body() dto: SignupAndJoinOrgDto,
  ) {
    return await this.usersService.signupAndJoinOrg(dto, profilePicture, token);
  }

  //============================================//

  // Tested
  @UseGuards(JwtAuthGuard)
  @Patch()
  @UseInterceptors(
    FileInterceptor('profilePicture', {
      fileFilter: (req, profilePicture, cb) => {
        if (!profilePicture.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
          cb(new Error('File Format not Supported...!!!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async updateProfile(
    @Request() req,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() profilePicture,
  ) {
    const { user } = req;
    return await this.usersService.updateProfile(user, dto, profilePicture);
  }

  //=======================================//

  @Get()
  async getUser(@Body('email') email: string) {
    return await this.usersService.getUser({ email });
  }

  //=======================================//
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const { user } = req;
    return await this.usersService.getProfile(user);
  }
}
