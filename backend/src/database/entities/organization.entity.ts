import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('organization')
export class Organization extends BaseEntity {
  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  image_url: string;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({
    name: 'admin_id',
    foreignKeyConstraintName: 'organization_admin_id_fkey',
  })
  admin: User;
}
