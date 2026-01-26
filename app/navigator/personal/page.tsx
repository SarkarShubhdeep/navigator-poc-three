import { ComingSoon } from "@/components/navigator/coming-soon";

export default function PersonalPage() {
  return (
    <div className="p-8">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Space</p>
        <h1 className="text-3xl font-bold">Personal</h1>
      </div>
      <ComingSoon title="" />
    </div>
  );
}
