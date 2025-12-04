import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);
    if (!user) return null;

    const isPasswordMatch = this.usersService.checkPassword(
      pass,
      user.password,
    );
    if (!isPasswordMatch) return null;

    const { password, ...result } = user;
    return result;
  }

  login(user: any) {
    const payload = { username: user._doc.email, sub: user._doc._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
