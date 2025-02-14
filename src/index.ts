import analyzeProject, {ProjectMetrics} from "./utils/analyzer.ts";
import yoctoSpinner from 'yocto-spinner';
import chalk from "chalk";
import fs from 'fs';
import path from 'path';
import express from 'express';
import {select} from '@inquirer/prompts';
import cors from 'cors';
import expressWs from 'express-ws';
import os from "os-utils";
import { WebSocket } from 'ws';

const packageJsonPath = path.join(process.cwd(), 'package.json');
if(!fs.existsSync(packageJsonPath)){
	throw 'No package.json found!';
}

let data: null | ProjectMetrics = null;
const app = express() as unknown as expressWs.Application;
expressWs(app);
const port = 2002;

app.use(cors({ origin: 'http://localhost:3000' }));

app.get('/data', async (_, res) => {
	res.send({data});
});

app.ws('/websocket', (ws: WebSocket) => {
	setInterval(() => {
		os.cpuUsage((v: number) => {
			ws.send(JSON.stringify({
				cpuUsage: (v*100).toFixed(1),
				memoryUsage: ((1-parseFloat(os.freememPercentage().toFixed(2)))*(os.totalmem() / 1024)).toFixed(1)
			}));
		});
	}, 100)
});

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
	try {
		data = await analyzeProject(spinner, answer);
		spinner.success("Success");
		app.listen(port, () => {
			console.log(`Serveur en ligne sur http://localhost:${port}`);
		});
	} catch(error) {
		spinner.error("An error occurred");
		console.log(chalk.red(error));
	}
})()
