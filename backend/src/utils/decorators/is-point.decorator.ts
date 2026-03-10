import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Point } from 'geojson';

@ValidatorConstraint({ name: 'isPoint', async: false })
export class IsPointConstraint implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const { type, coordinates } = value as Point;

    if (type !== 'Point') {
      return false;
    }

    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      typeof coordinates[0] !== 'number' ||
      typeof coordinates[1] !== 'number'
    ) {
      return false;
    }

    const [longitude, latitude] = coordinates;

    if (longitude < -180 || longitude > 180) {
      return false;
    }

    if (latitude < -90 || latitude > 90) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return `${args.property} must be a valid GeoJSON Point object with [longitude, latitude]`;
  }
}

export function IsPoint(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsPointConstraint,
    });
  };
}
