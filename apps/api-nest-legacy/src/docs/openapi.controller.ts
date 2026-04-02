import { Controller, Get, Header } from '@nestjs/common';

const OPEN_API_SPEC = {
  openapi: '3.0.3',
  info: {
    title: 'Habbit Runner API',
    version: '1.0.0',
    description: 'Offline-first habit tracker backend API'
  },
  servers: [{ url: '/' }],
  tags: [
    { name: 'Auth' },
    { name: 'Sync' },
    { name: 'Metrics' }
  ],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Issue access and refresh tokens',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' }
            }
          }
        },
        responses: {
          '200': {
            description: 'Token pair'
          }
        }
      }
    },
    '/auth/google/start': {
      get: {
        tags: ['Auth'],
        summary: 'Start Google OAuth flow',
        parameters: [
          {
            name: 'returnTo',
            in: 'query',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '302': { description: 'OAuth provider redirect' }
        }
      }
    },
    '/auth/google/callback': {
      get: {
        tags: ['Auth'],
        summary: 'Handle Google OAuth callback',
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          },
          {
            name: 'state',
            in: 'query',
            required: true,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '302': { description: 'Frontend redirect with tokens' }
        }
      }
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'Refreshed token pair' }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke refresh token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'Logout confirmation' }
        }
      }
    },
    '/auth/theme': {
      get: {
        tags: ['Auth'],
        summary: 'Read current user theme',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Theme id' }
        }
      },
      put: {
        tags: ['Auth'],
        summary: 'Update current user theme',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateThemeRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'Updated theme id' }
        }
      }
    },
    '/auth/preferences': {
      get: {
        tags: ['Auth'],
        summary: 'Read current user preferences',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Theme and timezone preferences' }
        }
      },
      put: {
        tags: ['Auth'],
        summary: 'Update current user preferences',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdatePreferencesRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'Updated preferences' }
        }
      }
    },
    '/sync/pull': {
      get: {
        tags: ['Sync'],
        summary: 'Pull sync changes',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'since',
            in: 'query',
            required: false,
            schema: { type: 'string' }
          }
        ],
        responses: {
          '200': {
            description: 'Sync payload',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PullResponse' }
              }
            }
          }
        }
      }
    },
    '/sync/push': {
      post: {
        tags: ['Sync'],
        summary: 'Push outbox operations',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PushRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'Push apply status' }
        }
      }
    },
    '/metrics': {
      get: {
        tags: ['Metrics'],
        summary: 'Read in-memory counters',
        responses: {
          '200': { description: 'Metrics snapshot' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' }
        }
      },
      UpdateThemeRequest: {
        type: 'object',
        required: ['theme'],
        properties: {
          theme: { type: 'string' }
        }
      },
      UpdatePreferencesRequest: {
        type: 'object',
        required: ['theme'],
        properties: {
          theme: { type: 'string' },
          timezone: { type: 'string' }
        }
      },
      PushRequest: {
        type: 'object',
        required: ['ops'],
        properties: {
          ops: {
            type: 'array',
            items: {
              type: 'object',
              required: ['id', 'entity', 'type', 'payload', 'clientTime'],
              properties: {
                id: { type: 'string' },
                entity: { type: 'string' },
                type: { type: 'string' },
                payload: { type: 'object', additionalProperties: true },
                clientTime: { type: 'string' }
              }
            }
          }
        }
      },
      PullResponse: {
        type: 'object',
        properties: {
          serverTime: { type: 'string' },
          nextCursor: { type: 'string' },
          habits: { type: 'array', items: { type: 'object', additionalProperties: true } },
          checkins: { type: 'array', items: { type: 'object', additionalProperties: true } },
          tombstones: { type: 'array', items: { type: 'object', additionalProperties: true } }
        }
      }
    }
  }
};

@Controller('docs')
export class OpenApiController {
  @Get('openapi.json')
  getOpenApiJson() {
    return OPEN_API_SPEC;
  }

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getSwaggerUi() {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Habbit Runner API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.SwaggerUIBundle({
          url: '/docs/openapi.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [window.SwaggerUIBundle.presets.apis]
        });
      };
    </script>
  </body>
</html>`;
  }
}
