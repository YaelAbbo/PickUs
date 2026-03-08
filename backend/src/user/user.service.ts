import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Organization } from '../database/entities/organization.entity';
import { User } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
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
    const organization = await this.organizationsRepository.findOne({
      where: { id: organizationId },
    });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Default password for new users
    const salt = await bcrypt.genSalt(10);
    const password = uuidv4();
    const passwordHash = await bcrypt.hash(password, salt);

    const user = this.usersRepository.create({
      firstName,
      lastName,
      nationalId,
      role,
      organization,
      currentLocation: currentLocation,
      profileImageUrl: profileImageUrl,
      passwordHash: passwordHash,
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
    id: string,
    {
      firstName,
      lastName,
      role,
      currentLocation,
      profileImageUrl,
      isDeleteImage,
    }: UpdateUserDto,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (role) user.role = role;
    if (currentLocation) user.currentLocation = currentLocation;

    if (isDeleteImage) {
      user.profileImageUrl = null;
    } else if (profileImageUrl) {
      user.profileImageUrl = profileImageUrl;
    }

    return await this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.isDeleted = true;
    await this.usersRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['organization'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAllByOrganization(organizationId: string): Promise<User[]> {
    return await this.usersRepository.find({
      where: {
        organization: { id: organizationId },
        isDeleted: false,
      },
    });
  }
}
