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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Permissions } from 'src/auth/permission.decorator';
import { Permission } from 'src/auth/permission.enum';
import { PermissionGuard } from 'src/auth/permission.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { BuildService } from './buildData.service';
import { SubmitBuildDataDto } from './dto/add-submission-data.dto';
import { CreateBuildDto } from './dto/create-build-data.dto';
import { UpdateBuildDto } from './dto/update-build-data.dto';
import { UpdateBuildSubmissionDto } from './dto/update-submission-data.dto';

@Controller('build-data')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionGuard)
export class BuildController {
  constructor(private readonly buildService: BuildService) {}

  @Get(':organisation')
  getBuildData(
    @Query('projectId') projectId: string,
    @Param('organisation') orgId: string,
  ) {
    return this.buildService.getBuildData(orgId, projectId);
  }

  @Permissions(Permission.BUILD_MANAGER)
  @Post(':organisation')
  createBuildData(
    @Body() createBuildDto: CreateBuildDto,
    @Request() req: any,
    @Param('organisation') orgId: string,
  ) {
    return this.buildService.create(createBuildDto, req.user, orgId);
  }

  @Permissions(Permission.BUILD_MANAGER)
  @Patch(':organisation')
  updateBuildData(
    @Body() updateBuildDto: UpdateBuildDto,
    @Request() req: any,
    @Param('organisation') orgId: string,
  ) {
    return this.buildService.update(updateBuildDto, req.user, orgId);
  }

  @Get(':organisation/:buildDataId')
  getBuildDetails(
    @Request() req: any,
    @Param('organisation') orgId: string,
    @Param('buildDataId') buildDataId: string,
  ) {
    return this.buildService.getBuildDetails(req.user, orgId, buildDataId);
  }

  @Permissions(Permission.BUILD_MANAGER)
  @Delete(':organisation/:buildDataId')
  deleteBuildData(
    @Request() req: any,
    @Param('organisation') orgId: string,
    @Param('buildDataId') buildDataId: string,
  ) {
    return this.buildService.deleteBuildData(req.user, orgId, buildDataId);
  }

  @Post('submission/:organisation')
  addBuildSubmission(
    @Body() submitBuildDataDto: SubmitBuildDataDto,
    @Request() req: any,
    @Param('organisation') orgId: string,
  ) {
    return this.buildService.addSubmission(submitBuildDataDto, req.user, orgId);
  }

  @Patch('submission/:organisation')
  updateBuildSubmission(
    @Body() updateBuildSubmissionDto: UpdateBuildSubmissionDto,
    @Request() req: any,
    @Param('organisation') orgId: string,
  ) {
    return this.buildService.updateSubmission(
      updateBuildSubmissionDto,
      req.user,
    );
  }
}
