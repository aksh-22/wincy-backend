import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { String } from 'aws-sdk/clients/acm';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Permission } from 'src/auth/permission.enum';
import { PermissionGuard } from 'src/auth/permission.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { AssignProjectDto } from './dto/assignProject.dto';
import { CreateProjectDto } from './dto/createProject.dto';
import {
  CreatePaymentPhaseDto,
  DeletePaymentPhasesDto,
  UpdatePaymentPhaseDto,
  UpdatePaymentPhaseMilestoneDto,
} from './dto/paymentPhase.dto';
import {
  RemoveAttachmentsDto,
  UpdateProjectDto,
} from './dto/updateProject.dto';
import { Project_Type } from './enum/project.enum';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // @Get('fix-managers')
  // async fixManager() {
  //   return await this.projectsService.fixManagers();
  // }

  @Get('invoice/:organisation')
  async getInvoiceProjects(
    @Query('status') status: string,
    @Query('dataType') dataType: string,
  ) {
    return await this.projectsService.getInvoiceProjects(
      status,
      null,
      dataType,
    );
  }

  @Get('invoice/:organisation:projectId')
  async getInvoiceOneProject(
    @Query('status') status: string,
    @Param('projectId') projectId: string,
  ) {
    return await this.projectsService.getInvoiceProjects(status, {
      _id: projectId,
    });
  }

  //==================================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':organisation')
  @Roles(Role.Admin, Role['Member++'])
  //Do we need to limit size of upload
  @UseInterceptors(
    FileInterceptor('logo', {
      fileFilter: (req, logo, cb) => {
        if (!logo.originalname.match(/\.(jpeg|jpg|png|gif)$/)) {
          cb(new Error('File Format not Supported...!!!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async createProject(
    @UploadedFile() logo,
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: CreateProjectDto,
  ) {
    const { user } = req;
    dto.platforms = dto.platforms ? JSON.parse(dto.platforms) : undefined;
    dto.awardedAt = dto.awardedAt ? new Date(dto.awardedAt) : dto.awardedAt;
    dto.startedAt = dto.startedAt ? new Date(dto.startedAt) : dto.startedAt;
    dto.dueDate = dto.dueDate ? new Date(dto.dueDate) : dto.dueDate;
    dto.technologies = dto.technologies
      ? JSON.parse(dto.technologies)
      : dto.technologies;
    // dto.sections = dto.sections? JSON.parse(dto.sections) : dto.sections;

    return await this.projectsService.createProject(user, dto, logo, orgId);
  }

  //===================================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  //Do we need to limit size of upload
  @UseInterceptors(
    FileInterceptor('logo', {
      fileFilter: (req, logo, cb) => {
        if (!logo.originalname.match(/\.(jpeg|jpg|png|gif)$/)) {
          cb(new Error('File Format not Supported...!!!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async updateProject(
    @UploadedFile() logo,
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    const { user } = req;
    dto.platforms = dto.platforms ? JSON.parse(dto.platforms) : undefined;
    dto.awardedAt = dto.awardedAt ? new Date(dto.awardedAt) : dto.awardedAt;
    dto.startedAt = dto.startedAt ? new Date(dto.startedAt) : dto.startedAt;
    dto.dueDate = dto.dueDate ? new Date(dto.dueDate) : dto.dueDate;
    dto.technologies = dto.technologies
      ? JSON.parse(dto.technologies)
      : dto.technologies;
    // dto.sections = dto.sections? JSON.parse(dto.sections) : dto.sections;

    return await this.projectsService.updateProject(
      user,
      dto,
      logo,
      projectId,
      orgId,
    );
  }

  //===================================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('assign/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async assignProject(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body() dto: AssignProjectDto,
  ) {
    const { user } = req;
    return await this.projectsService.assignProject(
      user,
      dto.team,
      dto.projectManagers,
      orgId,
      projectId,
    );
  }

  //====================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  @Get(':organisation')
  async getMyProjects(
    @Request() req,
    @Param('organisation') orgId: string,
    @Query('status') status: string,
    @Query('projectType') projectType: Project_Type,
  ) {
    const { user } = req;
    return await this.projectsService.getMyProjects(
      user,
      orgId,
      status,
      projectType,
    );
  }

  //====================================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('attachments/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  @UseInterceptors(
    FilesInterceptor('attachments', 10, {
      fileFilter: (req, attachments, cb) => {
        //@ts-ignore
        // if(!attachments.originalname.match(/\.(json|jpeg|jpg|png|gif|pdf|zip|doc|docx|txt|svg|tiff|psd|eps|ai|indd|mp4|mkv|avi|webm|ppt|xls|xlsx|xd|apk|ipa|aab)$/)){
        //   cb(new Error('File Format not Supported...!!!'), false);
        // }
        cb(null, true);
      },
    }),
  )
  async addAttachment(
    @UploadedFiles() attachments,
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body('folder') folder: string,
    @Body('storageLink') storageLink: string,
    @Body('name') name: string,
  ) {
    const { user } = req;
    return await this.projectsService.addAttachments(
      user,
      orgId,
      projectId,
      folder,
      attachments,
      storageLink,
      name,
    );
  }

  //==================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('attachments/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async removeAttachments(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body() dto: RemoveAttachmentsDto,
  ) {
    const { user } = req;
    return await this.projectsService.removeAttachments(
      user,
      projectId,
      orgId,
      dto,
    );
  }

  //==================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('attachments/:organisation/:project/:attachment')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async renameAttachments(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Param('attachment') attachmentId: string,
    @Body('name') name: string,
    @Body('storageLink') storageLink: string,
  ) {
    const { user } = req;
    return await this.projectsService.renameAndUpdateAttachment(
      user,
      orgId,
      projectId,
      attachmentId,
      name,
      storageLink,
    );
  }

  //==================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('single/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getProject(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
  ) {
    const { user } = req;
    return await this.projectsService.getProject(user, projectId, orgId);
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('mini/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getProjectsMinimised(
    @Request() req,
    @Param('organisation') orgId: string,
  ) {
    const { user } = req;
    return await this.projectsService.getProjectUserMinimised(user, orgId);
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('attachments/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getProjectAttachments(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
  ) {
    const { user } = req;
    return await this.projectsService.getProjectAttachments(
      user,
      projectId,
      orgId,
    );
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('users/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async user(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
  ) {
    const { user } = req;
    return await this.projectsService.getUsersProjectSelection(
      user,
      orgId,
      projectId,
    );
  }

  //===================================================//

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Delete(':organisation/:project')
  // @Roles(Role.Admin, Role['Member++'])
  // async deleteProject(
  //   @Request() req,
  //   @Param('organisation') orgId: string,
  //   @Param('project') projectId: string,
  // ) {
  //   const { user } = req;
  //   return await this.projectsService.deleteProject(user, orgId, projectId);
  // }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('credentials/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async updateCredentials(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Body('addCredentials') addCredentials: [object],
    @Body('removeCredentials') removeCredentials: [string],
    @Body('updateCredentials') updateCredentials: [object],
  ) {
    const { user } = req;
    return await this.projectsService.updateCredentials(
      user,
      orgId,
      projectId,
      removeCredentials,
      addCredentials,
      updateCredentials,
    );
  }
  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('section/:organisation/:project/:platform')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async addSection(
    @Request() req,
    @Param('platform') platformId: string,
    @Param('project') projectId: string,
    @Body('section') section: string,
  ) {
    const { user } = req;
    return await this.projectsService.saveSection(
      user,
      projectId,
      platformId,
      section,
    );
  }

  //===================================================//
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('section/:organisation/:project/:platform')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getSections(
    @Request() req,
    @Param('platform') platformId: string,
    @Param('project') projectId: string,
  ) {
    return await this.projectsService.getSections(projectId, platformId);
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('section/:organisation/:project/:platform')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async deleteSection(
    @Request() req,
    @Param('platform') platformId: string,
    @Param('project') projectId: string,
    @Body('section') section: string,
  ) {
    const { user } = req;
    return await this.projectsService.deleteSection(
      user,
      projectId,
      platformId,
      section,
    );
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('payment-phase/:organisation/:project')
  // @Roles(Role.Admin)
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async createPaymentPhase(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Body() dto: CreatePaymentPhaseDto,
  ) {
    const { user } = req;
    return await this.projectsService.createPaymentPhase(
      user,
      orgId,
      projectId,
      dto,
    );
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('payment-phase/:organisation/:project/:paymentPhase')
  // @Roles(Role.Admin)
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async updatePaymentPhase(
    @Param('paymentPhase') paymentPhaseId: string,
    @Param('project') projectId: string,
    @Body() dto: UpdatePaymentPhaseDto,
  ) {
    return await this.projectsService.updatePaymentPhase(
      projectId,
      paymentPhaseId,
      dto,
    );
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('payment-phase/:organisation/:project')
  // @Roles(Role.Admin)
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async deletePaymentPhase(
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body() dto: DeletePaymentPhasesDto,
  ) {
    return await this.projectsService.deletePaymentPhases(
      orgId,
      projectId,
      dto.paymentPhaseIds,
    );
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('payment-phase/invoice/:organisation/:paymentPhaseId')
  // @Roles(Role.Admin)
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async showPaymentPhaseLinkedInvoices(
    @Param('paymentPhaseId') paymentPhaseId: string,
    @Param('organisation') orgId: string,
  ) {
    return await this.projectsService.showPaymentPhaseInvoices(
      orgId,
      paymentPhaseId,
    );
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, PermissionGuard)
  @Get('payment-phase/:organisation/:project')
  // @Roles(Role.Admin)
  @Permissions(Permission.CREATE_INVOICE, Permission.GET_INVOICES)
  async getPaymentPhase(
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Request() req,
  ) {
    const { user } = req;
    return await this.projectsService.getPaymentPhases(orgId, projectId, user);
  }

  //===================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('payment-phase-milestone/:organisation/:project')
  // @Roles(Role.Admin)
  @Permissions(Permission.GET_INVOICES, Permission.CREATE_INVOICE)
  async updatePaymentPhaseMilestone(
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Body() dto: UpdatePaymentPhaseMilestoneDto,
  ) {
    return await this.projectsService.updatePaymentPhaseMilestone(
      orgId,
      projectId,
      dto.milestoneIds,
      dto.paymentPhaseId,
      undefined,
      dto.newMilestones,
      dto.removeMilestones,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('search/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async searchText(
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Query('search') text: string,
  ) {
    return await this.projectsService.searchProjectText(orgId, projectId, text);
  }
}
