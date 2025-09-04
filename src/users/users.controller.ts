import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ResponseUtil } from '../common/utils/response.util';
import { PaginationService } from '../common/services/pagination.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly paginationService: PaginationService,
  ) {}

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const { data, meta } = await this.usersService.findAll(page, limit);
    return ResponseUtil.paginated(data, meta, 'Users retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return ResponseUtil.success(user, 'User retrieved successfully');
  }

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return ResponseUtil.success(user, 'User created successfully');
  }

  @Patch(':id/status')
  async updateUserActive(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserActiveDto: UpdateUserActiveDto,
  ) {
    const user = await this.usersService.updateUserActive(
      id,
      updateUserActiveDto,
    );
    return ResponseUtil.success(user, 'User status updated successfully');
  }

  @Put(':id/roles')
  async updateUserRoles(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserRolesDto: UpdateUserRolesDto,
  ) {
    const user = await this.usersService.updateUserRoles(
      id,
      updateUserRolesDto,
    );
    return ResponseUtil.success(user, 'User roles updated successfully');
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    const user = await this.usersService.update(id, updateUserDto);
    return ResponseUtil.success(user, 'User updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.remove(id);
    return ResponseUtil.success(user, 'User deleted successfully');
  }
}
