import { BaseEntity } from '@/database/entities/base.entity';
import { Point } from 'geojson';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { Organization } from './organization.entity';

export enum UserRole {
  BASIC_USER = 'BASIC_USER',
  HR_MANAGER = 'HR_MANAGER',
  ADMIN = 'ADMIN',
  AI = 'AI',
}

@Entity('user')
@Index('user_current_location_index', ['current_location'], { spatial: true })
export class User extends BaseEntity {
  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ select: false })
  password_hash: string;

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
  })
  current_location: Point;

  @ManyToOne(() => Organization, { nullable: false })
  @JoinColumn({ name: 'org_id', foreignKeyConstraintName: 'user_org_id_fkey' })
  organization: Organization;

  @Column({ default: true })
  is_temp_password: boolean;

  @Column({ nullable: true })
  profile_image_url: string;
}
