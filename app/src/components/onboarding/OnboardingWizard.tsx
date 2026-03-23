/**
 * OnboardingWizard — premium first-run experience for new Waggle users.
 *
 * 7 steps: Welcome → Meet Agent → API Key → Template → Persona → First Message → Tips
 * Full-screen overlay with smooth transitions. Goal: "wow" within 60 seconds.
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { HiveIcon, BeeImage } from '@/components/HiveIcon';
import type { OnboardingState } from '@/hooks/useOnboarding';

// ── Constants ───────────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'sales-pipeline', name: 'Sales Pipeline', icon: '🎯', hint: 'Research the top 5 competitors in my industry' },
  { id: 'research-project', name: 'Research Project', icon: '🔬', hint: 'Help me design a literature review on my topic' },
  { id: 'code-review', name: 'Code Review', icon: '💻', hint: 'Read my project and tell me what you see' },
  { id: 'marketing-campaign', name: 'Marketing Campaign', icon: '📣', hint: 'Draft a campaign brief for my product launch' },
  { id: 'product-launch', name: 'Product Launch', icon: '🚀', hint: 'Help me write a PRD for my next feature' },
  { id: 'legal-review', name: 'Legal Review', icon: '⚖️', hint: 'Draft a standard NDA template' },
  { id: 'agency-consulting', name: 'Agency Consulting', icon: '🏢', hint: 'Set up client workspaces for my biggest accounts' },
];

const PERSONAS = [
  { id: 'researcher', name: 'Researcher', icon: '🔬', desc: 'Deep investigation & synthesis' },
  { id: 'writer', name: 'Writer', icon: '✍️', desc: 'Long-form content & editing' },
  { id: 'analyst', name: 'Analyst', icon: '📊', desc: 'Data analysis & reporting' },
  { id: 'coder', name: 'Coder', icon: '💻', desc: 'Code review & development' },
  { id: 'project-manager', name: 'Project Manager', icon: '📋', desc: 'Planning & coordination' },
  { id: 'executive-assistant', name: 'Executive Assistant', icon: '📧', desc: 'Email, scheduling, briefs' },
  { id: 'sales-rep', name: 'Sales Rep', icon: '🎯', desc: 'Prospecting & outreach' },
  { id: 'marketer', name: 'Marketer', icon: '📢', desc: 'Campaigns & copy' },
];

const CAPABILITY_ICONS = [
  { label: 'Research', iconName: 'research' },
  { label: 'Draft', iconName: 'draft' },
  { label: 'Plan', iconName: 'plan' },
  { label: 'Code', iconName: 'code' },
  { label: 'Remember', iconName: 'remember' },
];

const TEMPLATE_PERSONA: Record<string, string> = {
  'sales-pipeline': 'sales-rep',
  'research-project': 'researcher',
  'code-review': 'coder',
  'marketing-campaign': 'marketer',
  'product-launch': 'project-manager',
  'legal-review': 'analyst',
  'agency-consulting': 'executive-assistant',
};

// ── Props ───────────────────────────────────────────────────────────

interface OnboardingWizardProps {
  serverBaseUrl: string;
  state: OnboardingState;
  onUpdate: (updates: Partial<OnboardingState>) => void;
  onNext: () => void;
  onComplete: (serverBaseUrl: string) => void;
  onDismiss: () => void;
  /** Called when wizard finishes and user should land in their workspace */
  onFinish: (workspaceId: string, firstMessage: string) => void;
}

// ── Main Component ──────────────────────────────────────────────────

export function OnboardingWizard({
  serverBaseUrl,
  state,
  onUpdate,
  onNext: _onNext,
  onComplete,
  onDismiss,
  onFinish,
}: OnboardingWizardProps) {
  const [step, setStep] = useState(state.step);
  const [fadeClass, setFadeClass] = useState('opacity-100');
  const [apiKey, setApiKey] = useState('');
  const [keyValid, setKeyValid] = useState(false);
  const [keyChecking, setKeyChecking] = useState(false);
  const [keyError, setKeyError] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Auto-advance step 0 (Welcome) after 3 seconds
  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => goToStep(1), 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const goToStep = useCallback((next: number) => {
    setFadeClass('opacity-0');
    setTimeout(() => {
      setStep(next);
      onUpdate({ step: next });
      setFadeClass('opacity-100');
    }, 200);
  }, [onUpdate]);

  // ── API Key Validation ──────────────────────────────────────────
  const validateKey = useCallback(async (key: string) => {
    if (!key || key.length < 10) return;
    setKeyChecking(true);
    setKeyError('');
    try {
      // Store key in vault
      await fetch(`${serverBaseUrl}/api/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'anthropic', value: key }),
      });
      // Check health
      const healthRes = await fetch(`${serverBaseUrl}/health`);
      if (healthRes.ok) {
        const health = await healthRes.json();
        if (health.llm?.health === 'healthy' || health.llm?.health === 'degraded') {
          setKeyValid(true);
          onUpdate({ apiKeySet: true });
        } else {
          setKeyError('Key stored but could not verify. You can continue and test later.');
          setKeyValid(true); // Allow proceeding
        }
      }
    } catch {
      setKeyError('Could not connect to server. Check that Waggle is running.');
    } finally {
      setKeyChecking(false);
    }
  }, [serverBaseUrl, onUpdate]);

  // ── Workspace Creation ──────────────────────────────────────────
  const createWorkspace = useCallback(async () => {
    if (!selectedTemplate) return;
    setCreating(true);
    try {
      const name = workspaceName.trim() || TEMPLATES.find(t => t.id === selectedTemplate)?.name || 'My Workspace';
      const res = await fetch(`${serverBaseUrl}/api/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          group: 'Workspaces',
          templateId: selectedTemplate,
          personaId: selectedPersona ?? TEMPLATE_PERSONA[selectedTemplate],
        }),
      });
      if (res.ok) {
        const ws = await res.json();
        onUpdate({ workspaceId: ws.id, templateId: selectedTemplate, personaId: selectedPersona ?? TEMPLATE_PERSONA[selectedTemplate] });
        return ws.id;
      }
    } catch { /* handled below */ }
    setCreating(false);
    return null;
  }, [selectedTemplate, workspaceName, selectedPersona, serverBaseUrl, onUpdate]);

  // ── Final Step: Finish ──────────────────────────────────────────
  const handleFinish = useCallback(async () => {
    setCreating(true);
    const wsId = await createWorkspace();
    if (wsId) {
      const hint = TEMPLATES.find(t => t.id === selectedTemplate)?.hint || 'Hello! What can you help me with?';
      onComplete(serverBaseUrl);
      onFinish(wsId, hint);
    }
    setCreating(false);
  }, [createWorkspace, selectedTemplate, onComplete, onFinish, serverBaseUrl]);

  // ── Step rendering ──────────────────────────────────────────────
  const totalSteps = 6;
  const progress = Math.min((step / totalSteps) * 100, 100);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-auto honeycomb-bg"
      style={{ backgroundColor: 'var(--hive-950)' }}
    >
      {/* Progress bar — honey fill */}
      {step > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: 'var(--hive-800)' }}>
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%`, backgroundColor: 'var(--honey-500)' }}
          />
        </div>
      )}

      {/* Hex step indicator dots */}
      {step > 0 && step < 5 && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5">
          {[1, 2, 3, 4].map(s => (
            <span
              key={s}
              className="text-[10px] transition-all"
              style={{
                color: s === step ? 'var(--honey-500)' : s < step ? 'var(--honey-600)' : 'var(--hive-600)',
                transform: s === step ? 'scale(1.3)' : 'scale(1)',
              }}
            >
              ⬡
            </span>
          ))}
          <span className="text-[10px] ml-1" style={{ color: 'var(--hive-500)' }}>
            Step {step} of {totalSteps - 1}
          </span>
        </div>
      )}

      {/* Skip link */}
      {step > 0 && step < 5 && (
        <button
          onClick={onDismiss}
          className="absolute top-4 right-6 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
        >
          Skip setup
        </button>
      )}

      {/* Step content with fade transition */}
      <div className={`w-full max-w-2xl px-6 transition-opacity duration-200 ${fadeClass}`}>

        {/* ── Step 0: Welcome ────────────────────────────────── */}
        {step === 0 && (
          <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-700 cursor-pointer" onClick={() => goToStep(1)}>
            {/* Architect bee with glow */}
            <div className="relative">
              <BeeImage role="orchestrator" className="w-[180px] h-[180px] float" />
              <div className="absolute -inset-8 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: 'rgba(229, 160, 0, 0.08)' }} />
            </div>
            <p className="text-[11px] uppercase tracking-[0.12em] font-medium" style={{ color: 'var(--honey-500)' }}>
              YOUR AI OPERATING SYSTEM
            </p>
            <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--hive-50)' }}>
              Welcome to the Hive
            </h1>
            <p className="text-base max-w-md" style={{ color: 'var(--hive-300)' }}>
              Persistent memory. Workspace-native. Built for knowledge work.
            </p>
            <p className="text-xs mt-6" style={{ color: 'var(--hive-600)' }}>Click anywhere to continue</p>
          </div>
        )}

        {/* ── Step 1: Meet Your Agent ────────────────────────── */}
        {step === 1 && (
          <div className="flex flex-col items-center gap-6 text-center">
            <BeeImage role="connector" className="w-16 h-16" />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--hive-50)' }}>
              Meet your AI agent
            </h2>
            <p className="max-w-md" style={{ color: 'var(--hive-300)' }}>
              I can research, draft, plan, code, and <strong style={{ color: 'var(--hive-50)' }}>remember everything</strong> across sessions.
            </p>
            <div className="flex gap-6 mt-4">
              {CAPABILITY_ICONS.map(cap => (
                <div key={cap.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--honey-glow)', border: '1px solid var(--hive-700)' }}
                  >
                    <HiveIcon name={cap.iconName} size={28} />
                  </div>
                  <span className="text-xs" style={{ color: 'var(--hive-400)' }}>{cap.label}</span>
                </div>
              ))}
            </div>
            <Button className="mt-6 px-8" size="lg" onClick={() => goToStep(2)}
              style={{ backgroundColor: 'var(--honey-500)', color: 'var(--hive-950)' }}
            >
              Let's set up →
            </Button>
          </div>
        )}

        {/* ── Step 2: API Key ────────────────────────────────── */}
        {step === 2 && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="text-4xl">🔑</div>
            <h2 className="text-2xl font-bold text-foreground">Connect your AI brain</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Paste your Anthropic API key to power Waggle's intelligence.
            </p>
            <div className="w-full max-w-md mt-2">
              <div className="relative">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-ant-api03-..."
                  className="w-full rounded-lg border border-border bg-muted px-4 py-3 text-sm font-mono text-foreground outline-none focus:border-primary transition-colors"
                  autoFocus
                />
                {keyValid && (
                  <div className="absolute right-3 top-3 text-green-500 text-lg">✓</div>
                )}
              </div>
              {keyError && <p className="text-xs text-yellow-500 mt-2">{keyError}</p>}
              <div className="flex gap-2 mt-3">
                <Button
                  onClick={() => validateKey(apiKey)}
                  disabled={!apiKey || apiKey.length < 10 || keyChecking}
                  className="flex-1"
                >
                  {keyChecking ? 'Validating...' : keyValid ? 'Key saved!' : 'Validate & save'}
                </Button>
                {keyValid && (
                  <Button variant="outline" onClick={() => goToStep(3)}>
                    Continue →
                  </Button>
                )}
              </div>
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary/70 hover:text-primary mt-3 inline-block"
              >
                Get an API key →
              </a>
            </div>
            <button
              onClick={() => goToStep(3)}
              className="text-xs text-muted-foreground/30 hover:text-muted-foreground mt-4"
            >
              I'll do this later (AI features won't work)
            </button>
          </div>
        )}

        {/* ── Step 3: Choose Template ────────────────────────── */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-5">
            <h2 className="text-2xl font-bold text-foreground text-center">What are you working on?</h2>
            <p className="text-sm text-muted-foreground text-center">Pick a template to get started instantly.</p>
            <div className="grid grid-cols-2 gap-3 w-full mt-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setWorkspaceName(t.name);
                    setSelectedPersona(TEMPLATE_PERSONA[t.id] ?? null);
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    selectedTemplate === t.id
                      ? 'border-primary bg-primary/10 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]'
                      : 'border-border bg-card hover:border-primary/30 hover:bg-card/80'
                  }`}
                >
                  <span className="text-2xl shrink-0">{t.icon}</span>
                  <span className="text-sm font-medium text-foreground">{t.name}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedTemplate('blank');
                  setWorkspaceName('My Workspace');
                  setSelectedPersona(null);
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border border-dashed text-left transition-all ${
                  selectedTemplate === 'blank'
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-transparent hover:border-border'
                }`}
              >
                <span className="text-2xl shrink-0 opacity-40">+</span>
                <span className="text-sm text-muted-foreground">Blank workspace</span>
              </button>
            </div>
            {selectedTemplate && (
              <div className="w-full mt-2">
                <label className="text-xs text-muted-foreground mb-1 block">Workspace name</label>
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </div>
            )}
            <Button
              className="mt-2 px-8"
              size="lg"
              disabled={!selectedTemplate}
              onClick={() => goToStep(4)}
            >
              Continue
            </Button>
          </div>
        )}

        {/* ── Step 4: Choose Persona ─────────────────────────── */}
        {step === 4 && (
          <div className="flex flex-col items-center gap-5">
            <h2 className="text-2xl font-bold text-foreground text-center">How should I work?</h2>
            <p className="text-sm text-muted-foreground text-center">Choose an agent persona for this workspace.</p>
            <div className="grid grid-cols-2 gap-2.5 w-full mt-2">
              {PERSONAS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPersona(p.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    selectedPersona === p.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/30'
                  }`}
                >
                  <span className="text-xl shrink-0">{p.icon}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{p.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{p.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <Button
              className="mt-2 px-8"
              size="lg"
              disabled={creating}
              onClick={handleFinish}
            >
              {creating ? 'Creating workspace...' : 'Start working →'}
            </Button>
          </div>
        )}

        {/* ── Step 5: Ready ──────────────────────────────────── */}
        {step === 5 && (
          <div className="flex flex-col items-center gap-4 text-center">
            <BeeImage role="celebrating" className="w-[160px] h-[160px] float" />
            <h2 className="text-2xl font-bold" style={{ color: 'var(--hive-50)' }}>Your hive is ready ⬡</h2>
            <p style={{ color: 'var(--hive-300)' }}>Your workspace is ready. Let's get to work.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Post-Wizard Tooltips ────────────────────────────────────────────

export function OnboardingTooltips({ onDismiss }: { onDismiss: () => void }) {
  const [tipIndex, setTipIndex] = useState(0);
  const tips = [
    { text: 'Type / for 14 powerful commands — research, draft, plan, and more', position: 'bottom' as const },
    { text: 'I remember everything — ask about past work anytime', position: 'top' as const },
    { text: 'Create workspaces to organize different projects', position: 'top' as const },
  ];

  const handleNext = () => {
    if (tipIndex < tips.length - 1) {
      setTipIndex(tipIndex + 1);
    } else {
      onDismiss();
    }
  };

  if (tipIndex >= tips.length) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[9998] animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-primary text-primary-foreground rounded-xl px-5 py-3 shadow-lg max-w-sm flex items-center gap-3">
        <span className="text-sm">{tips[tipIndex].text}</span>
        <button
          onClick={handleNext}
          className="shrink-0 text-xs font-medium opacity-80 hover:opacity-100 bg-primary-foreground/20 rounded px-2 py-1"
        >
          {tipIndex < tips.length - 1 ? 'Next' : 'Got it'}
        </button>
      </div>
      <div className="flex justify-center gap-1 mt-2">
        {tips.map((_, i) => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === tipIndex ? 'bg-primary' : 'bg-muted-foreground/20'}`} />
        ))}
      </div>
    </div>
  );
}
