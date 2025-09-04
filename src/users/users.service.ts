import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserActiveDto } from './dto/update-user-active.dto';
import { UpdateUserRolesDto } from './dto/update-user-roles.dto';
import { PaginationService } from '../common/services/pagination.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  // Include configuration for user queries with roles and permissions
  private readonly userInclude = {
    roles: {
      include: {
        role: {
          include: {
            rolePermissions: {
              include: { permission: true },
            },
          },
        },
      },
    },
  };

  // Helper function to format user response
  private formatUserResponse(user: any) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles ? user.roles.map((ur: any) => ur.role.name) : [],
      permissions: user.roles
        ? user.roles.flatMap((ur: any) =>
            ur.role.rolePermissions.map((rp: any) => rp.permission.name),
          )
        : [],
    };
  }

  async create(createUserDto: CreateUserDto) {
    const {
      fullName,
      email,
      username,
      password,
      roles: roleIds,
    } = createUserDto;

    // Check if email or username already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      throw new ConflictException('Email or username already exists');
    }

    // Verify that all role IDs exist if provided
    if (roleIds && roleIds.length > 0) {
      const roles = await this.prisma.role.findMany({
        where: { id: { in: roleIds } },
      });

      if (roles.length !== roleIds.length) {
        throw new BadRequestException('One or more role IDs are invalid');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await this.prisma.user.create({
      data: {
        fullName,
        email,
        username,
        passwordHash,
        roles:
          roleIds && roleIds.length > 0
            ? {
                create: roleIds.map((roleId: number) => ({ roleId })),
              }
            : undefined,
      },
      include: this.userInclude,
    });

    return this.formatUserResponse(user);
  }

  async findAll(page: number = 1, limit: number = 10) {
    const { data, meta } = await this.paginationService.paginate(
      this.prisma.user,
      { page, limit },
      { include: this.userInclude },
    );

    return {
      data: data.map((user: any) => this.formatUserResponse(user)),
      meta,
    };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.userInclude,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: this.userInclude,
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.userInclude,
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    await this.findOne(id);

    const updateData: any = {};

    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(updateUserDto.password, 12);
    }

    if (updateUserDto.fullName) updateData.fullName = updateUserDto.fullName;
    if (updateUserDto.email) updateData.email = updateUserDto.email;
    if (updateUserDto.username) updateData.username = updateUserDto.username;
    if (updateUserDto.isActive !== undefined)
      updateData.isActive = updateUserDto.isActive;

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: this.userInclude,
    });

    return this.formatUserResponse(user);
  }

  async updateUserActive(id: number, data: UpdateUserActiveDto) {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { isActive: data.isActive },
      include: this.userInclude,
    });

    return this.formatUserResponse(user);
  }

  async updateUserRoles(id: number, data: UpdateUserRolesDto) {
    const { roles: roleIds } = data;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // Verify that all role IDs exist
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds } },
    });

    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more role IDs are invalid');
    }

    // Use transaction to ensure data consistency
    const user = await this.prisma.$transaction(async (tx) => {
      // Remove existing roles
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      // Add new roles
      await tx.userRole.createMany({
        data: roleIds.map((roleId: number) => ({
          userId: id,
          roleId,
        })),
      });

      // Return updated user
      return tx.user.findUnique({
        where: { id },
        include: this.userInclude,
      });
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.formatUserResponse(user);
  }

  async remove(id: number) {
    await this.findOne(id);

    const user = await this.prisma.user.delete({
      where: { id },
      include: this.userInclude,
    });

    return this.formatUserResponse(user);
  }

  async checkUserExists(id: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    return !!user;
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }

  async checkUsernameExists(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return !!user;
  }
}
