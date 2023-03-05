import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from './roles.enum';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
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

    let role;

    user.userType.forEach((element) => {
      if (String(element.organisation) == params.organisation) {
        role = element.userType;
      }
    });

    const permission = requiredRoles.includes(role) ? true : false;
    user.type = role;
    return permission;
  }
}
