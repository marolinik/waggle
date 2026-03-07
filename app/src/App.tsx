import { useState } from 'react';
import { ChatView } from './components/chat/ChatView';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { useSidecar } from './hooks/useSidecar';

function App() {
  const { connected } = useSidecar();
  const [showSettings, setShowSettings] = useState(false);
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('waggle_onboarded') === 'true'
  );

  if (!onboarded) {
    return <OnboardingWizard onComplete={() => setOnboarded(true)} />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar connected={connected} onSettingsClick={() => setShowSettings(!showSettings)} />
      <div className="flex-1">
        {showSettings ? (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        ) : (
          <ChatView />
        )}
      </div>
    </div>
  );
}

export default App;
