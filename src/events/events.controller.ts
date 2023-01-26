import { Controller, Post, UseGuards, Request, Body, Param, Query, Patch, Get, Delete } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreatePrivateEventDto, UpdatePrivateEventDto } from './dto/privateEvent.dto';
import { CreatePublicEventDto, UpdatePublicEventDto } from './dto/publicEvent.dto';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ){}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role["Admin"], Role['Member++'], Role['Member+'])
  @Post('public/:organisation')
  async createPublicEvent(
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: CreatePublicEventDto,
  ){
    const {user} = req;
    return await this.eventsService.createPublicEvents(user, orgId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role["Admin"], Role['Member++'], Role['Member+'])
  @Patch('public/:organisation/:event')
  async updatePublicEvent(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('event') eventId: string,
    @Body() dto: UpdatePublicEventDto,
  ){
    const {user} = req;
    return await this.eventsService.updatePublicEvent(user, orgId, eventId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role["Admin"], Role['Member++'], Role['Member+'])
  @Delete('public/:organisation/:event')
  async deletePublicEvent(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('event') eventId: string,
    @Body() dto: UpdatePublicEventDto,
  ){
    const {user} = req;
    return await this.eventsService.deletePublicEvent(user, orgId, eventId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role["Admin"], Role['Member++'], Role['Member+'])
  @Get('public/:organisation')
  async getPublicEvent(
    @Request() req,
    @Param('organisation') orgId: string,
    @Query('month') month: string,
    @Query('year') year: string
  ){
    const {user} = req;
    return await this.eventsService.getPublicEvents(user, orgId, parseInt(month), parseInt(year));
  }

  @UseGuards(JwtAuthGuard)
  @Post('private')
  async createPrivateEvent(
    @Request() req,
    @Body() dto: CreatePrivateEventDto,
  ){
    const {user} = req;
    return await this.eventsService.createPrivateEvent(user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('private/:event')
  async updatePrivateEvent(
    @Request() req,
    @Param('event') eventId: string,
    @Body() dto: UpdatePrivateEventDto,
  ){
    const {user} = req;
    return await this.eventsService.updatePrivateEvent(user, eventId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('private/:event')
  async deletePrivateEvent(
    @Request() req,
    @Param('event') eventId: string,
  ){
    const {user} = req;
    return await this.eventsService.deletePrivateEvent(user, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('private')
  async getPrivateEvent(
    @Request() req,
    @Query('month') month: string,
    @Query('year') year: string
  ){
    const {user} = req;
    return await this.eventsService.getPrivateEvents(user, parseInt(month), parseInt(year));
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/:organisation')
  async getMyEvent(
    @Request() req,
    @Param('organisation') orgId: string,
    @Query('month') month: string,
    @Query('year') year: string
  ){
    const {user} = req;
    return await this.eventsService.getMyEvents(user, orgId, parseInt(month), parseInt(year));
  }

}
