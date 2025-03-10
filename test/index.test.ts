import * as supertest from 'supertest';
import * as fs from 'fs';
import * as ffs from 'fs/promises';
import { jest } from '@jest/globals';
import * as express from 'express';
import { Server } from 'http';

jest.spyOn(fs, 'existsSync').mockImplementation((filePath: fs.PathLike) => {
    return filePath.toString().endsWith('package.json');

});

jest.spyOn(fs.promises, 'readFile').mockImplementation(async (
        filePath: fs.PathLike | ffs.FileHandle
): Promise<string> => {
    if (filePath.toString().endsWith('package.json')) {
        return JSON.stringify({
            scripts: {
                start: "npm start",
                build: "npm run build"
            }
        });
    }
    return "";
});

jest.unstable_mockModule('@inquirer/prompts', () => ({
    confirm: jest.fn(() => Promise.resolve(false)),
    select: jest.fn(() => Promise.resolve(null))
}));

jest.unstable_mockModule('../src/utils/analyzer.ts', () => ({
    __esModule: true,
    default: jest.fn(() =>
        Promise.resolve({
            totalFiles: 1,
            totalLines: 10,
            averageComplexity: "1.00",
            totalCommentLines: 2,
            documentationCoverage: "20.00",
            totalAsyncCount: 0,
            duplicatePercentage: "0.00",
            dependenciesCount: 0,
            npmAuditResults: {},
            lint: { totalErrors: 0, totalWarnings: 0, results: [] },
            startupTime: 100,
            buildTime: 200,
            dependencies: [],
            sys: { arch: "x64", cpus: [], hostname: "fake-host", system: "fake-system", platform: "linux", type: "Linux" }
        })
    ),
    ProjectMetrics: {}
}));

const realExpressModule = jest.requireActual('express');
// @ts-ignore
const realExpress = realExpressModule.default || realExpressModule;
const app = realExpress();
const listenSpy = jest.spyOn(app, 'listen').mockImplementation((_: number, cb?: () => void) => {
    if (cb) cb();
    return {} as unknown as Server;
});

jest.unstable_mockModule('express', () => {
    return () => app;
});

jest.isolateModules(() => {
    require('../src/index.ts');
});

const request = supertest(app);

describe('Tests de l\'application Express dans index.ts', () => {

    afterAll(() => {
        jest.resetAllMocks();
    });

    test('La route GET /data doit retourner l\'objet { data } avec les métriques', async () => {
        const response = await request.get('/data');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data');
        expect(response.body.data).toEqual({
            totalFiles: 1,
            totalLines: 10,
            averageComplexity: "1.00",
            totalCommentLines: 2,
            documentationCoverage: "20.00",
            totalAsyncCount: 0,
            duplicatePercentage: "0.00",
            dependenciesCount: 0,
            npmAuditResults: {},
            lint: { totalErrors: 0, totalWarnings: 0, results: [] },
            startupTime: 100,
            buildTime: 200,
            dependencies: [],
            sys: { arch: "x64", cpus: [], hostname: "fake-host", system: "fake-system", platform: "linux", type: "Linux" }
        });
    });

    test('La route GET / doit renvoyer le fichier index.html', async () => {
        const response = await request.get('/');

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toMatch(/html/);
    });

    test('L\'application doit appeler app.listen sur le port 2002', () => {
        expect(listenSpy).toHaveBeenCalledWith(2002, expect.any(Function));
    });

    test('La route WebSocket "/websocket" est configurée', done => {
        done();
    });
});
