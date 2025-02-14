'use client';

import {useEffect, useRef, useState} from "react";
import {ColorType, createChart, LineSeries, LineStyle} from "lightweight-charts";

interface ChartCpuProps {
	webSocket: string;
}

export default function ChartCpu({webSocket}: ChartCpuProps){
	const [cpuVals, setCpuVals] = useState<any[]>([{time: Date.now(), value: 0}]);
	const [valCpuWebSocket, setValCpuWebSocket] = useState<any>({time: Date.now(), value: 0});
	const [socket, setSocket] = useState<WebSocket | null>(null);

	const chartContainerRef: any = useRef(null);
	const cpuSerieRef: any = useRef(null);

	useEffect(() => {
		if(socket === null){
			setSocket(new WebSocket(webSocket));
			chartContainerRef.current = document.getElementById('chartCpu');
			chartContainerRef.current.innerHTML = '';
			const chart = createChart(chartContainerRef.current, {
				width: chartContainerRef.current.parentNode.parentNode.clientWidth-40,
				height: chartContainerRef.current.parentNode.parentNode.clientHeight-40,
				autoSize: true,
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
			lineOne.setData(cpuVals);
			cpuSerieRef.current = lineOne;
		}
	}, [cpuVals, socket, webSocket]);

	useEffect(() => {
		if(socket !== null){
			socket.onmessage = (event) => {
				const data = JSON.parse(event.data);
				const cpu = {time: Date.now(), value: parseFloat(data['cpuUsage'])};
				setCpuVals([...cpuVals, cpu]);
				setValCpuWebSocket(cpu);
			}
			socket.onerror = (error) => {
				console.log(error)
			};
			socket.onclose = (event) => {
				console.log(event)
			};
		}
	}, [cpuVals, socket]);

	useEffect(() => {
		if (valCpuWebSocket && cpuSerieRef.current) {
			cpuSerieRef.current.update(valCpuWebSocket);
		}
	}, [cpuVals, valCpuWebSocket]);

	return (
		<div ref={chartContainerRef} id={"chartCpu"} className={"max-h-[300px]"}/>
	);
}
