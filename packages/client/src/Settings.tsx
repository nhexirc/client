import { useState, useEffect } from "react";
import UserSettings from './lib/userSettings';
import { UserSettingsIface } from './lib/types';
import LoggingSettings from './settings/Logging';
import MessageBoxSettings from './settings/MessageBox';
import NetworkSettings from './settings/Network';
import DNDSettings from './settings/DragAndDrop';

export default function ({ isNight }) {
  const [settings, setSettings] = useState<UserSettingsIface>(null);

  useEffect(() => {
    async function getSettings() {
      setSettings(await UserSettings.load());
    }

    if (!settings) {
      getSettings();
    }
  });

  const sectionStyle = (isNight ? "bg-slate-800" : "bg-orange-300") + " p-4 m-4 rounded";

  return (
    <div className="align-top mx-auto mt-1 mb-auto w-1/2">
      <div className="text-4xl my-8 p-4">Settings</div>

      <div className={sectionStyle}>
        <DNDSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </DNDSettings>
      </div>

      <div className={sectionStyle}>
        <LoggingSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </LoggingSettings>
      </div>

      <div className={sectionStyle}>
        <MessageBoxSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </MessageBoxSettings>
      </div>

      <div className={sectionStyle}>
        <NetworkSettings isNight={isNight} settings={settings} setSettings={setSettings}>
        </NetworkSettings>
      </div>
    </div>
  );
}