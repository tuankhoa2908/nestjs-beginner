import { Controller, Post, Request, Get } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { Public } from './decorator/customize';
import { UseGuards } from '@nestjs/common';
import { LocalAuthGuard } from './auth/local-auth.guard';

@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }
}
