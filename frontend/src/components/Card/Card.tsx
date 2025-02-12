'use client';

import {CardUi, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import NumberFlow from "@number-flow/react";
import {useEffect, useState} from "react";
import {NumberData} from "@/app/page";

interface CardProps {
    title: string;
    description: string;
    footer: string;
    data: NumberData[];
}

export default function Card({title, description, footer, data}: CardProps) {
    const [value, setValue] = useState<NumberData[]>(data);

    return (
        <CardUi className={"aspect-video rounded-xl bg-muted/50"}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col">
                {
                    value.map((nb: NumberData, index: number) => {
                        return <NumberFlow
                            value={nb.value}
                            prefix={nb.text}
                            suffix={nb.suffix ? ` ${nb.suffix}` : ""}
                            trend={1}
                            key={index}
                        />
                    })
                }

            </CardContent>
            <CardFooter>
                <p>{footer}</p>
            </CardFooter>
        </CardUi>
    )
}