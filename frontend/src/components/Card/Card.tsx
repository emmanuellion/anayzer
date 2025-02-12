import {CardUi, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";

interface CardProps {
    title?: string;
    description?: string;
    content?: string;
    footer?: string;
}

export default function Card({title, description, content, footer}: CardProps) {
    return (
        <CardUi className={"aspect-video rounded-xl bg-muted/50"}>
            <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Card Description</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Card Content</p>
            </CardContent>
            <CardFooter>
                <p>Card Footer</p>
            </CardFooter>
        </CardUi>
    )
}