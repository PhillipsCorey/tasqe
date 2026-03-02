import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";


function IntroPage({ onNext }) {
  return (
    <div className="flex flex-col h-full justify-between py-4">
      {/* initial place for intro, navigator key explain, whatever */}
      <div className="flex flex-col gap-4">
        <span className="text-2xl font-bold text-primary tracking-tight">Welcome to tasqe</span>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          tasqe is your personal task manager built to keep you on top of what matters. Before you get started, we'll help you set things up so tasqe works the way you do.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          This will only take a moment.
        </p>
      </div>

      <button
        onClick={onNext}
        className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg transition-colors text-sm font-medium"
      >
        Get Started
      </button>

    </div>
  );
}


function ListSetupPage({ onNext }) {
  const [lists, setLists] = useState([{ name: "", categories: [""] }]);

  const addList = () => {
    setLists(prev => [...prev, { name: "", categories: [""] }]);
  };

  const removeList = (li) => {
    setLists(prev => prev.filter((_, i) => i !== li));
  };

  const updateListName = (li, val) => {
    setLists(prev => prev.map((l, i) => i === li ? { ...l, name: val } : l));
  };

  const addCategory = (li) => {
    setLists(prev => prev.map((l, i) => i === li ? { ...l, categories: [...l.categories, ""] } : l));
  };

  const removeCategory = (li, ci) => {
    setLists(prev => prev.map((l, i) => i === li ? { ...l, categories: l.categories.filter((_, j) => j !== ci) } : l));
  };

  const updateCategory = (li, ci, val) => {
    setLists(prev => prev.map((l, i) => i === li
      ? { ...l, categories: l.categories.map((c, j) => j === ci ? val : c) }
      : l
    ));
  };

  return (
    <div className="flex flex-col h-full">

      <div className="pb-3">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Your lists</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Add your to-do lists and any categories within them.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
        {lists.map((list, li) => (
          <div key={li} className="border border-light-border dark:border-dark-border rounded-lg overflow-hidden">
            {/* adding lists */}
            <div className="flex items-center gap-2 px-3 py-2 bg-light-bg-sidebar dark:bg-dark-bg-sidebar border-b border-light-border dark:border-dark-border">
              <input
                type="text"
                placeholder="List name..."
                value={list.name}
                onChange={e => updateListName(li, e.target.value)}
                className="flex-1 bg-transparent text-sm font-medium text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              {lists.length > 1 && (
                <button
                  onClick={() => removeList(li)}
                  className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  <Trash2 size={12} className="text-gray-400 hover:text-red-500" />
                </button>
              )}
            </div>

            <div className="px-3 py-2 space-y-1.5">
              {list.categories.map((cat, ci) => (
                <div key={ci} className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">—</span>
                  <input
                    type="text"
                    placeholder="Category (optional)..."
                    value={cat}
                    onChange={e => updateCategory(li, ci, e.target.value)}
                    className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 outline-none border-b border-light-border dark:border-dark-border py-0.5"
                  />
                  {list.categories.length > 1 && (
                    <button
                      onClick={() => removeCategory(li, ci)}
                      className="p-0.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={10} className="text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => addCategory(li)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors pt-0.5"
              >
                <Plus size={12} />
                Add category
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={addList}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
        >
          <Plus size={12} />
          Add another list
        </button>
      </div>

      <div className="pt-3 border-t border-light-border dark:border-dark-border mt-3">
        <button
          onClick={() => onNext(lists)}
          className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Next
        </button>
      </div>

    </div>
  );
}


const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function PreferencesPage({ onNext }) {
  const [daysAhead, setDaysAhead]       = useState(7);
  const [datelessMode, setDatelessMode] = useState("always");
  const [doneMode, setDoneMode]         = useState("strikethrough");
  const [weekStart, setWeekStart]       = useState(0);

  return (
    <div className="flex flex-col h-full">

      <div className="pb-3">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Preferences</span>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Customize how tasqe displays your tasks.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-0.5">

        {/* range of task display*/}
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
            <span>1</span>
            <span>7</span>
            <span>14</span>
            <span>21</span>
          </div>
        </div>

        <div className="h-px bg-light-border dark:bg-dark-border" />

        {/* dateless task dealing */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Dateless tasks</span>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">How would you like to view tasks without a deadline?</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="dateless"
                checked={datelessMode === "always"}
                onChange={() => setDatelessMode("always")}
                className="accent-primary"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Always visible in their category</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="dateless"
                checked={datelessMode === "separate"}
                onChange={() => setDatelessMode("separate")}
                className="accent-primary"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Grouped in a separate "Undated" section</span>
            </label>
          </div>
        </div>

        <div className="h-px bg-light-border dark:bg-dark-border" />

        {/* done tasks dealing */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Completed tasks</span>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">How would you like to view tasks you've marked done?</p>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="done"
                checked={doneMode === "strikethrough"}
                onChange={() => setDoneMode("strikethrough")}
                className="accent-primary"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Struck through until deadline passes</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="done"
                checked={doneMode === "separate"}
                onChange={() => setDoneMode("separate")}
                className="accent-primary"
              />
              <span className="text-xs text-gray-700 dark:text-gray-300">Moved to a separate "Done" section until deadline passes</span>
            </label>
          </div>
        </div>

        <div className="h-px bg-light-border dark:bg-dark-border" />

        {/* week start day*/}
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

      </div>

      <div className="pt-3 border-t border-light-border dark:border-dark-border mt-3">
        <button
          onClick={() => onNext({ daysAhead, datelessMode, doneMode, weekStart })}
          className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg transition-colors text-sm font-medium"
        >
          Finish
        </button>
      </div>

    </div>
  );
}


export default function Setup({ onComplete }) {
  const [page, setPage] = useState(0);
  const [lists, setLists] = useState([]);

  return (
    <div className="flex flex-col h-full">
      {/* pages dots */}
      <div className="flex items-center justify-center gap-1.5 py-2">
        {[0, 1, 2].map(i => (
          <span key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${page === i ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"}`} />
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {page === 0 && <IntroPage onNext={() => setPage(1)} />}
        {page === 1 && <ListSetupPage onNext={(l) => { setLists(l); setPage(2); }} />}
        {page === 2 && <PreferencesPage onNext={(prefs) => onComplete(lists, prefs)} />}
      </div>
    </div>
  );
}