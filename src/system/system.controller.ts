import { Controller, Get } from '@nestjs/common';
import { SystemService } from './system.service';

@Controller('system')
export class SystemController {
  constructor(
    private readonly systemService: SystemService,
  ){}

  @Get('platforms')
  async getPlatforms(){
    return await this.systemService.getPlatforms({});
  }

  @Get('technologies')
  async getTechnologies(){
    return await this.systemService.getTechnologies();
  }
  
  @Get('currencies')
  async getCurrencies(){
    return await this.systemService.getCurrencies();
  }

  @Get('gateways')
  async getGateways(){
    return await this.systemService.getGateways({});
  }
}
