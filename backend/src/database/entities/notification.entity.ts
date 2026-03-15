import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ride } from './ride.entity';
import { User } from './user.entity';

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
  ride: Ride | null;

  @Column()
  content: string;
}
