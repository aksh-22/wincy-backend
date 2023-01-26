import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlatformSchema } from './schema/platform.schema';
import { TechnologySchema } from './schema/technology.schema';
import { SystemService } from './system.service';
import { SystemController } from './system.controller';
import { CurrencySchema } from './schema/currency.schema';
import { GatewaySchema } from './schema/gateway.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Technology', schema: TechnologySchema }, { name: 'Platform', schema: PlatformSchema }, { name: 'Currency', schema: CurrencySchema }, { name: 'Gateway', schema: GatewaySchema }])],
  providers: [SystemService],
  exports: [SystemService],
  controllers: [SystemController],
})
export class SystemModule {}
