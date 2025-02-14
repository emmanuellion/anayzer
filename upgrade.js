import fs from 'fs';
import { exec } from 'child_process';

const filePackagePath = './package.json';
const filePackageTest = "./frontend/package.json";

exec('npm run build', (error, stdout, stderr) => {
	if (error) {
		console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
		return;
	}

	fs.readFile(filePackagePath, 'utf8', (err, data) => {
		const jsonData = JSON.parse(data);

		let work = jsonData.version;
		let NEW_VERSION =  work.split(".").slice(0, 2).join('.') + '.' + (parseInt(work.split(".")[2]) + 1);
		jsonData.version = NEW_VERSION;

		console.log(`NEW VERSION IS : ${jsonData.version} !!!`);

		fs.writeFile(filePackagePath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
			console.log("Le fichier package a été mis à jour avec succès !");

			exec('npm publish', (error, stdout, stderr) => {
				if (error) {
					console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
					return;
				}

				if (stderr) {
					console.error(`Erreur standard: ${stderr}`);
					return;
				}

				fs.readFile(filePackageTest, 'utf8', (err, data) => {
					const jsonTestData = JSON.parse(data);

					jsonTestData.version = '^'+NEW_VERSION;

					fs.writeFile(filePackageTest, JSON.stringify(jsonTestData, null, 2), 'utf8', (err) => {
						console.log("Le fichier package de test a été mis à jour avec succès !");
					});
				});
			});
		});
	});
});


