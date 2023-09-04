import {
  Body,
  Request,
  Controller,
  Param,
  Post,
  UseGuards,
  Patch,
  Get,
  Delete,
  Query,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/auth/roles.enum';
import { RolesGuard } from 'src/auth/roles.guard';
import { CreateEodDto } from './dto/createEod.dto';
import { CreateMilestoneDto } from './dto/createMilestone.dto';
import { createSubTaskDto } from './dto/createSubTask.dto';
import { CreateTaskDto } from './dto/createTask.dto';
import { CreateTodoDto } from './dto/createTodo.dto';
import { MoveTasksDto } from './dto/moveTasks.dto';
import { UpdateMilestoneDto } from './dto/updateMilestone.dto';
import { MultiTaskUpdateDto } from './dto/updateMultiTask.dto';
import { UpdateSubTaskDto } from './dto/updateSubTask.dto';
import { UpdateTaskDescriptionDto, UpdateTaskDto } from './dto/updateTask.dto';
import { UpdateTodoDto } from './dto/updateTodo.dto';
import { TasksService } from './tasks.service';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  //================================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('milestone/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async createMilestone(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    const { user } = req;

    if (dto.dueDate) {
      dto.dueDate = new Date(dto.dueDate);
    }
    return await this.tasksService.createMilestone(user, dto, orgId, projectId);
  }

  // Tested
  @Post('milestone/copy/post/:mId')
  async copyMilestone(
    @Request() req,
    @Param('mId') mId: string,
    @Param('organisation') orgId: string,
    @Body() body,
  ) {
    return await this.tasksService.copyMilestone(mId, body);
  }

  //================================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('milestone/:organisation/:project/:milestone')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async updateMilestone(
    @Request() req,
    @Param('project') projectId: string,
    @Param('milestone') milestoneId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    const { user } = req;
    return await this.tasksService.updateMilestone(
      user,
      dto,
      projectId,
      milestoneId,
    );
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('milestones/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async getProjectMilestones(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
  ) {
    const { user } = req;
    return await this.tasksService.getProjectMilestones(user, orgId, projectId);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('milestone/:organisation/:project/:milestone')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async getMilestone(
    @Request() req,
    @Param('milestone') milestoneId: string,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
  ) {
    const { user } = req;
    return await this.tasksService.getMilestone(
      user,
      orgId,
      projectId,
      milestoneId,
    );
  }

  //=================================================//

  // Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('task/:organisation/:project/:milestone')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async createTask(
    @Request() req,
    @Param('project') projectId: string,
    @Param('milestone') milestoneId: string,
    @Param('organisation') orgId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const { user } = req;
    return await this.tasksService.createTask(
      user,
      dto,
      projectId,
      milestoneId,
      orgId,
    );
  }

  //=================================================//

  // Not Yet Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':organisation/:task')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async updateTask(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('task') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const { user } = req;
    return await this.tasksService.updateTask(user, dto, orgId, taskId);
  }

  //=================================================//

  // Not Yet Tested
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('description/:organisation/:task')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async updateTaskDescription(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('task') taskId: string,
    @Body() dto: UpdateTaskDescriptionDto,
  ) {
    const { user } = req;
    return await this.tasksService.updateTaskDescription(
      user,
      dto,
      orgId,
      taskId,
    );
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':organisation/:milestone')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async getMilestoneTasks(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('milestone') milestoneId: string,
  ) {
    const { user } = req;
    return await this.tasksService.getMilestoneTasks(user, milestoneId, orgId);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':organisation/:milestone/sub-task/:parentId')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async getMilestoneSubTasks(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('milestone') milestoneId: string,
    @Param('parentId') parentId: string,
  ) {
    const { user } = req;
    return await this.tasksService.getMilestoneSubTasks(
      user,
      milestoneId,
      orgId,
      parentId,
    );
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('sortMilestones/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async sortMilestone(
    @Request() req,
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Body('milestones') milestones: any,
  ) {
    const { user } = req;
    return await this.tasksService.sortMilestones(
      user,
      orgId,
      projectId,
      milestones,
    );
  }

  //=================================================//

  @UseGuards(JwtAuthGuard)
  @Get('mytasks/:organisation/:project')
  async myTasks(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Query() query,
  ) {
    const { user } = req;
    const { pageNo, pageSize } = query;
    return await this.tasksService.myTasks(
      user,
      projectId,
      orgId,
      parseInt(pageNo),
      parseInt(pageSize),
    );
  }
  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('project/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async projectTasks(
    @Param('project') projectId: string,
    @Param('organisation') orgId: string,
    @Request() req,
    // return { data: 'test' };
  ) {
    const { user } = req;
    return await this.tasksService.getProjectTasks(user, orgId, projectId);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('milestone/:organisation/:milestone')
  @Roles(Role['Member++'], Role.Admin, Role['Member+'])
  async deleteMilestone(
    @Request() req,
    @Param('milestone') milestoneId: string,
    @Param('organisation') orgId: string,
  ) {
    const { user } = req;
    return await this.tasksService.deleteMilestone(user, orgId, milestoneId);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role['Member++'], Role.Admin, Role['Member+'])
  @Delete(':organisation/:project')
  async deleteTask(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Body('tasks') tasks: [string],
  ) {
    const { user } = req;
    return await this.tasksService.deleteTask(user, orgId, tasks, projectId);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('todo/:organisation/:project/:task')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async createTodo(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Param('task') taskId: string,
    @Body() dto: CreateTodoDto,
  ) {
    const { user } = req;
    return await this.tasksService.createTodo(
      user,
      orgId,
      projectId,
      dto,
      taskId,
    );
  }

  // //===================== Create Eod ============================//

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Post('eods/:organisation/:project/:task')
  // @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  // async createEod(
  //   @Request() req,
  //   @Param('organisation') orgId: string,
  //   @Param('project') projectId: string,
  //   @Param('task') taskId: string,
  //   @Body() dto: CreateEodDto,
  // ) {
  //   const { user } = req;
  //   return await this.tasksService.createEod(
  //     user,
  //     orgId,
  //     projectId,
  //     dto,
  //     taskId,
  //   );
  // }

  // //===================== Get Eod ============================//

  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Get('edos/:organisation/:project/:task')
  // @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  // async getEod(
  //   @Request() req,
  //   @Param('task') taskId: string,
  //   @Param('project') projectId: string,
  // ) {
  //   const { user } = req;
  //   return await this.tasksService.getTaskEods(user, projectId, taskId);
  // }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('todo/:organisation/:todo')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async updateTodo(
    @Request() req,
    @Param('todo') todoId: string,
    @Body() dto: UpdateTodoDto,
  ) {
    const { user } = req;
    return await this.tasksService.updateTodo(user, todoId, dto);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('sortTasks/:organisation/:milestone')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async sortTasks(
    @Request() req,
    @Param('milestone') milestoneId: string,
    @Param('organisation') orgId: string,
    @Body('tasks') tasks: object,
  ) {
    const { user } = req;
    return await this.tasksService.sortTasks(user, orgId, milestoneId, tasks);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('todo/:organisation/:todo')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async deleteTodo(@Request() req, @Param('todo') todoId: string) {
    const { user } = req;
    return await this.tasksService.deleteTodo(user, todoId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('todo/:organisation/:project/:task')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async getTodos(
    @Request() req,
    @Param('task') taskId: string,
    @Param('project') projectId: string,
  ) {
    const { user } = req;
    return await this.tasksService.getTaskTodos(user, projectId, taskId);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('sortTodo/:organisation/:task')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'], Role['Member'])
  async sortTodo(
    @Request() req,
    @Param('task') taskId: string,
    @Body('todos') todos: string,
  ) {
    const { user } = req;
    return await this.tasksService.sortTodo(user, taskId, todos);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('module/:organisation/:project/:milestone')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async createModule(
    @Request() req,
    @Param('project') projectId: string,
    @Param('milestone') milestoneId: string,
    @Body('module') moduleName: string,
  ) {
    const { user } = req;
    return await this.tasksService.createModule(
      user,
      milestoneId,
      projectId,
      moduleName,
    );
  }
  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('module/:organisation/:module')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async updateModule(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('module') moduleId: string,
    @Body('module') module: string,
  ) {
    const { user } = req;
    return await this.tasksService.updateModule(user, orgId, moduleId, module);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('module/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async deleteModules(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Body('modules') modules: [string],
  ) {
    const { user } = req;
    return await this.tasksService.deleteModules(
      user,
      orgId,
      projectId,
      modules,
    );
  }

  //=================================================//

  @UseGuards(JwtAuthGuard)
  @Get('module/:organisation/:milestone')
  async getModules(@Request() req, @Param('milestone') milestoneId: string) {
    const { user } = req;
    return await this.tasksService.getModules(user, milestoneId);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('sortModules/:organisation/:milestone')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async sortModules(
    @Request() req,
    @Param('milestone') milestoneId: string,
    @Param('organisation') orgId: string,
    @Body('modules') modules: object,
  ) {
    const { user } = req;
    return await this.tasksService.sortModules(
      user,
      orgId,
      milestoneId,
      modules,
    );
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('copy/tasks/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async copyTasks(
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: MoveTasksDto,
  ) {
    const { user } = req;
    return await this.tasksService.copyTasks(user, orgId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('move/tasks/:organisation')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async moveTasks(
    @Request() req,
    @Param('organisation') orgId: string,
    @Body() dto: MoveTasksDto,
  ) {
    const { user } = req;
    return await this.tasksService.moveTasks(user, orgId, dto);
  }

  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('move/modules/:organisation/:milestone')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async moveModules(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('milestone') milestoneId: string,
    @Body('modules') moduleIds: [string],
  ) {
    const { user } = req;
    return await this.tasksService.moveModules(
      user,
      orgId,
      moduleIds,
      milestoneId,
    );
  }
  //=================================================//

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('multi/:organisation/:project')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  async changeMultiTaskData(
    @Request() req,
    @Param('organisation') orgId: string,
    @Param('project') projectId: string,
    @Body() dto: MultiTaskUpdateDto,
  ) {
    const { user } = req;
    return await this.tasksService.changeMultipleTasksData(
      user,
      orgId,
      projectId,
      dto.tasks,
      dto.dueDate,
      dto.assignees,
      dto.platforms,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('attachments/:organisation/:task')
  @Roles(Role.Admin, Role['Member++'], Role['Member+'])
  @UseInterceptors(
    FilesInterceptor('attachments', 5, {
      // fileFilter: (req, attachments, cb) => {
      //   if (!attachments.originalname.match(/\.(jpeg|peg|png|gif|jpg)$/)) {
      //     cb(new Error('File Format not Supported...!!!'), false);
      //   } else {
      //     cb(null, true);
      //   }
      // },
      limits: { fileSize: 10 * 1000 * 1000 },
    }),
  )
  async updateAttachmentsTask(
    @Request() req,
    @UploadedFiles() attachments,
    @Param('organisation') orgId: string,
    @Param('task') taskId: string,
    @Body('removeAttachments') removeAttachments: string,
  ) {
    const { user } = req;
    return await this.tasksService.updateTaskAttachments(
      user,
      orgId,
      taskId,
      removeAttachments,
      attachments,
    );
  }
}
