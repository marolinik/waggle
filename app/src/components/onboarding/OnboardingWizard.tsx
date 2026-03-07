import { useState } from 'react';
import { ipc } from '../../lib/ipc';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [role, setRole] = useState('personal assistant');
  const [apiKey, setApiKey] = useState('');

  const handleFinish = async () => {
    if (apiKey) await ipc.setSettings('apiKey', apiKey);
    localStorage.setItem('waggle_onboarded', 'true');
    localStorage.setItem('waggle_agent_name', name || 'Waggle');
    localStorage.setItem('waggle_agent_role', role);
    onComplete();
  };

  const steps = [
    // Step 0: Welcome
    <div key="welcome" className="text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to Waggle</h1>
      <p className="text-[hsl(var(--muted-foreground))] mb-8">
        Your personal AI agent swarm. Let's set things up.
      </p>
      <button onClick={() => setStep(1)} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-6 py-2 rounded-lg font-medium hover:opacity-90">
        Get Started
      </button>
    </div>,
    // Step 1: Name your agent
    <div key="name">
      <h2 className="text-xl font-semibold mb-4">Name your agent</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., Waggle, Jarvis, Friday..."
        className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-4 py-3 text-sm text-[hsl(var(--foreground))] mb-4"
      />
      <label className="block text-sm font-medium mb-2">Role</label>
      <select
        value={role}
        onChange={(e) => setRole(e.target.value)}
        className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-4 py-2 text-sm text-[hsl(var(--foreground))] mb-6"
      >
        <option value="personal assistant">Personal Assistant</option>
        <option value="research assistant">Research Assistant</option>
        <option value="coding assistant">Coding Assistant</option>
        <option value="writing assistant">Writing Assistant</option>
      </select>
      <div className="flex gap-3">
        <button onClick={() => setStep(0)} className="text-sm text-[hsl(var(--muted-foreground))]">Back</button>
        <button onClick={() => setStep(2)} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 rounded-lg text-sm font-medium">Next</button>
      </div>
    </div>,
    // Step 2: API Key
    <div key="apikey">
      <h2 className="text-xl font-semibold mb-4">Connect your AI provider</h2>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
        Waggle uses your own API key. Your data stays on your machine.
      </p>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-ant-..."
        className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--secondary))] px-4 py-3 text-sm text-[hsl(var(--foreground))] mb-6"
      />
      <div className="flex gap-3">
        <button onClick={() => setStep(1)} className="text-sm text-[hsl(var(--muted-foreground))]">Back</button>
        <button onClick={handleFinish} className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-4 py-2 rounded-lg text-sm font-medium">
          {apiKey ? 'Finish Setup' : 'Skip for Now'}
        </button>
      </div>
    </div>,
  ];

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-full max-w-md p-8">
        {steps[step]}
      </div>
    </div>
  );
}
