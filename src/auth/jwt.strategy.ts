import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from 'src/config/config.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      usernameField: 'email',
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: ConfigService.keys.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.getUserSelect({ _id: payload.sub });
    if (!user) {
      throw new HttpException("User doesn't exist", HttpStatus.UNAUTHORIZED);
    }
    if(!user.verified){
      throw new HttpException("Please, verify your email", HttpStatus.FORBIDDEN);
    }
    if (!user.sessions.includes(payload.sessionId)) {
      throw new HttpException(
        'not a valid Session, Please logIn again!',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.passwordUpdatedAt) {
      const x = new Date(payload.iat).getTime() * 1000;
      const y = user.passwordUpdatedAt.getTime();
      if (x > y) {
        return user;
      } else {
        throw new HttpException(
          'Please login again after changing Password, session expired!!',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
    return user;
  }
}
