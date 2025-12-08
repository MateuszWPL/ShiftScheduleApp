import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

// Custom validator: endTime musi być późniejsze niż startTime
export function IsEndTimeAfterStartTime(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isEndTimeAfterStartTime',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const startTime = (args.object as any).startTime;
          if (!startTime || !value) return true; // Jeśli brak dat, walidacja przechodzi (IsDateString to sprawdzi)
          
          const start = new Date(startTime);
          const end = new Date(value);
          
          return end > start;
        },
        defaultMessage(args: ValidationArguments) {
          return 'endTime musi być późniejsze niż startTime';
        },
      },
    });
  };
}

