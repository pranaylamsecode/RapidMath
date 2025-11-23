import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Timer, ArrowRight, XCircle, CheckCircle, Zap, SkipForward } from 'lucide-react';
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
  
  // Timing
  const [startTime, setStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const TOTAL_TIME_PER_Q = 30;

  // Stats
  const [results, setResults] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const data = await generateQuestions(topic, 5);
      setQuestions(data);
      setLoading(false);
      setStartTime(Date.now());
      startQuestion();
    };
    loadData();
  }, [topic]);

  const startQuestion = () => {
    setQuestionStartTime(Date.now());
    setTimeLeft(TOTAL_TIME_PER_Q);
    setUserAnswer('');
  };

  useEffect(() => {
    if (loading || feedback) return;

    if (timeLeft <= 0) {
      // Time over, treat as incorrect/skip
      handleSubmit(undefined, true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, feedback]);

  useEffect(() => {
    if (!loading && !feedback && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, currentIndex, feedback]);

  const handleSubmit = (e?: React.FormEvent, isTimeout: boolean = false) => {
    e?.preventDefault();
    if (!isTimeout && !userAnswer) return;

    const currentQ = questions[currentIndex];
    
    // Logic for correctness
    const normalizedUser = userAnswer.trim().toLowerCase();
    const normalizedCorrect = currentQ.correctAnswer.trim().toLowerCase();
    
    // Check direct match or option index match (A, B...) if user types option letter
    let isCorrect = normalizedUser === normalizedCorrect;
    
    // Also check if user selected an option button which sets userAnswer directly
    // If the answer is "x > y", we match against that.
    
    if (isTimeout) isCorrect = false;

    const timeSpent = (Date.now() - questionStartTime) / 1000;

    // Update streak
    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);
    } else {
      setStreak(0);
    }

    setResults(prev => [...prev, {
      questionId: currentQ.id,
      isCorrect,
      userAnswer: isTimeout ? 'Timeout' : userAnswer,
      correctAnswer: currentQ.correctAnswer,
      timeSpent
    }]);

    setFeedback(isCorrect ? 'correct' : 'incorrect');

    // Auto advance
    setTimeout(() => {
      setFeedback(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        startQuestion();
      } else {
        finishDrill(isCorrect, isTimeout ? 'Timeout' : userAnswer, timeSpent);
      }
    }, 1200);
  };

  const handleSkip = () => {
      handleSubmit(undefined, true); // Treat skip as timeout/incorrect for simplicity in "Speed Drill"
  };

  const finishDrill = (lastCorrect: boolean, lastAns: string, lastTime: number) => {
    // We need to account for the last question in the results array which is updated via state
    // But state updates are async. 
    // Construct final list:
    const finalResults = [...results, {
        questionId: questions[currentIndex].id,
        isCorrect: lastCorrect,
        userAnswer: lastAns,
        correctAnswer: questions[currentIndex].correctAnswer,
        timeSpent: lastTime
    }];

    const totalTime = (Date.now() - startTime) / 1000;
    const correctCount = finalResults.filter(r => r.isCorrect).length;
    const score = (correctCount / questions.length) * 100;
    
    // Calculate max streak including last one if valid
    let currentStreak = 0;
    let finalMaxStreak = 0;
    finalResults.forEach(r => {
        if (r.isCorrect) {
            currentStreak++;
            if (currentStreak > finalMaxStreak) finalMaxStreak = currentStreak;
        } else {
            currentStreak = 0;
        }
    });

    const drillResult: DrillResult = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      topic: topic,
      score,
      totalQuestions: questions.length,
      timeTaken: totalTime,
      accuracy: score,
      maxStreak: finalMaxStreak,
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
  const progressPercent = (timeLeft / TOTAL_TIME_PER_Q) * 100;

  return (
    <div className="max-w-3xl mx-auto w-full p-4 flex flex-col h-full relative">
      {/* Visual Progress Bar */}
      <div className="flex gap-2 mb-6 w-full">
        {questions.map((_, idx) => {
          let barColor = "bg-slate-700";
          if (idx < results.length) {
             barColor = results[idx].isCorrect ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]";
          } else if (idx === currentIndex) {
             barColor = "bg-brand-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
          }
          
          return (
             <div key={idx} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${barColor}`} />
          );
        })}
      </div>

      {/* Top Stats Bar */}
      <div className="flex justify-between items-center mb-6 text-sm font-mono">
        <div className="flex items-center space-x-4">
           <div className="flex items-center text-slate-300">
             <Timer className="w-4 h-4 mr-2 text-brand-400" />
             <span className={`${timeLeft < 10 ? 'text-red-400 animate-pulse font-bold' : ''}`}>{timeLeft}s</span>
           </div>
           <div className="flex items-center text-slate-300">
             <Zap className={`w-4 h-4 mr-2 ${streak > 1 ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`} />
             <span>Streak: {streak}</span>
           </div>
        </div>
        <div className="text-slate-500">
          Q {currentIndex + 1} / {questions.length}
        </div>
      </div>

      {/* Timer Bar */}
      <div className="w-full h-1 bg-slate-800 rounded-full mb-8 overflow-hidden">
        <motion.div 
          className={`h-full ${timeLeft < 10 ? 'bg-red-500' : 'bg-brand-500'}`}
          animate={{ width: `${progressPercent}%` }}
          transition={{ ease: "linear", duration: 1 }}
        />
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col justify-start"
        >
          <h2 className="text-xs text-brand-500 font-bold tracking-[0.2em] uppercase mb-4 text-center">{currentQ.type}</h2>
          
          <div className="bg-slate-800/50 p-6 md:p-10 rounded-2xl border border-slate-700 backdrop-blur-sm mb-6 shadow-2xl min-h-[160px] flex items-center justify-center relative overflow-hidden">
             {/* Background glow effect */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand-500/5 blur-[100px] rounded-full" />
             
             <p className="text-xl md:text-3xl font-mono leading-relaxed text-white whitespace-pre-line text-center relative z-10">
              {currentQ.questionText}
            </p>
          </div>

          {/* Options Grid */}
          {currentQ.options && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
               {currentQ.options.map((opt, idx) => (
                 <button
                   key={idx}
                   onClick={() => setUserAnswer(opt)}
                   className={`p-4 rounded-xl text-left border transition-all relative group overflow-hidden ${
                     userAnswer === opt 
                     ? 'border-brand-500 bg-brand-500/20 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                     : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                   }`}
                 >
                   <div className="absolute inset-0 w-1 bg-brand-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <span className="font-bold text-slate-500 mr-3 font-mono text-sm">{String.fromCharCode(65 + idx)}</span>
                   <span className="font-medium">{opt}</span>
                 </button>
               ))}
             </div>
          )}

          {/* Action Bar */}
          <div className="mt-auto">
             <form onSubmit={(e) => handleSubmit(e)} className="relative flex items-center gap-4">
                <div className="relative flex-1">
                    <input
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="Select option or type..."
                    className="w-full bg-slate-900/50 border border-slate-600 rounded-xl py-4 px-6 text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
                    autoComplete="off"
                    />
                </div>
                
                <button
                type="submit"
                disabled={!userAnswer}
                className={`p-4 rounded-xl transition-all ${
                    userAnswer 
                    ? 'bg-brand-600 text-white hover:bg-brand-500 shadow-lg' 
                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                }`}
                >
                <ArrowRight className="w-6 h-6" />
                </button>

                <button
                    type="button"
                    onClick={handleSkip}
                    className="p-4 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Skip Question"
                >
                    <SkipForward className="w-6 h-6" />
                </button>
            </form>
          </div>

        </motion.div>
      </AnimatePresence>

      {/* Feedback Overlay */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            {feedback === 'correct' ? (
                 <div className="bg-green-500 text-white p-8 rounded-3xl shadow-2xl flex flex-col items-center animate-bounce-short">
                    <CheckCircle className="w-20 h-20 mb-2" />
                    <span className="text-2xl font-bold">Excellent!</span>
                 </div>
            ) : (
                <div className="bg-red-500 text-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
                    <XCircle className="w-20 h-20 mb-2" />
                    <span className="text-2xl font-bold">Missed it!</span>
                    <span className="mt-2 text-white/80">Correct: {currentQ.correctAnswer}</span>
                 </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex justify-center mt-6">
          <button onClick={onCancel} className="text-xs text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors">
            Abort Session
          </button>
      </div>
    </div>
  );
};

export default DrillSession;