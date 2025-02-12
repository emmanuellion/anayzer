import analyzeProject from "./utils/analyzer.ts";
import yoctoSpinner from 'yocto-spinner';
import chalk from "chalk";
import fs from 'fs';
import path from 'path';
// import express from 'express';
// import { exec } from 'child_process';
// import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import {input, select} from '@inquirer/prompts';

const packageJsonPath = path.join(process.cwd(), 'package.json');
if(!fs.existsSync(packageJsonPath)){
	throw 'No package.json found!';
}

(async() => {
	const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
	const answer = await select({
		message: 'Chose the command to mesure the startup time',
		choices:
			Object.keys(packageJson.scripts).map((el) => {return {
				name: `npm run ${el}`,
				value: `npm run ${el}`
			}})
	});
	console.log(answer);
	let spinner = yoctoSpinner({
		text: "Beginning analyze ...",
		color: "magenta",
	}).start();
	try {
		const result = await analyzeProject(spinner, answer);
		spinner.success("Success");
		console.log(chalk.green(JSON.stringify(result)));
	} catch(error) {
		spinner.error("An error occurred");
		console.log(chalk.red(error));
	}
})()




// const app = express();
// const port = 2002;
// const START_SERVER = false;
//
// function getFolderSize(folderPath: string) {
// 	return new Promise((resolve, reject) => {
// 		let totalSize = 0;
//
// 		fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
// 			if (err) return reject(err);
//
// 			let pending = files.length;
// 			if (!pending) return resolve(totalSize);
//
// 			files.forEach(file => {
// 				const filePath = path.join(folderPath, file.name);
//
// 				fs.stat(filePath, (err, stats: {size: number; isDirectory: () => boolean;}) => {
// 					if (err) return reject(err);
//
// 					if (stats.isDirectory()) {
// 						getFolderSize(filePath).then((size: any) => {
// 							totalSize += size;
// 							if (!--pending) resolve(totalSize);
// 						}).catch(reject);
// 					} else {
// 						totalSize += stats.size;
// 						if (!--pending) resolve(totalSize);
// 					}
// 				});
// 			});
// 		});
// 	});
// }
//
// async function getLatestVersion(pkg: string) {
// 	return new Promise((resolve) => {
// 		exec(`npm view ${pkg} version`, (err, stdout) => {
// 			if (err) return resolve(null);
// 			resolve(stdout.trim());
// 		});
// 	});
// }
//
// async function listPackages() {
// 	const nodeModulesPath = path.join(process.cwd(), 'node_modules');
// 	if(!fs.existsSync(nodeModulesPath)){
// 		throw "No node_modules found!";
// 	}
//
// 	try {
// 		const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
//		const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

// 		const packageData = [];
// 		for (const pkg of Object.keys(dependencies)) {
// 			const pkgPath = path.join(nodeModulesPath, pkg);
// 			if (fs.existsSync(pkgPath)) {
// 				const size = await getFolderSize(pkgPath);
// 				const installedVersion = dependencies[pkg];
// 				const latestVersion = await getLatestVersion(pkg);
// 				const outdated = latestVersion && installedVersion.replace('^', '') !== latestVersion;
// 				packageData.push({ name: pkg, size: (size as number), installedVersion, latestVersion, outdated });
// 			}
// 		}
// 		packageData.sort((a, b) => b.size - a.size);
// 		return packageData;
// 	} catch (error) {
// 		throw "Erreur lors de la lecture des dépendances du package.json ou du dossier node_modules:";
// 	}
// }

// const packageData: any[] = [];

// const width = 800;
// const height = 400;
// const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });
//
// app.get('/chart', async (req, res) => {
//
// 	const chartConfig: any = {
// 		type: 'bar',
// 		data: {
// 			labels: packageData.map(pkg => pkg.name),
// 			datasets: [{
// 				label: 'Taille des packages (MB)',
// 				data: packageData.map(pkg => pkg.size / 1024 / 1024),
// 				backgroundColor: packageData.map(pkg => pkg.outdated ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)'),
// 				borderColor: packageData.map(pkg => pkg.outdated ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'),
// 				borderWidth: 1
// 			}]
// 		},
// 		options: {
// 			responsive: false,
// 			scales: {
// 				y: {
// 					beginAtZero: true
// 				}
// 			}
// 		}
// 	};
//
// 	const image = await chartJSNodeCanvas.renderToBuffer(chartConfig);
// 	res.set('Content-Type', 'image/png');
// 	res.send(image);
// });
//
// app.get('/packages', async (req, res) => {
// 	res.json(packageData);
// });
//
// if(START_SERVER)
// 	app.listen(port, () => {
// 	console.log(`Serveur en ligne sur http://localhost:${port}`);
// });
