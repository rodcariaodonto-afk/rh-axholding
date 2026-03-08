// Profiler Comportamental - Profile Calculation Logic

import { Trait, realTraits, perceivedTraits } from "./traits";
import { profiles, Profile, getProfileByCode } from "./profiles";

export interface ProfileScores {
  EXE: number;
  COM: number;
  PLA: number;
  ANA: number;
}

export interface ProfileResult {
  code: string;
  profile: Profile;
  scores: ProfileScores;
  primaryProfile: string;
  secondaryProfile: string | null;
}

/**
 * Calculate profile scores based on selected traits
 */
const calculateScores = (
  realSelections: string[],
  perceivedSelections: string[]
): ProfileScores => {
  const scores: ProfileScores = {
    EXE: 0,
    COM: 0,
    PLA: 0,
    ANA: 0,
  };

  // Process real traits (weight multiplier: 1.5x for self-perception)
  realSelections.forEach((traitId) => {
    const trait = realTraits.find((t) => t.id === traitId);
    if (trait) {
      trait.profiles.forEach((profileCode) => {
        if (profileCode in scores) {
          scores[profileCode as keyof ProfileScores] += trait.weight * 1.5;
        }
      });
    }
  });

  // Process perceived traits (weight multiplier: 1x)
  perceivedSelections.forEach((traitId) => {
    const trait = perceivedTraits.find((t) => t.id === traitId);
    if (trait) {
      trait.profiles.forEach((profileCode) => {
        if (profileCode in scores) {
          scores[profileCode as keyof ProfileScores] += trait.weight;
        }
      });
    }
  });

  return scores;
};

/**
 * Determine the final profile code based on scores
 */
const determineProfileCode = (scores: ProfileScores): { primary: string; secondary: string | null } => {
  // Sort profiles by score
  const sortedProfiles = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([code]) => code);

  const primary = sortedProfiles[0];
  const secondary = sortedProfiles[1];
  
  // Calculate score difference percentage
  const primaryScore = scores[primary as keyof ProfileScores];
  const secondaryScore = scores[secondary as keyof ProfileScores];
  
  // If secondary score is at least 70% of primary, consider it a combined profile
  const ratio = secondaryScore / primaryScore;
  
  if (ratio >= 0.7) {
    return { primary, secondary };
  }
  
  return { primary, secondary: null };
};

/**
 * Get the combined profile code if applicable
 */
const getCombinedCode = (primary: string, secondary: string | null): string => {
  if (!secondary) {
    return primary;
  }
  
  // Check if combined profile exists
  const combinedCode = `${primary}_${secondary}`;
  if (profiles[combinedCode]) {
    return combinedCode;
  }
  
  // Try reverse combination
  const reverseCombinedCode = `${secondary}_${primary}`;
  if (profiles[reverseCombinedCode]) {
    return reverseCombinedCode;
  }
  
  // Return primary if no combined profile exists
  return primary;
};

/**
 * Main function to calculate the behavioral profile
 */
export const calculateProfile = (
  realSelections: string[],
  perceivedSelections: string[]
): ProfileResult => {
  // Calculate scores
  const scores = calculateScores(realSelections, perceivedSelections);
  
  // Determine primary and secondary profiles
  const { primary, secondary } = determineProfileCode(scores);
  
  // Get the final profile code (may be combined)
  const finalCode = getCombinedCode(primary, secondary);
  
  // Get the profile object
  const profile = getProfileByCode(finalCode) || getProfileByCode(primary)!;
  
  return {
    code: finalCode,
    profile,
    scores,
    primaryProfile: primary,
    secondaryProfile: secondary,
  };
};

/**
 * Format scores as percentages for display
 */
export const getScorePercentages = (scores: ProfileScores): Record<string, number> => {
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  
  if (total === 0) {
    return { EXE: 25, COM: 25, PLA: 25, ANA: 25 };
  }
  
  return {
    EXE: Math.round((scores.EXE / total) * 100),
    COM: Math.round((scores.COM / total) * 100),
    PLA: Math.round((scores.PLA / total) * 100),
    ANA: Math.round((scores.ANA / total) * 100),
  };
};

export const profileLabels: Record<string, string> = {
  EXE: "Executor",
  COM: "Comunicador",
  PLA: "Planejador",
  ANA: "Analista",
};
