import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RideStop } from './ride-stop.entity';
import { Ride } from './ride.entity';
import { User } from './user.entity';

@Entity('ride_passenger')
@Unique('ride_passenger_user_id_ride_id_key', ['user', 'ride'])
export class RidePassenger extends BaseEntity {
  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'ride_passenger_user_id_fkey',
  })
  user: User;

  @Column({ name: 'user_id' })
  userId: User['id'];

  @ManyToOne(() => Ride, { nullable: false })
  @JoinColumn({
    name: 'ride_id',
    foreignKeyConstraintName: 'ride_passenger_ride_id_fkey',
  })
  ride: Ride;

  @Column({ name: 'ride_id' })
  rideId: Ride['id'];

  @ManyToOne(() => RideStop, { nullable: false })
  @JoinColumn({
    name: 'ride_stop_id',
    foreignKeyConstraintName: 'ride_passenger_ride_stop_id_fkey',
  })
  rideStop: RideStop;

  @Column({ name: 'ride_stop_id' })
  rideStopId: RideStop['id'];
}
