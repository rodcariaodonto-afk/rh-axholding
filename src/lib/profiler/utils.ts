// Profiler utility functions

/**
 * Converts a profiler result code to its abbreviated initials.
 * E.g., "ANA_COM" -> "AC", "EXE" -> "E", "COM_PLA" -> "CP"
 */
export const getProfilerInitials = (code: string | null | undefined): string => {
  if (!code) return "";
  
  // Map full codes to their first letter
  const codeMap: Record<string, string> = {
    EXE: "E",
    COM: "C",
    PLA: "P",
    ANA: "A",
  };
  
  // Handle combined profiles (e.g., "EXE_COM" -> "EC")
  if (code.includes("_")) {
    const parts = code.split("_");
    return parts.map(part => codeMap[part] || part[0]).join("");
  }
  
  // Handle single profiles
  return codeMap[code] || code[0];
};
