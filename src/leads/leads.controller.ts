import { Body, Controller, Post, UseGuards, Request, Param, Patch, Delete, Get, Query } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateLeadDto } from './dto/createLead.dto';
import { createLeadActDto } from './dto/createLeadAct.dto';
import { deleteLeadActivitiesDto } from './dto/deleteLeadAct.dto';
import { UpdateLeadDto } from './dto/updateLead.dto';
import { updateLeadActDto } from './dto/updateLeadAct.dto';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
  ){}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('new/:organisation')
  @Roles(Role.Admin, Role["Member++"])
  async createLead(
    @Request() req,
    @Param('organisation') orgId: string, 
    @Body() dto: CreateLeadDto,
  ){
    const {user} = req;
    return await this.leadsService.createLead(user, orgId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('update/:organisation/:lead')
  @Roles(Role.Admin, Role["Member++"])
  async updateLead(
    @Request() req,
    @Param('organisation') orgId: string, 
    @Param('lead') leadId: string,
    @Body() dto: UpdateLeadDto,
  ){
    const {user} = req;
    return await this.leadsService.updateLead(user, orgId, dto, leadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('delete/:organisation/:lead')
  @Roles(Role.Admin, Role["Member++"])
  async deleteLead(
    @Param('organisation') orgId: string,
    @Param('lead') leadId: string,
  ){
    return await this.leadsService.deleteLead(orgId, leadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('lead/:organisation')
  @Roles(Role.Admin, Role["Member++"])
  async getLeads(
    @Query('status') status,
    @Param('organisation') orgId: string,
  ){
    return await this.leadsService.getLeads(orgId, status);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('lead/:organisation/:lead') 
  @Roles(Role.Admin, Role["Member++"])
  async getLead(
    @Param('organisation') orgId: string,
    @Param('lead') leadId: string,
  ){
    return await this.leadsService.getLead(orgId, leadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('activity/:organisation/:lead') 
  @Roles(Role.Admin, Role["Member++"])
  async createLeadActivity(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('lead') leadId: string,
    @Body() dto: createLeadActDto,
  ){
    const {user} = req;
    return await this.leadsService.createLeadActivity(user, orgId, dto, leadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('activity/:organisation/:leadActivity') 
  @Roles(Role.Admin, Role["Member++"])
  async updateLeadActivity(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('leadActivity') leadAct: string,
    @Body() dto: updateLeadActDto,
  ){
    const {user} = req;
    return await this.leadsService.updateLeadActivity(user, orgId, dto, leadAct);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('activity/:organisation') 
  @Roles(Role.Admin, Role["Member++"])
  async deleteLeadActivity(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('leadActivity') leadAct: string,
    @Body() dto: deleteLeadActivitiesDto,
  ){
    const {user} = req;
    return await this.leadsService.deleteLeadActivities(user, orgId, dto.activityIds);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('activity/:organisation/:lead') 
  @Roles(Role.Admin, Role["Member++"])
  async getLeadActivity(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('lead') leadId: string,
  ){
    return await this.leadsService.getLeadActivities(orgId, leadId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('bydate/:organisation')
  @Roles(Role.Admin, Role["Member++"])
  async getLeadsByDate(
    @Param('organisation') orgId: string,
    @Query('date') date: string,
  ){
    return await this.leadsService.getLeadsBydate(orgId, date);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('fav/:organisation')
  @Roles(Role.Admin, Role["Member++"])
  async getFavouriteLeads(
    @Param('organisation') orgId: string,
  ){
    return await this.leadsService.getFavouriteLeads(orgId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('dash/:organisation')
  @Roles(Role.Admin, Role["Member++"])
  async getTotalLeadsCount(
    @Param('organisation') orgId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ){
    return await this.leadsService.getTotalLeadsDash(orgId, from, to);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('sales/:organisation')
  @Roles(Role.Admin, Role["Member++"])
  async getSales(
    @Param('organisation') orgId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ){
    return await this.leadsService.getTotalSalesDash(orgId, from, to);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('dashboard/:organisation')
  @Roles(Role.Admin, Role["Member++"])
  async getDashBoard(
    @Param('organisation') orgId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ){
    return await this.leadsService.dashBoard(orgId, from, to);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('pending/:organisation')
  @Roles(Role.Admin, Role["Member++"])
  async getPendingLeads(
    @Request() req,
    @Param('organisation') orgId: string,
  ){
    const {user} = req;
    return await this.leadsService.pendingFollowUps(user, orgId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('sortLeads/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async sortMilestone(
    @Param('organisation') orgId: string,
    @Body('leads') leads: any,
  ){
    return await this.leadsService.sortLeads(leads, orgId);
  }

}
