'use client';

import {CardUi, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";
import NumberFlow from "@number-flow/react";
import {ReactNode, useEffect, useState} from "react";
import {NumberData} from "@/app/page";

interface CardProps {
    title: string;
    description: string;
    footer?: ReactNode | string;
    data?: NumberData[];
    content?: ReactNode;
    className?: string;
}

export default function Card({title, description, footer = "", content, data = [{text: "", value: 0}], className = ""}: CardProps) {
    const [value, setValue] = useState<NumberData[]>([{text: "", value: 0}]);

    useEffect(() => {
        if(value[0].value === 0 && !content)
            setValue(data);
    }, [content, data, value]);

    return (
        <CardUi className={"rounded-xl bg-muted/50 "+className}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className={`${content ? "" : "flex flex-col"}`}>
                {
                    content ? content : (
                        value.map((nb: NumberData, index: number) => {
                            return <NumberFlow
                                value={nb.value}
                                prefix={nb.text}
                                suffix={nb.suffix ? ` ${nb.suffix}` : ""}
                                trend={1}
                                key={index}
                            />
                        })
                    )
                }
            </CardContent>
            <CardFooter>
                {footer}
            </CardFooter>
        </CardUi>
    )
}
