import React from 'react';
import { User, QuestionType } from '../types';
import { Play, TrendingUp, Clock, Target, Award, Zap } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface DashboardProps {
  user: User;
  onStartDrill: (topic: QuestionType) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onStartDrill, onLogout }) => {
  // Compute basic stats
  const totalDrills = user.history.length;
  const avgScore = totalDrills > 0 
    ? Math.round(user.history.reduce((acc, curr) => acc + curr.score, 0) / totalDrills)
    : 0;
  
  const bestStreak = user.history.reduce((max, curr) => Math.max(max, curr.maxStreak || 0), 0);
  
  // Recent 5 performance for chart
  const recentPerformance = user.history.slice(-5).map((h, i) => ({
    name: `Drill ${i + 1}`,
    score: h.score,
    accuracy: h.accuracy
  }));

  const topics = [
    { 
      id: QuestionType.SIMPLIFICATION, 
      label: 'Simplification', 
      desc: 'Rapid fire BODMAS & calculations',
      color: 'from-blue-500 to-indigo-600'
    },
    { 
      id: QuestionType.SERIES, 
      label: 'Number Series', 
      desc: 'Identify missing or wrong patterns',
      color: 'from-emerald-500 to-teal-600'
    },
    { 
      id: QuestionType.QUADRATIC, 
      label: 'Quadratic Eq.', 
      desc: 'Root comparison (x > y, etc.)',
      color: 'from-purple-500 to-violet-600'
    },
    {
      id: QuestionType.APPROXIMATION,
      label: 'Approximation',
      desc: 'Estimate values quickly',
      color: 'from-orange-500 to-pink-600'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto w-full p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {user.name}</h1>
          <p className="text-slate-400 mt-1">Ready to crush some numbers today?</p>
        </div>
        <button 
          onClick={onLogout}
          className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm"
        >
          Sign Out
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-slate-400 font-medium">Avg. Score</h3>
          </div>
          <p className="text-3xl font-bold text-white">{avgScore}%</p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <h3 className="text-slate-400 font-medium">Best Streak</h3>
          </div>
          <p className="text-3xl font-bold text-white">{bestStreak}</p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-slate-400 font-medium">Drills Completed</h3>
          </div>
          <p className="text-3xl font-bold text-white">{totalDrills}</p>
        </div>
      </div>

      {/* Main Content Area: Charts & Drill Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Drill Selection */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Play className="w-5 h-5 text-brand-500" /> Start a Speed Drill
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topics.map((t) => (
              <button
                key={t.id}
                onClick={() => onStartDrill(t.id)}
                className="group relative overflow-hidden rounded-2xl p-6 text-left border border-slate-700 hover:border-slate-500 transition-all hover:shadow-xl hover:-translate-y-1 bg-slate-800"
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br ${t.color} transition-opacity`} />
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-300 transition-colors">{t.label}</h3>
                <p className="text-sm text-slate-400">{t.desc}</p>
              </button>
            ))}
          </div>
          
          {/* Performance Chart */}
          <div className="mt-8 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-6">Recent Performance</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={recentPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right: History */}
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 h-fit">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> History
          </h3>
          <div className="space-y-4">
            {user.history.length === 0 ? (
              <p className="text-slate-500 text-sm">No drills yet. Start one!</p>
            ) : (
              user.history.slice().reverse().map((h) => (
                <div key={h.id} className="flex justify-between items-center p-3 rounded-lg bg-slate-700/50 border border-slate-700">
                  <div>
                    <p className="text-white font-medium text-sm">{h.topic}</p>
                    <p className="text-xs text-slate-400">{new Date(h.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${h.score >= 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {h.score.toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-400 flex items-center justify-end gap-1">
                        <Zap className="w-3 h-3 text-yellow-500" /> {h.maxStreak || 0}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;