'use client';

import {useEffect, useRef, useState} from "react";
import {ColorType, createChart, LineSeries, LineStyle} from "lightweight-charts";

interface ChartProps {
	webSocket: string;
}

export default function ChartMem({webSocket}: ChartProps){
	const [memVals, setMemVals] = useState<any[]>([{time: Date.now(), value: 0}]);
	const [valMemWebSocket, setValMemWebSocket] = useState<any>({time: Date.now(), value: 0});
	const [socket, setSocket] = useState<WebSocket | null>(null);

	const chartContainerRef: any = useRef(null);
	const memorySerieRef: any = useRef(null);

	useEffect(() => {
		if(socket === null){
			setSocket(new WebSocket(webSocket));
			chartContainerRef.current = document.getElementById('chartMem');
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
			const lineTwo = chart.addSeries(LineSeries, {
				color: 'rgb(242, 142, 44)',
				priceScaleId: 'right',
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
			lineTwo.setData(memVals);
			memorySerieRef.current = lineTwo;
		}
	}, [memVals, socket, webSocket]);

	useEffect(() => {
		if(socket !== null){
			socket.onmessage = (event) => {
				const data = JSON.parse(event.data);
				const memory = {time: Date.now(), value: parseFloat(data['memoryUsage'])};
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
	}, [memVals, socket]);

	useEffect(() => {
		if (valMemWebSocket && memorySerieRef.current) {
			memorySerieRef.current.update(valMemWebSocket);
		}
	}, [memVals, valMemWebSocket]);

	return (
		<div ref={chartContainerRef} id={"chartMem"} className={"max-h-[300px]"}/>
	);
}
