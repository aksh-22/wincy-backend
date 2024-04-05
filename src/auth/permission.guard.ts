import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
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
        user.type = element.userType;
        if (element.userType === Role.Admin) {
          permitted = true;
        } else {
          permitted = false;
        }
      }
    });
    if (!permitted) {
      permission = user?.permission?.[params.organisation];
      // user?.permission?.forEach((element) => {
      //   if (String(element.organisation) == params.organisation) {
      //     permission = element.permission;
      //   }
      // });

      if (permission?.length > 0) {
        permitted = permission.some((el) => requiredPermission.includes(el));
      }
    }

    if (!permitted) {
      throw new HttpException(
        'You are not authorized for this.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    return permitted;
  }
}
