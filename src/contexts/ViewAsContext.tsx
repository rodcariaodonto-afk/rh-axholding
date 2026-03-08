import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ViewAsContextValue {
  /** True when admin/people is previewing as a regular collaborator */
  isViewingAsCollaborator: boolean;
  /** Toggle the "view as collaborator" mode */
  toggleViewAsCollaborator: () => void;
  /** Explicitly set the mode */
  setViewingAsCollaborator: (value: boolean) => void;
}

const ViewAsContext = createContext<ViewAsContextValue | undefined>(undefined);

export function ViewAsProvider({ children }: { children: ReactNode }) {
  const [isViewingAsCollaborator, setViewingAsCollaborator] = useState(false);

  const toggleViewAsCollaborator = useCallback(() => {
    setViewingAsCollaborator((prev) => !prev);
  }, []);

  return (
    <ViewAsContext.Provider
      value={{
        isViewingAsCollaborator,
        toggleViewAsCollaborator,
        setViewingAsCollaborator,
      }}
    >
      {children}
    </ViewAsContext.Provider>
  );
}

export function useViewAs() {
  const context = useContext(ViewAsContext);
  if (context === undefined) {
    throw new Error("useViewAs must be used within a ViewAsProvider");
  }
  return context;
}
