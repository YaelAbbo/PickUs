import { BaseEntity } from '@/database/entities/base.entity';
import { Point } from 'geojson';
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
import { Organization } from './organization.entity';
import { RideStop } from './ride-stop.entity';
import { User } from './user.entity';

export enum RideStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

@Entity('ride')
@Index('ride_current_location_index', ['current_location'], { spatial: true })
@Unique('ride_driver_id_starts_at_key', ['driver', 'starts_at']) // Match SQL name
@Check('ride_check', '"estimated_ends_at" > "starts_at"')
@Check('ride_max_seats_amount_check', '"max_seats_amount" > 0')
export class Ride extends BaseEntity {
  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'org_id', foreignKeyConstraintName: 'ride_org_id_fkey' })
  organization: Organization;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'driver_id',
    foreignKeyConstraintName: 'ride_driver_id_fkey',
  })
  driver: User;

  @Column({ type: 'timestamptz' })
  starts_at: Date;

  @Column({ type: 'timestamptz' })
  estimated_ends_at: Date;

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  start_location: Point;

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  end_location: Point;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  current_location: Point;

  @Column()
  max_seats_amount: number;

  @Column({
    type: 'enum',
    enum: RideStatus,
    enumName: 'ride_status',
    default: RideStatus.PENDING,
  })
  ride_status: RideStatus;

  @OneToMany(() => RideStop, (stop) => stop.ride)
  stops: RideStop[];
}
