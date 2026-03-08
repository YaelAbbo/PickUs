import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UseAccessAuth } from '../auth/auth.decorator';
import { User } from '../database/entities/user.entity';
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
  async findOne(@Param('id') id: string): Promise<User> {
    return await this.userService.findOne(id);
  }

  @UseAccessAuth()
  @Get('organization/:orgId')
  async findAllByOrganization(@Param('orgId') orgId: string): Promise<User[]> {
    return await this.userService.findAllByOrganization(orgId);
  }

  @UseAccessAuth()
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.userService.update(id, updateUserDto);
  }

  @UseAccessAuth()
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return await this.userService.remove(id);
  }
}
