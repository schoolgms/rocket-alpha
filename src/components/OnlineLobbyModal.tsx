import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { MultiplayerManager, RoomParticipant } from '../game/network/MultiplayerManager';
import { CarCustomization } from '../game/garage/GarageTypes';
import { 
  X, 
  Globe, 
  Copy, 
  Check, 
  Users, 
  Play, 
  ShieldAlert, 
  ArrowRight, 
  Sparkles,
  Info
} from 'lucide-react';

interface OnlineLobbyModalProps {
  customization: CarCustomization;
  onStartOnlineMatch: (roomCode: string, isHost: boolean) => void;
  onClose: () => void;
}

export function OnlineLobbyModal({
  customization,
  onStartOnlineMatch,
  onClose
}: OnlineLobbyModalProps) {
  const { t } = useLanguage();
  const mpManager = MultiplayerManager.getInstance();

  const [inRoom, setInRoom] = useState<boolean>(!!mpManager.roomCode);
  const [roomCode, setRoomCode] = useState<string>(mpManager.roomCode || '');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [participants, setParticipants] = useState<RoomParticipant[]>(mpManager.participants);
  const [isCopied, setIsCopied] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'blue' | 'orange'>(customization.team || 'blue');

  useEffect(() => {
    const unsub = mpManager.onParticipantsUpdate = (list) => {
      setParticipants([...list]);
    };
    return () => {
      mpManager.onParticipantsUpdate = undefined;
    };
  }, [mpManager]);

  const handleCreateRoom = () => {
    const code = mpManager.createRoom({ ...customization, team: selectedTeam });
    setRoomCode(code);
    setInRoom(true);
  };

  const handleJoinRoom = (codeToJoin: string) => {
    if (!codeToJoin) return;
    mpManager.joinRoom(codeToJoin, { ...customization, team: selectedTeam });
    setRoomCode(codeToJoin);
    setInRoom(true);
  };

  const handleCopyLink = () => {
    const link = mpManager.getShareableLink();
    navigator.clipboard.writeText(link);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleToggleReady = () => {
    const next = !isReady;
    setIsReady(next);
    mpManager.setReady(next);
  };

  const handleTeamChange = (team: 'blue' | 'orange') => {
    setSelectedTeam(team);
    mpManager.setTeam(team);
  };

  const handleLaunch = () => {
    if (roomCode) {
      onStartOnlineMatch(roomCode, mpManager.isHost);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150 select-none">
      <div className="w-full max-w-xl bg-slate-950 border border-purple-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold tracking-wider text-white uppercase" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              {t.multiplayerTitle}
            </h2>
          </div>
          <button
            onClick={() => {
              if (inRoom) mpManager.leaveRoom();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {!inRoom ? (
            /* LOBBY BROWSER & ROOM CREATION */
            <div className="space-y-6">
              {/* Architecture info note */}
              <div className="p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-purple-200">
                  <div className="font-bold text-white mb-0.5">{t.multiplayerNotice}</div>
                  {t.multiplayerDesc}
                </div>
              </div>

              {/* Create or Join Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCreateRoom}
                  className="p-4 rounded-xl bg-gradient-to-br from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 border border-purple-400/50 text-white flex flex-col items-start gap-1 shadow-lg active:scale-98 transition-all"
                >
                  <span className="text-lg font-black uppercase tracking-wider" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                    {t.createRoom}
                  </span>
                  <span className="text-xs text-purple-200">Generate a custom room code for your friends</span>
                </button>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    {t.joinRoom}
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. ARENA-101"
                      value={joinCodeInput}
                      onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono font-bold text-white uppercase focus:outline-none focus:border-purple-400"
                    />
                    <button
                      onClick={() => handleJoinRoom(joinCodeInput)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase rounded-lg active:scale-95"
                    >
                      {t.joinRoom}
                    </button>
                  </div>
                </div>
              </div>

              {/* Public Arenas List */}
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  {t.publicLobby}
                </h3>
                <div className="flex flex-col gap-2">
                  {mpManager.availableRooms.map(r => (
                    <div
                      key={r.code}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col">
                        <div className="text-sm font-bold text-white flex items-center gap-2">
                          <span>{r.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-400 border border-slate-700">{r.code}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>Host: {r.hostName}</span>
                          <span>·</span>
                          <span className="capitalize">{r.stadium}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">
                          {r.playerCount}/{r.maxPlayers}
                        </span>
                        <button
                          onClick={() => handleJoinRoom(r.code)}
                          className="px-3 py-1 bg-purple-700/80 hover:bg-purple-600 text-white font-bold text-xs uppercase rounded-lg active:scale-95"
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* INSIDE ROOM LOBBY */
            <div className="space-y-5">
              {/* Room Code & Invite Link Banner */}
              <div className="p-4 rounded-xl bg-slate-900 border border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-purple-400 uppercase tracking-wider">{t.roomCode}</div>
                  <div className="text-2xl font-black font-mono text-white tracking-widest">{roomCode}</div>
                </div>

                <button
                  onClick={handleCopyLink}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/50 rounded-lg text-xs font-bold text-purple-300 uppercase transition-colors"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? t.inviteCopied : t.copyInviteLink}</span>
                </button>
              </div>

              {/* Team Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {t.joinTeam}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTeamChange('blue')}
                    className={`py-2 px-3 rounded-xl border font-bold text-sm uppercase transition-all ${
                      selectedTeam === 'blue'
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {t.blueTeam}
                  </button>
                  <button
                    onClick={() => handleTeamChange('orange')}
                    className={`py-2 px-3 rounded-xl border font-bold text-sm uppercase transition-all ${
                      selectedTeam === 'orange'
                        ? 'bg-orange-600 border-orange-400 text-white shadow-[0_0_15px_rgba(234,88,12,0.4)]'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {t.orangeTeam}
                  </button>
                </div>
              </div>

              {/* Connected Players List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t.playersConnected} ({participants.length})
                  </span>
                  <span className="text-[11px] text-emerald-400 font-semibold">{t.connected}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {participants.map(p => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${p.team === 'blue' ? 'bg-blue-500' : 'bg-orange-500'}`} />
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{p.name}</span>
                            {p.isHost && (
                              <span className="text-[10px] font-bold px-1.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                {t.hostGame}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 uppercase">
                            {p.team === 'blue' ? t.blueTeam : t.orangeTeam} · {p.customization.body}
                          </div>
                        </div>
                      </div>

                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        p.isReady ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-500'
                      }`}>
                        {p.isReady ? 'Ready' : 'Not Ready'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {inRoom && (
          <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <button
              onClick={() => {
                mpManager.leaveRoom();
                setInRoom(false);
              }}
              className="text-xs font-bold text-rose-400 hover:text-rose-300 uppercase px-3 py-1.5 bg-rose-950/40 rounded-lg border border-rose-800/40"
            >
              Leave Room
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleReady}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all ${
                  isReady ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                {isReady ? 'Ready ✓' : t.readyUp}
              </button>

              <button
                onClick={handleLaunch}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-transform"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                <Play className="w-4 h-4 fill-current" />
                {t.startGame}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
