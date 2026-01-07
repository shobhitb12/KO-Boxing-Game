
import React, { useState, useEffect, useRef } from 'react';
import { PlayerConfig, GameState } from './types';
import BoxingGame from './components/BoxingGame';
import { P1_CONTROLS, P2_CONTROLS } from './constants';
import { getMatchCommentary } from './services/geminiService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [p1Config, setP1Config] = useState<PlayerConfig>({
    name: 'Player 1',
    faceUrl: null,
    color: '#ef4444' // Tailwind red-500
  });
  const [p2Config, setP2Config] = useState<PlayerConfig>({
    name: 'Player 2',
    faceUrl: null,
    color: '#3b82f6' // Tailwind blue-500
  });
  const [winner, setWinner] = useState<string | null>(null);
  const [commentary, setCommentary] = useState<string>('');
  const [loadingCommentary, setLoadingCommentary] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, playerNum: 1 | 2) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (playerNum === 1) setP1Config(prev => ({ ...prev, faceUrl: url }));
      else setP2Config(prev => ({ ...prev, faceUrl: url }));
    }
  };

  const startGame = () => {
    setWinner(null);
    setCommentary('');
    setGameState('PLAYING');
  };

  const onGameOver = async (winnerName: string) => {
    setWinner(winnerName);
    setGameState('GAMEOVER');
    setLoadingCommentary(true);
    const loserName = winnerName === p1Config.name ? p2Config.name : p1Config.name;
    const aiText = await getMatchCommentary(winnerName, loserName);
    setCommentary(aiText);
    setLoadingCommentary(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-900 text-white p-4">
      {gameState === 'MENU' && (
        <div className="max-w-4xl w-full flex flex-col items-center animate-in fade-in zoom-in duration-500">
          <h1 className="text-7xl font-bungee mb-8 text-yellow-500 drop-shadow-lg text-center leading-none">
            FACE-OFF <br/> <span className="text-white">BOXING</span>
          </h1>
          
          <div className="grid md:grid-cols-2 gap-8 w-full mb-12">
            {/* Player 1 Selection */}
            <div className="bg-zinc-800 p-6 rounded-2xl border-4 border-red-500 shadow-xl flex flex-col items-center space-y-4">
              <h2 className="text-2xl font-bold text-red-500">PLAYER 1</h2>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center">
                {p1Config.faceUrl ? (
                  <img src={p1Config.faceUrl} alt="P1 Face" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-zinc-500 text-center text-xs">NO FACE</div>
                )}
              </div>
              <input 
                type="text" 
                value={p1Config.name} 
                onChange={(e) => setP1Config(p => ({...p, name: e.target.value}))}
                className="bg-zinc-700 border-none rounded px-3 py-2 text-center focus:ring-2 ring-red-500 w-full"
                placeholder="Name"
              />
              <label className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-all w-full text-center">
                UPLOAD FACE
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 1)} />
              </label>
              <div className="text-xs text-zinc-400 font-mono text-center">
                Q/E: Move | W: Jump | S: Punch | D: Kick
              </div>
            </div>

            {/* Player 2 Selection */}
            <div className="bg-zinc-800 p-6 rounded-2xl border-4 border-blue-500 shadow-xl flex flex-col items-center space-y-4">
              <h2 className="text-2xl font-bold text-blue-500">PLAYER 2</h2>
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-700 bg-zinc-900 flex items-center justify-center">
                {p2Config.faceUrl ? (
                  <img src={p2Config.faceUrl} alt="P2 Face" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-zinc-500 text-center text-xs">NO FACE</div>
                )}
              </div>
              <input 
                type="text" 
                value={p2Config.name} 
                onChange={(e) => setP2Config(p => ({...p, name: e.target.value}))}
                className="bg-zinc-700 border-none rounded px-3 py-2 text-center focus:ring-2 ring-blue-500 w-full"
                placeholder="Name"
              />
              <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-all w-full text-center">
                UPLOAD FACE
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 2)} />
              </label>
              <div className="text-xs text-zinc-400 font-mono text-center">
                I/P: Move | O: Jump | J: Punch | K: Kick
              </div>
            </div>
          </div>

          <button 
            onClick={startGame}
            className="group relative inline-flex items-center justify-center px-12 py-6 font-bungee text-3xl tracking-tighter text-black bg-yellow-400 rounded-full hover:bg-yellow-300 transform transition-all hover:scale-105 active:scale-95 shadow-[0_0_50px_-12px_rgba(234,179,8,0.5)]"
          >
            FIGHT!
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && (
        <BoxingGame 
          p1Config={p1Config} 
          p2Config={p2Config} 
          onGameOver={onGameOver}
        />
      )}

      {gameState === 'GAMEOVER' && (
        <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-6 animate-in fade-in duration-700">
          <h2 className="text-8xl font-bungee text-white mb-2 tracking-widest drop-shadow-2xl">K.O.</h2>
          <p className="text-4xl font-bold text-yellow-400 mb-8 font-bungee">{winner} WINS!</p>
          
          <div className="bg-zinc-800 p-8 rounded-3xl max-w-2xl border-2 border-yellow-500/30 text-center mb-8 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-bold font-bungee">GEMINI COMMENTARY</div>
            {loadingCommentary ? (
              <div className="flex items-center space-x-2 justify-center py-4">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
              </div>
            ) : (
              <p className="italic text-xl leading-relaxed text-zinc-200">"{commentary}"</p>
            )}
          </div>

          <button 
            onClick={() => setGameState('MENU')}
            className="bg-white text-black px-8 py-3 rounded-full font-bold hover:bg-zinc-200 transition-colors"
          >
            BACK TO MENU
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
