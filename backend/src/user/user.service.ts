import type { Organization } from '@/database/entities';
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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
    } catch (err) {
      console.error(err);
      throw new ConflictException('Failed to create user');
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
      throw new NotFoundException('User not found');
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
    organizationId: Organization['id'],
  ): Promise<User[]> {
    return await this.usersRepository.find({
      where: {
        organization: { id: organizationId },
        isDeleted: false,
      },
    });
  }
}
