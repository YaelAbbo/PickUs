import { UseAccessAuth } from '@/auth/decorators';
import { LiveUpdatesService } from '@/websocket/live-updates.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Organization, User } from '../database/entities';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly liveUpdatesService: LiveUpdatesService,
  ) {}

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
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ): Promise<{ data: User[]; total: number; hasNextPage: boolean }> {
    return await this.userService.findAllByOrganization(
      orgId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 15,
      search,
    );
  }

  @UseAccessAuth()
  @Patch(':id')
  async update(
    @Param('id') id: User['id'],
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    const updatedUser = await this.userService.update(id, updateUserDto);
    const freshUser = await this.userService.getUserById(updatedUser.id);

    this.liveUpdatesService.broadcastUserUpdate({ user: freshUser });

    return freshUser;
  }

  @UseAccessAuth()
  @Post(':id/resend-temp-password')
  async resendTempPassword(@Param('id') id: User['id']): Promise<void> {
    await this.userService.resendTempPassword(id);
  }

  @UseAccessAuth()
  @Delete(':id')
  async remove(@Param('id') id: User['id']): Promise<void> {
    await this.userService.update(id, { isDeleted: true });
  }
}
