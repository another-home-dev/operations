import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

// This describes what a request looks like AFTER the guard has checked it —
// with the wristband info attached as `request.user`.
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    roles: string[];
  };
}

@Injectable()
export class IdentityGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const userId = request.headers['x-user-id'] as string | undefined;
    const rolesHeader = request.headers['x-user-roles'] as string | undefined;

    // No wristband at all means this request didn't come through the Gateway
    // properly — refuse it rather than guessing who it might be.
    if (!userId) {
      throw new UnauthorizedException('Missing identity headers — request did not come through the Gateway.');
    }

    // Attach the decoded identity onto the request, so controllers/services
    // further down the chain can read it without re-parsing headers themselves.
    request.user = {
      userId,
      roles: rolesHeader ? rolesHeader.split(',') : [],
    };

    return true;
  }
}
