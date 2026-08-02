// Must be kept in sync with `backend\src\websocket\events.ts`.
export enum WsEvent {
  // Room
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',

  // Location
  LOCATION_UPDATE = 'location:update', // client → server: driver sends their position
  LOCATION_UPDATED = 'location:updated', // server → room: broadcasts updated position to ride participants

  // Driver
  DRIVER_NEAR_STOP = 'driver:near_stop',
  DRIVER_MESSAGE = 'driver:message',

  // Ride
  RIDE_STARTED = 'ride:started',
  RIDE_CREATED = 'ride:created',
  RIDE_UPDATED = 'ride:updated',
  RIDE_DELETED = 'ride:deleted',

  // Ride Passenger
  RIDE_PASSENGER_JOINED = 'ride:passenger:joined',
  RIDE_PASSENGER_UPDATED = 'ride:passenger:updated',
  RIDE_PASSENGER_LEFT = 'ride:passenger:left',

  // User
  USER_UPDATED = 'user:updated',
}
