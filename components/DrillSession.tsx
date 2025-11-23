import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Timer, ArrowRight, XCircle, CheckCircle } from 'lucide-react';
import { Question, QuestionType, DrillResult } from '../types';
import { generateQuestions } from '../services/gemini';

interface DrillSessionProps {
  topic: QuestionType;
  onComplete: (result: DrillResult) => void;
  onCancel: () => void;
}

const DrillSession: React.FC<DrillSessionProps> = ({ topic, onComplete, onCancel }) => {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [results, setResults] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await generateQuestions(topic, 5);
      setQuestions(data);
      setLoading(false);
      setStartTime(Date.now());
      setQuestionStartTime(Date.now());
    };
    loadData();
  }, [topic]);

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, currentIndex, feedback]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!userAnswer) return;

    const currentQ = questions[currentIndex];
    // Simple normalization: remove spaces, lowercase
    const normalizedUser = userAnswer.replace(/\s/g, '').toLowerCase();
    const normalizedCorrect = currentQ.correctAnswer.replace(/\s/g, '').toLowerCase();
    
    // Check for exact match or if user selected an option (A, B, C...) matching the value
    // For this simple version, we assume direct value match or option text match
    const isCorrect = normalizedUser === normalizedCorrect;

    const timeSpent = (Date.now() - questionStartTime) / 1000;

    setResults(prev => [...prev, {
      questionId: currentQ.id,
      isCorrect,
      userAnswer,
      correctAnswer: currentQ.correctAnswer,
      timeSpent
    }]);

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Auto advance after short delay
    setTimeout(() => {
      setFeedback(null);
      setUserAnswer('');
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setQuestionStartTime(Date.now());
      } else {
        finishDrill();
      }
    }, 1200);
  };

  const finishDrill = () => {
    const totalTime = (Date.now() - startTime) / 1000;
    // Calculate final stats manually since state update might be pending in a real closure scenario, 
    // but here we wait for the timeout so 'results' needs to be up to date. 
    // Actually, 'results' in this scope will be stale due to closure if we don't use functional updates or a ref.
    // Let's rely on the fact that we are inside a timeout that was defined when 'finishDrill' was CALLED? 
    // No, better to pass the final result explicitly to a helper or use a ref for results to be safe.
    
    // FIX: Re-construct the final array including the last answer
    const finalResults = [...results, {
        questionId: questions[currentIndex].id,
        isCorrect: userAnswer.replace(/\s/g, '').toLowerCase() === questions[currentIndex].correctAnswer.replace(/\s/g, '').toLowerCase(),
        userAnswer,
        correctAnswer: questions[currentIndex].correctAnswer,
        timeSpent: (Date.now() - questionStartTime) / 1000
    }];

    const correctCount = finalResults.filter(r => r.isCorrect).length;
    const score = (correctCount / questions.length) * 100;

    const drillResult: DrillResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      topic: topic,
      score,
      totalQuestions: questions.length,
      timeTaken: totalTime,
      accuracy: score,
      details: finalResults
    };
    onComplete(drillResult);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 text-brand-100">
        <Loader2 className="w-12 h-12 animate-spin text-brand-500" />
        <p className="text-xl font-light animate-pulse">Consulting AI for fresh questions...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="max-w-3xl mx-auto w-full p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 text-slate-400 text-sm font-mono">
        <div className="flex items-center space-x-2">
          <Timer className="w-4 h-4" />
          <span>Session Active</span>
        </div>
        <div>
          Question {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="flex-1 flex flex-col justify-center"
        >
          <h2 className="text-sm text-brand-500 font-bold tracking-wider uppercase mb-4">{currentQ.type}</h2>
          
          <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 backdrop-blur-sm mb-8 shadow-2xl">
            <p className="text-2xl md:text-4xl font-mono leading-relaxed text-white whitespace-pre-line">
              {currentQ.questionText}
            </p>
          </div>

          {/* Options if available */}
          {currentQ.options && (
             <div className="grid grid-cols-2 gap-4 mb-8">
               {currentQ.options.map((opt, idx) => (
                 <button
                   key={idx}
                   onClick={() => setUserAnswer(opt)}
                   className={`p-4 rounded-xl text-left border transition-all ${
                     userAnswer === opt 
                     ? 'border-brand-500 bg-brand-500/20 text-white' 
                     : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                   }`}
                 >
                   <span className="font-bold text-slate-500 mr-2">{String.fromCharCode(65 + idx)}.</span>
                   {opt}
                 </button>
               ))}
             </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="relative">
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type answer..."
              className="w-full bg-transparent border-b-2 border-slate-600 text-3xl py-4 px-2 text-center text-white focus:outline-none focus:border-brand-500 transition-colors font-mono"
              autoComplete="off"
            />
            <button
              type="submit"
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-brand-500 hover:text-brand-400 transition-colors"
            >
              <ArrowRight className="w-8 h-8" />
            </button>
          </form>

        </motion.div>
      </AnimatePresence>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-50 flex items-center justify-center pointer-events-none ${
              feedback === 'correct' ? 'bg-green-500/10' : 'bg-red-500/10'
            }`}
          >
            <div className={`p-6 rounded-full ${feedback === 'correct' ? 'bg-green-500' : 'bg-red-500'} text-white shadow-lg`}>
              {feedback === 'correct' ? <CheckCircle className="w-16 h-16" /> : <XCircle className="w-16 h-16" />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={onCancel} className="mt-8 text-slate-500 hover:text-white text-sm">
        Quit Session
      </button>
    </div>
  );
};

export default DrillSession;