import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ id: string; email: string; createdAt: Date }> {
    const { email, password } = registerDto;

    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ email, passwordHash });
    const savedUser = await this.userRepository.save(user);

    return { id: savedUser.id, email: savedUser.email, createdAt: savedUser.createdAt };
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}