import { useState } from 'react';
import { ChatView } from './components/chat/ChatView';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { useSidecar } from './hooks/useSidecar';

function App() {
  const { connected } = useSidecar();
  const [showSettings, setShowSettings] = useState(false);

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
