import * as path from 'path';
import mock from 'mock-fs';
import { spawn, exec } from 'child_process';
import { ESLint } from 'eslint';
import { jest } from '@jest/globals';
import analyzeProject, {
    ProjectMetrics,
    getAllSourceFiles,
    analyzeFile,
    analyzeDuplication,
    countDependencies,
    runNpmAudit,
    analyzeLinting,
    measureStartupTime,
    measureBuildTime,
    getFolderSize,
    getLatestVersion,
    analyzePackages
} from '../../src/utils/analyzer';

jest.mock('child_process', () => ({
    spawn: jest.fn(),
    exec: jest.fn()
}));

jest.mock('os', () => {
    const actualOs = jest.requireActual('os') as typeof import('os');

    return {
        ...actualOs,
        cpus: jest.fn(() => [{ model: 'Fake CPU', speed: 999 }]),
        hostname: jest.fn(() => 'fake-host'),
        machine: jest.fn(() => 'fake-machine')
    };
});

describe('analyzeProject module tests', () => {
    const exeC: any = null;
    const mockedExec = exec as unknown as jest.MockedFunction<typeof exeC>;

    afterEach(() => {
        mock.restore();
        jest.clearAllMocks();
    });

    describe('getAllSourceFiles', () => {
        it('should return all .js, .ts, .jsx, .tsx files recursively', async () => {
            mock({
                'test-src/dir1': {
                    'file1.js': '// some JS code',
                    'file2.txt': 'not included'
                },
                'test-src/dir2': {
                    'file3.ts': '// some TS code',
                    'file4.md': '# markdown'
                }
            });

            const result = await getAllSourceFiles('test-src');
            expect(result.sort()).toEqual([
                path.join('test-src', 'dir1', 'file1.js'),
                path.join('test-src', 'dir2', 'file3.ts')
            ]);
        });
    });

    describe('analyzeFile', () => {
        it('should return correct metrics for a single file', async () => {
            mock({
                'test-file.js': `
          // Single line comment
          /* block comment start
          block comment end */
          if (true) { console.log('Hello'); }
          async function test() {
            await something();
          }
        `
            });
            const metrics = await analyzeFile('test-file.js');
            expect(metrics.filePath).toBe('test-file.js');
            expect(metrics.lines).toBeGreaterThan(0);
            expect(metrics.commentLines).toBe(3);
            expect(metrics.cyclomaticComplexity).toBe(2);
            expect(metrics.asyncCount).toBe(2);
        });
    });

    describe('analyzeDuplication', () => {
        it('should detect duplicate lines among files', async () => {
            mock({
                'fileA.js': `
          console.log('Hello');
          console.log('World');
          console.log('World');
        `,
                'fileB.js': `
          console.log('Hello');
          console.log('Another line');
        `
            });

            const { duplicateLines, totalLines, duplicationPercentage } = await analyzeDuplication(['fileA.js', 'fileB.js']);
            expect(totalLines).toBe(5);
            expect(duplicateLines).toBe(1);
            expect(duplicationPercentage).toBe(20);
        });
    });

    describe('countDependencies', () => {
        it('should count deps and devDeps from package.json', async () => {
            mock({
                'package.json': JSON.stringify({
                    dependencies: { react: '^18.2.0', lodash: '^4.17.21' },
                    devDependencies: { jest: '^29.5.0' }
                })
            });

            const count = await countDependencies();
            expect(count).toBe(3);
        });
    });

    describe('runNpmAudit', () => {
        it('should parse npm audit --json output', async () => {
            mockedExec.mockImplementation((_: any, cb: any) => {
                cb(null, '{ "advisories": {} }', '');
            });

            const result = await runNpmAudit();
            expect(result).toEqual({ advisories: {} });
            expect(exec).toHaveBeenCalledWith('npm audit --json', expect.any(Function));
        });

        it('should return null on error', async () => {
            mockedExec.mockImplementation((_: any, cb: any) => {
                cb(new Error('some error'), '', '');
            });
            const result = await runNpmAudit();
            expect(result).toBeNull();
        });
    });

    describe('analyzeLinting', () => {
        it('should return total errors and warnings', async () => {
            const mockLintFiles = jest.spyOn(ESLint.prototype, 'lintFiles')
                .mockResolvedValueOnce([
                    { errorCount: 2, warningCount: 1 },
                    { errorCount: 0, warningCount: 2 },
                ] as any);

            const result = await analyzeLinting('src');
            expect(result.totalErrors).toBe(2);
            expect(result.totalWarnings).toBe(3);
            expect(mockLintFiles).toHaveBeenCalledWith('src/**/*.{js,ts,tsx,jsx}');
        });
    });

    describe('measureStartupTime', () => {
        it('should measure time from spawn to exit', async () => {
            const mockChild = {
                on: jest.fn((event, cb: any) => {
                    if (event === 'exit') {
                        setTimeout(() => cb(0), 10);
                    }
                }),
                kill: jest.fn()
            };

            (spawn as jest.Mock).mockReturnValue(mockChild);

            const time = await measureStartupTime('npm start');

            expect(time).toBeGreaterThan(0);
            expect(spawn).toHaveBeenCalledWith('npm start', [], { shell: true });
        });
    });

    describe('measureBuildTime', () => {
        it('should measure build time with npm run build', async () => {
            mockedExec.mockImplementation((_: any, cb: any) => {
                setTimeout(() => cb(null, 'Build done', ''), 5);
            });

            const time = await measureBuildTime();
            expect(time).toBeGreaterThan(0);
            expect(exec).toHaveBeenCalledWith('npm run build', expect.any(Function));
        });
    });

    describe('getFolderSize', () => {
        it('should calculate folder size recursively', async () => {
            mock({
                'folder': {
                    'file1.txt': 'Hello',
                    'subfolder': {
                        'file2.txt': 'World!!!'
                    }
                }
            });

            const size = await getFolderSize('folder');
            expect(size).toBe(13);
        });
    });

    describe('getLatestVersion', () => {
        it('should return the version from npm view', async () => {
            mockedExec.mockImplementation((_: any, cb: any) => {
                cb(null, '1.2.3\n', '');
            });
            const version = await getLatestVersion('some-package');
            expect(version).toBe('1.2.3');
        });
    });

    describe('analyzePackages', () => {
        it('should analyze installed packages', async () => {
            mock({
                'node_modules/react': {
                    'index.js': 'React code'
                },
                'node_modules/lodash': {
                    'lodash.js': 'Lodash code'
                },
                'package.json': JSON.stringify({
                    dependencies: { react: '^18.2.0' },
                    devDependencies: { lodash: '^4.17.21' }
                })
            });

            mockedExec.mockImplementation((cmd: string, cb: any) => {
                if (cmd.includes('react')) {
                    cb(null, '18.2.0\n', '');
                } else if (cmd.includes('lodash')) {
                    cb(null, '4.17.21\n', '');
                }
            });

            const result = await analyzePackages();
            expect(result).toHaveLength(2);

            const reactPkg = result.find(p => p.name === 'react');
            expect(reactPkg).toBeDefined();
            expect(reactPkg?.outdated).toBe(false);

            const lodashPkg = result.find(p => p.name === 'lodash');
            expect(lodashPkg).toBeDefined();
            expect(lodashPkg?.outdated).toBe(false);
        });
    });

    describe('analyzeProject (intégration)', () => {
        it('should return a ProjectMetrics object with main stats', async () => {
            mock({
                'src': {
                    'file1.js': '// a\nif(true) {}\n',
                    'file2.ts': '/* block comment */\nasync function x() { await y(); }',
                },
                'package.json': JSON.stringify({
                    dependencies: { react: '^18.2.0' },
                    devDependencies: { jest: '^29.5.0' }
                }),
                'node_modules/react': { 'index.js': 'React code' },
                'node_modules/jest': { 'index.js': 'Jest code' }
            });

            mockedExec.mockImplementation((cmd: string, cb: any) => {
                if (cmd.includes('npm audit')) {
                    cb(null, '{ "advisories": {} }', '');
                } else if (cmd.includes('npm view')) {
                    if (cmd.includes('react')) cb(null, '18.2.0\n', '');
                    if (cmd.includes('jest')) cb(null, '29.5.0\n', '');
                } else if (cmd.includes('npm run build')) {
                    cb(null, 'Build done', '');
                }
            });

            (spawn as jest.Mock).mockReturnValue({
                on: (event: string, callback: any) => {
                    if (event === 'exit') {
                        setTimeout(() => callback(0), 5);
                    }
                },
                kill: jest.fn()
            });

            jest.spyOn(ESLint.prototype, 'lintFiles').mockResolvedValueOnce([
                { errorCount: 0, warningCount: 1 },
            ] as any);

            const metrics = await analyzeProject('npm start') as ProjectMetrics;

            expect(metrics.totalFiles).toBe(2);
            expect(metrics.totalLines).toBe(3);
            expect(metrics.averageComplexity).toBe('3.00');
            expect(metrics.totalCommentLines).toBeGreaterThanOrEqual(2);
            expect(metrics.documentationCoverage).toBeDefined();
            expect(metrics.totalAsyncCount).toBe(2);
            expect(metrics.duplicatePercentage).toBeDefined();
            expect(metrics.dependenciesCount).toBe(2);
            expect(metrics.npmAuditResults).toEqual({ advisories: {} });
            expect(metrics.lint.totalWarnings).toBe(1);
            expect(metrics.startupTime).toBeGreaterThan(0);
            expect(metrics.buildTime).toBeGreaterThanOrEqual(0);
            expect(metrics.dependencies).toHaveLength(2);
            expect(metrics.sys).toBeDefined();
        });
    });

});
