import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  getDocs,
  serverTimestamp,
  increment,
  arrayUnion,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Room, GamePhase, GameState, Team, Player, PlayerRole } from '../types';
import { generateJoinCode } from '../lib/utils';

const ROOMS_COLLECTION = 'rooms';

export const gameService = {
  async createRoom(hostId: string): Promise<string> {
    const code = generateJoinCode();
    const roomId = doc(collection(db, ROOMS_COLLECTION)).id;
    
    const initialGameState: GameState = {
      stamina: 100,
      water: 100,
      morale: 100,
      currentPhase: GamePhase.LOBBY,
      phaseStartTime: Date.now(),
      allianceBuilt: false,
      crisisSolved: false,
      miracleTriggered: false,
      victoryAchieved: false,
      lastAction: 'Room Created'
    };

    const roomData = {
      id: roomId,
      code,
      status: GamePhase.LOBBY,
      hostId,
      gameState: initialGameState,
      playersCount: 0,
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, ROOMS_COLLECTION, roomId), roomData);
      return roomId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${ROOMS_COLLECTION}/${roomId}`);
      return '';
    }
  },

  async joinRoom(code: string, playerName: string, userId: string): Promise<string | null> {
    try {
      const q = query(collection(db, ROOMS_COLLECTION), where('code', '==', code), where('status', '==', GamePhase.LOBBY));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return null;
      
      const roomDoc = querySnapshot.docs[0];
      const roomId = roomDoc.id;
      
      const playerRef = doc(db, `${ROOMS_COLLECTION}/${roomId}/players`, userId);
      const playerData: Player = {
        id: userId,
        name: playerName,
        team: null,
        role: PlayerRole.UNASSIGNED,
        isHost: false,
        score: 0
      };
      
      await setDoc(playerRef, playerData);
      await updateDoc(doc(db, ROOMS_COLLECTION, roomId), {
        playersCount: increment(1)
      });
      
      return roomId;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `rooms/${code}/players`);
      return null;
    }
  },

  subscribeToRoom(roomId: string, callback: (room: Room) => void) {
    return onSnapshot(doc(db, ROOMS_COLLECTION, roomId), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as Room);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${ROOMS_COLLECTION}/${roomId}`);
    });
  },

  subscribeToPlayers(roomId: string, callback: (players: Player[]) => void) {
    return onSnapshot(collection(db, `${ROOMS_COLLECTION}/${roomId}/players`), (snapshot) => {
      const players = snapshot.docs.map(doc => doc.data() as Player);
      callback(players);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `${ROOMS_COLLECTION}/${roomId}/players`);
    });
  },

  async updateGameState(roomId: string, updates: Partial<GameState>) {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const currentGameState = roomSnap.data().gameState;
        await updateDoc(roomRef, {
          gameState: { ...currentGameState, ...updates }
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${ROOMS_COLLECTION}/${roomId}`);
    }
  },

  async setGamePhase(roomId: string, phase: GamePhase) {
    try {
      await updateDoc(doc(db, ROOMS_COLLECTION, roomId), {
        status: phase,
        'gameState.currentPhase': phase,
        'gameState.phaseStartTime': Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${ROOMS_COLLECTION}/${roomId}`);
    }
  },

  async assignTeams(roomId: string, players: Player[]) {
    const teams: Team[] = [Team.YISRAEL, Team.YEHUDAH, Team.EDOM];
    const updates = players.map((player, index) => {
      const team = teams[index % teams.length];
      return updateDoc(doc(db, `${ROOMS_COLLECTION}/${roomId}/players`, player.id), { team });
    });
    await Promise.all(updates);
  },

  async setPlayerRole(roomId: string, playerId: string, role: PlayerRole) {
    try {
      await updateDoc(doc(db, `${ROOMS_COLLECTION}/${roomId}/players`, playerId), { role });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${ROOMS_COLLECTION}/${roomId}/players/${playerId}`);
    }
  },

  async updatePlayerScore(roomId: string, playerId: string, points: number) {
    try {
      await updateDoc(doc(db, `${ROOMS_COLLECTION}/${roomId}/players`, playerId), {
        score: increment(points)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${ROOMS_COLLECTION}/${roomId}/players/${playerId}`);
    }
  }
};
