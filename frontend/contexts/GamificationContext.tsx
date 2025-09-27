"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiGet, apiPost } from '@utils/api';

interface UserStats {
  credits: number;
  level: number;
  experience: number;
  experienceToNext: number;
  rank: string;
  totalPurchases: number;
  totalSpent: number;
  achievements: Achievement[];
  badges: Badge[];
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  points: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: string;
}

interface GamificationContextType {
  userStats: UserStats | null;
  isLoading: boolean;
  earnCredits: (amount: number, reason: string) => Promise<void>;
  addExperience: (amount: number, reason: string) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  unlockBadge: (badgeId: string) => Promise<void>;
  refreshStats: () => Promise<void>;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

interface GamificationProviderProps {
  children: React.ReactNode;
}

export const GamificationProvider: React.FC<GamificationProviderProps> = ({ children }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserStats = async () => {
    try {
      setIsLoading(true);
      const stats = await apiGet<UserStats>('/user/gamification/stats');
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      // Set default stats if API fails
      setUserStats({
        credits: 0,
        level: 1,
        experience: 0,
        experienceToNext: 100,
        rank: 'Novice Shopper',
        totalPurchases: 0,
        totalSpent: 0,
        achievements: [],
        badges: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const earnCredits = async (amount: number, reason: string) => {
    try {
      await apiPost('/user/gamification/earn-credits', { amount, reason });
      await refreshStats();
    } catch (error) {
      console.error('Failed to earn credits:', error);
    }
  };

  const addExperience = async (amount: number, reason: string) => {
    try {
      await apiPost('/user/gamification/add-experience', { amount, reason });
      await refreshStats();
    } catch (error) {
      console.error('Failed to add experience:', error);
    }
  };

  const unlockAchievement = async (achievementId: string) => {
    try {
      await apiPost('/user/gamification/unlock-achievement', { achievementId });
      await refreshStats();
    } catch (error) {
      console.error('Failed to unlock achievement:', error);
    }
  };

  const unlockBadge = async (badgeId: string) => {
    try {
      await apiPost('/user/gamification/unlock-badge', { badgeId });
      await refreshStats();
    } catch (error) {
      console.error('Failed to unlock badge:', error);
    }
  };

  const refreshStats = async () => {
    await fetchUserStats();
  };

  useEffect(() => {
    fetchUserStats();
  }, []);

  const value: GamificationContextType = {
    userStats,
    isLoading,
    earnCredits,
    addExperience,
    unlockAchievement,
    unlockBadge,
    refreshStats
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};

// Helper functions for gamification calculations
export const calculateCreditsFromPurchase = (amount: number): number => {
  // Earn 1 credit per $10 spent, minimum 1 credit
  return Math.max(1, Math.floor(amount / 10));
};

export const calculateExperienceFromPurchase = (amount: number): number => {
  // Earn 1 XP per $1 spent, minimum 5 XP
  return Math.max(5, Math.floor(amount));
};

export const getRankFromLevel = (level: number): string => {
  if (level >= 50) return 'Shopping Legend';
  if (level >= 40) return 'VIP Shopper';
  if (level >= 30) return 'Elite Buyer';
  if (level >= 20) return 'Pro Shopper';
  if (level >= 10) return 'Experienced Buyer';
  if (level >= 5) return 'Regular Customer';
  return 'Novice Shopper';
};

export const getLevelFromExperience = (experience: number): { level: number; experienceToNext: number } => {
  let level = 1;
  let expToNext = 100;
  let currentExp = experience;

  while (currentExp >= expToNext) {
    currentExp -= expToNext;
    level++;
    expToNext = Math.floor(expToNext * 1.2); // Each level requires 20% more XP
  }

  return { level, experienceToNext: expToNext - currentExp };
};
