import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';

interface AuthConfig {
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  jwtAccessExpiration: string;
  jwtRefreshExpiration: string;
  bcryptSaltRounds: number;
  refreshTokenCookieKey: string
}

@Injectable()
export class AuthService {
	private readonly config: AuthConfig;

	constructor(
		private jwtService: JwtService,
		@InjectRepository(User)
		private usersRepo: Repository<User>,
		private configService: ConfigService,
	) {
		this.config = {
			jwtAccessSecret: this.configService.get<string>('JWT_ACCESS_SECRET', 'AT_SECRET'),
			jwtRefreshSecret: this.configService.get<string>('JWT_REFRESH_SECRET', 'RT_SECRET'),
			jwtAccessExpiration: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
			jwtRefreshExpiration: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
			bcryptSaltRounds: parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS', '10')),
      refreshTokenCookieKey: this.configService.get<string>('REFRESH_TOKEN_COOKIE_KEY', 'refreshToken'),
		};
	}

	async getTokens(userId: string) {
		const payload = { sub: userId };
		const atOptions: JwtSignOptions = {
			secret: this.config.jwtAccessSecret,
			expiresIn: this.config.jwtAccessExpiration as JwtSignOptions['expiresIn'],
		};
		const accessToken = await this.jwtService.signAsync(payload, atOptions);

		const rtOptions: JwtSignOptions = {
			secret: this.config.jwtRefreshSecret,
			expiresIn: this.config.jwtRefreshExpiration as JwtSignOptions['expiresIn'],
		};
		const refreshToken = await this.jwtService.signAsync(payload, rtOptions);

		return { access_token: accessToken, refresh_token: refreshToken };
	}

	async login(id: string, password: string) {
		const user = (await this.usersRepo.findOne({
			where: { id },
			select: ['id', 'passwordHash'] as (keyof User)[],
		})) as Pick<User, 'id' | 'passwordHash'> | null;

		if (!user) throw new UnauthorizedException('Invalid credentials');

		const pwOk = await bcrypt.compare(password, user.passwordHash);
		if (!pwOk) throw new UnauthorizedException('Invalid credentials');

		const tokens = await this.getTokens(user.id);
		const hashed = await bcrypt.hash(tokens.refresh_token, this.config.bcryptSaltRounds);
		await this.usersRepo.update(user.id, { hashedRefreshToken: hashed });
		return tokens;
	}

	async logout(userId: string) {
		await this.usersRepo.update(userId, { hashedRefreshToken: null });
		return { success: true };
	}

	async refreshTokens(userId: string, rt: string) {
		const user = (await this.usersRepo.findOne({
			where: { id: userId },
			select: ['id', 'hashedRefreshToken'] as (keyof User)[],
		})) as Pick<User, 'id' | 'hashedRefreshToken'> | null;

		if (!user || !user.hashedRefreshToken) throw new ForbiddenException('Access Denied');

		const matches = await bcrypt.compare(rt, user.hashedRefreshToken);
		if (!matches) throw new ForbiddenException('Access Denied');

		const tokens = await this.getTokens(user.id);
		const hashed = await bcrypt.hash(tokens.refresh_token, this.config.bcryptSaltRounds);
		await this.usersRepo.update(user.id, { hashedRefreshToken: hashed });
		return tokens;
	}

  setCookies(res: any, refreshToken: string) {
    res.cookie(this.config.refreshTokenCookieKey, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: this.config.jwtRefreshExpiration === '7d' ? 1000 * 60 * 60 * 24 * 7 : undefined,
    });
  }

  clearCookies(res: any) {
    res.clearCookie(this.config.refreshTokenCookieKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }
}

export default AuthService;
