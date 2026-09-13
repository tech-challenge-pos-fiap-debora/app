import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedError } from '../../../../shared/domain/errors';
import type { ClientRepositoryInterface } from '../../../domain/repositories/client.repository';
import { CLIENT_REPOSITORY } from '../../../domain/repositories/tokens';
import type { UserRepositoryInterface } from '../../../domain/repositories/user.repository';
import { USER_REPOSITORY } from '../../../domain/repositories/tokens';
import { UserRole } from '../../../domain/entities/user-role';
import type { JwtPayload } from './jwt-payload';

@Injectable()
export class ValidateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly users: UserRepositoryInterface,
    @Inject(CLIENT_REPOSITORY)
    private readonly clients: ClientRepositoryInterface,
  ) {}

  async execute(payload: JwtPayload): Promise<JwtPayload> {
    if (payload.role === UserRole.CLIENTE) {
      const client = await this.clients.findById(payload.sub);
      if (!client) {
        throw new UnauthorizedError('Unauthorized');
      }

      return {
        sub: client.id,
        email: client.email,
        role: UserRole.CLIENTE,
      };
    }

    const user = await this.users.findById(payload.sub);
    if (!user?.active) {
      throw new UnauthorizedError('Unauthorized');
    }

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
