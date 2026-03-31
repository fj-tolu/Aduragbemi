import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';


const LETTER_TEXT = `Dearest Aduragbemi,
Happy Birthday.

I’ve been sitting with my thoughts on what you mean to me, and honestly, the word "beauty" feels incomplete until I put "Black" in front of it. You are my absolute definition of Black beauty—it’s in the radiance you carry and that smile of yours that is so beautifully contagious.

But there’s something even deeper. Whenever you close your eyes, I’m reminded of why you were given your name. In those quiet moments, you look like the very definition of prayer: a soul in deep, direct communication with God, our Lover. It’s a reminder that prayer isn’t just words; it’s a state of being, and you embody it.

We are in this "growing phase" together, where we’re finally beginning to define life exactly how we want it. I know that means we’re on different terms sometimes, and I won’t even lie to you—there are times you stress me out! But I’ve realized that every bit of that stress has actually helped us build a lasting bond. It’s the friction that makes the foundation solid.

What often feels like distance between us has actually been a gift. It helped me realize that we complement each other; we don’t "complete" each other. I love that we are both whole and capable on our own, but being whole alone has only taught me to value your presence and your every word even more.

I have seen how far you’ve come, Adura, and I can see clearly how great you will be. You hold the reigns of your life with such strength, and I know you won’t let go until the world hears you and finally harkens to your voice.

I am so proud to be part of your story.`;

const FloatingHearts = () => {
  const [hearts, setHearts] = useState<Array<{id: number, left: string, size: number, duration: number, delay: number}>>([]);

  useEffect(() => {
    // Generate hearts only on client side to avoid hydration mismatch if SSR was used
    const generatedHearts = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 24 + 12, // 12px to 36px
      duration: Math.random() * 15 + 10, // 10s to 25s
      delay: Math.random() * 10,
    }));
    setHearts(generatedHearts);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {hearts.map((heart) => (
        <motion.div
          key={heart.id}
          className="absolute bottom-[-50px]"
          style={{ left: heart.left }}
          animate={{
            y: ['0vh', '-120vh'],
            x: [0, Math.random() * 60 - 30, Math.random() * 60 - 30, 0],
            opacity: [0, 0.8, 0.8, 0],
            rotate: [0, Math.random() * 360],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Heart size={heart.size} className="text-emerald-400/40 fill-emerald-400/20 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
        </motion.div>
      ))}
    </div>
  );
};

const highlightWords = [
  "beauty", "Black", "radiance", "smile", "name", "prayer", "God", "Lover", 
  "growing phase", "bond", "friction", "foundation", "gift", "complement", 
  "whole", "Adura", "strength", "voice", "proud", "story"
];

const InteractiveLetterText = ({ text }: { text: string }) => {
  const pattern = new RegExp(`\\b(${highlightWords.join('|')})\\b`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, i) => {
        const isHighlight = highlightWords.some(w => w.toLowerCase() === part.toLowerCase());
        if (isHighlight) {
          return (
            <motion.span
              key={i}
              className="inline-block text-emerald-300 cursor-default font-medium relative"
              whileHover={{ 
                textShadow: "0px 0px 20px rgba(52,211,153,1), 0px 0px 40px rgba(52,211,153,0.8)", 
                color: "#a7f3d0", 
                scale: 1.05 
              }}
              animate={{
                textShadow: ["0px 0px 4px rgba(52,211,153,0.3)", "0px 0px 12px rgba(52,211,153,0.8)", "0px 0px 4px rgba(52,211,153,0.3)"]
              }}
              transition={{
                duration: 2 + (i % 3),
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {part}
            </motion.span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export default function App() {
  const [stage, setStage] = useState<'loader' | 'envelope' | 'password' | 'letter'>('loader');
  const [passwordError, setPasswordError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Attempt to autoplay music on mount, and attach listeners for first interaction
    const playMusic = () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.volume = 0.2;
        bgMusicRef.current.play().catch(e => console.log("Autoplay blocked. Will play on interaction."));
      }
    };
    
    playMusic();
    window.addEventListener('click', playMusic, { once: true });
    window.addEventListener('touchstart', playMusic, { once: true });
    
    return () => {
      window.removeEventListener('click', playMusic);
      window.removeEventListener('touchstart', playMusic);
    };
  }, []);

  useEffect(() => {
    if (stage === 'loader') {
      const timer = setTimeout(() => setStage('envelope'), 3500);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const handlePasswordSubmit = (pw: string) => {
    if (pw.toLowerCase().trim() === 'aduragbemi') {
      setStage('letter');
      playAudio();
    } else {
      setPasswordError(true);
    }
  };

  const playAudio = async () => {
    setIsPlaying(true);
    const fullText = `${LETTER_TEXT}\n\nWith all my love, Toluwanimi.`;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: fullText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlaying(false);
        audio.play();
        return;
      }
    } catch (error) {
      console.error("TTS Error:", error);
    }

    // Fallback to Web Speech API if Gemini TTS fails
    const utterance = new SpeechSynthesisUtterance(fullText);
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a Nigerian or male voice
    const nigerianVoice = voices.find(v => v.lang === 'en-NG' || v.name.includes('Nigeria'));
    const maleVoice = voices.find(v => v.name.toLowerCase().includes('male') || v.name.includes('David') || v.name.includes('Mark'));
    
    utterance.voice = nigerianVoice || maleVoice || voices[0];
    utterance.rate = 0.85;
    utterance.pitch = 0.8;
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  // Ensure voices are loaded for fallback
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans relative text-emerald-50">
      <FloatingHearts />
      
      {/* Autoplay background music - Note: Browsers may block this until first interaction */}
      {/* I've used a chill atmospheric track here. You can replace the src with an Anendlessocean mp3 link if you host one! */}
      <audio 
        ref={bgMusicRef} 
        src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" 
        loop 
        autoPlay
      />

      <AnimatePresence mode="wait">
        {stage === 'loader' && (
          <motion.div
            key="loader"
            exit={{ opacity: 0, scale: 0.5 }}
            className="flex flex-col items-center z-10"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                ease: "easeInOut"
              }}
            >
              <Heart className="w-20 h-20 sm:w-24 sm:h-24 text-emerald-400 fill-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" />
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 text-emerald-300 font-serif text-lg sm:text-xl italic text-center drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
            >
              Loading something special...
            </motion.p>
          </motion.div>
        )}

        {stage === 'envelope' && (
          <motion.div
            key="envelope"
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="relative cursor-pointer group z-10"
            onClick={() => setStage('password')}
          >
            <div className="relative w-72 sm:w-80 aspect-[10/7] transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              <svg width="100%" height="100%" viewBox="0 0 320 224" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="320" height="224" rx="12" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                {/* Back flap */}
                <path d="M0 12 L160 130 L320 12" fill="#022c22" stroke="#10b981" strokeWidth="1" />
                {/* Bottom flap */}
                <path d="M0 224 L160 130 L320 224" fill="#065f46" stroke="#10b981" strokeWidth="1" />
                {/* Left flap */}
                <path d="M0 12 L160 130 L0 224" fill="#047857" opacity="0.9" stroke="#10b981" strokeWidth="1" />
                {/* Right flap */}
                <path d="M320 12 L160 130 L320 224" fill="#047857" opacity="0.9" stroke="#10b981" strokeWidth="1" />
                {/* Wax seal */}
                <circle cx="160" cy="130" r="24" fill="#059669" stroke="#34d399" strokeWidth="2" />
                <circle cx="160" cy="130" r="20" fill="#047857" />
                <path d="M153 123 Q160 135 167 123" stroke="#6ee7b7" strokeWidth="2" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-12 sm:-top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-emerald-400 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold shadow-[0_0_15px_rgba(52,211,153,0.6)] whitespace-nowrap text-base sm:text-lg border border-emerald-500"
            >
              Click Me! 💌
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gray-900 rotate-45 border-r border-b border-emerald-500"></div>
            </motion.div>
          </motion.div>
        )}

        {stage === 'password' && (
          <motion.div
            key="password"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            className="bg-gray-900/90 backdrop-blur-md p-6 sm:p-8 md:p-10 rounded-3xl shadow-[0_0_30px_rgba(52,211,153,0.3)] max-w-md w-full text-center border border-emerald-500/50 z-10 mx-4"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
              <Heart className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 fill-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-emerald-300 mb-2 font-serif drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">Secret Password?</h2>
            <p className="text-sm sm:text-base text-emerald-100/70 mb-6 sm:mb-8">Only my favourite person knows the password to open this letter...</p>
            
            <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit((e.target as any).password.value); }}>
              <input
                name="password"
                type="password"
                className={`w-full p-3 sm:p-4 text-base sm:text-lg border rounded-xl mb-2 focus:outline-none transition-all text-center tracking-widest bg-gray-950 text-emerald-300 ${passwordError ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'border-emerald-500/50 focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(52,211,153,0.4)]'}`}
                placeholder="Enter password..."
                autoFocus
                onChange={() => setPasswordError(false)}
              />
              <p className="text-xs sm:text-sm text-emerald-400/80 mb-4 italic font-medium drop-shadow-[0_0_2px_rgba(52,211,153,0.8)]">Hint: The one who embodies the very definition of prayer...</p>
              
              <AnimatePresence>
                {passwordError && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-400 text-sm mb-4 font-medium drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]"
                  >
                    Oops! That's not it. Try again!
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="submit"
                className="w-full bg-emerald-600/80 hover:bg-emerald-500 text-white font-bold py-3 sm:py-4 rounded-xl transition-all text-base sm:text-lg shadow-[0_0_15px_rgba(52,211,153,0.4)] hover:shadow-[0_0_25px_rgba(52,211,153,0.6)] border border-emerald-400/50 transform hover:-translate-y-1"
              >
                Unlock Letter
              </button>
            </form>
          </motion.div>
        )}

        {stage === 'letter' && (
          <motion.div
            key="letter"
            initial={{ opacity: 0, scale: 0.8, rotateX: 20 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0 }}
            transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
            className="bg-gray-900/95 backdrop-blur-xl p-6 sm:p-8 md:p-12 rounded-lg shadow-[0_0_40px_rgba(52,211,153,0.2)] max-w-2xl w-full relative overflow-y-auto max-h-[85vh] border border-emerald-500/30 z-10 mx-4 text-emerald-50"
          >
            {/* Decorative corners */}
            <div className="absolute top-3 sm:top-4 left-3 sm:left-4 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-l-2 border-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></div>
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 w-6 sm:w-8 h-6 sm:h-8 border-t-2 border-r-2 border-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></div>
            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-l-2 border-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></div>
            <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 w-6 sm:w-8 h-6 sm:h-8 border-b-2 border-r-2 border-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]"></div>
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-900 via-emerald-400 to-emerald-900 shadow-[0_0_10px_rgba(52,211,153,0.8)]"></div>
            
            <div className="flex justify-between items-start mb-6 sm:mb-8 mt-2 sm:mt-0">
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-serif text-emerald-300 italic drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">Happy Birthday...</h1>
              {isPlaying && (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="bg-emerald-950/50 p-2 rounded-full shrink-0 ml-4 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.4)]"
                >
                  <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400 fill-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                </motion.div>
              )}
            </div>
            
            <div className="font-serif text-base sm:text-lg md:text-xl leading-relaxed sm:leading-loose text-emerald-100/90 whitespace-pre-wrap">
              <InteractiveLetterText text={LETTER_TEXT} />
            </div>
            
            <div className="mt-8 sm:mt-12 text-right font-serif text-xl sm:text-2xl text-emerald-300 italic border-t border-emerald-500/30 pt-4 sm:pt-6 drop-shadow-[0_0_5px_rgba(52,211,153,0.4)]">
              With all my love, <br/>
              <motion.span
                className="inline-block cursor-default"
                whileHover={{ scale: 1.05, textShadow: "0px 0px 20px rgba(52,211,153,1)" }}
                animate={{ textShadow: ["0px 0px 5px rgba(52,211,153,0.4)", "0px 0px 15px rgba(52,211,153,0.8)", "0px 0px 5px rgba(52,211,153,0.4)"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                Toluwanimi
              </motion.span> ❤️
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
