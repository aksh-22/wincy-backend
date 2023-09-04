import {
  Body,
  Controller,
  Patch,
  Post,
  Request,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth-guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  //Tested
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  //Tested
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async userLogoutV3(@Request() req, @Headers() headers) {
    const { user } = req;
    const { authorization } = headers;
    const token = authorization.substring(7, authorization.length);
    return await this.authService.userLogout(user, token);
  }

  //Tested
  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  async changePasswordV3(
    @Request() req,
    @Body('currentPassword') currentPass: string,
    @Body('newPassword') newPass: string,
  ) {
    const { user } = req;

    return await this.authService.changePassword(user, newPass, currentPass);
  }

  //Tested
  @Post('reset-request')
  async resetpasswordRequest(@Body('email') email: string) {
    return await this.authService.resetPasswordMail(email);
  }

  //Tested
  @Patch('reset-password')
  async resetPassword(
    @Body('passCode') passCode: string,
    @Body('email') email: string,
    @Body('newPassword') newPassword: string,
  ) {
    return await this.authService.resetPassword(passCode, email, newPassword);
  }
}
