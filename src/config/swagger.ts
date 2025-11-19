import { Express } from 'express';
import swaggerJsdoc, { OAS3Definition, OAS3Options } from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const getSwaggerDefinition = (): OAS3Definition => {
  const {
    SWAGGER_TITLE = 'Social Media API',
    SWAGGER_DESCRIPTION = 'API documentation for the social media backend.',
    SWAGGER_VERSION = '1.0.0',
    SWAGGER_CONTACT_NAME = 'API Support',
    SWAGGER_CONTACT_EMAIL = 'support@example.com',
    SWAGGER_BASE_URL = 'http://localhost:3000',
  } = process.env;

  return {
    openapi: '3.0.0',
    info: {
      title: SWAGGER_TITLE,
      version: SWAGGER_VERSION,
      description: SWAGGER_DESCRIPTION,
      contact: {
        name: SWAGGER_CONTACT_NAME,
        email: SWAGGER_CONTACT_EMAIL,
      },
    },
    servers: [
      {
        url: SWAGGER_BASE_URL,
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'connect.sid',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };
};

const createSwaggerOptions = (): OAS3Options => ({
  definition: getSwaggerDefinition(),
  apis: ['src/routes/**/*.ts', 'src/controllers/**/*.ts', 'src/models/**/*.ts'],
});

export const swaggerSpec = swaggerJsdoc(createSwaggerOptions());

export const setupSwagger = (app: Express, path = '/api-docs'): void => {
  app.use(path, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

