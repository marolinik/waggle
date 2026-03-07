import { useState, useEffect } from 'react';
import { rpcCall } from '../../lib/ipc';

interface McpServer {
  id: string;
  name: string;
  command: string;
  args: string[];
  enabled?: boolean;
}

export function McpServerList() {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCommand, setNewCommand] = useState('');
  const [newArgs, setNewArgs] = useState('');

  const refresh = () => {
    rpcCall('mcp.list').then((result) => {
      setServers(result as McpServer[]);
    }).catch(() => {});
  };

  useEffect(() => { refresh(); }, []);

  const handleAdd = async () => {
    const id = newName.toLowerCase().replace(/\s+/g, '-');
    await rpcCall('mcp.add', {
      id,
      name: newName,
      command: newCommand,
      args: newArgs.split(' ').filter(Boolean),
    });
    setNewName('');
    setNewCommand('');
    setNewArgs('');
    setShowAdd(false);
    refresh();
  };

  const handleRemove = async (id: string) => {
    await rpcCall('mcp.remove', { id });
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">MCP Servers</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs text-[hsl(var(--primary))] hover:underline"
        >
          + Add Server
        </button>
      </div>

      {servers.length === 0 && !showAdd && (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          No MCP servers configured. Add one to extend your agent's capabilities.
        </p>
      )}

      {servers.map((server) => (
        <div
          key={server.id}
          className="flex items-center justify-between p-3 mb-2 rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]"
        >
          <div>
            <div className="text-sm font-medium">{server.name}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              {server.command} {server.args.join(' ')}
            </div>
          </div>
          <button
            onClick={() => handleRemove(server.id)}
            className="text-xs text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      ))}

      {showAdd && (
        <div className="p-3 rounded-lg border border-[hsl(var(--border))] space-y-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Server name"
            className="w-full rounded border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))]"
          />
          <input
            value={newCommand}
            onChange={(e) => setNewCommand(e.target.value)}
            placeholder="Command (e.g., npx)"
            className="w-full rounded border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))]"
          />
          <input
            value={newArgs}
            onChange={(e) => setNewArgs(e.target.value)}
            placeholder="Arguments (space-separated)"
            className="w-full rounded border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-3 py-1.5 text-sm text-[hsl(var(--foreground))]"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="text-xs bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-3 py-1 rounded">Add</button>
            <button onClick={() => setShowAdd(false)} className="text-xs text-[hsl(var(--muted-foreground))]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
