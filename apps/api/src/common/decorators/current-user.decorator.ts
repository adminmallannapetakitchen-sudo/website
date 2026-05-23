import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
  sub: string;
  email?: string | null;
  phone?: string | null;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserPayload | undefined, ctx: ExecutionContext): CurrentUserPayload | string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user: CurrentUserPayload = request.user;
    if (!user) return undefined;
    return data ? (user[data] as string) : user;
  },
);
