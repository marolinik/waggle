/**
 * SkillsSection — manage skills and plugins in settings.
 *
 * Skills are markdown files in ~/.waggle/skills/ that extend the agent's system prompt.
 * Plugins are structured packages in ~/.waggle/plugins/ with manifests and MCP servers.
 */

import React, { useState, useEffect, useCallback } from 'react';

export interface SkillInfo {
  name: string;
  length: number;
  preview?: string;
}

export interface PluginInfo {
  name: string;
  version: string;
  description: string;
  skills?: string[];
  mcpServers?: Array<{ name: string; command: string }>;
}

export interface SkillsSectionProps {
  baseUrl?: string;
}

export function SkillsSection({ baseUrl = 'http://127.0.0.1:3333' }: SkillsSectionProps) {
  const [skills, setSkills] = useState<SkillInfo[]>([]);
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillContent, setNewSkillContent] = useState('');
  const [editingSkill, setEditingSkill] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [skillsDir, setSkillsDir] = useState('');

  const fetchSkills = useCallback(async () => {
    try {
      const [skillsRes, pluginsRes] = await Promise.all([
        fetch(`${baseUrl}/api/skills`),
        fetch(`${baseUrl}/api/plugins`),
      ]);
      if (skillsRes.ok) {
        const data = await skillsRes.json() as { skills: SkillInfo[]; directory: string };
        setSkills(data.skills);
        setSkillsDir(data.directory);
      }
      if (pluginsRes.ok) {
        const data = await pluginsRes.json() as { plugins: PluginInfo[] };
        setPlugins(data.plugins);
      }
    } catch {
      setError('Failed to load skills');
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => { fetchSkills(); }, [fetchSkills]);

  const createSkill = useCallback(async () => {
    if (!newSkillName.trim() || !newSkillContent.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${baseUrl}/api/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSkillName.trim(), content: newSkillContent }),
      });
      if (!res.ok) {
        const err = await res.json() as { error: string };
        setError(err.error);
        return;
      }
      setShowCreateSkill(false);
      setNewSkillName('');
      setNewSkillContent('');
      await fetchSkills();
    } catch {
      setError('Failed to create skill');
    }
  }, [baseUrl, newSkillName, newSkillContent, fetchSkills]);

  const deleteSkill = useCallback(async (name: string) => {
    try {
      await fetch(`${baseUrl}/api/skills/${name}`, { method: 'DELETE' });
      await fetchSkills();
    } catch {
      setError('Failed to delete skill');
    }
  }, [baseUrl, fetchSkills]);

  const startEditing = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${baseUrl}/api/skills/${name}`);
      if (res.ok) {
        const data = await res.json() as { content: string };
        setEditingSkill(name);
        setEditContent(data.content);
      }
    } catch {
      setError('Failed to load skill');
    }
  }, [baseUrl]);

  const saveEdit = useCallback(async () => {
    if (!editingSkill) return;
    try {
      const res = await fetch(`${baseUrl}/api/skills/${editingSkill}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        setEditingSkill(null);
        setEditContent('');
        await fetchSkills();
      }
    } catch {
      setError('Failed to save skill');
    }
  }, [baseUrl, editingSkill, editContent, fetchSkills]);

  const deletePlugin = useCallback(async (name: string) => {
    try {
      await fetch(`${baseUrl}/api/plugins/${name}`, { method: 'DELETE' });
      await fetchSkills();
    } catch {
      setError('Failed to uninstall plugin');
    }
  }, [baseUrl, fetchSkills]);

  const sectionStyle: React.CSSProperties = { marginBottom: 32 };
  const headingStyle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: 'var(--text, #e0e0e0)', marginBottom: 8 };
  const subStyle: React.CSSProperties = { fontSize: 12, color: 'var(--text-muted, #888)', marginBottom: 16 };
  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-tertiary, #1a1a2e)',
    border: '1px solid var(--border, #333)',
    borderRadius: 8,
    padding: '12px 16px',
    marginBottom: 8,
  };
  const btnStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
  };
  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--bg-input, #111)',
    border: '1px solid var(--border, #444)',
    borderRadius: 6,
    padding: '8px 12px',
    color: 'var(--text, #e0e0e0)',
    fontSize: 13,
    fontFamily: "'JetBrains Mono', monospace",
    outline: 'none',
  };

  if (loading) {
    return <div style={{ color: 'var(--text-dim)', padding: 24 }}>Loading...</div>;
  }

  return (
    <div>
      {error && (
        <div style={{ background: '#3b1818', border: '1px solid #7f1d1d', borderRadius: 8, padding: '8px 12px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
          {error}
          <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>x</button>
        </div>
      )}

      {/* Skills */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={headingStyle}>Skills</div>
            <div style={subStyle}>
              Markdown files that extend the agent's capabilities. Stored in {skillsDir || '~/.waggle/skills/'}
            </div>
          </div>
          <button
            onClick={() => setShowCreateSkill(true)}
            style={{ ...btnStyle, background: 'var(--brand, #E8920F)', color: '#000' }}
          >
            + New Skill
          </button>
        </div>

        {/* Create skill form */}
        {showCreateSkill && (
          <div style={{ ...cardStyle, borderColor: 'var(--brand, #E8920F)' }}>
            <input
              type="text"
              placeholder="skill-name (no spaces)"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <textarea
              placeholder="Skill content (markdown)... This becomes part of the agent's system prompt."
              value={newSkillContent}
              onChange={(e) => setNewSkillContent(e.target.value)}
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateSkill(false)} style={{ ...btnStyle, background: 'var(--bg-secondary, #222)', color: 'var(--text-muted, #888)' }}>Cancel</button>
              <button onClick={createSkill} style={{ ...btnStyle, background: 'var(--brand, #E8920F)', color: '#000' }}>Create</button>
            </div>
          </div>
        )}

        {/* Editing a skill */}
        {editingSkill && (
          <div style={{ ...cardStyle, borderColor: 'var(--brand, #E8920F)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand, #E8920F)', marginBottom: 8 }}>Editing: {editingSkill}</div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={12}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: 8 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditingSkill(null)} style={{ ...btnStyle, background: 'var(--bg-secondary, #222)', color: 'var(--text-muted, #888)' }}>Cancel</button>
              <button onClick={saveEdit} style={{ ...btnStyle, background: 'var(--brand, #E8920F)', color: '#000' }}>Save</button>
            </div>
          </div>
        )}

        {/* Skill list */}
        {skills.length === 0 && !showCreateSkill && (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-dim, #555)' }}>
            No skills installed. Create one to extend the agent's capabilities.
          </div>
        )}
        {skills.map((skill) => (
          <div key={skill.name} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text, #e0e0e0)', fontFamily: "'JetBrains Mono', monospace", fontSize: 14 }}>
                  {skill.name}
                </span>
                <span style={{ color: 'var(--text-dim, #555)', fontSize: 11, marginLeft: 8 }}>
                  {skill.length} chars
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => startEditing(skill.name)} style={{ ...btnStyle, background: 'var(--bg-secondary, #222)', color: 'var(--text-muted, #888)' }}>Edit</button>
                <button onClick={() => deleteSkill(skill.name)} style={{ ...btnStyle, background: '#3b1818', color: '#f87171' }}>Delete</button>
              </div>
            </div>
            {skill.preview && (
              <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-muted, #888)', fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'pre-wrap', maxHeight: 60, overflow: 'hidden' }}>
                {skill.preview}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Plugins */}
      <div style={sectionStyle}>
        <div style={headingStyle}>Plugins</div>
        <div style={subStyle}>
          Structured extension packages with manifests, skills, and MCP server integrations. Install from local directory or marketplace (coming soon).
        </div>

        {plugins.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-dim, #555)' }}>
            No plugins installed. Plugin marketplace coming soon.
          </div>
        )}
        {plugins.map((plugin) => (
          <div key={plugin.name} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--text, #e0e0e0)', fontSize: 14 }}>
                  {plugin.name}
                </span>
                <span style={{ color: 'var(--text-dim, #555)', fontSize: 11, marginLeft: 8 }}>
                  v{plugin.version}
                </span>
              </div>
              <button onClick={() => deletePlugin(plugin.name)} style={{ ...btnStyle, background: '#3b1818', color: '#f87171' }}>Uninstall</button>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted, #888)' }}>
              {plugin.description}
            </div>
            {plugin.skills && plugin.skills.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {plugin.skills.map(s => (
                  <span key={s} style={{ background: 'var(--brand-dim, rgba(232,146,15,0.15))', color: 'var(--brand, #E8920F)', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                    {s}
                  </span>
                ))}
              </div>
            )}
            {plugin.mcpServers && plugin.mcpServers.length > 0 && (
              <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {plugin.mcpServers.map(mcp => (
                  <span key={mcp.name} style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 8px', borderRadius: 4, fontSize: 11 }}>
                    MCP: {mcp.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* How it works */}
      <div style={sectionStyle}>
        <div style={headingStyle}>How Skills Work</div>
        <div style={{ ...cardStyle, fontSize: 13, color: 'var(--text-muted, #888)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 8 }}>Skills are markdown files that get injected into the agent's system prompt. They teach the agent new behaviors, knowledge, or workflows.</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: 'var(--text, #e0e0e0)' }}>Creating skills:</strong> Write a .md file with instructions the agent should follow. Click "New Skill" above or create files directly in the skills directory.</p>
          <p style={{ marginBottom: 8 }}><strong style={{ color: 'var(--text, #e0e0e0)' }}>Plugins:</strong> Bundles of skills + MCP server integrations. Install from local directories now, marketplace support coming soon.</p>
          <p><strong style={{ color: 'var(--text, #e0e0e0)' }}>MCP Servers:</strong> Plugins can include MCP (Model Context Protocol) servers that give the agent access to external tools and data sources.</p>
        </div>
      </div>
    </div>
  );
}
