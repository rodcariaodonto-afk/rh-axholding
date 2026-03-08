import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = (event: MediaQueryListEvent | MediaQueryList) => {
      // MediaQueryListEvent (modern) OR MediaQueryList (initial call)
      const matches = "matches" in event ? event.matches : mql.matches;
      setIsMobile(matches);
    };

    // Initial
    onChange(mql);

    // Modern browsers
    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange as (e: MediaQueryListEvent) => void);
      return () => mql.removeEventListener("change", onChange as (e: MediaQueryListEvent) => void);
    }

    // Safari / older
    const legacyMql = mql as unknown as {
      addListener: (listener: (ev: MediaQueryListEvent) => void) => void;
      removeListener: (listener: (ev: MediaQueryListEvent) => void) => void;
    };

    legacyMql.addListener(onChange as (ev: MediaQueryListEvent) => void);
    return () => legacyMql.removeListener(onChange as (ev: MediaQueryListEvent) => void);
  }, []);

  return isMobile;
}
