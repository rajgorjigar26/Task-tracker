import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, Check, X, Calendar, Home, CircleAlert } from 'lucide-react';

const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
  .tm-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
  .tm-body { font-family: 'Inter', sans-serif; }
  .tm-mono { font-family: 'IBM Plex Mono', monospace; }

  @keyframes tm-slide-in {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes tm-fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .tm-item-enter { animation: tm-slide-in 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
  .tm-item-exit {
    opacity: 0;
    transform: translateX(14px) scale(0.97);
    max-height: 0 !important;
    margin-top: 0 !important;
    margin-bottom: 0 !important;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
    border-width: 0 !important;
  }
  .tm-item {
    transition: opacity 0.22s ease, transform 0.22s ease, max-height 0.32s ease,
      margin 0.32s ease, padding 0.32s ease, border-width 0.32s ease;
    max-height: 140px;
    overflow: hidden;
  }
  .tm-panel { animation: tm-fade-in 0.24s cubic-bezier(0.22, 1, 0.36, 1); }
  .tm-checkbox { transition: background-color 0.18s ease, border-color 0.18s ease, transform 0.15s ease; }
  .tm-checkbox:active { transform: scale(0.85); }
  .tm-text { transition: color 0.25s ease; }
  .tm-tab { transition: color 0.18s ease, border-color 0.18s ease; }
  .tm-scrollbar::-webkit-scrollbar { height: 5px; width: 5px; }
  .tm-scrollbar::-webkit-scrollbar-track { background: transparent; }
  .tm-scrollbar::-webkit-scrollbar-thumb { background: #D8D2C4; border-radius: 4px; }
`;

const PALETTE = ['#7A5C3E', '#3E6B8A', '#8A4B6B', '#4B7A4E', '#8A6B2E', '#5C5C8A'];
const PAPER = '#F7F4EC';
const INK = '#20242B';
const RULE = '#E4DECE';
const MUTED = '#9A9280';

const DEFAULT_CATS = [
  { id: 'imp-short', name: 'IMP-ST', tag: '', color: '#B4402F', builtin: true },
  { id: 'nimp-short', name: 'NIMP-ST', tag: '', color: '#B9852B', builtin: true },
  { id: 'imp-long', name: 'IMP-LT', tag: '', color: '#2C6E63', builtin: true },
  { id: 'nimp-long', name: 'NIMP-LT', tag: '', color: '#5C6470', builtin: true },
];

const STORAGE_KEY = 'task-matrix-data-v2';
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TaskMatrix() {
  const [categories, setCategories] = useState(DEFAULT_CATS);
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [exitingIds, setExitingIds] = useState(new Set());
  const [draft, setDraft] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [showDateInput, setShowDateInput] = useState(false);
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState(PALETTE[0]);
  const saveTimer = useRef(null);
  const today = localToday();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.categories && parsed.categories.length) {
          const merged = parsed.categories.map((c) => {
            const def = DEFAULT_CATS.find((d) => d.id === c.id);
            return def ? { ...def } : c;
          });
          const missingDefaults = DEFAULT_CATS.filter(
            (d) => !merged.some((c) => c.id === d.id)
          );
          setCategories([...missingDefaults, ...merged]);
        }
        if (parsed.tasks) setTasks(parsed.tasks);
      }
    } catch (e) {
      // fresh start
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ categories, tasks }));
      } catch (e) {
        console.error('Save failed', e);
      }
    }, 250);
    return () => clearTimeout(saveTimer.current);
  }, [categories, tasks, loaded]);

  const addTask = useCallback((catId) => {
    const text = draft.trim();
    if (!text) return;
    setTasks((prev) => [
      ...prev,
      { id: uid(), catId, text, done: false, dueDate: draftDate || null, createdAt: Date.now() },
    ]);
    setDraft('');
    setDraftDate('');
    setShowDateInput(false);
  }, [draft, draftDate]);

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const setTaskDate = (id, dueDate) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, dueDate: dueDate || null } : t)));
  };

  const deleteTask = (id) => {
    setExitingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 260);
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const id = uid();
    setCategories((prev) => [...prev, { id, name, tag: 'Custom', color: newCatColor, builtin: false }]);
    setNewCatName('');
    setNewCatColor(PALETTE[categories.length % PALETTE.length]);
    setAddingCat(false);
    setActiveTab(id);
  };

  const deleteCategoryAltogether = (id) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTasks((prev) => prev.filter((t) => t.catId !== id));
    if (activeTab === id) setActiveTab('home');
  };

  const activeCat = categories.find((c) => c.id === activeTab);
  const todayTasks = tasks
    .filter((t) => t.dueDate === today && !t.done)
    .sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="tm-body min-h-screen w-full" style={{ background: PAPER, color: INK }}>
      <style>{FONT_STYLE}</style>

      <div className="sticky top-0 z-10" style={{ background: PAPER, borderBottom: `1px solid ${RULE}` }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-3">
          <h1 className="tm-display text-2xl sm:text-3xl mb-3" style={{ fontWeight: 600 }}>
            Task Matrix
          </h1>
          <div className="flex gap-1 overflow-x-auto tm-scrollbar pb-1 -mb-1">
            <TabButton active={activeTab === 'home'} onClick={() => setActiveTab('home')}>
              <Home size={13} /> Home
            </TabButton>
            {categories.map((c) => {
              const open = tasks.filter((t) => t.catId === c.id && !t.done).length;
              return (
                <TabButton key={c.id} active={activeTab === c.id} onClick={() => setActiveTab(c.id)} color={c.color}>
                  {c.name}{c.tag && c.tag !== 'Custom' ? <span className="opacity-60"> · {c.tag}</span> : ''}
                  {open > 0 && <span className="tm-mono opacity-60">&nbsp;{open}</span>}
                </TabButton>
              );
            })}
            <TabButton active={addingCat} onClick={() => setAddingCat((v) => !v)} dashed>
              <Plus size={13} /> Add
            </TabButton>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {addingCat && (
          <div
            className="tm-panel flex flex-wrap items-center gap-2 p-3 rounded-md border mb-6"
            style={{ borderColor: RULE, background: '#FBF9F2' }}
          >
            <input
              autoFocus
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder="Category name"
              className="tm-body text-sm px-2.5 py-1.5 rounded border outline-none flex-1 min-w-[140px]"
              style={{ borderColor: RULE, background: PAPER }}
            />
            <div className="flex items-center gap-1.5">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewCatColor(c)}
                  className="w-5 h-5 rounded-full transition-transform"
                  style={{
                    background: c,
                    transform: newCatColor === c ? 'scale(1.2)' : 'scale(1)',
                    boxShadow: newCatColor === c ? `0 0 0 2px ${PAPER}, 0 0 0 3.5px ${c}` : 'none',
                  }}
                />
              ))}
            </div>
            <button onClick={addCategory} className="text-sm px-3 py-1.5 rounded text-white" style={{ background: INK }}>
              Add
            </button>
            <button onClick={() => setAddingCat(false)} className="p-1.5 rounded" style={{ color: MUTED }}>
              <X size={16} />
            </button>
          </div>
        )}

        {activeTab === 'home' ? (
          <HomeView categories={categories} tasks={tasks} todayTasks={todayTasks}
            onToggle={toggleTask} onDelete={deleteTask} exitingIds={exitingIds} />
        ) : activeCat ? (
          <CategoryView
            cat={activeCat}
            tasks={tasks.filter((t) => t.catId === activeCat.id)}
            draft={draft} setDraft={setDraft}
            draftDate={draftDate} setDraftDate={setDraftDate}
            showDateInput={showDateInput} setShowDateInput={setShowDateInput}
            onAdd={() => addTask(activeCat.id)}
            onToggle={toggleTask} onDelete={deleteTask} onSetDate={setTaskDate}
            exitingIds={exitingIds}
            onDeleteCategory={!activeCat.builtin ? () => deleteCategoryAltogether(activeCat.id) : null}
            today={today}
          />
        ) : null}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children, color, dashed }) {
  return (
    <button
      onClick={onClick}
      className="tm-tab flex items-center gap-1.5 whitespace-nowrap text-[12.5px] px-3 py-1.5 rounded-full border flex-shrink-0"
      style={{
        borderColor: active ? (color || INK) : dashed ? '#C9C1AE' : RULE,
        borderStyle: dashed ? 'dashed' : 'solid',
        color: active ? INK : MUTED,
        background: active ? '#FCFAF3' : 'transparent',
        fontWeight: active ? 600 : 500,
      }}
    >
      {children}
    </button>
  );
}

function HomeView({ categories, tasks, todayTasks, onToggle, onDelete, exitingIds }) {
  return (
    <div className="tm-panel">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
        {categories.map((c) => {
          const catTasks = tasks.filter((t) => t.catId === c.id);
          const pending = catTasks.filter((t) => !t.done).length;
          const completed = catTasks.filter((t) => t.done).length;
          return (
            <div key={c.id} className="rounded-lg border p-3" style={{ borderColor: RULE, background: '#FCFAF3' }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                <span className="tm-body text-[12px] font-semibold truncate">{c.name}</span>
              </div>
              <div className="tm-mono text-[11px] leading-relaxed" style={{ color: '#7A7364' }}>
                <div>{pending} pending</div>
                <div>{completed} completed</div>
                <div style={{ color: MUTED }}>{catTasks.length} total</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mb-3">
        <Calendar size={14} style={{ color: MUTED }} />
        <span className="tm-mono text-[11px] tracking-wider uppercase" style={{ color: MUTED }}>
          Due today
        </span>
        <div className="h-px flex-1" style={{ background: RULE }} />
      </div>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: RULE, background: '#FCFAF3' }}>
        {todayTasks.length === 0 ? (
          <p className="tm-body text-[13px] italic px-4 py-5" style={{ color: '#B8B0A0' }}>
            Nothing due today.
          </p>
        ) : (
          <div className="px-2.5 py-2">
            {todayTasks.map((t) => {
              const cat = categories.find((c) => c.id === t.catId);
              return (
                <div
                  key={t.id}
                  className={`tm-item tm-item-enter flex items-center gap-2.5 px-1.5 py-2 rounded group ${exitingIds.has(t.id) ? 'tm-item-exit' : ''}`}
                >
                  <button
                    onClick={() => onToggle(t.id)}
                    className="tm-checkbox w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center flex-shrink-0"
                    style={{ borderColor: cat?.color || '#C9C1AE', background: 'transparent' }}
                  />
                  <span className="tm-body text-[13.5px] flex-1 truncate">{t.text}</span>
                  {cat && (
                    <span
                      className="tm-mono text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: `${cat.color}1A`, color: cat.color }}
                    >
                      {cat.name}
                    </span>
                  )}
                  <button
                    onClick={() => onDelete(t.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    style={{ color: '#C4442F' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryView({
  cat, tasks, draft, setDraft, draftDate, setDraftDate, showDateInput, setShowDateInput,
  onAdd, onToggle, onDelete, onSetDate, exitingIds, onDeleteCategory, today,
}) {
  const open = tasks.filter((t) => !t.done).sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return a.createdAt - b.createdAt;
  });
  const done = tasks.filter((t) => t.done);

  return (
    <div className="tm-panel">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
          <h2 className="tm-display text-xl" style={{ fontWeight: 600 }}>{cat.name}</h2>
          {cat.tag && (
            <span className="tm-mono text-[11px] uppercase tracking-wide" style={{ color: MUTED }}>{cat.tag}</span>
          )}
        </div>
        {onDeleteCategory && (
          <button
            onClick={() => { if (window.confirm(`Delete "${cat.name}" and all its tasks?`)) onDeleteCategory(); }}
            className="tm-body text-[12px] flex items-center gap-1 px-2.5 py-1 rounded border"
            style={{ borderColor: '#E8CFC8', color: '#B4402F' }}
          >
            <Trash2 size={12} /> Delete category
          </button>
        )}
      </div>

      <div className="rounded-lg border p-2.5 mb-5" style={{ borderColor: RULE, background: '#FBF9F2' }}>
        <div className="flex items-center gap-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder="Add a task…"
            className="tm-body text-[13.5px] flex-1 min-w-0 px-2 py-1.5 rounded outline-none bg-transparent"
          />
          <button
            onClick={() => setShowDateInput((v) => !v)}
            className="p-1.5 rounded-md flex-shrink-0"
            style={{ background: showDateInput || draftDate ? `${cat.color}22` : 'transparent', color: cat.color }}
          >
            <Calendar size={15} />
          </button>
          <button
            onClick={onAdd}
            disabled={!draft.trim()}
            className="p-1.5 rounded-md flex-shrink-0 transition-opacity"
            style={{ background: cat.color, opacity: draft.trim() ? 1 : 0.35 }}
          >
            <Plus size={15} color="#fff" />
          </button>
        </div>
        {showDateInput && (
          <div className="tm-panel mt-2 flex items-center gap-2">
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="tm-mono text-[12px] px-2 py-1 rounded border outline-none"
              style={{ borderColor: RULE, background: PAPER }}
            />
            {draftDate && (
              <button onClick={() => setDraftDate('')} className="text-[11px]" style={{ color: MUTED }}>
                clear
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden mb-5" style={{ borderColor: RULE, background: '#FCFAF3' }}>
        <div className="px-3.5 py-2 border-b tm-mono text-[10.5px] tracking-wide uppercase" style={{ borderColor: RULE, color: MUTED }}>
          Open · {open.length}
        </div>
        <div className="px-2.5 py-1.5">
          {open.length === 0 && (
            <p className="tm-body text-[13px] italic px-1.5 py-3" style={{ color: '#B8B0A0' }}>All clear here.</p>
          )}
          {open.map((t) => (
            <FullTaskRow key={t.id} task={t} color={cat.color} today={today}
              onToggle={onToggle} onDelete={onDelete} onSetDate={onSetDate}
              exiting={exitingIds.has(t.id)} />
          ))}
        </div>
      </div>

      {done.length > 0 && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: RULE, background: '#FCFAF3' }}>
          <div className="px-3.5 py-2 border-b tm-mono text-[10.5px] tracking-wide uppercase" style={{ borderColor: RULE, color: MUTED }}>
            Completed · {done.length}
          </div>
          <div className="px-2.5 py-1.5">
            {done.map((t) => (
              <FullTaskRow key={t.id} task={t} color={cat.color} today={today}
                onToggle={onToggle} onDelete={onDelete} onSetDate={onSetDate}
                exiting={exitingIds.has(t.id)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FullTaskRow({ task, color, today, onToggle, onDelete, onSetDate, exiting }) {
  const [editingDate, setEditingDate] = useState(false);
  const overdue = task.dueDate && task.dueDate < today && !task.done;

  return (
    <div className={`tm-item tm-item-enter flex items-start gap-2.5 px-1.5 py-2 rounded group ${exiting ? 'tm-item-exit' : ''}`}>
      <button
        onClick={() => onToggle(task.id)}
        className="tm-checkbox mt-0.5 w-[16px] h-[16px] rounded-[4px] border flex items-center justify-center flex-shrink-0"
        style={{ borderColor: task.done ? color : '#C9C1AE', background: task.done ? color : 'transparent' }}
      >
        {task.done && <Check size={11} color="#fff" strokeWidth={3} />}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className="tm-text tm-body text-[13.5px] leading-snug break-words block"
          style={{ color: task.done ? '#B8B0A0' : INK, textDecoration: task.done ? 'line-through' : 'none' }}
        >
          {task.text}
        </span>
        {!editingDate ? (
          <button
            onClick={() => setEditingDate(true)}
            className="tm-mono text-[10.5px] mt-0.5 flex items-center gap-1"
            style={{ color: overdue ? '#B4402F' : MUTED }}
          >
            {overdue && <CircleAlert size={10} />}
            {task.dueDate ? formatDate(task.dueDate) : '+ set date'}
          </button>
        ) : (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="date"
              autoFocus
              value={task.dueDate || ''}
              onChange={(e) => onSetDate(task.id, e.target.value)}
              onBlur={() => setEditingDate(false)}
              className="tm-mono text-[11px] px-1.5 py-0.5 rounded border outline-none"
              style={{ borderColor: RULE, background: PAPER }}
            />
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
        style={{ color: '#C4442F' }}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}
