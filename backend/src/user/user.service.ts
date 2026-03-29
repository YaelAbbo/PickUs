import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { User } from '../database/entities/user.entity';
import { POSTGRES_UNIQUE_VIOLATION } from '../utils/constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserErrorCode } from './enums/user-error-code.enum';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create({
    firstName,
    lastName,
    nationalId,
    role,
    currentLocation,
    profileImageUrl,
    organizationId,
  }: CreateUserDto): Promise<User> {
    // Default password for new users
    const salt = await bcrypt.genSalt(10);
    const password = uuidv4();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      firstName,
      lastName,
      nationalId,
      role,
      organization: { id: organizationId },
      currentLocation,
      profileImageUrl,
      passwordHash,
      isTempPassword: true,
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === POSTGRES_UNIQUE_VIOLATION
      ) {
        throw new ConflictException(UserErrorCode.USER_ALREADY_EXISTS);
      }
      throw new ConflictException(UserErrorCode.FAILED_TO_CREATE_USER);
    }
  }

  async update(
    id: User['id'],
    {
      firstName,
      lastName,
      role,
      currentLocation,
      profileImageUrl,
      isDeleteImage,
      isDeleted,
    }: UpdateUserDto & { isDeleted?: boolean },
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(UserErrorCode.USER_NOT_FOUND);
    }

    if (isDeleted) {
      user.isDeleted = true;
    } else {
      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (role) user.role = role;
      if (currentLocation) user.currentLocation = currentLocation;

      if (isDeleteImage) {
        user.profileImageUrl = null;
      } else if (profileImageUrl) {
        user.profileImageUrl = profileImageUrl;
      }
    }

    return await this.usersRepository.save(user);
  }

  async getUserById(id: User['id']): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAllByOrganization(
    organizationId: string,
    page = 1,
    limit = 15,
    searchQuery = '',
  ): Promise<{ data: User[]; total: number; hasNextPage: boolean }> {
    const query = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.organization', 'organization')
      .where('user.organization = :organizationId', { organizationId })
      .andWhere('user.isDeleted = false');

    if (searchQuery) {
      query.andWhere(
        '(LOWER(user.firstName) LIKE LOWER(:search) OR ' +
          'LOWER(user.lastName) LIKE LOWER(:search) OR ' +
          'user.nationalId LIKE :search)',
        { search: `%${searchQuery}%` },
      );
    }

    query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC');

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      hasNextPage: page * limit < total,
    };
  }
}
