import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../../identidade/domain/entities/user';
import type { UserRepositoryInterface } from '../../../../../identidade/domain/repositories/user.repository';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class TypeormUserRepository implements UserRepositoryInterface {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  private toDomain(row: UserEntity): User {
    return User.create(
      {
        name: row.name,
        email: row.email,
        passwordHash: row.passwordHash,
        role: row.role as User['role'],
        active: row.active,
      },
      row.id,
    );
  }

  async create(data: User): Promise<User> {
    const row = this.repo.create({
      id: data.id,
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      role: data.role,
      active: data.active,
    });
    const saved = await this.repo.save(row);
    return this.toDomain(saved);
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.repo.findOne({
      where: { email: email.toLowerCase() },
    });
    return row ? this.toDomain(row) : null;
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }
}
