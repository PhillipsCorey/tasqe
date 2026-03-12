import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Check, Calendar, Clock, CheckSquare, Square, X } from "lucide-react";

const DEFAULT_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f97316","#ec4899","#14b8a6","#f59e0b","#f43f5e"];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_FULL = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

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
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
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
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr + "T00:00:00");
  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, colorClass: "bg-red-500/10 text-red-600 dark:text-red-400" };
  if (diffDays === 0) return { label: "Today", colorClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400" };
  if (diffDays === 1) return { label: "Tomorrow", colorClass: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" };
  if (diffDays <= 3) return { label: `In ${diffDays} days`, colorClass: "bg-teal-500/10 text-teal-600 dark:text-teal-400" };
  return { label: `In ${diffDays} days`, colorClass: "bg-teal-500/5 text-teal-600 dark:text-teal-500" };
}

// Floating task popover
function TaskPopover({ task, anchorRect, containerRef, onClose }) {
  const popRef = useRef(null);
  const [pos, setPos] = useState(null);

  useEffect(() => {
    if (!popRef.current || !anchorRect || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const popH = popRef.current.offsetHeight;
    const popW = popRef.current.offsetWidth;
    const MARGIN = 8;

    let top = anchorRect.bottom - container.top + MARGIN;
    let left = anchorRect.left - container.left;

    if (top + popH > container.height - MARGIN) {
      top = anchorRect.top - container.top - popH - MARGIN;
    }

    if (left + popW > container.width - MARGIN) {
      left = container.width - popW - MARGIN;
    }
    if (left < MARGIN) left = MARGIN;

    setPos({ top, left });
  }, [anchorRect, containerRef]);

  useEffect(() => {
    const handler = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const dueFmt = task.date ? formatDueDate(task.date) : null;
  const subStats = task.subtasks?.length
    ? { done: task.subtasks.filter(s => s.done).length, total: task.subtasks.length }
    : null;

  return (
    <div
      ref={popRef}
      className="absolute z-50 w-64 bg-white dark:bg-gray-800 border border-light-border dark:border-dark-border rounded-lg shadow-xl overflow-hidden"
      style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden", top: 0, left: 0 }}
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="h-1" style={{ backgroundColor: task.hex }} />

      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-sm font-semibold text-gray-800 dark:text-gray-100 leading-tight ${task.done ? "line-through opacity-60" : ""}`}>
            {task.taskName}
          </span>
          <button onClick={onClose} className="flex-shrink-0 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">
            <X size={13} className="text-gray-400" />
          </button>
        </div>
        {/* list/category */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: task.hex }}
          >
            {task.listName}
          </span>
          {task.categoryName && (
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {task.categoryName}
            </span>
          )}
        </div>

        {/* date/time*/}
        {(dueFmt || task.time) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {dueFmt && (
              <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${dueFmt.colorClass}`}>
                <Calendar size={10} />
                {dueFmt.label}
              </span>
            )}
            {task.time && (
              <span className="flex items-center gap-1 text-[10px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.5 rounded">
                <Clock size={10} />
                {task.time}
              </span>
            )}
          </div>
        )}

        {/* description */}
        {task.descr && (
          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            {task.descr}
          </p>
        )}

        {/* subtasks */}
        {task.subtasks?.length > 0 && (
          <div className="space-y-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
            {subStats && (
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block mb-0.5">
                {subStats.done}/{subStats.total} subtasks
              </span>
            )}
            {task.subtasks.map((sub, i) => (
              <div key={i} className="flex items-center gap-1.5">
                {sub.done
                  ? <CheckSquare size={13} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                  : <Square size={13} className="text-gray-400 flex-shrink-0" />
                }
                <span className={`text-xs text-gray-700 dark:text-gray-300 ${sub.done ? "line-through opacity-60" : ""}`}>
                  {sub.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PrefCalendar() {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [allLists, setAllLists] = useState([]);
  const [weekStartDay, setWeekStartDay] = useState(0);
  const [listColorMap, setListColorMap] = useState({});
  const [hiddenLists, setHiddenLists] = useState(new Set());
  const [activeTask, setActiveTask] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    chrome.storage?.local.get(null, (result) => {
      const found = [];
      Object.entries(result || {}).forEach(([key, val]) => {
        if (!val || typeof val !== "object") return;
        if (key === "todoData") {
          Object.entries(val).forEach(([listName, categories]) => {
            if (Array.isArray(categories)) {
              found.push({ id: `${key}__${listName}`, listName, todo: categories });
            }
          });
          return;
        }
        if (Array.isArray(val.todo)) {
          found.push({ id: key, listName: key, todo: val.todo });
          return;
        }
        Object.entries(val).forEach(([listName, categories]) => {
          if (Array.isArray(categories)) {
            found.push({ id: `${key}__${listName}`, listName, todo: categories });
          }
        });
      });
      setAllLists(found);

      const prefs = result.preferencesSetData || {};
      if (prefs.weekStart !== undefined) setWeekStartDay(Number(prefs.weekStart));

      const savedColors = prefs.listColors || {};
      const colorMap = {};
      let colorIdx = 0;
      found.forEach(list => {
        if (!colorMap[list.listName]) {
          colorMap[list.listName] = savedColors[list.listName] || DEFAULT_COLORS[colorIdx % DEFAULT_COLORS.length];
          colorIdx++;
        }
      });
      setListColorMap(colorMap);
    });
  }, []);

  const tasksByDate = {};
  allLists.forEach(list => {
    if (hiddenLists.has(list.listName)) return;
    list.todo.forEach(cat => {
      (cat.items || []).forEach(item => {
        const d = parseDate(item.date);
        if (!d) return;
        d.setHours(0, 0, 0, 0);
        const key = d.toDateString();
        if (!tasksByDate[key]) tasksByDate[key] = [];
        tasksByDate[key].push({
          taskName: item.name,
          descr: item.descr || "",
          date: item.date || "",
          time: item.time || "",
          done: item.done,
          subtasks: item.subtasks || [],
          listName: list.listName,
          categoryName: cat.name,
        });
      });
    });
  });

  const toggleList = (listName) => {
    setHiddenLists(prev => {
      const next = new Set(prev);
      if (next.has(listName)) next.delete(listName);
      else next.add(listName);
      return next;
    });
  };

  const handleTaskClick = (e, task) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const hex = listColorMap[task.listName] || "#6366f1";
    setActiveTask({ task: { ...task, hex }, anchorRect: rect });
  };

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

  let lastRowWithCurrentMonth = 5;
  for (let row = 5; row >= 0; row--) {
    const rowCells = cells.slice(row * 7, row * 7 + 7);
    if (rowCells.some(d => d.getMonth() === month)) {
      lastRowWithCurrentMonth = row;
      break;
    }
  }
  const visibleRows = lastRowWithCurrentMonth + 1;
  const visibleCells = cells.slice(0, visibleRows * 7);

  const MAX_VISIBLE = 3;
  const listNames = Object.keys(listColorMap);

  return (
    <div
      ref={containerRef}
      className="flex flex-1 bg-light-bg dark:bg-dark-bg overflow-hidden relative"
      onClick={() => setActiveTask(null)}
    >

      <div className="flex flex-col flex-1 overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-light-border dark:border-dark-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors text-gray-600 dark:text-gray-400"
            >
              <ChevronRight size={16} />
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
              {MONTHS_FULL[month]} {year}
            </h2>
          </div>
          <button
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="px-3 py-1.5 text-xs font-medium border border-light-border dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-light-border dark:border-dark-border flex-shrink-0">
          {dayHeaders.map(d => (
            <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide border-r border-light-border dark:border-dark-border last:border-r-0">
              {d}
            </div>
          ))}
        </div>

        {/* days grid */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="grid grid-cols-7 h-full"
            style={{ gridTemplateRows: `repeat(${visibleRows}, minmax(100px, 1fr))` }}
          >
            {visibleCells.map((day, i) => {
              const isCurrentMonth = day.getMonth() === month;
              const isToday = sameDay(day, today);
              const key = day.toDateString();
              const tasks = tasksByDate[key] || [];
              const overflowCount = tasks.length - MAX_VISIBLE;

              return (
                <div
                  key={i}
                  className={`border-r border-b border-light-border dark:border-dark-border flex flex-col min-h-0 ${
                    isCurrentMonth ? "bg-white dark:bg-dark-bg" : "bg-gray-50 dark:bg-gray-900/40"
                  }`}
                  style={{ borderRight: (i + 1) % 7 === 0 ? "none" : undefined }}
                >
                  <div className="px-2 pt-1.5 pb-1 flex-shrink-0">
                    <span className={`inline-flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full
                      ${isToday
                        ? "bg-primary text-white"
                        : isCurrentMonth
                          ? "text-gray-800 dark:text-gray-200"
                          : "text-gray-400 dark:text-gray-600"
                      }`}>
                      {day.getDate()}
                    </span>
                  </div>
                  <div className="px-1 pb-1 flex flex-col gap-0.5 flex-1 min-h-0 overflow-hidden">
                    {tasks.slice(0, MAX_VISIBLE).map((task, ti) => {
                      const hex = listColorMap[task.listName] || "#6366f1";
                      return (
                        <div
                          key={ti}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-white text-[11px] font-medium truncate cursor-pointer hover:brightness-90 transition-all ${task.done ? "opacity-50" : ""}`}
                          style={{ backgroundColor: hex }}
                          title={`${task.taskName} · ${task.listName}`}
                          onClick={(e) => handleTaskClick(e, task)}
                        >
                          <span className="truncate">{task.taskName}</span>
                        </div>
                      );
                    })}
                    {overflowCount > 0 && (
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 px-1.5 cursor-default">
                        +{overflowCount} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* legend */}
      {listNames.length > 0 && (
        <div className="w-52 flex-shrink-0 border-l border-light-border dark:border-dark-border flex flex-col bg-light-bg-sidebar dark:bg-dark-bg-sidebar overflow-hidden">
          <div className="px-4 py-3 border-b border-light-border dark:border-dark-border flex-shrink-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">My Lists</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {listNames.map(name => {
              const hex = listColorMap[name] || "#6366f1";
              const isVisible = !hiddenLists.has(name);
              return (
                <button
                  key={name}
                  onClick={(e) => { e.stopPropagation(); toggleList(name); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <span
                    className="flex-shrink-0 w-4 h-4 rounded flex items-center justify-center border-2 transition-colors"
                    style={{
                      borderColor: hex,
                      backgroundColor: isVisible ? hex : "transparent",
                    }}
                  >
                    {isVisible && <Check size={10} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className={`text-sm truncate transition-colors ${isVisible ? "text-gray-800 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}`}>
                    {name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* floater */}
      {activeTask && (
        <TaskPopover
          task={activeTask.task}
          anchorRect={activeTask.anchorRect}
          containerRef={containerRef}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  );
}