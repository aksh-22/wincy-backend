import { Controller, Post, UseGuards, UseInterceptors, Request, UploadedFiles, Param, Body, Patch, Get, Delete, Query } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { AddReplyDto } from './dto/addReply.dto';
import { CreateQueryDto } from './dto/createQuery.dto';
import { DeleteQueriesDto } from './dto/deleteQueries.dto';
import { DeleteRepliesDto } from './dto/deleteReplies.dto';
import { UpdateQueryDto } from './dto/updateQuery.dto';
import { UpdateReplyDto } from './dto/updateReply.dto';
import { QueriesService } from './queries.service';

@Controller('queries')
export class QueriesController {
  constructor(
    private readonly queriesService: QueriesService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('query/:organisation/:project')
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
  async createQuery(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body() dto: CreateQueryDto,
  ) {
    const {user} = req;
    return await this.queriesService.createQuery(user, orgId, projectId, attachments, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('query/:organisation/:project/:query')
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
  async updateQuery(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Param('query') queryId: string,
    @Body() dto: UpdateQueryDto,
  ) {
    const {user} = req;
    return await this.queriesService.updateQuery(user, orgId, projectId, queryId, attachments, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('query/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async deleteQueries(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body() dto: DeleteQueriesDto,
  ) {
    const {user} = req;
    return await this.queriesService.deleteQueries(user, orgId, projectId, dto.queries);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('query/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getQueries(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Query('status') status: "Open" | "Close",
  ) {
    const {user} = req;
    return await this.queriesService.getQueries(user, orgId, projectId, status);
  }

  
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('reply/:organisation/:project/:query')
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
  async addReply(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Param('query') queryId: string,
    @Body() dto: AddReplyDto,
  ) {
    const {user} = req;
    return await this.queriesService.addReply(user, orgId, projectId, queryId, attachments, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('reply/:organisation/:project/:reply')
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
  async updateReply(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Param('reply') replyId: string,
    @Body() dto: UpdateReplyDto,
  ) {
    const {user} = req;
    return await this.queriesService.updateReply(user, orgId, projectId, replyId, attachments, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('reply/:organisation/:project/:query')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async getReplies(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Param('query') queryId: string,
  ) {
    const {user} = req;
    return await this.queriesService.getReplies(user, orgId, projectId, queryId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('reply/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role.Member)
  async deleteReplies(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body() dto: DeleteRepliesDto,
  ) {
    const {user} = req;
    return await this.queriesService.deleteReplies(user, orgId, projectId, dto.replies);
  }

}
