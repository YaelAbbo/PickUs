import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { MailService } from '../mail/mail.service';
import { POSTGRES_UNIQUE_VIOLATION } from '../utils/constants';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserErrorCode } from './enums/user-error-code.enum';

const BCRYPT_SALT_ROUNDS = 10;
const TEMP_PASSWORD_LENGTH = 18;

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly mailService: MailService,
  ) {}

  async create({
    firstName,
    lastName,
    nationalId,
    email,
    role,
    currentLocation,
    profileImageUrl,
    orgId,
  }: CreateUserDto): Promise<User> {
    const { tempPassword, passwordHash } = await this.createTemporaryPassword();

    const user = this.usersRepository.create({
      firstName,
      lastName,
      nationalId,
      email,
      role,
      organization: { id: orgId },
      currentLocation,
      profileImageUrl,
      passwordHash,
      isTempPassword: true,
    });

    let savedUser: User;
    try {
      savedUser = await this.usersRepository.save(user);
    } catch (error) {
      this.logger.error(`Failed to create user, error`, error);
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

    try {
      await this.mailService.sendTempPasswordEmail({
        to: email,
        displayName: `${firstName} ${lastName}`,
        tempPassword,
      });
    } catch (error) {
      this.logger.error(
        `User created but email delivery failed for ${email}`,
        error,
      );
    }

    return savedUser;
  }

  async resendTempPassword(id: User['id']): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(UserErrorCode.USER_NOT_FOUND);
    }

    const { tempPassword, passwordHash } = await this.createTemporaryPassword();
    user.passwordHash = passwordHash;
    user.isTempPassword = true;

    await this.usersRepository.save(user);

    try {
      await this.mailService.sendTempPasswordEmail({
        to: user.email,
        displayName: `${user.firstName} ${user.lastName}`,
        tempPassword,
      });
    } catch (error) {
      this.logger.error(
        `Resend temp password email failed for ${user.email}`,
        error,
      );
    }
  }

  async update(
    id: User['id'],
    {
      firstName,
      lastName,
      email,
      role,
      currentLocation,
      profileImageUrl,
      isDeleteImage,
      isDeleted,
      password,
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
      if (email) user.email = email;
      if (role) user.role = role;
      if (currentLocation) user.currentLocation = currentLocation;

      if (isDeleteImage) {
        user.profileImageUrl = null;
      } else if (profileImageUrl) {
        user.profileImageUrl = profileImageUrl;
      }

      if (password) {
        const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
        user.passwordHash = await bcrypt.hash(password, salt);

        if (user.isTempPassword) {
          user.isTempPassword = false;
        }
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

  private buildSecurePassword(): string {
    return randomBytes(TEMP_PASSWORD_LENGTH).toString('base64url');
  }

  private async createTemporaryPassword(): Promise<{
    passwordHash: string;
    tempPassword: string;
  }> {
    const tempPassword = this.buildSecurePassword();
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(tempPassword, salt);

    return { passwordHash, tempPassword };
  }
}
