import { BaseEntity } from '@/database/entities/base.entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Ride } from './ride.entity';

@Entity('notification')
export class Notification extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
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
  ride?: Ride;

  @Column()
  content: string;
}
