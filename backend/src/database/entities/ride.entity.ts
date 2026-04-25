import type { UUID } from 'crypto';
import { Point } from 'geojson';
import { maxBy, minBy } from 'lodash';
import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';
import { RidePassenger } from './ride-passenger.entity';
import { RideStop } from './ride-stop.entity';
import { User } from './user.entity';

export enum RideStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

@Entity('ride')
@Index('ride_current_location_index', ['currentLocation'], { spatial: true })
@Unique('ride_driver_id_starts_at_key', ['driver', 'startsAt'])
@Check('ride_check', '"estimatedEndsAt" > "startsAt"')
@Check('ride_max_seats_amount_check', '"maxSeatsAmount" > 0')
export class Ride extends BaseEntity {
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'org_id', foreignKeyConstraintName: 'ride_org_id_fkey' })
  organization: Organization;

  @Column({ name: 'org_id' })
  orgId: UUID;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'driver_id',
    foreignKeyConstraintName: 'ride_driver_id_fkey',
  })
  driver: User;

  @Column({ name: 'driver_id' })
  driverId: UUID;

  @Column({ type: 'timestamptz', name: 'starts_at' })
  startsAt: Date;

  @Column({ type: 'timestamptz', name: 'estimated_ends_at' })
  estimatedEndsAt: Date;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'current_location',
  })
  currentLocation: Point;

  @Column({ name: 'max_seats_amount' })
  maxSeatsAmount: number;

  @Column({
    type: 'enum',
    enum: RideStatus,
    enumName: 'ride_status',
    default: RideStatus.PENDING,
    name: 'ride_status',
  })
  rideStatus: RideStatus;

  @OneToMany(() => RideStop, (stop) => stop.ride, { cascade: true })
  rideStops: RideStop[];

  @OneToMany(() => RidePassenger, (passenger) => passenger.ride)
  passengers: RidePassenger[];

  get startLocation(): RideStop | undefined {
    return minBy(this.rideStops, 'orderIndex');
  }

  get endLocation() {
    return maxBy(this.rideStops, 'orderIndex');
  }
}
