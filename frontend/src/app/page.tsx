import Card from "@/components/Card/Card";

export default function Page() {
  return (
    <div className="w-screen h-screen overflow-hidden bg-black/25 p-4">
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
            <Card />
            <Card />
            <Card />
        </div>
        <div className="min-h-[60vh] flex-1 rounded-xl bg-muted/50" />
      </div>
    </div>
  );
}
