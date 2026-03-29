import { Point } from 'geojson';
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Ride } from './ride.entity';

@Entity('ride_stop')
@Index('ride_stop_location_index', ['location'], { spatial: true })
@Unique('ride_stop_ride_id_location_key', ['location', 'ride'])
export class RideStop extends BaseEntity {
  @ManyToOne(() => Ride, (ride) => ride.rideStops, {
    nullable: false,
  })
  @JoinColumn({
    name: 'ride_id',
    foreignKeyConstraintName: 'ride_stop_ride_id_fkey',
  })
  ride: Ride;

  @Column('uuid', { name: 'ride_id' })
  rideId: Ride['id'];

  @Column({ type: 'geography', spatialFeatureType: 'Point', srid: 4326 })
  location: Point;

  @Column({ name: 'location_name' })
  locationName: string;

  @Column({ type: 'timestamptz', name: 'estimated_arrival_at' })
  estimatedArrivalAt: Date;

  @Column({ name: 'order_index' })
  orderIndex: number;
}
