import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async loginUser(username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { roles: { include: { role: true } } },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Invalid credentials or account is disabled',
      );
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const accessToken = this.jwtService.sign(
      { userId: user.id },
      {
        expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN') || '1h',
      },
    );

    const refreshToken = this.jwtService.sign(
      { userId: user.id },
      {
        secret:
          this.configService.get('REFRESH_TOKEN_SECRET') ||
          this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRES_IN') || '7d',
      },
    );

    // Persist refresh token
    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id },
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles.map((ur: any) => ur.role.name),
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async login(loginDto: LoginDto) {
    try {
      const { user, tokens } = await this.loginUser(
        loginDto.username,
        loginDto.password,
      );
      return { user, tokens };
    } catch (error: any) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  async refreshAccessToken(token: string): Promise<{ accessToken: string }> {
    // Lookup in DB
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!stored) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify
    try {
      const payload = this.jwtService.verify(token, {
        secret:
          this.configService.get('REFRESH_TOKEN_SECRET') ||
          this.configService.get('JWT_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Issue new access token
      const accessToken = this.jwtService.sign(
        { userId: user.id },
        {
          expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRES_IN') || '1h',
        },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async refreshToken(token: string) {
    try {
      const result = await this.refreshAccessToken(token);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async logoutUser(token?: string): Promise<void> {
    if (token) {
      await this.prisma.refreshToken.deleteMany({ where: { token } });
    }
  }

  async logout(token?: string) {
    try {
      await this.logoutUser(token);
      return { message: 'Logged out successfully' };
    } catch (error) {
      return { message: 'Logged out successfully' };
    }
  }

  async logActivity(
    userId: number,
    action: string,
    tableName: string,
    recordId?: number,
    changes?: any,
    ipAddress?: string,
    userAgent?: string,
  ) {
    return this.prisma.activityLog.create({
      data: {
        userId,
        action,
        tableName,
        recordId,
        changes,
        ipAddress,
        userAgent,
      },
    });
  }
}
