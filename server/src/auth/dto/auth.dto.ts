export class LoginRequest {
  email!: string;
}

export class OAuthStartQuery {
  returnTo?: string;
}

export class OAuthCallbackQuery {
  code!: string;
  state!: string;
}

export class RefreshRequest {
  refreshToken!: string;
}

export class UpdateThemeRequest {
  theme!: string;
}
