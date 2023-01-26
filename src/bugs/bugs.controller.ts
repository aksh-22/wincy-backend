import { Body, Request, Controller, Post, UseGuards, Param, Patch, Delete, UseInterceptors, UploadedFile, Get, Query, UploadedFiles } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { BugsService } from './bugs.service';
import { updateBugReportDto } from './dtos/bugReport.dto';
import { CreateBugDto } from './dtos/createBug.dto';
// import { CreateBugDto } from './dtos/createBug.dto';
import { UpdateBugDto } from './dtos/updateBug.dto';

@Controller('bugs')
export class BugsController {
  constructor(
    private readonly bugsService: BugsService,
  ){}

  //=============================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post(':project/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  @UseInterceptors(
    FilesInterceptor('attachments', 5,{
      // fileFilter: (req, attachments, cb) => {
      //   if (!attachments.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
      //     cb(new Error('File Format not Supported...!!!'), false);
      //   } else {
      //     cb(null, true);
      //   }
      // },
      limits: {fileSize: 10 * 1000 * 1000}
    }),
  )
  async createBug(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('project') projectId: string,
    @Body() body,
  ){
    const {user} = req;
    return await this.bugsService.createBug(user, body, projectId, attachments);
  }

  //=============================================//

  //Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':organisation/:bug')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async updateBug(
    @Request() req,
    @Param('bug') bugId: string,
    @Body() body,
  ){
    const {user} = req;
    return await this.bugsService.updateBug(user, body, bugId);
  }

  //=============================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async deleteBugs(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body('bugs') bugs: [string],
  ){
    const {user} = req;
    return await this.bugsService.deleteBugs(user, bugs, projectId, orgId);
  }

  //=============================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getProjectBugs(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Query() query: any,
  ){
    const {user} = req;
    const {platform, pageSize, pageNo} = query;
    return await this.bugsService.getProjectBugs(user, projectId, orgId, platform, pageSize, pageNo);
  }

  //=============================================//

  @UseGuards(JwtAuthGuard)
  @Get('single/:organisation/:project/:bug')
  async getSingleProject(
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Param('bug') bugId: string,
  ){
    return await this.bugsService.getSingleBug(bugId, projectId, orgId);
  }

  //=============================================//

  @UseGuards(JwtAuthGuard)
  @Get('mybugs/:organisation/:project')
  async getMyBugs(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
  ){
    const {user} = req;
    return await this.bugsService.getMyBugs(user, projectId, orgId);
  }

  //=============================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('add-attachments/:organisation/:bug')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  @UseInterceptors(
    FilesInterceptor('attachments', 5,{
      // fileFilter: (req, attachments, cb) => {
      //   if (!attachments.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
      //     cb(new Error('File Format not Supported...!!!'), false);
      //   } else {
      //     cb(null, true);
      //   }
      // },
      limits: {fileSize: 10 * 1000 * 1000}
    }),
  )
  async addBugAttachments(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('bug') bugId: string,
  ){
    const {user} = req;
    return await this.bugsService.addBugAttachments(user, bugId, attachments);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('remove-attachments/:organisation/:bug')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async removeBugAttachments(
    @Request() req,
    @Body('attachments') attachments: [string],
    @Param('bug') bugId: string
  ){
    const {user} = req;
    return await this.bugsService.removeBugAtachments(user, bugId, attachments);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('count/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getBugsCount(
    @Request() req,
    @Param('project') projectId: string
  ){
    return await this.bugsService.getBugsCount(projectId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('count-task/:organisation/:task')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getBugsCountForTask(
    @Param('task') taskId: string
  ){
    return await this.bugsService.getBugsCountForTask(taskId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('task/:organisation/:project/:task')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getBugsForTask(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Param('task') taskId: string
  ){
    const {user} = req;
    return await this.bugsService.getBugsForTask(user, orgId, projectId, taskId);
  }
    // // Tested
    // @UseGuards(JwtAuthGuard)
    // @Patch('pick/:project/:bug')
    // async pickBug(
    //   @Request() req,
    //   @Param('project') projectId: string,
    //   @Param('bug') bugId: string,
    // ){
    //   const {user} = req;
    //   return await this.bugsService.pickBug(user, projectId, bugId);
    // }
}
