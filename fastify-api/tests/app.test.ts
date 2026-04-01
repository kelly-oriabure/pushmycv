import { buildApp } from '../src/app.js';
import { FastifyInstance } from 'fastify';

describe('Fastify App', () => {
    let app: FastifyInstance;

    beforeEach(async () => {
        app = await buildApp();
    });

    afterEach(async () => {
        await app.close();
    });

    test('GET / returns welcome message', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/'
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.payload);
        expect(payload.message).toBe('Welcome to PushMyCV API');
        expect(payload.status).toBe('running');
    });

    test('GET /health returns healthy status', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/health'
        });

        expect(response.statusCode).toBe(200);
        const payload = JSON.parse(response.payload);
        expect(payload.status).toBe('healthy');
        expect(payload.timestamp).toBeDefined();
    });

    test('GET /nonexistent returns 404', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/nonexistent'
        });

        expect(response.statusCode).toBe(404);
    });
});
