'use client';

import Card from "@/components/Card/Card";
import {useEffect, useState} from "react";
import Loader from "@/components/Loader/Loader";

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
    ressources: any;
    buildTime: number;
    dependencies: any;
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
                                value: parseFloat(data.data.averageComplexity),
                                suffix: "between 1 & 10 = good, 11 & 20 = ok, ..."
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
                                value: data.data.totalLines
                            },

                        ]);
                        console.log([
                            {
                                text: "Number of dependencies : ",
                                value: data.data.dependenciesCount
                            },
                            {
                                text: "Build time : ",
                                value: data.data.buildTime
                            },
                            {
                                text: "Average complexity : ",
                                value: parseFloat(data.data.averageComplexity)
                            },
                            {
                                text: "Startup time : ",
                                value: data.data.startupTime
                            },
                            {
                                text: "Total number of lines : ",
                                value: data.data.totalLines
                            },

                        ])
                        setData(data.data);
                    }))
                .catch(err => console.log(err));
        }
    }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black/25 p-4">
        {
            data ? (
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        {infos.length > 0 && <Card title={"Some data"} description={"Some data"} data={infos} footer={"footer"} />}
                        {/*<Card />*/}
                        {/*<Card />*/}
                    </div>
                    <div className="min-h-[60vh] flex-1 rounded-xl bg-muted/50" />
                </div>
            ) : <Loader />
        }
    </div>
  );
}
