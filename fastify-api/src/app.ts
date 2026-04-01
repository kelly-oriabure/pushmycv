import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import authPlugin from './plugins/auth.js';
import { apiRoutes } from './routes/api.js';
import { queueRoutes } from './routes/queue.js';
import { authRoutes } from './routes/auth.js';
import { otpAuthRoutes } from './routes/otp-auth.js';
import { profileRoutes } from './routes/profiles.js';
import { jobRoutes } from './routes/jobs.js';
import { resumeRoutes } from './routes/resumes.js';
import { applicationRoutes } from './routes/applications.js';
import { experienceRoutes } from './routes/experiences.js';

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
    const app = Fastify({
        logger: true,
        ...opts
    });

    await app.register(swagger, {
        openapi: {
            info: {
                title: 'PushMyCV API',
                description: 'API documentation for PushMyCV - CV/Resume management application with job queue system',
                version: '1.0.0'
            },
            servers: [
                {
                    url: 'http://localhost:3000',
                    description: 'Development server'
                }
            ],
            tags: [
                { name: 'general', description: 'General endpoints' },
                { name: 'health', description: 'Health check endpoints' },
                { name: 'auth', description: 'Authentication endpoints (password-based)' },
                { name: 'otp-auth', description: 'OTP Authentication (email verification flow)' },
                { name: 'profiles', description: 'User profile management' },
                { name: 'resumes', description: 'Resume/CV management' },
                { name: 'experiences', description: 'Work experience management' },
                { name: 'jobs', description: 'Job listings and search' },
                { name: 'applications', description: 'Job application tracking' },
                { name: 'queue', description: 'Background job queue management' },
                { name: 'workflows', description: 'Workflow status and management' }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT'
                    }
                }
            }
        }
    });

    // Register authentication plugin
    await app.register(authPlugin);

    // Register authentication routes
    await app.register(authRoutes, { prefix: '/auth' });

    // Register OTP authentication routes
    await app.register(otpAuthRoutes, { prefix: '/auth/otp' });

    // Register API routes
    await app.register(apiRoutes, { prefix: '/api' });

    // Register queue management routes
    await app.register(queueRoutes, { prefix: '/queue' });

    // Register profile routes
    await app.register(profileRoutes, { prefix: '/api' });

    // Register job routes
    await app.register(jobRoutes, { prefix: '/api' });

    // Register resume routes
    await app.register(resumeRoutes, { prefix: '/api' });

    // Register application routes
    await app.register(applicationRoutes, { prefix: '/api' });

    // Register experience routes
    await app.register(experienceRoutes, { prefix: '/api' });

    // Register Swagger UI (must be after all routes)
    await app.register(swaggerUI, {
        routePrefix: '/docs',
        uiConfig: {
            docExpansion: 'list',
            deepLinking: true
        },
        staticCSP: true
    });

    app.get('/', {
        schema: {
            description: 'Welcome endpoint',
            tags: ['general'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        status: { type: 'string' },
                        version: { type: 'string' }
                    }
                }
            }
        }
    }, async (_request, _reply) => {
        return {
            message: 'Welcome to PushMyCV API',
            status: 'running',
            version: '1.0.0'
        };
    });

    app.get('/health', {
        schema: {
            description: 'Health check endpoint',
            tags: ['health'],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        timestamp: { type: 'string' }
                    }
                }
            }
        }
    }, async (_request, _reply) => {
        return {
            status: 'healthy',
            timestamp: new Date().toISOString()
        };
    });

    return app;
}
