import {
  Body,
  Request,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
  Get,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Permission } from 'src/auth/permission.enum';
import { PermissionGuard } from 'src/auth/permission.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import {
  AddAccountDto,
  DeleteAccountsDto,
  UpdateAccountDto,
  UpdatePermissionDto,
} from './dto/account.dto';
import { CreateOrganisationDto } from './dto/createOrg.dto';
import {
  AddCustomerDto,
  DeleteCustomersDto,
  LinkCustomerDto,
  UpdateCustomerDto,
} from './dto/customer.dto';
import { SendInvitationDto } from './dto/sendInvitation.dto';
import {
  AddSubsiduaryDto,
  DeleteSubsiduariesDto,
  UpdateSubsiduaryDto,
} from './dto/subsiduaries.dto';
import { UpdateOrganisationDto } from './dto/updateOrg.dto';
import { updateRoleDto } from './dto/updateRole.dto';
import { OrganisationsService } from './organisations.service';
import { GetTeamDto } from './dto/team.dto';

@Controller('organisations')
export class OrganisationsController {
  constructor(private readonly organisationsService: OrganisationsService) {}

  //=====================================//

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Post('admin/permission/:organisation')
  @Permissions(Permission.GIVE_PERMISSION)
  async permissionManager(
    @Param('organisation') orgId: string,
    @Body() dto: UpdatePermissionDto,
  ) {
    return await this.organisationsService.permissionManager(orgId, dto);
  }

  // @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get('admin/permission-list/:organisation')
  // @Permissions(Permission.GIVE_PERMISSION)
  async permissionList(@Param('organisation') orgId: string) {
    return await this.organisationsService.permissionList();
  }

  //Tested
  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrganisation(@Request() req, @Body() dto: CreateOrganisationDto) {
    const { user } = req;
    return await this.organisationsService.createOrganisation(user, dto);
  }

  //=======================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':organisation')
  @Roles(Role.Admin, Role['Member++'])
  async sendInvitation(
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: SendInvitationDto,
  ) {
    return await this.organisationsService.sendInvitationLinkV3(
      req,
      dto,
      orgId,
      req.headers.origin,
    );
  }

  //=======================================//

  // Tested

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('admin/:organisation/:user')
  @Roles(Role.Admin)
  async updateRoles(
    @Param('organisation') orgId: string,
    @Param('user') userId: string,
  ) {
    return await this.organisationsService.makeAdmin(userId, orgId);
  }

  //=======================================//

  //=======================================//

  // Tested

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('roles/:organisation/:user')
  @Roles(Role.Admin, Role['Member++'])
  async makeAdmin(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('user') userId: string,
    @Body() dto: updateRoleDto,
  ) {
    const { user } = req;
    return await this.organisationsService.changeRoles(
      user,
      userId,
      orgId,
      dto,
    );
  }

  //=======================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':organisation')
  @Roles(Role.Admin)
  async updateOrganisation(
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: UpdateOrganisationDto,
  ) {
    const { user } = req;
    return await this.organisationsService.updateOrganisation(user, dto, orgId);
  }

  //=========================================//

  @UseGuards(JwtAuthGuard)
  @Get('team/:organisation')
  async getTeam(
    @Param('organisation') orgId: string,
    @Query() query: GetTeamDto,
  ) {
    return await this.organisationsService.myTeam(orgId, query);
  }

  //==========================================//

  @Get('join/:token')
  async joinOrganisation(@Param('token') token: string) {
    return await this.organisationsService.addToOrganisation(token);
  }

  //========================================//

  @UseGuards(JwtAuthGuard)
  @Get()
  async myOrganisations(@Request() req) {
    const { user } = req;
    return await this.organisationsService.getMyOrganisations(user);
  }

  //=========================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':organisation')
  @Roles(Role.Admin, Role['Member++'])
  async getOrganisation(@Param('organisation') orgId: string) {
    return await this.organisationsService.getOrganisation({ _id: orgId });
  }

  //=========================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('invitation/:organisation')
  @Roles(Role.Admin, Role['Member++'])
  async revokeinvitation(
    @Param('organisation') orgId: string,
    @Body('email') email: string,
  ) {
    return await this.organisationsService.revokeInvitation(email, orgId);
  }

  //=========================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('invitations/:organisation')
  @Roles(Role.Admin, Role['Member++'])
  async getOrgInvitations(@Param('organisation') orgId: string) {
    return await this.organisationsService.getOrgInvitations(orgId);
  }

  //========================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('user/:organisation/:user')
  @Roles(Role.Admin, Role['Member++'])
  async removeMemberOrganisation(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('user') userId: string,
  ) {
    const { user } = req;
    return await this.organisationsService.removeMember(user, userId, orgId);
  }

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Delete(':organisation')
  // @Roles(Role.Admin)
  // async deleteOrganisation(@Param('organisation') orgId: string) {
  //   return await this.organisationsService.deleteOrganisation(orgId);
  // }

  @UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
  @Delete('subsiduaries/:organisation')
  @Roles(Role.Admin)
  async deleteSubsiduaries(
    @Param('organisation') orgId: string,
    @Body() dto: DeleteSubsiduariesDto,
  ) {
    return await this.organisationsService.deleteSubsiduaries(
      orgId,
      dto.subsiduaries,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get('subsiduaries/:organisation')
  // @Roles(Role.Admin, Role.Member)
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async getSubsiduaries(@Param('organisation') orgId: string) {
    return await this.organisationsService.getSubsiduaries(orgId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('subsiduaries/:organisation')
  @Roles(Role.Admin)
  async addSubsiduary(
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: AddSubsiduaryDto,
  ) {
    const { user } = req;
    return await this.organisationsService.addSubsiduary(user, orgId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('subsiduaries/:organisation/:subsiduary')
  @Roles(Role.Admin)
  async updateSubsiduary(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('subsiduary') subsiduaryId: string,
    @Body() dto: UpdateSubsiduaryDto,
  ) {
    const { user } = req;
    return await this.organisationsService.updateSubsiduary(
      user,
      orgId,
      subsiduaryId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('customers/:organisation')
  @Roles(Role.Admin)
  async deleteCustomers(
    @Param('organisation') orgId: string,
    @Body() dto: DeleteCustomersDto,
  ) {
    return await this.organisationsService.deleteCustomers(
      orgId,
      dto.customers,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get('customers/:organisation')
  // @Roles(Role.Admin)
  @Permissions(Permission.CREATE_INVOICE)
  async getCustomers(
    @Param('organisation') organisation: string,
    @Query('projectId') projectId: string,
  ) {
    return await this.organisationsService.getCustomers(
      organisation,
      projectId,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Post('customers/:organisation')
  @Permissions(Permission.CREATE_INVOICE)
  async addCustomer(
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: AddCustomerDto,
  ) {
    const { user } = req;
    return await this.organisationsService.addCustomer(user, orgId, dto);
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Patch('customers/:organisation/:customer')
  @Permissions(Permission.CREATE_INVOICE)
  async updateCustomer(
    @Param('organisation') orgId: string,
    @Param('customer') customerId: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return await this.organisationsService.updateCustomer(
      orgId,
      customerId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Post('link-project/:organisation')
  @Permissions(Permission.CREATE_INVOICE)
  async linkCustomer(@Param('organisation') orgId: string, @Body() body) {
    return await this.organisationsService.linkCustomer(orgId, body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('accounts/:organisation/:subsiduary')
  @Roles(Role.Admin)
  async addAccount(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('subsiduary') subId: string,
    @Body() dto: AddAccountDto,
  ) {
    const { user } = req;
    return await this.organisationsService.addAccount(user, orgId, subId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('accounts/:organisation/:account')
  @Roles(Role.Admin)
  async updateAccount(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('account') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    const { user } = req;
    return await this.organisationsService.updateAccount(
      user,
      orgId,
      accountId,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('accounts/:organisation')
  @Roles(Role.Admin)
  async deleteAccounts(
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: DeleteAccountsDto,
  ) {
    const { user } = req;
    return await this.organisationsService.deleteAccounts(
      user,
      orgId,
      dto.accountIds,
    );
  }

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get('accounts/:organisation')
  @Permissions(Permission.CREATE_INVOICE)
  async getAccounts(
    @Param('organisation') orgId: string,
    @Query('subsiduaryId') subId: string,
  ) {
    return await this.organisationsService.getAccounts(orgId, subId);
  }
}
