'use client'

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { mainCharacter } from '@/images';
import IceCube from '@/icons/IceCube';
import { calculateEnergyLimit, calculateLevel, calculatePointsPerClick, calculateProfitPerHour, GameState, InitialGameState, useGameStore } from '@/utils/game-mechaincs';
import WebApp from '@twa-dev/sdk';

interface LoadingProps {
  setIsInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentView: (view: string) => void;
}

export default function Loading({ setIsInitialized, setCurrentView }: LoadingProps) {
  const initializeState = useGameStore((state: GameState) => state.initializeState);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const openTimestampRef = useRef(Date.now());

  const fetchOrCreateUser = async () => {
    try {
      WebApp.ready();
      let initData = WebApp.initData;
      const telegramId = WebApp.initDataUnsafe.user?.id.toString();
      const username = WebApp.initDataUnsafe.user?.username || 'Unknown User';
      const telegramName = WebApp.initDataUnsafe.user?.first_name || 'Unknown User';

      // Extract referrer from start parameter
      const startParam = new URLSearchParams(WebApp.initDataUnsafe.start_param || '').get('startapp');
      const referrerTelegramId = startParam ? startParam.replace('kentId', '') : null;

      if (process.env.NEXT_PUBLIC_BYPASS_TELEGRAM_AUTH === 'true') {
        initData = "temp";
      }
      let url = `/api/user?initData=${encodeURIComponent(initData)}`;
      if (referrerTelegramId) {
        url += `&referrer=${referrerTelegramId}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch or create user');
      }
      const userData = await response.json();

      console.log("user data: ", userData);

      // Create the game store with fetched data
      const initialState: InitialGameState = {
        userTelegramInitData: initData,
        userTelegramName: telegramName,
        lastClickTimestamp: userData.lastPointsUpdateTimestamp,
        gameLevelIndex: calculateLevel(userData.points),
        points: userData.points,
        pointsBalance: userData.pointsBalance,
        unsynchronizedPoints: 0,
        multitapLevelIndex: userData.multitapLevelIndex,
        pointsPerClick: calculatePointsPerClick(userData.multitapLevelIndex),
        energy: userData.energy,
        maxEnergy: calculateEnergyLimit(userData.energyLimitLevelIndex),
        energyRefillsLeft: userData.energyRefillsLeft,
        energyLimitLevelIndex: userData.energyLimitLevelIndex,
        lastEnergyRefillTimestamp: userData.lastEnergyRefillsTimestamp,
        mineLevelIndex: userData.mineLevelIndex,
        profitPerHour: calculateProfitPerHour(userData.mineLevelIndex)
      };

      console.log("Initial state: ", initialState);

      initializeState(initialState);
      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Handle error (e.g., show error message to user)
    }
  };

  useEffect(() => {
    fetchOrCreateUser();
  }, []);

  useEffect(() => {
    if (isDataLoaded) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - openTimestampRef.current;
      const remainingTime = Math.max(3000 - elapsedTime, 0);

      const timer = setTimeout(() => {
        setCurrentView('game');
        setIsInitialized(true);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [isDataLoaded, setIsInitialized]);

  return (
    <div className="bg-[#000000] flex justify-center items-center h-screen">
      <div className="w-full max-w-xl text-white flex flex-col items-center">
        <div className="w-64 h-64 rounded-full circle-outer p-2 mb-8">
          <div className="w-full h-full rounded-full circle-inner overflow-hidden relative">
            <Image
              src={mainCharacter}
              alt="Main Character"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'cover',
                transform: 'scale(1.05) translateY(10%)'
              }}
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-4">LOADING DEADPOOL</h1>

        <div className="flex items-center space-x-2">
          <IceCube className="w-0 h-0 animate-pulse" />
          <IceCube className="w-0 h-0 animate-pulse delay-100" />
          <IceCube className="w-0 h-0 animate-pulse delay-200" />
        </div>
      </div>
    </div>
  );
}