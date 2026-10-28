import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouteTrackerContextType {
  previousRoute: string | null;
  currentRoute: string;
  history: string[];
  goBack: (fallback?: string) => void;
}

const RouteTrackerContext = createContext<RouteTrackerContextType>({
  previousRoute: null,
  currentRoute: '/',
  history: [],
  goBack: () => {},
});

const STORAGE_KEY_PREV = 'techit_route_tracker_prev';
const STORAGE_KEY_CURR = 'techit_route_tracker_curr';
const STORAGE_KEY_HIST = 'techit_route_tracker_hist';

export function RouteTrackerProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY_HIST);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return sessionStorage.getItem(STORAGE_KEY_CURR) || (location.pathname + location.search);
  });

  const [previousRoute, setPreviousRoute] = useState<string | null>(() => {
    return sessionStorage.getItem(STORAGE_KEY_PREV) || null;
  });

  const isNavigatingBackRef = useRef(false);

  useEffect(() => {
    const newPath = location.pathname + location.search;

    if (newPath === currentRoute) return;

    if (isNavigatingBackRef.current) {
      isNavigatingBackRef.current = false;
      setCurrentRoute(newPath);
      sessionStorage.setItem(STORAGE_KEY_CURR, newPath);
      return;
    }

    setPreviousRoute(currentRoute);
    sessionStorage.setItem(STORAGE_KEY_PREV, currentRoute);

    setCurrentRoute(newPath);
    sessionStorage.setItem(STORAGE_KEY_CURR, newPath);

    setHistory((prev) => {
      const updated = [...prev.slice(-20), currentRoute];
      try {
        sessionStorage.setItem(STORAGE_KEY_HIST, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
      return updated;
    });
  }, [location.pathname, location.search, currentRoute]);

  const goBack = (fallback = '/feed') => {
    isNavigatingBackRef.current = true;

    if (previousRoute && previousRoute !== currentRoute) {
      const target = previousRoute;
      const newHistory = [...history];
      newHistory.pop();
      const newPrev = newHistory[newHistory.length - 1] || null;

      setHistory(newHistory);
      setPreviousRoute(newPrev);
      if (newPrev) {
        sessionStorage.setItem(STORAGE_KEY_PREV, newPrev);
      } else {
        sessionStorage.removeItem(STORAGE_KEY_PREV);
      }

      navigate(target);
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <RouteTrackerContext.Provider value={{ previousRoute, currentRoute, history, goBack }}>
      {children}
    </RouteTrackerContext.Provider>
  );
}

export function useRouteTracker() {
  return useContext(RouteTrackerContext);
}
