import { Controller, Get, Param, Query, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { ActivitiesService } from './activities.service';

@Controller('activities')
export class ActivitiesController {
  constructor(
    private readonly actsService: ActivitiesService
  ){}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getActivities(
    @Request() req,
    @Param('organisation') orgId: string,
    @Query('type') type: "Bug" | "Project" | "Task" | "Todo" | "Milestone",
    @Query('entityId') entityId: string,
    @Query('project') projectId: string,
  ){
    const filter = {};
    filter['type'] = type;
    if(type) {
      filter[`${type.toLowerCase()}`] = entityId;
    }
    filter['project'] = projectId;

    return await this.actsService.getActivities(JSON.parse(JSON.stringify(filter)));  //to remove undefined fields from the filter
  }
}
