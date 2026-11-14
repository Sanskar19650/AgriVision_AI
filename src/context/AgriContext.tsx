import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  auth,
  db,
  OperationType,
  handleFirestoreError,
  testFirestoreConnection,
  signOut,
} from '../firebase';
import {
  DEMO_ACTIVITIES,
  DEMO_BLOCKCHAIN,
  DEMO_CROPS,
  DEMO_DAMAGE_DETECTIONS,
  DEMO_DEVICES,
  DEMO_DISEASE_DETECTIONS,
  DEMO_FARMS,
  DEMO_FERTILIZERS,
  DEMO_IRRIGATION,
  DEMO_LAND_RECORDS,
  DEMO_NOTIFICATIONS,
  DEMO_PLOTS,
  DEMO_RECOMMENDATIONS,
  DEMO_SOIL_READINGS,
  DEMO_USER,
  DEMO_WEATHER_RECORDS,
} from '../data/demoSeedData';
import type {
  BlockchainRecord,
  Crop,
  CropActivity,
  CropRecommendation,
  DamageDetection,
  DiseaseDetection,
  Farm,
  FertilizerRecord,
  IotDevice,
  IrrigationRecord,
  LandRecord,
  NotificationItem,
  Plot,
  SoilReading,
  UserProfile,
  WeatherRecord,
} from '../types/agri';

interface DemoSnapshotState {
  profile: UserProfile;
  farms: Farm[];
  plots: Plot[];
  landRecords: LandRecord[];
  crops: Crop[];
  cropActivities: CropActivity[];
  soilReadings: SoilReading[];
  iotDevices: IotDevice[];
  diseaseDetections: DiseaseDetection[];
  damageDetections: DamageDetection[];
  cropRecommendations: CropRecommendation[];
  irrigationRecords: IrrigationRecord[];
  fertilizerRecords: FertilizerRecord[];
  notifications: NotificationItem[];
  blockchainRecords: BlockchainRecord[];
  weatherRecords: WeatherRecord[];
}

const DEMO_STORAGE_KEY = 'agrivision_demo_workspace_v1';
const DEMO_ACTIVE_KEY = 'agrivision_demo_active_v1';

function buildInitialDemoState(): DemoSnapshotState {
  return {
    profile: DEMO_USER,
    farms: DEMO_FARMS,
    plots: DEMO_PLOTS,
    landRecords: DEMO_LAND_RECORDS,
    crops: DEMO_CROPS,
    cropActivities: DEMO_ACTIVITIES,
    soilReadings: DEMO_SOIL_READINGS,
    iotDevices: DEMO_DEVICES,
    diseaseDetections: DEMO_DISEASE_DETECTIONS,
    damageDetections: DEMO_DAMAGE_DETECTIONS,
    cropRecommendations: DEMO_RECOMMENDATIONS,
    irrigationRecords: DEMO_IRRIGATION,
    fertilizerRecords: DEMO_FERTILIZERS,
    notifications: DEMO_NOTIFICATIONS,
    blockchainRecords: DEMO_BLOCKCHAIN,
    weatherRecords: DEMO_WEATHER_RECORDS,
  };
}

function loadDemoState(): DemoSnapshotState {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return buildInitialDemoState();
    return { ...buildInitialDemoState(), ...JSON.parse(raw) };
  } catch {
    return buildInitialDemoState();
  }
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeDocDates<T extends Record<string, any>>(data: T): T {
  const out: Record<string, any> = { ...data };
  for (const k of ['createdAt', 'updatedAt']) {
    if (out[k] instanceof Timestamp) {
      out[k] = out[k].toDate().toISOString();
    } else if (!out[k]) {
      out[k] = new Date().toISOString();
    }
  }
  return out as T;
}

interface AgriContextValue {
  authReady: boolean;
  firebaseUser: User | null;
  isDemoMode: boolean;
  profile: UserProfile | null;
  farms: Farm[];
  plots: Plot[];
  landRecords: LandRecord[];
  crops: Crop[];
  cropActivities: CropActivity[];
  soilReadings: SoilReading[];
  iotDevices: IotDevice[];
  diseaseDetections: DiseaseDetection[];
  damageDetections: DamageDetection[];
  cropRecommendations: CropRecommendation[];
  irrigationRecords: IrrigationRecord[];
  fertilizerRecords: FertilizerRecord[];
  notifications: NotificationItem[];
  blockchainRecords: BlockchainRecord[];
  weatherRecords: WeatherRecord[];
  enterDemoMode: () => void;
  exitSession: () => Promise<void>;
  resetDemoData: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  addFarm: (farm: Omit<Farm, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateFarm: (id: string, updates: Partial<Farm>) => Promise<void>;
  deleteFarm: (id: string) => Promise<void>;
  addPlot: (plot: Omit<Plot, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  saveLandRecord: (record: Omit<LandRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addCrop: (crop: Omit<Crop, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCrop: (id: string, updates: Partial<Crop>) => Promise<void>;
  addCropActivity: (act: Omit<CropActivity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addSoilReading: (reading: Omit<SoilReading, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addIotDevice: (device: Omit<IotDevice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  logDiseaseDetection: (item: Omit<DiseaseDetection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  logDamageDetection: (item: Omit<DamageDetection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  logCropRecommendation: (item: Omit<CropRecommendation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addIrrigation: (item: Omit<IrrigationRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateIrrigationStatus: (id: string, status: IrrigationRecord['status']) => Promise<void>;
  addFertilizer: (item: Omit<FertilizerRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addNotification: (item: Omit<NotificationItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  markNotificationRead: (id: string, read: boolean) => Promise<void>;
  addBlockchainRecord: (item: Omit<BlockchainRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  addWeatherRecord: (item: Omit<WeatherRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
}

const AgriContext = createContext<AgriContextValue | null>(null);

export function AgriProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        localStorage.setItem(DEMO_ACTIVE_KEY, 'true');
        return true;
      }
      return localStorage.getItem(DEMO_ACTIVE_KEY) === 'true';
    }
    return false;
  });

  const [demoState, setDemoState] = useState<DemoSnapshotState>(loadDemoState);

  // Live Firestore states
  const [liveProfile, setLiveProfile] = useState<UserProfile | null>(null);
  const [liveFarms, setLiveFarms] = useState<Farm[]>([]);
  const [livePlots, setLivePlots] = useState<Plot[]>([]);
  const [liveLandRecords, setLiveLandRecords] = useState<LandRecord[]>([]);
  const [liveCrops, setLiveCrops] = useState<Crop[]>([]);
  const [liveActivities, setLiveActivities] = useState<CropActivity[]>([]);
  const [liveSoil, setLiveSoil] = useState<SoilReading[]>([]);
  const [liveDevices, setLiveDevices] = useState<IotDevice[]>([]);
  const [liveDisease, setLiveDisease] = useState<DiseaseDetection[]>([]);
  const [liveDamage, setLiveDamage] = useState<DamageDetection[]>([]);
  const [liveRecs, setLiveRecs] = useState<CropRecommendation[]>([]);
  const [liveIrrigation, setLiveIrrigation] = useState<IrrigationRecord[]>([]);
  const [liveFertilizer, setLiveFertilizer] = useState<FertilizerRecord[]>([]);
  const [liveNotifications, setLiveNotifications] = useState<NotificationItem[]>([]);
  const [liveBlockchain, setLiveBlockchain] = useState<BlockchainRecord[]>([]);
  const [liveWeather, setLiveWeather] = useState<WeatherRecord[]>([]);

  useEffect(() => {
    testFirestoreConnection();
  }, []);

  useEffect(() => {
    if (isDemoMode) {
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demoState));
      } catch {
        // Ignore storage quota issues
      }
    }
  }, [demoState, isDemoMode]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsDemoMode(false);
        localStorage.removeItem(DEMO_ACTIVE_KEY);
        const userRef = doc(db, 'users', user.uid);
        try {
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            setLiveProfile(normalizeDocDates(snap.data() as UserProfile));
          } else if (user.emailVerified) {
            const isBootstrappedAdmin = user.email === 'jamdadesanskar14@gmail.com';
            const initial: UserProfile = {
              uid: user.uid,
              fullName: user.displayName || 'Farmer User',
              email: user.email || '',
              mobile: user.phoneNumber || '',
              role: isBootstrappedAdmin ? 'admin' : 'farmer',
              state: 'Maharashtra',
              district: 'Pune',
              taluka: 'Baramati',
              village: '',
              address: '',
              photoUrl: user.photoURL || '',
            };
            await setDoc(userRef, {
              ...initial,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            setLiveProfile(initial);
          } else {
            setLiveProfile({
              uid: user.uid,
              fullName: user.displayName || 'Farmer User',
              email: user.email || '',
              mobile: '',
              role: 'farmer',
              state: 'Maharashtra',
              district: 'Pune',
              taluka: '',
              village: '',
              address: '',
            });
          }
        } catch (err) {
          console.warn('User profile sync notice:', err);
        }
      } else {
        setLiveProfile(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Attach Firestore snapshot listeners only when authenticated
  useEffect(() => {
    if (!firebaseUser || isDemoMode) return;
    const uid = firebaseUser.uid;
    const subscribe = <T extends Record<string, any>>(
      colName: string,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ) => {
      const q = query(collection(db, colName), where('userId', '==', uid));
      return onSnapshot(
        q,
        (snapshot) => {
          const rows = snapshot.docs.map((d) => normalizeDocDates(d.data()) as T);
          setter(rows);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, colName);
        }
      );
    };

    const unsubs = [
      subscribe<Farm>('farms', setLiveFarms),
      subscribe<Plot>('plots', setLivePlots),
      subscribe<LandRecord>('landRecords', setLiveLandRecords),
      subscribe<Crop>('crops', setLiveCrops),
      subscribe<CropActivity>('cropActivities', setLiveActivities),
      subscribe<SoilReading>('soilReadings', setLiveSoil),
      subscribe<IotDevice>('iotDevices', setLiveDevices),
      subscribe<DiseaseDetection>('diseaseDetections', setLiveDisease),
      subscribe<DamageDetection>('damageDetections', setLiveDamage),
      subscribe<CropRecommendation>('cropRecommendations', setLiveRecs),
      subscribe<IrrigationRecord>('irrigationRecords', setLiveIrrigation),
      subscribe<FertilizerRecord>('fertilizerRecords', setLiveFertilizer),
      subscribe<NotificationItem>('notifications', setLiveNotifications),
      subscribe<BlockchainRecord>('blockchainRecords', setLiveBlockchain),
      subscribe<WeatherRecord>('weatherRecords', (rows) => {
        const sorted = [...(typeof rows === 'function' ? [] : rows)].sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
        setLiveWeather(sorted);
      }),
    ];

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [firebaseUser, isDemoMode]);

  const enterDemoMode = () => {
    localStorage.setItem(DEMO_ACTIVE_KEY, 'true');
    setIsDemoMode(true);
  };

  const exitSession = async () => {
    localStorage.removeItem(DEMO_ACTIVE_KEY);
    setIsDemoMode(false);
    if (auth.currentUser) {
      await signOut(auth);
    }
  };

  const resetDemoData = () => {
    const fresh = buildInitialDemoState();
    setDemoState(fresh);
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh));
  };

  const activeUid = firebaseUser?.uid || demoState.profile.uid;

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (isDemoMode || !firebaseUser) {
      setDemoState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updates, updatedAt: new Date().toISOString() },
      }));
      return;
    }
    const ref = doc(db, 'users', firebaseUser.uid);
    try {
      const allowed = {
        fullName: updates.fullName ?? liveProfile?.fullName ?? 'Farmer',
        mobile: updates.mobile ?? liveProfile?.mobile ?? '',
        state: updates.state ?? liveProfile?.state ?? 'Maharashtra',
        district: updates.district ?? liveProfile?.district ?? '',
        taluka: updates.taluka ?? liveProfile?.taluka ?? '',
        village: updates.village ?? liveProfile?.village ?? '',
        address: updates.address ?? liveProfile?.address ?? '',
        photoUrl: updates.photoUrl ?? liveProfile?.photoUrl ?? '',
        updatedAt: serverTimestamp(),
      };
      await updateDoc(ref, allowed);
      setLiveProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${firebaseUser.uid}`);
    }
  };

  const writeRecord = async <T extends { id: string }>(
    colName: string,
    demoKey: keyof DemoSnapshotState,
    prefix: string,
    payload: Omit<T, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    const id = makeId(prefix);
    const nowIso = new Date().toISOString();
    if (isDemoMode || !firebaseUser) {
      const item = {
        ...payload,
        id,
        userId: activeUid,
        createdAt: nowIso,
        updatedAt: nowIso,
      } as unknown as T;
      setDemoState((prev) => ({
        ...prev,
        [demoKey]: [item, ...(prev[demoKey] as unknown as T[])],
      }));
      return id;
    }

    const docPath = `${colName}/${id}`;
    try {
      await setDoc(doc(db, colName, id), {
        ...payload,
        id,
        userId: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, docPath);
    }
  };

  const addFarm = (farm: Omit<Farm, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    writeRecord<Farm>('farms', 'farms', 'farm', farm);

  const updateFarm = async (id: string, updates: Partial<Farm>) => {
    if (isDemoMode || !firebaseUser) {
      setDemoState((prev) => ({
        ...prev,
        farms: prev.farms.map((f) =>
          f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
        ),
      }));
      return;
    }
    try {
      await updateDoc(doc(db, 'farms', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `farms/${id}`);
    }
  };

  const deleteFarm = async (id: string) => {
    if (isDemoMode || !firebaseUser) {
      setDemoState((prev) => ({
        ...prev,
        farms: prev.farms.filter((f) => f.id !== id),
      }));
      return;
    }
    try {
      await deleteDoc(doc(db, 'farms', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `farms/${id}`);
    }
  };

  const addPlot = async (plot: Omit<Plot, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<Plot>('plots', 'plots', 'plot', plot);
  };

  const saveLandRecord = async (record: Omit<LandRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<LandRecord>('landRecords', 'landRecords', 'land', record);
  };

  const addCrop = async (crop: Omit<Crop, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<Crop>('crops', 'crops', 'crop', crop);
  };

  const updateCrop = async (id: string, updates: Partial<Crop>) => {
    if (isDemoMode || !firebaseUser) {
      setDemoState((prev) => ({
        ...prev,
        crops: prev.crops.map((c) =>
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        ),
      }));
      return;
    }
    try {
      await updateDoc(doc(db, 'crops', id), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `crops/${id}`);
    }
  };

  const addCropActivity = async (act: Omit<CropActivity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<CropActivity>('cropActivities', 'cropActivities', 'act', act);
  };

  const addSoilReading = async (reading: Omit<SoilReading, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<SoilReading>('soilReadings', 'soilReadings', 'soil', reading);
  };

  const addIotDevice = async (device: Omit<IotDevice, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<IotDevice>('iotDevices', 'iotDevices', 'dev', device);
  };

  const logDiseaseDetection = async (item: Omit<DiseaseDetection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<DiseaseDetection>('diseaseDetections', 'diseaseDetections', 'dis', item);
  };

  const logDamageDetection = async (item: Omit<DamageDetection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<DamageDetection>('damageDetections', 'damageDetections', 'dmg', item);
  };

  const logCropRecommendation = async (item: Omit<CropRecommendation, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<CropRecommendation>('cropRecommendations', 'cropRecommendations', 'rec', item);
  };

  const addIrrigation = async (item: Omit<IrrigationRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<IrrigationRecord>('irrigationRecords', 'irrigationRecords', 'irr', item);
  };

  const updateIrrigationStatus = async (id: string, status: IrrigationRecord['status']) => {
    if (isDemoMode || !firebaseUser) {
      setDemoState((prev) => ({
        ...prev,
        irrigationRecords: prev.irrigationRecords.map((r) =>
          r.id === id ? { ...r, status, updatedAt: new Date().toISOString() } : r
        ),
      }));
      return;
    }
    try {
      await updateDoc(doc(db, 'irrigationRecords', id), {
        status,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `irrigationRecords/${id}`);
    }
  };

  const addFertilizer = async (item: Omit<FertilizerRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<FertilizerRecord>('fertilizerRecords', 'fertilizerRecords', 'fert', item);
  };

  const addNotification = async (item: Omit<NotificationItem, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<NotificationItem>('notifications', 'notifications', 'notif', item);
  };

  const markNotificationRead = async (id: string, read: boolean) => {
    if (isDemoMode || !firebaseUser) {
      setDemoState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) =>
          n.id === id ? { ...n, read, updatedAt: new Date().toISOString() } : n
        ),
      }));
      return;
    }
    try {
      await updateDoc(doc(db, 'notifications', id), {
        read,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const addBlockchainRecord = async (item: Omit<BlockchainRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    await writeRecord<BlockchainRecord>('blockchainRecords', 'blockchainRecords', 'bc', item);
  };

  const addWeatherRecord = async (item: Omit<WeatherRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) =>
    writeRecord<WeatherRecord>('weatherRecords', 'weatherRecords', 'wx', {
      ...item,
      condition: String(item.condition || 'Clear').slice(0, 80),
      source: item.source ? String(item.source).slice(0, 120) : undefined,
    });

  const value: AgriContextValue = {
    authReady,
    firebaseUser,
    isDemoMode,
    profile: isDemoMode ? demoState.profile : liveProfile,
    farms: isDemoMode ? demoState.farms : liveFarms,
    plots: isDemoMode ? demoState.plots : livePlots,
    landRecords: isDemoMode ? demoState.landRecords : liveLandRecords,
    crops: isDemoMode ? demoState.crops : liveCrops,
    cropActivities: isDemoMode ? demoState.cropActivities : liveActivities,
    soilReadings: isDemoMode ? demoState.soilReadings : liveSoil,
    iotDevices: isDemoMode ? demoState.iotDevices : liveDevices,
    diseaseDetections: isDemoMode ? demoState.diseaseDetections : liveDisease,
    damageDetections: isDemoMode ? demoState.damageDetections : liveDamage,
    cropRecommendations: isDemoMode ? demoState.cropRecommendations : liveRecs,
    irrigationRecords: isDemoMode ? demoState.irrigationRecords : liveIrrigation,
    fertilizerRecords: isDemoMode ? demoState.fertilizerRecords : liveFertilizer,
    notifications: isDemoMode ? demoState.notifications : liveNotifications,
    blockchainRecords: isDemoMode ? demoState.blockchainRecords : liveBlockchain,
    weatherRecords: isDemoMode ? demoState.weatherRecords : liveWeather,
    enterDemoMode,
    exitSession,
    resetDemoData,
    updateProfile,
    addFarm,
    updateFarm,
    deleteFarm,
    addPlot,
    saveLandRecord,
    addCrop,
    updateCrop,
    addCropActivity,
    addSoilReading,
    addIotDevice,
    logDiseaseDetection,
    logDamageDetection,
    logCropRecommendation,
    addIrrigation,
    updateIrrigationStatus,
    addFertilizer,
    addNotification,
    markNotificationRead,
    addBlockchainRecord,
    addWeatherRecord,
  };

  return <AgriContext.Provider value={value}>{children}</AgriContext.Provider>;
}

export function useAgri() {
  const ctx = useContext(AgriContext);
  if (!ctx) throw new Error('useAgri must be used within AgriProvider');
  return ctx;
}
