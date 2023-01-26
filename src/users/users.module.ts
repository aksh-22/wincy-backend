import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from 'src/config/config.service';
import { OrganisationsModule } from 'src/organisations/organisations.module';
import { SystemModule } from 'src/system/system.module';
import { UtilsModule } from 'src/utils/utils.module';
import { PasswordResetSchema } from './schema/passwordReset.schema';
import { UserSchema } from './schema/user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [ SystemModule, UtilsModule, forwardRef(() =>OrganisationsModule),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }, {name: 'PasswordReset', schema: PasswordResetSchema}]),
    JwtModule.register({
      secret: ConfigService.keys.JWT_SECRET,
      signOptions: { expiresIn: '6000s' },
      verifyOptions: { ignoreExpiration: true },
    }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})

export class UsersModule { }
