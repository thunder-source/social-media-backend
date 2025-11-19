import { Express } from 'express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Social Media API',
    version: '1.0.0',
    description: 'API documentation for the social media backend.',
  },
  servers: [
    {
      url: process.env.API_BASE_URL ?? 'http://localhost:5000/api',
      description: 'Default environment',
    },
  ],
};

export const setupSwagger = (_app: Express): void => {
  // Placeholder for swagger-ui setup.
  // Add swagger-ui-express integration here when ready.
};

