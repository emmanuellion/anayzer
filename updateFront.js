import { exec } from 'child_process';

exec('cp -r frontend/out ./dist/public', (error, stdout, stderr) => {
	if (error) {
		console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
		return;
	}

	if (stderr) {
		console.error(`Erreur standard: ${stderr}`);
		return;
	}

	exec('cp -r frontend/out ./src/public', (error, stdout, stderr) => {
		if (error) {
			console.error(`Erreur lors de l'exécution de la commande: ${error.message}`);
			return;
		}

		if (stderr) {
			console.error(`Erreur standard: ${stderr}`);
			return;
		}

		console.log("Copy completed");
	});
});
