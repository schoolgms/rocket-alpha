import { CarCustomization } from '../garage/GarageTypes';
import { CarInputs } from '../physics/PhysicsTypes';

export interface NetworkCarState {
  id: string;
  name: string;
  team: 'blue' | 'orange';
  position: [number, number, number];
  quaternion: [number, number, number, number];
  velocity: [number, number, number];
  boost: number;
  isBoosting: boolean;
  isSupersonic: boolean;
}

export interface NetworkBallState {
  position: [number, number, number];
  velocity: [number, number, number];
}

export interface NetworkMatchState {
  roomCode: string;
  isHost: boolean;
  timeRemaining: number;
  blueScore: number;
  orangeScore: number;
  isOvertime: boolean;
  isKickoff: boolean;
  kickoffCountdown: number;
  cars: NetworkCarState[];
  ball: NetworkBallState;
}

export interface RoomParticipant {
  id: string;
  name: string;
  team: 'blue' | 'orange';
  isHost: boolean;
  isReady: boolean;
  customization: CarCustomization;
}

export interface RoomInfo {
  code: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  stadium: string;
  hostName: string;
}

export class MultiplayerManager {
  private static instance: MultiplayerManager;
  public isConnected = false;
  public roomCode: string | null = null;
  public isHost = false;
  public localParticipantId: string;
  public participants: RoomParticipant[] = [];
  public availableRooms: RoomInfo[] = [];

  // Callbacks
  public onStateSync?: (state: NetworkMatchState) => void;
  public onParticipantsUpdate?: (participants: RoomParticipant[]) => void;
  public onConnectionStatus?: (status: 'disconnected' | 'connecting' | 'connected') => void;

  // Broadcast channel for same-browser / multi-tab P2P testing!
  private broadcastChannel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;

  private constructor() {
    this.localParticipantId = 'p_' + Math.random().toString(36).substring(2, 8);
    this.initBroadcastSync();
    this.generateMockPublicRooms();
  }

  public static getInstance(): MultiplayerManager {
    if (!MultiplayerManager.instance) {
      MultiplayerManager.instance = new MultiplayerManager();
    }
    return MultiplayerManager.instance;
  }

  private initBroadcastSync() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('rocket_arena_mp_channel');
        this.broadcastChannel.onmessage = (event) => {
          this.handleIncomingMessage(event.data);
        };
      }
    } catch {
      // BroadcastChannel unavailable
    }
  }

  private generateMockPublicRooms() {
    this.availableRooms = [
      { code: 'ARENA-EURO', name: 'Champions Arena 2v2', playerCount: 3, maxPlayers: 4, stadium: 'classic', hostName: 'ViperPilot' },
      { code: 'CYBER-NEON', name: 'Neon 1v1 Fast Duel', playerCount: 1, maxPlayers: 2, stadium: 'neon', hostName: 'CyberStriker' },
      { code: 'SUNSET-CUP', name: 'Sunset Mountain 3v3', playerCount: 4, maxPlayers: 6, stadium: 'sunset', hostName: 'AceRocket' },
    ];
  }

  public createRoom(customization: CarCustomization, roomCodeOverride?: string): string {
    const code = roomCodeOverride || 'ARENA-' + Math.floor(100 + Math.random() * 900);
    this.roomCode = code;
    this.isHost = true;
    this.isConnected = true;

    this.participants = [{
      id: this.localParticipantId,
      name: customization.playerName || 'Host Player',
      team: customization.team || 'blue',
      isHost: true,
      isReady: true,
      customization,
    }];

    this.broadcastMessage({
      type: 'ROOM_CREATED',
      roomCode: code,
      participant: this.participants[0],
    });

    if (this.onConnectionStatus) this.onConnectionStatus('connected');
    if (this.onParticipantsUpdate) this.onParticipantsUpdate(this.participants);

    return code;
  }

  public joinRoom(code: string, customization: CarCustomization): boolean {
    const cleanCode = code.trim().toUpperCase();
    this.roomCode = cleanCode;
    this.isHost = false;
    this.isConnected = true;

    const me: RoomParticipant = {
      id: this.localParticipantId,
      name: customization.playerName || 'Guest Player',
      team: customization.team === 'blue' ? 'orange' : 'blue',
      isHost: false,
      isReady: false,
      customization,
    };

    this.participants = [me];

    this.broadcastMessage({
      type: 'PLAYER_JOINED',
      roomCode: cleanCode,
      participant: me,
    });

    if (this.onConnectionStatus) this.onConnectionStatus('connected');
    if (this.onParticipantsUpdate) this.onParticipantsUpdate(this.participants);

    return true;
  }

  public setTeam(team: 'blue' | 'orange') {
    const me = this.participants.find(p => p.id === this.localParticipantId);
    if (me) {
      me.team = team;
      me.customization.team = team;
      this.broadcastMessage({
        type: 'PLAYER_UPDATE',
        roomCode: this.roomCode,
        participant: me,
      });
      if (this.onParticipantsUpdate) this.onParticipantsUpdate(this.participants);
    }
  }

  public setReady(ready: boolean) {
    const me = this.participants.find(p => p.id === this.localParticipantId);
    if (me) {
      me.isReady = ready;
      this.broadcastMessage({
        type: 'PLAYER_UPDATE',
        roomCode: this.roomCode,
        participant: me,
      });
      if (this.onParticipantsUpdate) this.onParticipantsUpdate(this.participants);
    }
  }

  public leaveRoom() {
    if (this.roomCode) {
      this.broadcastMessage({
        type: 'PLAYER_LEFT',
        roomCode: this.roomCode,
        participantId: this.localParticipantId,
      });
    }
    this.roomCode = null;
    this.isHost = false;
    this.isConnected = false;
    this.participants = [];
    if (this.onConnectionStatus) this.onConnectionStatus('disconnected');
    if (this.onParticipantsUpdate) this.onParticipantsUpdate([]);
  }

  public broadcastMatchState(state: NetworkMatchState) {
    if (!this.isConnected || !this.roomCode) return;
    this.broadcastMessage({
      type: 'MATCH_SYNC',
      roomCode: this.roomCode,
      state,
    });
  }

  public sendPlayerInputs(inputs: CarInputs) {
    if (!this.isConnected || !this.roomCode) return;
    this.broadcastMessage({
      type: 'PLAYER_INPUTS',
      roomCode: this.roomCode,
      participantId: this.localParticipantId,
      inputs,
    });
  }

  private broadcastMessage(msg: Record<string, unknown>) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(msg);
      } catch {
        // Ignore
      }
    }
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch {
        // Ignore
      }
    }
  }

  private handleIncomingMessage(msg: Record<string, unknown>) {
    if (!msg || typeof msg !== 'object') return;
    if (msg.roomCode !== this.roomCode) return;

    if (msg.type === 'MATCH_SYNC' && !this.isHost) {
      if (this.onStateSync && msg.state) {
        this.onStateSync(msg.state as NetworkMatchState);
      }
    } else if (msg.type === 'PLAYER_JOINED') {
      const p = msg.participant as RoomParticipant;
      if (p && p.id !== this.localParticipantId) {
        if (!this.participants.some(existing => existing.id === p.id)) {
          this.participants.push(p);
          if (this.onParticipantsUpdate) this.onParticipantsUpdate(this.participants);
          // If host, announce self back so guest discovers host
          if (this.isHost) {
            const hostP = this.participants.find(x => x.id === this.localParticipantId);
            if (hostP) {
              this.broadcastMessage({
                type: 'ROOM_ANNOUNCE',
                roomCode: this.roomCode,
                participant: hostP,
              });
            }
          }
        }
      }
    } else if (msg.type === 'ROOM_ANNOUNCE') {
      const p = msg.participant as RoomParticipant;
      if (p && p.id !== this.localParticipantId) {
        if (!this.participants.some(existing => existing.id === p.id)) {
          this.participants.unshift(p);
          if (this.onParticipantsUpdate) this.onParticipantsUpdate(this.participants);
        }
      }
    } else if (msg.type === 'PLAYER_UPDATE') {
      const p = msg.participant as RoomParticipant;
      if (p) {
        const idx = this.participants.findIndex(existing => existing.id === p.id);
        if (idx !== -1) {
          this.participants[idx] = p;
          if (this.onParticipantsUpdate) this.onParticipantsUpdate(this.participants);
        }
      }
    } else if (msg.type === 'PLAYER_LEFT') {
      const pId = msg.participantId as string;
      if (pId) {
        this.participants = this.participants.filter(p => p.id !== pId);
        if (this.onParticipantsUpdate) this.onParticipantsUpdate(this.participants);
      }
    }
  }

  public getShareableLink(): string {
    const url = new URL(window.location.href);
    if (this.roomCode) {
      url.searchParams.set('room', this.roomCode);
    }
    return url.toString();
  }
}
