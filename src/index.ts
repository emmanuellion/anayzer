import analyzeProject, {ProjectMetrics} from "./utils/analyzer.ts";
import yoctoSpinner from 'yocto-spinner';
import chalk from "chalk";
import fs from 'fs';
import path from 'path';
import express from 'express';
import {select} from '@inquirer/prompts';
import cors from 'cors';

const packageJsonPath = path.join(process.cwd(), 'package.json');
if(!fs.existsSync(packageJsonPath)){
	throw 'No package.json found!';
}

let data: null | ProjectMetrics = null;

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
	const spinner = yoctoSpinner({
		text: "Beginning analyze ...",
		color: "magenta",
	}).start();
	try {
		data = await analyzeProject(spinner, answer);
		spinner.success("Success");
	} catch(error) {
		spinner.error("An error occurred");
		console.log(chalk.red(error));
	}
})()




const app = express();
const port = 2002;
const START_SERVER = true;

app.use(cors({ origin: 'http://localhost:3000' }));

app.get('/data', async (_, res) => {
	res.send({data});
});

if(START_SERVER)
	app.listen(port, () => {
	console.log(`Serveur en ligne sur http://localhost:${port}`);
});
