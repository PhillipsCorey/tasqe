import { useState, useEffect, useRef } from "react";
import { Plus, ChevronDown, ChevronRight, CheckSquare, Square, Clock, Calendar, Trash2 } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parseDate(dateStr) {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch.map(Number);
    return new Date(year, month - 1, day);
  }
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    let [month, day, year] = parts.map(Number);
    if (year < 100) year += 2000;
    return new Date(year, month - 1, day);
  }
  return null;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function startOfWeek(date) {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeekDay(date, startDay = 0) {
  const d = new Date(date);
  const diff = (d.getDay() - startDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = parseDate(dateStr);
  if (!due) return null;

  const diffMs = due - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let label;
  let colorClass;

  if (diffDays < 0) {
    label = `${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""} overdue`;
    colorClass = "bg-red-500/10 text-red-600 dark:text-red-400";
  }

  else if (diffDays === 0) {
    label = "Today";
    colorClass = "bg-orange-500/10 text-orange-600 dark:text-orange-400";
  }

  else if (diffDays === 1) {
    label = "Tomorrow";
    colorClass = "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  }

  else if (diffDays <= 3) {
    label = `In ${diffDays} days`;
    colorClass = "bg-teal-500/10 text-teal-600 dark:text-teal-400";
  }

  else {
    label = `In ${diffDays} days`;
    colorClass = "bg-teal-500/5 text-teal-600 dark:text-teal-500";
  }

  return { label, colorClass };
}


function MonthView({ allLists, weekStartDay }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [hoveredDay, setHoveredDay] = useState(null);
  const [lockedDay, setLockedDay] = useState(null);

  const tasksByDate = {};
  allLists.forEach(list => {
    list.todo.forEach(cat => {
      (cat.items || []).forEach(item => {
        const d = parseDate(item.date);
        if (!d) return;
        d.setHours(0, 0, 0, 0);
        const key = d.toDateString();
        if (!tasksByDate[key]) tasksByDate[key] = [];
        tasksByDate[key].push({ taskName: item.name, listName: list.listName });
      });
    });
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = startOfWeekDay(firstOfMonth, weekStartDay);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
  const dayHeaders = Array.from({ length: 7 }, (_, i) => DAYS[(weekStartDay + i) % 7]);

  return (
    <div className="flex flex-col h-full gap-2" onClick={() => setLockedDay(null)}>
      <div className="flex items-center justify-between px-1">
        <button onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400 text-xs leading-none">‹</button>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{MONTHS_FULL[month]} {year}</span>
        <button onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400 text-xs leading-none">›</button>
      </div>

      <div className="grid grid-cols-7 gap-px">
        {dayHeaders.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 dark:text-gray-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px flex-1 relative" style={{ gridAutoRows: "min-content" }}>
        {cells.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = sameDay(day, today);
          const key = day.toDateString();
          const tasks = tasksByDate[key] || [];
          const hasDot = tasks.length > 0;
    
          return (
            <div key={i}
              className="relative flex flex-col items-center pt-1 pb-0.5 rounded-md cursor-default select-none"
              onMouseEnter={() => !lockedDay && setHoveredDay(day)}
              onMouseLeave={() => !lockedDay && setHoveredDay(null)}
              onClick={(e) => { e.stopPropagation(); setLockedDay(prev => prev && sameDay(prev, day) ? null : day); }}
            >
              <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors
                ${isToday ? "bg-primary text-white"
                  : isCurrentMonth ? "text-gray-700 dark:text-gray-200"
                  : "text-gray-300 dark:text-gray-600"}`}>
                {day.getDate()}
              </span>
              <span className={`mt-0.5 w-1 h-1 rounded-full ${hasDot ? "bg-primary" : "bg-transparent"}`} />
            </div>
          );
        })}
      </div>
        <div className="border-t border-light-border dark:border-dark-border pt-2 flex-1 overflow-y-auto" onMouseLeave={() => !lockedDay && setHoveredDay(null)}>
        {(lockedDay || hoveredDay) ? (
          <>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-1.5 px-1 flex items-center gap-1.5">
              {MONTHS[(lockedDay || hoveredDay).getMonth()]} {(lockedDay || hoveredDay).getDate()}
              {lockedDay && <span className="text-[9px] bg-primary/10 text-primary px-1 py-0.5 rounded">pinned</span>}
            </div>
            {(tasksByDate[(lockedDay || hoveredDay).toDateString()] || []).length === 0 ? (
              <span className="text-xs text-gray-400 dark:text-gray-500 px-1">No tasks due.</span>
            ) : (
              <div className="space-y-1">
                {(tasksByDate[(lockedDay || hoveredDay).toDateString()] || []).map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1 rounded-md bg-light-bg-sidebar dark:bg-dark-bg-sidebar">
                    <span className="text-xs text-gray-700 dark:text-gray-200 truncate">{t.taskName}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2 shrink-0">{t.listName}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500 px-1">Hover a day to see tasks.</span>
        )}
      </div>
    </div>
  );
}


function AddTaskModal({ categoryName, onAdd, onClose }) {
  const [name, setName]  = useState("");
  const [descr, setDescr] = useState("");
  const [time, setTime]  = useState("");
  const [date, setDate]  = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), descr, time, date, done: false, subtasks: [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-xl w-72 flex flex-col overflow-hidden">

        <div className="px-4 pt-4 pb-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
            Add to <span className="text-primary italic">{categoryName}</span>
          </h3>
        </div>

        <div className="px-4 pb-2 space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Task name..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none"
          />
          <input
            type="text"
            placeholder="Description (optional)..."
            value={descr}
            onChange={e => setDescr(e.target.value)}
            className="w-full bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none"
          />
          <input
            type="text"
            placeholder="Duration (e.g. 30 mins)..."
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none"
          />
          <input
            type="text"
            placeholder="Deadline MM/DD/YY (optional)..."
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-light-border dark:border-dark-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function DayAddModal({ allLists, selectedDay, onAdd, onClose }) {
  const dateStr = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, "0")}-${String(selectedDay.getDate()).padStart(2, "0")}`;

  const options = allLists.flatMap(list =>
    list.todo.map(cat => ({
      listId: list.id,
      listName: list.listName,
      categoryName: cat.name,
      label: list.todo.length > 1 ? `${list.listName} › ${cat.name}` : list.listName,
    }))
  );

  const [selectedOption, setSelectedOption] = useState(options[0]?.listId + "||" + options[0]?.categoryName || "");
  const [name, setName]   = useState("");
  const [descr, setDescr] = useState("");
  const [time, setTime]   = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !selectedOption) return;
    const [listId, categoryName] = selectedOption.split("||");
    onAdd(listId, categoryName, { name: name.trim(), descr, time, date: dateStr, done: false, subtasks: [] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-xl w-72 flex flex-col overflow-hidden">

        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Add task</h3>
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border px-2 py-0.5 rounded-md">
            {MONTHS[selectedDay.getMonth()]} {selectedDay.getDate()}
          </span>
        </div>

        <div className="px-4 pb-2 space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="Task name..."
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none"
          />
          <select
            value={selectedOption}
            onChange={e => setSelectedOption(e.target.value)}
            className="w-full bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-lg outline-none cursor-pointer"
          >
            {options.map((opt, i) => (
              <option key={i} value={opt.listId + "||" + opt.categoryName}>
                {opt.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Description (optional)..."
            value={descr}
            onChange={e => setDescr(e.target.value)}
            className="w-full bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none"
          />
          <input
            type="text"
            placeholder="Duration (e.g. 30 mins)..."
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full bg-transparent border border-light-border dark:border-dark-border text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 px-3 py-1.5 rounded-lg outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-light-border dark:border-dark-border">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default function WeekCalendar({onClose}) {
  const [allLists, setAllLists] = useState([]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [modal, setModal] = useState(null);
  const [activeListFilter, setActiveListFilter] = useState("all");
  const [dayAddModal, setDayAddModal] = useState(false);

  const [daysAhead, setDaysAhead]       = useState(7);
  const [datelessMode, setDatelessMode] = useState("always");
  const [doneMode, setDoneMode]         = useState("strikethrough");
  const [weekStartDay, setWeekStartDay] = useState(0);
  const [calView, setCalView] = useState("week"); 


  const today = new Date(); today.setHours(0, 0, 0, 0);

  //load from chrome storage
  useEffect(() => {
    chrome.storage?.local.get(null, (result) => {
      const found = [];

      Object.entries(result || {}).forEach(([key, val]) => {
        if (!val || typeof val !== "object") return;

        if (key === "todoData") {
          Object.entries(val).forEach(([listName, categories]) => {
            if (Array.isArray(categories)) {
              found.push({ id: `${key}__${listName}`, storageKey: key, listName, todo: categories });
            }
          });
          return;
        }

        if (Array.isArray(val.todo)) {
          found.push({ id: key, storageKey: key, listName: key, todo: val.todo });
          return;
        }

        Object.entries(val).forEach(([listName, categories]) => {
          if (Array.isArray(categories)) {
            found.push({ id: `${key}__${listName}`, storageKey: key, listName, todo: categories });
          }
        });
      });

      setAllLists(found);

      const prefs = result.preferencesSetData || {};
      if (prefs.daysAhead !== undefined) setDaysAhead(Number(prefs.daysAhead));
      if (prefs.datelessMode !== undefined) setDatelessMode(prefs.datelessMode);
      if (prefs.doneMode !== undefined) setDoneMode(prefs.doneMode);
      if (prefs.weekStart !== undefined) {
        setWeekStartDay(Number(prefs.weekStart));
        setWeekStart(startOfWeekDay(new Date(), Number(prefs.weekStart)));
      }

    });
  }, []);

  const saveList = (listId, newTodo) => {
    setAllLists(prev => prev.map(l => l.id === listId ? { ...l, todo: newTodo } : l));

    const list = allLists.find(l => l.id === listId);
    if (!list) return;

    if (list.storageKey === "todoData") {
      chrome.storage?.local.get(["todoData"], (result) => {
        const current = result?.todoData || {};
        chrome.storage?.local.set({ todoData: { ...current, [list.listName]: newTodo } });
      });
    } else {
      chrome.storage?.local.set({ [list.storageKey]: { todo: newTodo } });
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const rangeEnd = new Date(selectedDay);
  rangeEnd.setDate(rangeEnd.getDate() + daysAhead);
  rangeEnd.setHours(0, 0, 0, 0);

  const allGroupedTasks = (() => {
  const cutoffDays = new Date(today);
  cutoffDays.setDate(today.getDate() + daysAhead);
  cutoffDays.setHours(23, 59, 59, 999);

  const isToday = sameDay(selectedDay, today);
  const cutoff = new Date(selectedDay);
  cutoff.setDate(cutoff.getDate() + daysAhead);
  cutoff.setHours(23, 59, 59, 999);

  

  const groups = [];
  const undatedItems = [];

  allLists.forEach(list => {
    list.todo.forEach(category => {
      const relevant = (category.items || []).filter(item => {
        const d = parseDate(item.date);

        if (!d) {
          if (datelessMode === "separate") {
            undatedItems.push({ ...item, listId: list.id, listName: list.listName, categoryName: category.name });
          }
          return datelessMode === "always";
        }

        d.setHours(0, 0, 0, 0);
        if (item.done && d < today) return false;
        return d <= cutoff;
      });
      if (relevant.length > 0) {
        groups.push({
          listId: list.id,
          listName: list.listName,
          categoryName: category.name,
          items: relevant,
        });
      }
    });
  });

  groups.sort((a, b) => {
    const minDate = arr =>
      arr.reduce((best, item) => {
        const d = parseDate(item.date);
        return d && (!best || d < best) ? d : best;
      }, null);
    const da = minDate(a.items);
    const db = minDate(b.items);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });

  // display pref for undated
  if (datelessMode === "separate" && undatedItems.length > 0) {
    groups.push({
      listId: "undated",
      listName: "",
      categoryName: "Undated",
      items: undatedItems,
    });
  }

  return groups;
})();

  //category selection between dates and shown tasks
  const activeCategoryNames = [...new Set(allGroupedTasks.map(g => g.categoryName))];

  const groupedTasks = activeListFilter === "all"
    ? allGroupedTasks
    : allGroupedTasks.filter(g => g.categoryName === activeListFilter);

  const hasTasks = (day) => {
    return allLists.some(list =>
      list.todo.some(cat =>
        (cat.items || []).some(item => {
          const d = parseDate(item.date);
          if (!d) return false;
          d.setHours(0, 0, 0, 0);
          if (item.done && d < today) return false;
          return sameDay(d, day);
        })
      )
    );
  };

  const toggleDone = (listId, categoryName, itemName) => {
    const list = allLists.find(l => l.id === listId);
    if (!list) return;
    const newTodo = list.todo.map(cat => {
      if (cat.name !== categoryName) return cat;
      return {
        ...cat,
        items: cat.items.map(item =>
          item.name === itemName ? { ...item, done: !item.done } : item
        ),
      };
    });
    saveList(listId, newTodo);
  };


  const toggleSubtaskDone = (listId, categoryName, itemName, subIndex) => {
    const list = allLists.find(l => l.id === listId);
    if (!list) return;

    const newTodo = list.todo.map(cat => {
      if (cat.name !== categoryName) return cat;

      return {
        ...cat,
        items: (cat.items || []).map(item => {
          if (item.name !== itemName) return item;

          const nextSubs = (item.subtasks || []).map((s, i) =>
            i === subIndex ? { ...s, done: !s.done } : s
          );

          return { ...item, subtasks: nextSubs };
        }),
      };
    });

    saveList(listId, newTodo);
  };
  
  const deleteTask = (listId, categoryName, itemName) => {
    const list = allLists.find(l => l.id === listId);
    if (!list) return;

    const newTodo = list.todo.map(cat => {
      if (cat.name !== categoryName) return cat;
      return { ...cat, items: (cat.items || []).filter(item => item.name !== itemName) };
    });

    saveList(listId, newTodo);
  };

  const handleAdd = ({ listId, categoryName }, newItem) => {
    const list = allLists.find(l => l.id === listId);
    if (!list) return;
    const newTodo = list.todo.map(cat => {
      if (cat.name !== categoryName) return cat;
      return { ...cat, items: [...cat.items, newItem] };
    });
    saveList(listId, newTodo);
  };

  const totalTaskCount = groupedTasks.reduce((s, g) => s + g.items.length, 0);

  const inner = (
    <div className="flex flex-col h-full gap-3">

      <div className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border rounded-lg px-2 py-2">
        {/* moving weeks buttons */}
        <div className="flex items-center justify-between mb-2 px-1">
          <button
            onClick={() => { const prev = new Date(weekStart); prev.setDate(prev.getDate() - 7); setWeekStart(startOfWeekDay(prev, weekStartDay)); }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400 text-xs leading-none"
          >
            ‹
          </button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {MONTHS[weekStart.getMonth()]} {weekStart.getFullYear()}
          </span>
          <button
            onClick={() => { const next = new Date(weekStart); next.setDate(next.getDate() + 7); setWeekStart(startOfWeekDay(next, weekStartDay)); }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400 text-xs leading-none"
          >
            ›
          </button>
        </div>

        {/* each day */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day, i) => {
            const isToday    = sameDay(day, today);
            const isSelected = sameDay(day, selectedDay);
            const hasDot     = hasTasks(day);

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(new Date(day))}
                className={`flex flex-col items-center py-1.5 rounded-lg transition-colors relative ${
                  isSelected
                    ? "bg-primary text-white"
                    : isToday
                      ? "bg-primary/15 text-primary dark:text-primary"
                      : "hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <span className="text-[10px] font-medium leading-none mb-1 opacity-70">
                  {DAYS[day.getDay()]}
                </span>
                <span className="text-sm font-bold leading-none">
                  {day.getDate()}
                </span>
                <span className={`mt-1 w-1 h-1 rounded-full transition-colors ${
                  hasDot ? isSelected ? "bg-white" : "bg-primary" : "bg-transparent"
                }`} />
              </button>
            );
          })}
        </div>

      </div>

      {/* date below week */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 shrink-0">
          {sameDay(selectedDay, today)
            ? `Tasks due in the next ${daysAhead} day${daysAhead !== 1 ? "s" : ""}`
            : `Tasks due by ${MONTHS[rangeEnd.getMonth()]} ${rangeEnd.getDate()}`
          }
        </span>

        <div className="flex-1 h-px bg-light-border dark:bg-dark-border" />

        {/* filter*/}
        {activeCategoryNames.length > 1 && (
          <select
            value={activeListFilter}
            onChange={e => setActiveListFilter(e.target.value)}
            className="bg-light-bg-sidebar dark:bg-dark-bg-sidebar border border-light-border dark:border-dark-border text-[11px] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-lg outline-none cursor-pointer max-w-[110px] truncate"
          >
            <option value="all">All</option>
            {activeCategoryNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        )}

        {/* count */}
        <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
          {totalTaskCount} task{totalTaskCount !== 1 ? "s" : ""}
        </span>

        {/* add by day*/}
        <button
          onClick={() => setDayAddModal(true)}
          className="shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Add task for this day"
        >
          <Plus size={14} className="text-primary" />
        </button>
      </div>

      {/* categories*/}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {groupedTasks.length === 0 ? (
          <div className="flex items-center justify-center h-24">
            <span className="text-sm text-gray-400 dark:text-gray-500">
              {sameDay(selectedDay, today)
                ? `No tasks due in the next ${daysAhead} day${daysAhead !== 1 ? "s" : ""}.`
                : `No tasks due by ${MONTHS[rangeEnd.getMonth()]} ${rangeEnd.getDate()}.`
                }
            </span>
          </div>
        ) : (
          groupedTasks.map((group, gi) => (
            <CategoryGroup
              group={group}
              doneMode={doneMode}
              onToggleTask={(itemName) => toggleDone(group.listId, group.categoryName, itemName)}
              onToggleSubtask={(itemName, subIndex) =>
                toggleSubtaskDone(group.listId, group.categoryName, itemName, subIndex)
              }
              onDeleteTask={(itemName) =>
                deleteTask(group.listId, group.categoryName, itemName)
              }
              onAdd={() => setModal({ listId: group.listId, categoryName: group.categoryName })}
            />
          ))
        )}
      </div>

      {modal && (
        <AddTaskModal
          categoryName={modal.categoryName}
          onAdd={(item) => handleAdd(modal, item)}
          onClose={() => setModal(null)}
        />
      )}

      {dayAddModal && (
        <DayAddModal
          allLists={allLists}
          selectedDay={selectedDay}
          onAdd={(listId, categoryName, item) => handleAdd({ listId, categoryName }, item)}
          onClose={() => setDayAddModal(false)}
        />
      )}
    </div>
  );

  if (onClose) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-xl w-96 h-[600px] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-light-border dark:border-dark-border flex-shrink-0">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Views</span>
            <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-500 dark:text-gray-400 text-lg leading-none">✕</button>
          </div>
          <div className="flex border-b border-light-border dark:border-dark-border flex-shrink-0">
            {["week", "month"].map(v => (
              <button key={v} onClick={() => setCalView(v)}
                className={`flex-1 py-2 text-xs font-semibold capitalize transition-colors
                  ${calView === v ? "text-primary border-b-2 border-primary -mb-px" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"}`}>
                {v}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-hidden px-4 py-3">
            {calView === "week" ? inner : <MonthView allLists={allLists} weekStartDay={weekStartDay} />}
          </div>
        </div>
      </div>
    );
  }
  return inner;


}

// tasks under each category
function CategoryGroup({ group, doneMode, onToggleTask, onToggleSubtask, onDeleteTask, onAdd }) {  const [collapsed, setCollapsed] = useState(false);
  const doneCount = group.items.filter(i => i.done).length;

  // doneitems section for seperate
  const undoneItems = group.items.filter(i => !i.done);
  const doneItems   = group.items.filter(i => i.done);

  return (
    <div className="border border-light-border dark:border-dark-border rounded-lg overflow-hidden">

      {/* category name, list name, completion, expand/collaps, addtothiscategory*/}
      <div className="flex items-center gap-2 px-3 py-2 bg-light-bg-sidebar dark:bg-dark-bg-sidebar border-b border-light-border dark:border-dark-border">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
        >
          {collapsed
            ? <ChevronRight size={14} className="text-gray-500 dark:text-gray-400" />
            : <ChevronDown  size={14} className="text-gray-500 dark:text-gray-400" />}
        </button>

        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wide">
            {group.categoryName}
          </span>
          {group.listName !== "To Do List" && group.listName !== "" && (
            <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-500 normal-case tracking-normal">
              · {group.listName}
            </span>
          )}
        </div>

        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          doneCount === group.items.length
            ? "bg-green-500/20 text-green-700 dark:text-green-400"
            : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
        }`}>
          {doneCount}/{group.items.length}
        </span>

        <button
          onClick={onAdd}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          title="Add task to this category"
        >
          <Plus size={12} className="text-primary" />
        </button>
      </div>

      {!collapsed && (
        <div className="divide-y divide-light-border dark:divide-dark-border">
          {(doneMode === "separate" ? undoneItems : group.items).map((item, idx) => (
            <TaskRow
              key={idx}
              item={item}
              onToggleTask={() => onToggleTask(item.name)}
              onToggleSubtask={(subIndex) => onToggleSubtask(item.name, subIndex)}
              onDelete={() => onDeleteTask(item.name)}
            />
          ))}

          {/* seperate done section */}
          {doneMode === "separate" && doneItems.length > 0 && (
            <>
              <div className="px-3 py-1 bg-light-bg-sidebar dark:bg-dark-bg-sidebar">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Done</span>
              </div>
                {doneItems.map((item, idx) => (
                  <TaskRow
                    key={`done-${idx}`}
                    item={item}
                    onToggleTask={() => onToggleTask(item.name)}
                    onToggleSubtask={(subIndex) => onToggleSubtask(item.name, subIndex)}
                    onDelete={() => onDeleteTask(item.name)}
                  />
                ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ item, onToggleTask, onToggleSubtask, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const deadline = parseDate(item.date);
  const today    = new Date(); today.setHours(0, 0, 0, 0);

  return (
    <div className="px-3 py-2 bg-white dark:bg-dark-bg">

      {/* done box, subtask toggle, and description outside of the rest */}
      <div className="flex items-start gap-2">
        <button onClick={onToggleTask} className="mt-0.5 flex-shrink-0">
          {item.done
            ? <CheckSquare size={16} className="text-green-600 dark:text-green-400" />
            : <Square      size={16} className="text-gray-400" />}
        </button>

        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => item.subtasks?.length > 0 && setExpanded(e => !e)}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-medium text-gray-800 dark:text-gray-200 ${item.done ? "line-through opacity-60" : ""}`}>
              {item.name}
            </span>

            {item.done && (
              <span className="text-[10px] bg-green-500/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
                Done
              </span>
            )}
            {item.time && (
              <span className="flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded">
                <Clock size={10} />
                {item.time}
              </span>
            )}
            {item.date && formatDueDate(item.date) && (
              <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${formatDueDate(item.date).colorClass}`}>
                <Calendar size={10} />
                {formatDueDate(item.date).label}
              </span>
            )}
          </div>

          {item.descr && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.descr}</p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
          title="Delete task"
        >
          <Trash2 size={14} className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400" />
        </button>

        {item.subtasks && item.subtasks.length > 0 && (
          
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors flex-shrink-0"
          >
            {expanded
              ? <ChevronDown  size={12} className="text-gray-400" />
              : <ChevronRight size={12} className="text-gray-400" />}
          </button>
        )}
      </div>

      {/* subtasks */}
      {expanded && item.subtasks && item.subtasks.length > 0 && (
        <div className="mt-2 ml-6 space-y-1 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
          {item.subtasks.map((sub, si) => (
            <div key={si} className="flex items-center gap-2">
              <button onClick={(e) => {e.stopPropagation(); onToggleSubtask(si)}} className="flex-shrink-0">
                {sub.done
                  ? <CheckSquare size={14} className="text-green-600 dark:text-green-400" />
                  : <Square size={14} className="text-gray-400" />}
              </button>
              <span className={`text-xs text-gray-700 dark:text-gray-300 flex-1 ${sub.done ? "line-through opacity-60" : ""}`}>
                {sub.name}
              </span>
              {sub.time && (
                <span className="flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded">
                  <Clock size={10} />
                  {sub.time}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}