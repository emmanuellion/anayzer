import { promises as fs } from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

export async function countDirectoriesInSrc(): Promise<number> {
    const entries = await fs.readdir(SRC_DIR, { withFileTypes: true });
    return entries.filter(entry => entry.isDirectory()).length;
}

export async function countFilesInSrc(): Promise<number> {
    const entries = await fs.readdir(SRC_DIR, { withFileTypes: true });
    return entries.filter(entry => entry.isFile()).length;
}

async function countLinesInFile(filePath: string): Promise<number> {
    const content = await fs.readFile(filePath, 'utf-8');
    return content.split('\n').length;
}

export async function countLinesInSourceFiles(): Promise<Record<string, number>> {
    const result: Record<string, number> = {};

    async function traverseDirectory(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await traverseDirectory(fullPath);
            } else if (entry.isFile()) {
                const ext: string = path.extname(entry.name).toLowerCase();
                if (['.ts', '.tsx', '.js', '.jsx'].join('').includes(ext)) {
                    const relativePath = path.relative(SRC_DIR, fullPath);
                    result[relativePath] = await countLinesInFile(fullPath);
                }
            }
        }
    }

    await traverseDirectory(SRC_DIR);
    return result;
}
