export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-muted-foreground text-lg">Coming soon</p>
    </div>
  );
}
