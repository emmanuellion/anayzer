'use client';

import {useEffect, useRef, useState} from "react";
import {ColorType, createChart, LineSeries, LineStyle} from "lightweight-charts";

interface ChartProps {
	webSocket: string;
}

export default function Chart({webSocket}: ChartProps){
	const [cpuVals, setCpuVals] = useState<any[]>([{time: Date.now(), value: 0}]);
	const [memVals, setMemVals] = useState<any[]>([{time: Date.now(), value: 0}]);
	const [valCpuWebSocket, setValCpuWebSocket] = useState<any>({time: Date.now(), value: 0});
	const [valMemWebSocket, setValMemWebSocket] = useState<any>({time: Date.now(), value: 0});
	const [socket, setSocket] = useState<WebSocket | null>(null);

	const chartContainerRef: any = useRef(null);
	const cpuSerieRef: any = useRef(null);
	const memorySerieRef: any = useRef(null);

	useEffect(() => {
		if(socket === null){
			setSocket(new WebSocket(webSocket));
			chartContainerRef.current = document.getElementById('chart');
			chartContainerRef.current.innerHTML = '';
			const chart = createChart(chartContainerRef.current, {
				width: chartContainerRef.current.clientWidth-30,
				height: chartContainerRef.current.clientHeight-30,
				layout: {
					background: { type: ColorType.Solid, color: 'transparent' },
					textColor: '#a6a9b3'
				},
				crosshair: {
					mode: 0
				},
				timeScale: {
					timeVisible: true,
					borderColor: '#71649C',
					barSpacing: 0.5,
				},
				grid: {
					vertLines: {
						color: '#a6a9b3'
					},
					horzLines: {
						color: '#a6a9b3'
					}
				},
				rightPriceScale: {
					visible: true
				},
				leftPriceScale: {
					visible: true
				}
			});
			const lineOne = chart.addSeries(LineSeries, {
				color: '#2962FF',
				priceScaleId: 'right',
				autoscaleInfoProvider: () => ({
					priceRange: {
						minValue: 0,
						maxValue: 100,
					},
				}),
				priceFormat: {
					type: 'custom',
					formatter: (value: string) => `${parseFloat(value).toFixed(2)} %`,
				},
			});
			lineOne.createPriceLine({
				price: 100,
				color: 'red',
				lineWidth: 2,
				lineStyle: LineStyle.Dotted,
				axisLabelVisible: true,
				title: 'LIMIT CPU',
			});
			const lineTwo = chart.addSeries(LineSeries, {
				color: 'rgb(242, 142, 44)',
				priceScaleId: 'left',
				autoscaleInfoProvider: () => ({
					priceRange: {
						minValue: 0,
						maxValue: 32,
					},
				}),
				priceFormat: {
					type: 'custom',
					formatter: (value: string) => `${parseFloat(value).toFixed(2)} Go`,
				},
			});
			lineTwo.createPriceLine({
				price: 32,
				color: 'red',
				lineWidth: 2,
				lineStyle: LineStyle.Dotted,
				axisLabelVisible: true,
				title: 'LIMIT RAM',
			});
			lineOne.setData(cpuVals);
			lineTwo.setData(memVals);
			cpuSerieRef.current = lineOne;
			memorySerieRef.current = lineTwo;
		}
	}, [cpuVals, memVals, socket, webSocket]);

	useEffect(() => {
		if(socket !== null){
			socket.onmessage = (event) => {
				const data = JSON.parse(event.data);
				const cpu = {time: Date.now(), value: parseFloat(data['cpuUsage'])};
				const memory = {time: Date.now(), value: parseFloat(data['memoryUsage'])};
				setCpuVals([...cpuVals, cpu]);
				setValCpuWebSocket(cpu);
				setMemVals([...memVals, memory]);
				setValMemWebSocket(memory);
			}
			socket.onerror = (error) => {
				console.log(error)
			};
			socket.onclose = (event) => {
				console.log(event)
			};
		}
	}, [cpuVals, memVals, socket]);

	useEffect(() => {
		if (valCpuWebSocket && valMemWebSocket && cpuSerieRef.current && memorySerieRef.current) {
			cpuSerieRef.current.update(valCpuWebSocket);
			memorySerieRef.current.update(valMemWebSocket);
		}
	}, [cpuVals, memVals, valCpuWebSocket, valMemWebSocket]);

	return (
		<div ref={chartContainerRef} id={"chart"} className={"aspect-video rounded-xl bg-muted/50 flex items-center justify-center col-[2/4] row-[1]"}/>
	);
}
