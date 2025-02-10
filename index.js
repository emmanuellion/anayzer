const fs = require('fs');
const path = require('path');
const express = require('express');
const { exec } = require('child_process');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const app = express();
const port = 2002;

// Fonction pour obtenir la taille d'un dossier
function getFolderSize(folderPath) {
	return new Promise((resolve, reject) => {
		let totalSize = 0;

		fs.readdir(folderPath, { withFileTypes: true }, (err, files) => {
			if (err) return reject(err);

			let pending = files.length;
			if (!pending) return resolve(totalSize);

			files.forEach(file => {
				const filePath = path.join(folderPath, file.name);

				fs.stat(filePath, (err, stats) => {
					if (err) return reject(err);

					if (stats.isDirectory()) {
						getFolderSize(filePath).then(size => {
							totalSize += size;
							if (!--pending) resolve(totalSize);
						}).catch(reject);
					} else {
						totalSize += stats.size;
						if (!--pending) resolve(totalSize);
					}
				});
			});
		});
	});
}

async function getLatestVersion(pkg) {
	return new Promise((resolve, reject) => {
		exec(`npm view ${pkg} version`, (err, stdout) => {
			if (err) return resolve(null);
			resolve(stdout.trim());
		});
	});
}

async function listPackages() {
	const nodeModulesPath = path.join(__dirname, 'node_modules');
	const packageJsonPath = path.join(__dirname, 'package.json');

	try {
		const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));
		const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

		let packageData = [];

		for (const pkg of Object.keys(dependencies)) {
			const pkgPath = path.join(nodeModulesPath, pkg);
			if (fs.existsSync(pkgPath)) {
				const size = await getFolderSize(pkgPath);
				const installedVersion = dependencies[pkg];
				const latestVersion = await getLatestVersion(pkg);
				const outdated = latestVersion && installedVersion.replaceAll('^', '') !== latestVersion;
				packageData.push({ name: pkg, size, installedVersion, latestVersion, outdated });
			}
		}

		packageData.sort((a, b) => b.size - a.size);

		return packageData;
	} catch (error) {
		console.error("Erreur lors de la lecture des dépendances du package.json ou du dossier node_modules:", error);
		return [];
	}
}

const width = 800;
const height = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

app.get('/chart', async (req, res) => {
	const packageData = await listPackages();

	const chartConfig = {
		type: 'bar',
		data: {
			labels: packageData.map(pkg => pkg.name),
			datasets: [{
				label: 'Taille des packages (MB)',
				data: packageData.map(pkg => pkg.size / 1024 / 1024),
				backgroundColor: packageData.map(pkg => pkg.outdated ? 'rgba(255, 99, 132, 0.2)' : 'rgba(75, 192, 192, 0.2)'),
				borderColor: packageData.map(pkg => pkg.outdated ? 'rgba(255, 99, 132, 1)' : 'rgba(75, 192, 192, 1)'),
				borderWidth: 1
			}]
		},
		options: {
			responsive: false,
			scales: {
				y: {
					beginAtZero: true
				}
			}
		}
	};

	const image = await chartJSNodeCanvas.renderToBuffer(chartConfig);
	res.set('Content-Type', 'image/png');
	res.send(image);
});

app.get('/packages', async (req, res) => {
	const packageData = await listPackages();
	res.json(packageData);
});

app.listen(port, () => {
	console.log(`Serveur en ligne sur http://localhost:${port}`);
});
