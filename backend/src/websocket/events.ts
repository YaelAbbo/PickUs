export enum WsEvent {
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',

  LOCATION_UPDATE = 'location:update', // client → server: driver sends their position
  LOCATION_UPDATED = 'location:updated', // server → room: broadcasts updated position to ride participants

  DRIVER_NEAR_STOP = 'driver:near_stop',
  RIDE_STARTED = 'ride:started',
  DRIVER_MESSAGE = 'driver:message',
}
