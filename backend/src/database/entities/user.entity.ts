import { Point } from 'geojson';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
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
export class User extends BaseEntity {
  @Column({ name: 'national_id', unique: true, type: 'varchar' })
  nationalId: string;

  @Column({ name: 'first_name', type: 'varchar' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName: string;

  @Column({ select: false, name: 'password_hash', type: 'varchar' })
  passwordHash: string;

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
}
