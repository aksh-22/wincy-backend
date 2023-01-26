import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from 'src/config/config.service';
import { SystemModule } from 'src/system/system.module';
import { PasswordResetSchema } from 'src/users/schema/passwordReset.schema';
import { UsersModule } from 'src/users/users.module';
import { UtilsModule } from 'src/utils/utils.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    SystemModule,
    UsersModule,
    UtilsModule,
    PassportModule,
    JwtModule.register({
      secret: ConfigService.keys.JWT_SECRET,
      signOptions: { expiresIn: '6s' },
      verifyOptions: { ignoreExpiration: true },
    }),
    MongooseModule.forFeature([{name:"PasswordReset", schema: PasswordResetSchema}])
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
