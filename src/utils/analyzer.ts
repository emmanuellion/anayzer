import fs from 'fs/promises';
import path from 'path';
import {exec, spawn} from 'child_process';
import util from 'util';
import {ESLint} from 'eslint';
import os from 'node:os';
import chalk from "chalk";
import yoctoSpinner from "yocto-spinner";

const execPromise = util.promisify(exec);

interface FileMetrics {
    filePath: string;
    lines: number;
    cyclomaticComplexity: number;
    commentLines: number;
    asyncCount: number;
}

export interface ProjectMetrics {
    totalFiles: number;
    totalLines: number;
    averageComplexity: string;
    totalCommentLines: number;
    documentationCoverage: string;
    totalAsyncCount: number;
    duplicatePercentage: string;
    dependenciesCount: number;
    npmAuditResults: any;
    lint: any;
    startupTime: number;
    buildTime: number;
    dependencies: any;
    sys: any;
}

async function getAllSourceFiles(dir: string): Promise<string[]> {
    let results: string[] = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            const nestedFiles = await getAllSourceFiles(filePath);
            results = results.concat(nestedFiles);
        } else if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.jsx') || file.endsWith('.tsx')) {
            results.push(filePath);
        }
    }
    return results;
}

async function analyzeFile(filePath: string): Promise<FileMetrics> {
    const content = await fs.readFile(filePath, 'utf-8');
    const linesArray = content.split(/\r?\n/);
    const totalLines = linesArray.length;

    let commentLines = 0;
    let inBlockComment = false;
    for (const line of linesArray) {
        const trimmed = line.trim();
        if (inBlockComment) {
            commentLines++;
            if (trimmed.includes('*/')) {
                inBlockComment = false;
            }
        } else if (trimmed.startsWith('//')) {
            commentLines++;
        } else if (trimmed.startsWith('/*')) {
            commentLines++;
            if (!trimmed.includes('*/')) {
                inBlockComment = true;
            }
        }
    }

    const cleanedContent = content
        .replace(/\/\/.*$/gm, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(["'`])(?:(?=(\\?))\2.)*?\1/g, '');

    let complexity = 1;
    const controlStatements = ['if', 'for', 'while', 'case', 'catch', '&&', '\\|\\|'];
    for (const keyword of controlStatements) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = cleanedContent.match(regex);
        if (matches) {
            complexity += matches.length;
        }
    }

    const asyncMatches = cleanedContent.match(/\basync\b/g);
    const awaitMatches = cleanedContent.match(/\bawait\b/g);
    const asyncCount = (asyncMatches ? asyncMatches.length : 0) + (awaitMatches ? awaitMatches.length : 0);

    return {
        filePath,
        lines: totalLines,
        cyclomaticComplexity: complexity,
        commentLines,
        asyncCount,
    };
}

async function analyzeDuplication(files: string[]): Promise<{ duplicateLines: number; totalLines: number; duplicationPercentage: number }> {
    const lineCounts = new Map<string, number>();
    let totalLines = 0;

    for (const filePath of files) {
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line !== '');
        totalLines += lines.length;
        for (const line of lines) {
            const count = lineCounts.get(line) || 0;
            lineCounts.set(line, count + 1);
        }
    }

    let duplicateLines = 0;
    for (const count of lineCounts.values()) {
        if (count > 1) {
            duplicateLines += count - 1;
        }
    }

    const duplicationPercentage = totalLines > 0 ? (duplicateLines / totalLines) * 100 : 0;
    return { duplicateLines, totalLines, duplicationPercentage };
}

async function countDependencies(): Promise<number> {
    try {
        const packageJsonContent = await fs.readFile('package.json', 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        const dependenciesCount = packageJson.dependencies ? Object.keys(packageJson.dependencies).length : 0;
        const devDependenciesCount = packageJson.devDependencies ? Object.keys(packageJson.devDependencies).length : 0;
        return dependenciesCount + devDependenciesCount;
    } catch (error) {
        console.error('Erreur lors de la lecture de package.json', error);
        return 0;
    }
}

async function runNpmAudit(): Promise<any> {
    try {
        const { stdout } = await execPromise('npm audit --json');
        return JSON.parse(stdout);
    } catch (error: any) {
        console.error("Erreur lors de l'exécution de 'npm audit'", error);
        return null;
    }
}

async function analyzeLinting(base: string): Promise<{ totalErrors: number; totalWarnings: number; results: any[] }> {
    const eslint = new ESLint();
    const results = await eslint.lintFiles(base+"/**/*.{js,ts,tsx,jsx}");

    let totalErrors = 0;
    let totalWarnings = 0;
    for (const result of results) {
        totalErrors += result.errorCount;
        totalWarnings += result.warningCount;
    }

    return { totalErrors, totalWarnings, results };
}

async function measureStartupTime(command: string): Promise<number> {
    return new Promise<number>((resolve, reject) => {
        const startTime = Date.now();
        const child = spawn(command, [], { shell: true });

        child.on('error', (err) => {
            reject(err);
        });

        child.on('exit', () => {
            const elapsed = Date.now() - startTime;
            child.kill();
            resolve(elapsed);
        });
    });
}

async function measureBuildTime(): Promise<number> {
    const startTime = Date.now();
    try {
        await execPromise('npm run build');
    } catch (error) {
        console.error("Erreur lors du build :", error);
    }
    return Date.now() - startTime;
}

async function getFolderSize(folderPath: string): Promise<number> {
    const files = await fs.readdir(folderPath, { withFileTypes: true });
    const sizes = await Promise.all(files.map(async (file) => {
        const filePath = path.join(folderPath, file.name);
        if (file.isDirectory()) {
            return await getFolderSize(filePath);
        } else {
            const stats = await fs.stat(filePath);
            return stats.size;
        }
    })
    );
    return sizes.reduce((sum, size) => sum + size, 0);
}

async function getLatestVersion(pkg: string) {
    return new Promise((resolve) => {
        exec(`npm view ${pkg} version`, (err, stdout) => {
            if (err) return resolve(null);
            resolve(stdout.trim());
        });
    });
}

async function analyzePackages() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const packageJsonPath = path.join(process.cwd(), 'package.json');

    try {
        await fs.stat(nodeModulesPath);
    } catch (_) {
        throw new Error("No node_modules found!");
    }

    try {
        await fs.stat(packageJsonPath);
    } catch (_) {
        throw new Error("No package.json found!");
    }

    try {
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);

        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        const packageData = [];

        for (const pkg of Object.keys(dependencies)) {
            const pkgPath = path.join(nodeModulesPath, pkg);
            try {
                await fs.stat(pkgPath);

                const size = await getFolderSize(pkgPath) as number;
                const installedVersion = dependencies[pkg];
                const latestVersion = await getLatestVersion(pkg);
                const outdated = latestVersion && installedVersion.replace('^', '') !== latestVersion;
                packageData.push({ name: pkg, size, installedVersion, latestVersion, outdated });
            } catch (_) { /* empty */ }
        }

        packageData.sort((a, b) => b.size - a.size);
        return packageData;
    } catch (_) {
        throw new Error("Erreur lors de la lecture des dépendances du package.json ou du dossier node_modules:");
    }
}

function startStep(text: string){
    const spinner = yoctoSpinner({
        text: text,
        color: "magenta",
        spinner: {
            "interval": 80,
            "frames": [
                "⠋",
                "⠙",
                "⠹",
                "⠸",
                "⠼",
                "⠴",
                "⠦",
                "⠧",
                "⠇",
                "⠏"
            ]
        }
    }).start();
    return spinner;
}

export default async function analyzeProject(command: string | null): Promise<ProjectMetrics> {
    const base = path.join(process.cwd(), 'src');
    let spinner = startStep("Reading source files");
    const files = await getAllSourceFiles(base);
    spinner.success();
    spinner = startStep("Getting metrics from source files");
    const fileMetricsArray = await Promise.all(files.map(analyzeFile));

    const totalFiles = fileMetricsArray.length;
    const totalLines = fileMetricsArray.reduce((acc, fm) => acc + fm.lines, 0);
    const totalComplexity = fileMetricsArray.reduce((acc, fm) => acc + fm.cyclomaticComplexity, 0);
    const totalCommentLines = fileMetricsArray.reduce((acc, fm) => acc + fm.commentLines, 0);
    const totalAsyncCount = fileMetricsArray.reduce((acc, fm) => acc + fm.asyncCount, 0);

    const averageComplexity = totalFiles > 0 ? totalComplexity / totalFiles : 0;
    const documentationCoverage = totalLines > 0 ? (totalCommentLines / totalLines) * 100 : 0;
    spinner.success();

    spinner = startStep("Analyzing duplication");
    const duplication = await analyzeDuplication(files);
    spinner.success();
    spinner = startStep("Analyzing dependencies");
    const dependenciesCount = await countDependencies();
    spinner.success();
    spinner = startStep("npm audit");
    const npmAuditResults = await runNpmAudit();
    spinner.success();
    spinner = startStep("Retrieving linting data");
    const lint = await analyzeLinting(base);
    spinner.success();
    let startupTime = 0, buildTime = 0;
    if(command){
        spinner = startStep("Measuring startup time");
        startupTime = await measureStartupTime(command);
        spinner.success();
        spinner = startStep("Measuring build time");
        buildTime = await measureBuildTime();
        spinner.success();
    }
    spinner = startStep("Analyzing packages");
    const dependencies = await analyzePackages();
    spinner.success();

    return {
        totalFiles,
        totalLines,
        averageComplexity: averageComplexity.toFixed(2),
        totalCommentLines,
        documentationCoverage: documentationCoverage.toFixed(2),
        totalAsyncCount,
        duplicatePercentage: duplication.duplicationPercentage.toFixed(2),
        dependenciesCount,
        npmAuditResults,
        lint,
        startupTime,
        buildTime,
        dependencies,
        sys: {
            arch: os.arch(),
            cpus: os.cpus(),
            hostname: os.hostname(),
            system: os.machine(),
            platform: os.platform(),
            type: os.type()
        }
    };
}
