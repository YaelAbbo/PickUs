import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ride } from './ride.entity';
import { User } from './user.entity';

@Entity('notification')
@Index('notification_recipient_ride_idx', ['recipient', 'ride'], {
  unique: false,
  where: '"ride_id" IS NOT NULL AND "is_deleted" = false',
})
export class Notification extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'created_by_user_id',
    foreignKeyConstraintName: 'notification_created_by_user_id_fkey',
  })
  creator: User;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'recipient_user_id',
    foreignKeyConstraintName: 'notification_recipient_user_id_fkey',
  })
  recipient: User;

  @ManyToOne(() => Ride, { nullable: true })
  @JoinColumn({
    name: 'ride_id',
    foreignKeyConstraintName: 'notification_ride_id_fkey',
  })
  ride: Ride | null;

  @Column()
  content: string;
}
