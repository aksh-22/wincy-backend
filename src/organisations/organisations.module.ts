import { forwardRef, Module } from '@nestjs/common';
import { OrganisationsService } from './organisations.service';
import { OrganisationsController } from './organisations.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganisationSchema } from './schema/organisation.schema';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from 'src/config/config.service';
import { UsersModule } from 'src/users/users.module';
import { UtilsModule } from 'src/utils/utils.module';
import { InvitationSchema } from './schema/invitation.schema';
import { ProjectsModule } from 'src/projects/projects.module';
import { SubsiduarySchema } from './schema/subsiduary.schema';
import { CustomerSchema } from './schema/customer.schema';
import { AccountSchema } from './schema/account.schema';

@Module({
  imports : [forwardRef(() => UsersModule), UtilsModule, forwardRef(() => ProjectsModule), MongooseModule.forFeature([{ name: 'Organisation', schema: OrganisationSchema }, { name: 'Invitation', schema: InvitationSchema}, { name: 'Subsiduary', schema: SubsiduarySchema}, { name: 'Customer', schema: CustomerSchema}, { name: 'Account', schema: AccountSchema}]),
    JwtModule.register({
      secret: ConfigService.keys.JWT_SECRET,
      signOptions: { expiresIn: '6000s'},
      verifyOptions: { ignoreExpiration: true}
    })
  ],
  providers: [OrganisationsService],
  controllers: [OrganisationsController],
  exports: [OrganisationsService],
})
export class OrganisationsModule {}
