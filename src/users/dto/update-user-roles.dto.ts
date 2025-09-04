import { IsArray, IsNumber } from 'class-validator';

export class UpdateUserRolesDto {
  @IsArray()
  @IsNumber({}, { each: true })
  roles: number[];
}
