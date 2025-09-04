import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ResponseUtil } from '../common/utils/response.util';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);

    // Set HTTP-only cookie for refresh token
    res.cookie('refreshToken', result.tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Log login activity
    await this.authService.logActivity(
      result.user.id,
      'LOGIN',
      'users',
      result.user.id,
      null,
      req.ip,
      req.get('User-Agent'),
    );

    return ResponseUtil.success(
      {
        user: result.user,
        accessToken: result.tokens.accessToken,
      },
      'Login successful',
    );
  }

  @Post('refresh')
  async refresh(@Req() req: Request) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const result = await this.authService.refreshToken(refreshToken);
    return ResponseUtil.success(result, 'Token refreshed successfully');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    await this.authService.logout(refreshToken);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Log logout activity
    await this.authService.logActivity(
      req.user.userId,
      'LOGOUT',
      'users',
      req.user.userId,
      null,
      req.ip,
      req.get('User-Agent'),
    );

    return ResponseUtil.success(null, 'Logged out successfully');
  }
}
