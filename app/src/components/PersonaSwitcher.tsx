/**
 * PersonaSwitcher — Dialog for switching agent persona mid-conversation.
 *
 * Uses shadcn Dialog. Persona grid follows the same card pattern as
 * CreateWorkspaceDialog's persona picker. Messages are preserved when
 * switching — only the system prompt changes via composePersonaPrompt().
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

export interface PersonaSwitcherProps {
  open: boolean;
  onClose: () => void;
  onSelect: (personaId: string | null) => void;
  currentPersonaId: string | null;
  personas: Array<{ id: string; name: string; description: string; icon: string }>;
}

export function PersonaSwitcher({
  open,
  onClose,
  onSelect,
  currentPersonaId,
  personas,
}: PersonaSwitcherProps) {
  const handleSelect = (personaId: string | null) => {
    onSelect(personaId);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}
    >
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Switch Persona</DialogTitle>
          <DialogDescription>
            Change how Waggle behaves in this workspace. Messages are preserved.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 mt-2">
          {/* "None" option to reset to default */}
          <button
            type="button"
            onClick={() => handleSelect(null)}
            className={`rounded-lg border p-3 text-left transition-colors cursor-pointer hover:border-primary/50 ${
              currentPersonaId === null
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">--</span>
              <span className="text-sm font-medium text-foreground">None (Default)</span>
              {currentPersonaId === null && (
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-primary">Current</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Core assistant, no persona overlay</p>
          </button>

          {personas.map((persona) => (
            <button
              key={persona.id}
              type="button"
              onClick={() => handleSelect(persona.id)}
              className={`rounded-lg border p-3 text-left transition-colors cursor-pointer hover:border-primary/50 ${
                currentPersonaId === persona.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{persona.icon}</span>
                <span className="text-sm font-medium text-foreground">{persona.name}</span>
                {currentPersonaId === persona.id && (
                  <span className="ml-auto text-[10px] font-medium uppercase tracking-wider text-primary">Current</span>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{persona.description}</p>
            </button>
          ))}

          {/* Create New Persona */}
          <button
            type="button"
            onClick={() => { /* TODO: Full persona creation form is P2 — link to Settings */ }}
            className="rounded-lg border border-dashed border-border p-3 text-left transition-colors cursor-pointer hover:border-primary/50 col-span-2"
          >
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <span className="text-lg">+</span>
              <span className="text-sm">Create Custom Persona</span>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
