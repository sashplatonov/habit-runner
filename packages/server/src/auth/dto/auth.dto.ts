import { IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class LoginRequest {
  @IsEmail()
  email!: string;
}

export class OAuthStartQuery {
  @IsOptional()
  @IsUrl({
    require_tld: false,
  })
  returnTo?: string;
}

export class OAuthCallbackQuery {
  @IsString()
  code!: string;

  @IsString()
  state!: string;
}

export class RefreshRequest {
  @IsString()
  refreshToken!: string;
}

export class UpdateThemeRequest {
  @IsString()
  theme!: string;
}
