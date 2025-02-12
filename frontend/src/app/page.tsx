'use client';

import Card from "@/components/Card/Card";
import {useEffect, useState} from "react";
import Loader from "@/components/Loader/Loader";

export default function Page() {
    const [data, setData] = useState(null);

    useEffect(() => {
        if(!data){
            fetch('http://localhost:2002/data')
                .then(res => res.json()
                    .then(data => setData(data)))
                .catch(err => console.log(err));
        }
    }, []);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black/25 p-4">
        {
            data ? (
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                        <Card title={"Some data"} />
                        <Card />
                        <Card />
                    </div>
                    <div className="min-h-[60vh] flex-1 rounded-xl bg-muted/50" />
                </div>
            ) : <Loader />
        }
    </div>
  );
}
