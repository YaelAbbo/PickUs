import { UseAccessAuth } from '@/auth/decorators';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Organization, User } from '../database/entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseAccessAuth()
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.userService.create(createUserDto);
  }

  @UseAccessAuth()
  @Get(':id')
  async findOne(@Param('id') id: User['id']): Promise<User> {
    return await this.userService.getUserById(id);
  }

  @UseAccessAuth()
  @Get('organization/:orgId')
  async findAllByOrganization(
    @Param('orgId') orgId: Organization['id'],
  ): Promise<User[]> {
    return await this.userService.findAllByOrganization(orgId);
  }

  @UseAccessAuth()
  @Patch(':id')
  async update(
    @Param('id') id: User['id'],
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @UseAccessAuth()
  @Delete(':id')
  async remove(@Param('id') id: User['id']): Promise<void> {
    await this.userService.update(id, { isDeleted: true });
  }
}
