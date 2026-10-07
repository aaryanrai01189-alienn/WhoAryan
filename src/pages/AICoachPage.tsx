import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiService } from '../services/aiService';
import { taskService } from '../services/taskService';
import { goalService } from '../services/goalService';
import { Task, Goal, AIProposedTask, AIDailyPlanResponse } from '../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Calendar, 
  CheckCircle, 
  Plus, 
  Clock, 
  Zap, 
  User, 
  RotateCcw,
  Flame,
  Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  sender: 'user' | 'coach';
  text: string;
  suggestedTasks?: AIProposedTask[] | null;
  timestamp: string;
}

const QUICK_PROMPTS = [
  'Make me a 3-hour study plan',
  'I have an important exam / deadline tomorrow',
  'How can I break through afternoon procrastination?',
  'Analyze my current priorities and suggest 3 high-impact tasks',
];

export const AICoachPage: React.FC = () => {
  const { profile, levelInfo } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeMode, setActiveMode] = useState<'chat' | 'my_day'>('chat');

  // Chat states
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_welcome',
      sender: 'coach',
      text: `Greetings, **${profile?.displayName || 'Operative'}**. I am your NEXORA AI Strategic Coach powered by Gemini.\n\nI monitor your cognitive stamina, priorities, and streak velocity. Ask me to design a study plan, schedule your day, or break down complex workloads.`,
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // My Day states
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [dailyPlan, setDailyPlan] = useState<AIDailyPlanResponse | null>(null);
  const [availableHours, setAvailableHours] = useState(8);
  const [focusTheme, setFocusTheme] = useState('High Momentum');
  const [addedTasksNotice, setAddedTasksNotice] = useState<string | null>(null);

  const uid = profile?.uid || '';

  useEffect(() => {
    if (!uid) return;
    const unsubTasks = taskService.subscribeTasks(uid, (list) => setTasks(list));
    const unsubGoals = goalService.subscribeGoals(uid, (list) => setGoals(list));
    return () => {
      unsubTasks();
      unsubGoals();
    };
  }, [uid]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = textToSend || inputText;
    if (!messageContent.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: messageContent.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const resp = await aiService.askCoach(
        messageContent,
        {
          userLevel: levelInfo.level,
          totalXP: profile?.totalXP,
          streak: profile?.currentStreak,
          pendingTasksCount: tasks.filter((t) => !t.completed).length,
          activeGoalsCount: goals.filter((g) => g.status === 'in_progress').length,
          topPriorities: tasks.slice(0, 3).map((t) => t.title),
        },
        messages.map((m) => ({ sender: m.sender, text: m.text }))
      );

      const coachMsg: ChatMessage = {
        id: `msg_coach_${Date.now()}`,
        sender: 'coach',
        text: resp.text,
        suggestedTasks: resp.suggestedTasks,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, coachMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  // Add suggested tasks with explicit confirmation
  const handleAddSuggestedTasks = async (suggested: AIProposedTask[]) => {
    if (!uid) return;
    for (const item of suggested) {
      await taskService.createTask({
        userId: uid,
        title: item.title,
        category: item.category || 'Work',
        difficulty: item.difficulty || 'Medium',
        baseXP: 50,
        estimatedDuration: item.estimatedDuration || 30,
        notes: item.notes,
      });
    }
    setAddedTasksNotice(`Added ${suggested.length} tasks to your tactical queue!`);
    setTimeout(() => setAddedTasksNotice(null), 3000);
  };

  // Generate My Day
  const handleGenerateMyDay = async () => {
    setIsGeneratingPlan(true);
    try {
      const plan = await aiService.generateDailyPlan({
        tasks,
        goals,
        dailyTarget: profile?.dailyTarget || 4,
        availableHours,
        focusTheme,
      });
      setDailyPlan(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              AI Strategic Coach
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/30 uppercase tracking-widest">
              Gemini 2.5
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tactical guidance, workload decomposition, and chronologically optimized daily schedules.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200 dark:border-slate-700/60">
          <button
            onClick={() => setActiveMode('chat')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'chat'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Interactive Coach</span>
          </button>

          <button
            onClick={() => setActiveMode('my_day')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeMode === 'my_day'
                ? 'bg-white dark:bg-slate-900 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate My Day</span>
          </button>
        </div>
      </div>

      {addedTasksNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-bold text-center">
          {addedTasksNotice}
        </div>
      )}

      {/* MODE 1: CHAT INTERFACE */}
      {activeMode === 'chat' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm flex flex-col h-[650px] overflow-hidden">
          {/* Quick Prompts Bar */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 flex items-center gap-2 overflow-x-auto scrollbar-none text-xs">
            <span className="text-slate-400 font-bold flex-shrink-0 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-500" /> Prompts:
            </span>
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isSending}
                className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-cyan-500 hover:border-cyan-500 border border-slate-200 dark:border-slate-700/60 font-medium whitespace-nowrap flex-shrink-0 transition-colors text-xs disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => {
              const isCoach = msg.sender === 'coach';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-2xl ${isCoach ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  {/* Avatar icon */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold shadow-sm ${
                      isCoach
                        ? 'bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isCoach ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Message body */}
                  <div className="space-y-2.5 min-w-0">
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isCoach
                          ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/70'
                          : 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-sm font-medium'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>

                    {/* Actionable Proposed Tasks (Strict User Confirmation Pattern) */}
                    {isCoach && msg.suggestedTasks && msg.suggestedTasks.length > 0 && (
                      <div className="rounded-xl p-3.5 bg-cyan-950/20 dark:bg-cyan-950/40 border border-cyan-500/30 space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" /> Proposed Action Items ({msg.suggestedTasks.length})
                          </span>
                          <span className="text-[10px] text-slate-400">Requires Confirmation</span>
                        </div>

                        <div className="space-y-1.5">
                          {msg.suggestedTasks.map((st, i) => (
                            <div
                              key={i}
                              className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-bold text-slate-200 truncate">{st.title}</p>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {st.category} • {st.difficulty} • {st.estimatedDuration}m
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleAddSuggestedTasks(msg.suggestedTasks!)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-white font-bold text-xs hover:bg-cyan-600 transition-colors shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add All Tasks to Queue</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 block px-1">{msg.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {isSending && (
              <div className="flex gap-3 max-w-md mr-auto items-center text-xs text-slate-400 font-mono">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1.5 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-slate-400">Synthesizing strategy...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask your coach anything (e.g., 'Plan my 3-hour study session')..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODE 2: GENERATE MY DAY */}
      {activeMode === 'my_day' && (
        <div className="space-y-6">
          {/* Plan Settings Card */}
          <div className="rounded-2xl p-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Daily Tactical Schedule Generator</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI sequences your active tasks, energy peaks, and breaks into an elite execution timetable.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Available Hours
                </label>
                <select
                  value={availableHours}
                  onChange={(e) => setAvailableHours(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono"
                >
                  <option value={4}>4 Hours</option>
                  <option value={6}>6 Hours</option>
                  <option value={8}>8 Hours</option>
                  <option value={10}>10 Hours</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Focus Theme
                </label>
                <select
                  value={focusTheme}
                  onChange={(e) => setFocusTheme(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                >
                  <option value="High Momentum">High Momentum</option>
                  <option value="Deep Study">Deep Study</option>
                  <option value="Balanced Wellness">Balanced Wellness</option>
                  <option value="Sprint Execution">Sprint Execution</option>
                </select>
              </div>

              <button
                onClick={handleGenerateMyDay}
                disabled={isGeneratingPlan}
                className="mt-4 sm:mt-0 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50"
              >
                {isGeneratingPlan ? 'Constructing Schedule...' : 'Generate My Day'}
              </button>
            </div>
          </div>

          {/* Generated Plan Display */}
          {dailyPlan ? (
            <div className="space-y-4">
              {/* Motto and Highlights Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-cyan-400">
                    Day Motto: "{dailyPlan.focusMotto}"
                  </span>
                  <h4 className="text-sm font-semibold text-slate-200 mt-1">{dailyPlan.summary}</h4>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>{dailyPlan.totalEstimatedHours}h Active</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <Zap className="w-4 h-4 fill-current" />
                    <span>+{dailyPlan.potentialXP} Potential XP</span>
                  </div>
                </div>
              </div>

              {/* Time Blocks Stream */}
              <div className="space-y-3">
                {dailyPlan.blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-xs font-bold whitespace-nowrap">
                        {block.time}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-bold text-slate-900 dark:text-white">
                            {block.activity}
                          </h5>
                          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 font-bold">
                            {block.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Energy: {block.energyLevel}
                          </span>
                        </div>
                        {block.tips && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                            {block.tips}
                          </p>
                        )}
                      </div>
                    </div>

                    {block.isNewTask && block.taskData && (
                      <button
                        onClick={() => handleAddSuggestedTasks([block.taskData!])}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 whitespace-nowrap"
                      >
                        + Add as Task
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl p-12 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
              <Calendar className="w-10 h-10 text-cyan-500/50 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Ready to generate your custom timetable
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Click "Generate My Day" to synthesize your tasks, energy curves, and streak multipliers into a clear execution roadmap.
              </p>
              <button
                onClick={handleGenerateMyDay}
                disabled={isGeneratingPlan}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-bold text-xs shadow-md shadow-cyan-500/20"
              >
                Generate My Day
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
