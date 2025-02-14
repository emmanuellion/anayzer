#!/usr/bin/env node

import analyzeProject, { ProjectMetrics } from "./utils/analyzer.ts";
import chalk from "chalk";
import fs from 'fs';
import path from 'path';
import express from 'express';
import {select, confirm} from '@inquirer/prompts';
import cors from 'cors';
import expressWs from 'express-ws';
import os from "os-utils";
import { WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const packageJsonPath = path.join(process.cwd(), 'package.json');
if(!fs.existsSync(packageJsonPath)){
	throw 'No package.json found!';
}

let data: null | ProjectMetrics = null;
const app = express() as unknown as expressWs.Application;
expressWs(app);
const port = 2002;

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, 'public/index.html'));
});

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
	const measuring = await confirm({ message: 'Do you want to measure start/build command ?', default: false });
	let answer = null;
	if(measuring)
		answer = await select({
			message: 'Chose the command to mesure the startup time',
			choices:
				Object.keys(packageJson.scripts).map((el) => {return {
					name: `npm run ${el}`,
					value: `npm run ${el}`
				}})
		});
	try {
		data = await analyzeProject(answer);
		app.listen(port, () => {
			console.log(chalk.green(`Serveur en ligne sur http://localhost:${port}`));
		});
	} catch(error) {
		console.log(chalk.red(error));
	}
})()
