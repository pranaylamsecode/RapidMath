import React, { useEffect, useState } from 'react';
import { DrillResult } from '../types';
import { getDrillAnalysis } from '../services/gemini';
import { Brain, RotateCcw, Home, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalysisProps {
  result: DrillResult;
  onRetry: () => void;
  onHome: () => void;
}

const Analysis: React.FC<AnalysisProps> = ({ result, onRetry, onHome }) => {
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(true);

  useEffect(() => {
    const fetchAdvice = async () => {
      // Filter only necessary data to save tokens and clean context
      const simplifiedDetails = result.details.map(d => ({
        wasCorrect: d.isCorrect,
        timeTaken: d.timeSpent,
        correctAnswer: d.correctAnswer
      }));
      
      const advice = await getDrillAnalysis({
        topic: result.topic,
        score: result.score,
        details: simplifiedDetails
      });
      setAiAdvice(advice);
      setLoadingAi(false);
    };
    fetchAdvice();
  }, [result]);

  return (
    <div className="max-w-4xl mx-auto w-full p-4 lg:p-8 pb-20">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-2">Drill Complete!</h1>
        <div className="text-6xl font-mono font-bold text-brand-400 my-6">
          {Math.round(result.score)}<span className="text-2xl text-slate-500">%</span>
        </div>
        <p className="text-slate-400">
          Time: <span className="text-white">{result.timeTaken.toFixed(1)}s</span> • 
          Avg: <span className="text-white">{(result.timeTaken / result.totalQuestions).toFixed(1)}s/q</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Question Breakdown */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">Question Breakdown</h3>
          {result.details.map((q, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              key={idx} 
              className={`p-4 rounded-xl border ${q.isCorrect ? 'border-green-900/50 bg-green-900/20' : 'border-red-900/50 bg-red-900/20'} flex justify-between items-center`}
            >
              <div className="flex items-center gap-3">
                {q.isCorrect ? <Check className="w-5 h-5 text-green-500" /> : <X className="w-5 h-5 text-red-500" />}
                <div>
                  <p className="text-slate-300 text-sm">Q{idx + 1}</p>
                  {!q.isCorrect && (
                    <p className="text-xs text-slate-400">Ans: {q.correctAnswer} <span className="opacity-50">(You: {q.userAnswer})</span></p>
                  )}
                </div>
              </div>
              <span className="font-mono text-sm text-slate-400">{q.timeSpent.toFixed(1)}s</span>
            </motion.div>
          ))}
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-6 rounded-2xl border border-indigo-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">AI Coach Insights</h3>
          </div>
          
          <div className="text-slate-300 leading-relaxed text-sm space-y-2">
            {loadingAi ? (
              <div className="flex space-x-1 animate-pulse">
                <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animation-delay-200"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animation-delay-400"></div>
              </div>
            ) : (
              <div className="whitespace-pre-line">
                {aiAdvice}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex justify-center gap-4">
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-900/20"
        >
          <RotateCcw className="w-5 h-5" /> Retry Drill
        </button>
        <button 
          onClick={onHome}
          className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
        >
          <Home className="w-5 h-5" /> Dashboard
        </button>
      </div>
    </div>
  );
};

export default Analysis;