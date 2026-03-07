export function TitleBar() {
  return (
    <div data-tauri-drag-region className="h-8 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] flex items-center px-4">
      <span className="text-xs text-[hsl(var(--muted-foreground))]">Waggle</span>
    </div>
  );
}
