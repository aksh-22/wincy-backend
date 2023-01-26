import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganisationsModule } from 'src/organisations/organisations.module';
import { OrganisationSchema } from 'src/organisations/schema/organisation.schema';
import { SystemModule } from 'src/system/system.module';
import { UsersModule } from 'src/users/users.module';
import { UtilsModule } from 'src/utils/utils.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadSchema } from './schema/lead.schema';
import { LeadActivitySchema } from './schema/leadActivity.schema';
import { LeadSortSchema } from './schema/lead_sort.schema';

@Module({
  imports: [
    UsersModule,
    SystemModule,
    OrganisationsModule,
    UtilsModule,
    MongooseModule.forFeature([
      { name: 'Lead', schema: LeadSchema },
      { name: 'Organisation', schema: OrganisationSchema },
      { name: 'LeadActivity', schema: LeadActivitySchema },
      { name: 'LeadActivity', schema: LeadActivitySchema },
      { name: 'LeadSort', schema: LeadSortSchema },
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
