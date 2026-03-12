import { useState, useEffect } from "react";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PrefModal({ onClose }) {
  const [daysAhead, setDaysAhead] = useState(7);
  const [datelessMode, setDatelessMode] = useState("always");
  const [doneMode, setDoneMode] = useState("strikethrough");
  const [weekStart, setWeekStart] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [listColors, setListColors] = useState({});
  const [listNames, setListNames] = useState([]);

  useEffect(() => {
    chrome.storage?.local.get(["preferencesSetData", "todoData"], (result) => {
        const prefs = result?.preferencesSetData || {};
        if (prefs.daysAhead !== undefined)    setDaysAhead(Number(prefs.daysAhead));
        if (prefs.datelessMode !== undefined) setDatelessMode(prefs.datelessMode);
        if (prefs.doneMode !== undefined)     setDoneMode(prefs.doneMode);
        if (prefs.weekStart !== undefined)    setWeekStart(Number(prefs.weekStart));
        const names = Object.keys(result?.todoData || {});
        setListNames(names);
        setListColors(prefs.listColors || {});
        setLoaded(true);
    });
  }, []);

  const handleSave = () => {
    const preferences = { daysAhead, datelessMode, doneMode, weekStart, listColors };
    chrome.storage?.local.set({ preferencesSetData: preferences }, () => {
      onClose();
    });
  };

  if (!loaded) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-xl w-80 flex flex-col overflow-hidden">
        
        <div className="px-4 pt-4 pb-2 border-b border-light-border dark:border-dark-border">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Preferences</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Customize how tasqe displays your tasks.</p>
        </div>

        <div className="px-4 py-4 space-y-5 overflow-y-auto max-h-[70vh]">

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Days ahead to show</span>
              <span className="text-xs font-medium text-primary">{daysAhead} days</span>
            </div>
            <input
              type="range"
              min={1}
              max={21}
              value={daysAhead}
              onChange={e => setDaysAhead(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
              <span>1</span><span>7</span><span>14</span><span>21</span>
            </div>
          </div>

          <div className="h-px bg-light-border dark:bg-dark-border" />

          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Dateless tasks</span>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">How would you like to view tasks without a deadline?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="pref-dateless" checked={datelessMode === "always"} onChange={() => setDatelessMode("always")} className="accent-primary" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Always visible in their category</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="pref-dateless" checked={datelessMode === "separate"} onChange={() => setDatelessMode("separate")} className="accent-primary" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Grouped in a separate "Undated" section</span>
              </label>
            </div>
          </div>

          <div className="h-px bg-light-border dark:bg-dark-border" />

          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Completed tasks</span>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">How would you like to view tasks you've marked done?</p>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="pref-done" checked={doneMode === "strikethrough"} onChange={() => setDoneMode("strikethrough")} className="accent-primary" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Struck through until deadline passes</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="radio" name="pref-done" checked={doneMode === "separate"} onChange={() => setDoneMode("separate")} className="accent-primary" />
                <span className="text-xs text-gray-700 dark:text-gray-300">Moved to a separate "Done" section</span>
              </label>
            </div>
          </div>

          <div className="h-px bg-light-border dark:bg-dark-border" />

          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Week starts on</span>
            <select
              value={weekStart}
              onChange={e => setWeekStart(Number(e.target.value))}
              className="w-full bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
            >
              {DAYS_OF_WEEK.map((day, i) => (
                <option key={i} value={i}>{day}</option>
              ))}
            </select>
          </div>

          <div className="h-px bg-light-border dark:bg-dark-border" />

          <div className="space-y-2">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">List colors</span>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Click a swatch to change a list's calendar color.</p>
            <div className="space-y-2">
              {listNames.map(name => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-xs text-gray-700 dark:text-gray-300 truncate flex-1 mr-3">{name}</span>
                  <input
                    type="color"
                    value={listColors[name] || "#3b82f6"}
                    onChange={e => setListColors(prev => ({ ...prev, [name]: e.target.value }))}
                    className="w-7 h-7 rounded cursor-pointer border border-light-border dark:border-dark-border bg-transparent"
                  />
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-light-border dark:border-dark-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}