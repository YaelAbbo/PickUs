import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from '../ai/ai.module';
import { Organization } from '../database/entities/organization.entity';
import { User } from '../database/entities/user.entity';
import { MailModule } from '../mail/mail.module';
import { MapModule } from '../map/map.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Organization]),
    MailModule,
    AiModule,
    forwardRef(() => MapModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
