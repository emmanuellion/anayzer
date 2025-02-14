'use client';

import Card from "@/components/Card/Card";
import {useEffect, useState} from "react";
import Loader from "@/components/Loader/Loader";
import ChartCpu from "@/components/ChartCpu/ChartCpu";
import ChartMem from "@/components/ChartMem/ChartMem";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import s from './page.module.css';

interface ProjectMetrics {
    totalFiles: number;
    totalLines: number;
    averageComplexity: string;
    totalCommentLines: number;
    documentationCoverage: string;
    totalAsyncCount: number;
    duplicatePercentage: string;
    dependenciesCount: number;
    npmAuditResults: any;
    lint: any;
    startupTime: number;
    buildTime: number;
    dependencies: any;
    sys: any;
}

export interface NumberData {
    text: string;
    value: number;
    suffix?: string;
}

export default function Page() {
    const [data, setData] = useState<null | ProjectMetrics>(null);
    const [infos, setInfos] = useState<NumberData[]>([]);

    useEffect(() => {
        if(!data){
            fetch('http://localhost:2002/data')
                .then(res => res.json()
                    .then(data => {
                        setInfos([
                            {
                                text: "Number of dependencies : ",
                                value: data.data.dependenciesCount
                            },
                            {
                                text: "Build time : ",
                                value: data.data.buildTime,
                                suffix: "ms"
                            },
                            {
                                text: "Average complexity : ",
                                value: parseFloat(data.data.averageComplexity)
                            },
                            {
                                text: "Startup time : ",
                                value: data.data.startupTime,
                                suffix: "ms"
                            },
                            {
                                text: "Total number of lines : ",
                                value: data.data.totalLines
                            },
                            {
                                text: "Total number of totalFiles : ",
                                value: data.data.totalFiles
                            },
                            {
                                text: "Number of async function : ",
                                value: data.data.totalAsyncCount
                            },
                        ]);
                        setData(data.data);
                    }))
                .catch(err => console.log(err));
        }
    }, [data]);

  return (
    <div className={"w-screen h-screen overflow-x-hidden bg-black/25 p-4 "+s.scroll}>
        {
            data ? (
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                        {infos.length > 0 && <Card
                            title={"Some data"}
                            description={"Here are some numbers about your project"}
                            data={infos}
                            className={"h-full"}
                            footer={<p>complexity between : <br/> [ 1 ; 10 ] = good <br/> [ 11 ; 20 ] = ok <br/> [ 21 ; 50 ] = complex <br/> [ 51 ; ∞ [ = too complex</p>} />}
                        <Card
                            className={"h-full"}
                            title={"Cpu usage"}
                            description={"Measuring in real time your cpu usage"}
                            content={<ChartCpu webSocket={"ws://localhost:2002/websocket"}/>} />
                        <Card
                            className={"h-full"}
                            title={"Memory usage"}
                            description={"Measuring in real time your memory usage"}
                            content={<ChartMem webSocket={"ws://localhost:2002/websocket"}/>} />
                        <Card
                            className={"h-full"}
                            title={"System data"}
                            description={"Here are few informations that you should already know ..."}
                            content={<div className={"grid grid-cols-3 gap-4"}>
                                <div className={"flex flex-col gap-2 w-full h-full"}>
                                    <label className={"font-[700] underline"}>Hostname</label>
                                    <p>{data.sys.hostname}</p>
                                </div>
                                <div className={"flex flex-col gap-2 w-full h-full"}>
                                    <label className={"font-[700] underline"}>Architecture</label>
                                    <p>{data.sys.arch}</p>
                                </div>
                                <div className={"flex flex-col gap-2 w-full h-full"}>
                                    <label className={"font-[700] underline"}>Platforme</label>
                                    <p>{data.sys.platform}</p>
                                </div>
                                <div className={"flex flex-col gap-2 w-full h-full"}>
                                    <label className={"font-[700] underline"}>System</label>
                                    <p>{data.sys.system}</p>
                                </div>
                                <div className={"flex flex-col gap-2 w-full h-full"}>
                                    <label className={"font-[700] underline"}>Type</label>
                                    <p>{data.sys.type}</p>
                                </div>
                                <div className={"flex flex-col gap-2 w-full h-full"}>
                                    <label className={"font-[700] underline"}>Model</label>
                                    <p>{data.sys.cpus[0].model}</p>
                                </div>
                            </div>} />
                    </div>
                    <Card
                        className={"w-full aspect-auto"}
                        title={"Lint result"}
                        description={""}
                        content={
                            <Table>
                                <TableCaption>List of all messages</TableCaption>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Severity</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Rule</TableHead>
                                        <TableHead className="text-right">File</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {
                                        data.lint.results.map((file: any, index: number) => {
                                            return file.messages.length > 0 ? (
                                                file.messages.map((message: any, ind: number) => {return <TableRow className={message.severity === 2 ? "bg-red-500/20" : message.severity === 1 ? "bg-orange-500/20" : "bg-green-500/20"} key={`${index}${ind}`}>
                                                <TableCell className="font-medium">{message.severity}</TableCell>
                                                <TableCell>{message.message}</TableCell>
                                                <TableCell>{message.ruleId}</TableCell>
                                                <TableCell className="text-right">{file.filePath}</TableCell>
                                            </TableRow>})) : null;
                                        })
                                    }
                                </TableBody>
                            </Table>
                        } />
                    {/*<div className="min-h-[30vh] flex-1 rounded-xl bg-muted/50"></div>*/}
                </div>
            ) : <Loader />
        }
    </div>
  );
}
