// Must be kept in sync with `backend/src/websocket/events.ts`.
export enum WsEvent {
  ROOM_JOIN = 'room:join',
  ROOM_LEAVE = 'room:leave',

  LOCATION_UPDATE = 'location:update',
  LOCATION_UPDATED = 'location:updated',

  DRIVER_NEAR_STOP = 'driver:near_stop',
  RIDE_STARTED = 'ride:started',
  DRIVER_MESSAGE = 'driver:message',
}
