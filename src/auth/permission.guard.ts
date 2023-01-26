import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './permission.decorator';
import { Permission } from './permission.enum';
import { Role } from './roles.enum';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const { params } = context.switchToHttp().getRequest();

    if (!params.organisation) {
      throw new HttpException(
        'Please, Provide with an Organisation!',
        HttpStatus.BAD_REQUEST,
      );
    }

    let permission = [];
    let permitted = false;

    user.userType.forEach((element) => {
      if (String(element.organisation) == params.organisation) {
        permitted = element.userType === Role.Admin;
      }
    });

    if (!permitted) {
      permission = user.permission[params.organisation];
      // user?.permission?.forEach((element) => {
      //   if (String(element.organisation) == params.organisation) {
      //     permission = element.permission;
      //   }
      // });

      if (permission?.length > 0) {
        permitted = permission.some((el) => requiredPermission.includes(el));
      }
    }

    return permitted;
  }
}
