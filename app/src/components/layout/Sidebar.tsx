interface SidebarProps {
  connected: boolean;
  onSettingsClick: () => void;
}

export function Sidebar({ connected, onSettingsClick }: SidebarProps) {
  return (
    <div className="w-16 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] flex flex-col items-center py-4 gap-4">
      <div className="text-lg font-bold">W</div>
      <div className="flex-1" />
      <div
        className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
        title={connected ? 'Connected' : 'Disconnected'}
      />
      <button
        onClick={onSettingsClick}
        className="p-2 rounded hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))]"
        title="Settings"
      >
        &#x2699;
      </button>
    </div>
  );
}
