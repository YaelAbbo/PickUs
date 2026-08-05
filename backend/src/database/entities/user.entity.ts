import type { UUID } from 'crypto';
import type { Point } from 'geojson';
import {
  AfterLoad,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { EMBEDDING_DIMENSION } from '../../utils/constants';
import { BaseEntity } from './base.entity';
import { Organization } from './organization.entity';

export enum UserRole {
  BASIC_USER = 'BASIC_USER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
  AI = 'AI',
}

@Entity('user')
@Index('user_current_location_index', ['currentLocation'], { spatial: true })
@Index('uq_user_national_id', ['nationalId'], {
  unique: true,
  where: '"is_deleted" IS FALSE',
})
@Index('uq_user_email', ['email'], {
  unique: true,
  where: '"is_deleted" IS FALSE',
})
@Index('uq_user_phone_number', ['phoneNumber'], {
  unique: true,
  where: '"is_deleted" IS FALSE',
})
export class User extends BaseEntity {
  @Column({ name: 'first_name', type: 'varchar' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName: string;

  fullName: string;

  @AfterLoad()
  setFullName() {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }

  @Column({ name: 'national_id', type: 'varchar' })
  nationalId: string;

  @Column({ name: 'email', type: 'varchar' })
  email: string;

  @Column({ name: 'phone_number', type: 'varchar' })
  phoneNumber: string;

  @Column({ select: false, name: 'password_hash', type: 'varchar' })
  passwordHash: string;

  @Column({ name: 'org_id', type: 'varchar' })
  orgId: UUID;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role',
    default: UserRole.BASIC_USER,
  })
  role: UserRole;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'current_location',
  })
  currentLocation: Point | null;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'org_id', foreignKeyConstraintName: 'user_org_id_fkey' })
  organization: Organization;

  @Column({ default: true, name: 'is_temp_password', type: 'bool' })
  isTempPassword: boolean;

  @Column({ nullable: true, name: 'profile_image_url', type: 'varchar' })
  profileImageUrl: string | null;

  @Column({
    type: 'varchar',
    select: false,
    nullable: true,
    name: 'hashed_refresh_token',
  })
  hashedRefreshToken: string | null;

  @Column({
    type: 'vector',
    length: EMBEDDING_DIMENSION,
    nullable: true,
    name: 'avg_ride_embedding',
  })
  avgRideEmbedding: number[] | null;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'avg_start_location',
  })
  avgStartLocation: Point | null;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
    name: 'avg_end_location',
  })
  avgEndLocation: Point | null;

  @Column({ type: 'time', nullable: true, name: 'avg_start_time' })
  avgStartTime: string | null;

  @Column({ type: 'time', nullable: true, name: 'avg_end_time' })
  avgEndTime: string | null;

  @Column({ type: 'int', default: 0, name: 'completed_rides_count' })
  completedRidesCount: number;
}
