/**
 * TaskBoard — simple task list grouped by status.
 *
 * Three columns: Open, In Progress, Done.
 * Compact view suitable for the context panel.
 */

import React, { useState } from 'react';

export interface TeamTask {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'done';
  assigneeId?: string;
  assigneeName?: string;
  creatorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskBoardProps {
  tasks: TeamTask[];
  onCreateTask?: (title: string) => void;
  onUpdateStatus?: (taskId: string, status: TeamTask['status']) => void;
  onDeleteTask?: (taskId: string) => void;
  onClaimTask?: (taskId: string) => void;
  loading?: boolean;
}

const STATUS_LABELS: Record<TeamTask['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
};

const STATUS_COLORS: Record<TeamTask['status'], string> = {
  open: '#3b82f6',      // blue
  in_progress: '#f59e0b', // amber
  done: '#22c55e',       // green
};

export function getTaskStatusColor(status: TeamTask['status']): string {
  return STATUS_COLORS[status] ?? '#6b7280';
}

export function groupTasksByStatus(tasks: TeamTask[]): Record<TeamTask['status'], TeamTask[]> {
  const result: Record<TeamTask['status'], TeamTask[]> = {
    open: [],
    in_progress: [],
    done: [],
  };
  for (const task of tasks) {
    if (result[task.status]) {
      result[task.status].push(task);
    }
  }
  return result;
}

export function TaskBoard({
  tasks,
  onCreateTask,
  onUpdateStatus,
  onDeleteTask,
  onClaimTask,
  loading,
}: TaskBoardProps) {
  const [newTitle, setNewTitle] = useState('');
  const grouped = groupTasksByStatus(tasks);

  const handleCreate = () => {
    if (!newTitle.trim() || !onCreateTask) return;
    onCreateTask(newTitle.trim());
    setNewTitle('');
  };

  if (loading) {
    return (
      <div className="task-board" style={{ padding: 12, color: 'var(--text-dim)', fontSize: 11 }}>
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="task-board" style={{ fontSize: 11 }}>
      {/* Quick add */}
      {onCreateTask && (
        <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.05))' }}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New task..."
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            style={{
              flex: 1,
              padding: '4px 8px',
              background: 'var(--bg-input, rgba(255,255,255,0.05))',
              border: '1px solid var(--border, rgba(255,255,255,0.1))',
              borderRadius: 4,
              color: 'var(--text)',
              fontSize: 11,
            }}
          />
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim()}
            style={{
              padding: '4px 8px',
              background: 'var(--primary, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 10,
              opacity: !newTitle.trim() ? 0.5 : 1,
            }}
          >
            Add
          </button>
        </div>
      )}

      {/* Status groups */}
      {(['open', 'in_progress', 'done'] as const).map((status) => {
        const statusTasks = grouped[status];
        if (statusTasks.length === 0 && status === 'done') return null; // hide empty done

        return (
          <div key={status}>
            <div style={{
              padding: '6px 12px',
              fontSize: 9,
              fontWeight: 600,
              color: STATUS_COLORS[status],
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>{STATUS_LABELS[status]}</span>
              <span style={{ color: 'var(--text-dim)' }}>{statusTasks.length}</span>
            </div>
            {statusTasks.length === 0 ? (
              <div style={{ padding: '4px 12px', color: 'var(--text-dim)', fontSize: 10 }}>
                No tasks
              </div>
            ) : (
              statusTasks.map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: '6px 12px',
                    borderBottom: '1px solid var(--border-subtle, rgba(255,255,255,0.03))',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  {/* Status cycle button */}
                  {onUpdateStatus && (
                    <button
                      onClick={() => {
                        const next: Record<string, TeamTask['status']> = {
                          open: 'in_progress',
                          in_progress: 'done',
                          done: 'open',
                        };
                        onUpdateStatus(task.id, next[task.status]);
                      }}
                      title={`Move to ${STATUS_LABELS[task.status === 'open' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'open']}`}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        border: `2px solid ${STATUS_COLORS[task.status]}`,
                        background: task.status === 'done' ? STATUS_COLORS.done : 'transparent',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      color: task.status === 'done' ? 'var(--text-dim)' : 'var(--text-muted)',
                      textDecoration: task.status === 'done' ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {task.title}
                    </div>
                    {task.assigneeName && (
                      <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>
                        {task.assigneeName}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}
