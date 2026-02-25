import { BaseEntity } from '@/database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Ride } from './ride.entity';
import { User } from './user.entity';

@Entity('notification')
export class Notification extends BaseEntity {
  @ManyToOne(() => User)
  @JoinColumn({
    name: 'created_by_user_id',
    foreignKeyConstraintName: 'notification_created_by_user_id_fkey',
  })
  creator: User;

  @ManyToOne(() => Ride, { nullable: true })
  @JoinColumn({
    name: 'ride_id',
    foreignKeyConstraintName: 'notification_ride_id_fkey',
  })
  ride: Ride | null;

  @Column()
  content: string;
}
