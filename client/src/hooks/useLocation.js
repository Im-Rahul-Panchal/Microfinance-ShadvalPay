import { useState, useEffect, useCallback, useRef } from "react";

const useLocation = (refreshInterval = 4 * 60 * 1000) => { // Reduced to 4 minutes for safety
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permission: null, // "granted", "denied", "prompt", "blocked"
    timestamp: null,
  });

  const active = useRef(true);
  const retryCount = useRef(0);
  const maxRetries = 3;

  const isSecure = window.isSecureContext || window.location.hostname === "localhost";    

  const updateLocation = useCallback((newState) => {
    if (!active.current) return;

    setLocation((prev) => {
      // Avoid unnecessary re-renders
      if (
        prev.latitude === newState.latitude &&
        prev.longitude === newState.longitude &&
        prev.error === newState.error &&
        prev.loading === newState.loading &&
        prev.permission === newState.permission
      ) {
        return prev;
      }
      return { ...newState, timestamp: Date.now() };
    });
  }, []);

  const getLocation = useCallback(() => {
    // Security check: Geolocation only works on HTTPS or localhost
    if (!isSecure) {
      updateLocation({
        latitude: null,
        longitude: null,
        error: "Location requires HTTPS or localhost",
        loading: false,
        permission: "blocked",
        timestamp: Date.now(),
      });
      return;
    }

    if (!navigator.geolocation) {
      updateLocation({
        latitude: null,
        longitude: null,
        error: "Geolocation not supported by browser",
        loading: false,
        permission: "blocked",
      });
      return;
    }

    // Optional: Check permission state first (modern browsers)
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" }).then((result) => {
        if (result.state === "denied") {
          updateLocation({
            latitude: null,
            longitude: null,
            error: "Location permission denied by user",
            loading: false,
            permission: "denied",
          });
        } else if (result.state === "prompt") {
          updateLocation((prev) => ({ ...prev, permission: "prompt" }));
        }
      }).catch(() => {
        // Ignore if permissions API not supported
      });
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!active.current) return;

        retryCount.current = 0; // Reset retries on success

        updateLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
          permission: "granted",
        });
      },
      (error) => {
        if (!active.current) return;

        let userMessage = "Unable to retrieve location";
        let permissionStatus = "blocked";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            userMessage = "Location access denied";
            permissionStatus = "denied";
            break;
          case error.POSITION_UNAVAILABLE:
            userMessage = "Location information unavailable";
            break;
          case error.TIMEOUT:
            userMessage = "Location request timed out";
            break;
          default:
            userMessage = "An unknown error occurred";
        }

        // Retry logic on transient errors (timeout or unavailable)
        if ((error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) && retryCount.current < maxRetries) {
          retryCount.current += 1;
          setTimeout(() => getLocation(), 3000 * retryCount.current); // Exponential backoff
          return;
        }

        updateLocation({
          latitude: null,
          longitude: null,
          error: userMessage,
          loading: false,
          permission: permissionStatus,
        });
      },
      {
        enableHighAccuracy: true,     // Better accuracy (important for field apps)
        timeout: 15000,               // Increased timeout
        maximumAge: 0,                // Force fresh location — critical fix!
      }
    );
  }, [updateLocation, isSecure]);

  useEffect(() => {
    active.current = true;

    // Initial fetch
    getLocation();

    // Refresh when app becomes visible (e.g., from background on mobile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && active.current) {
        getLocation();
      }
    };

    // Periodic refresh
    const interval = setInterval(() => {
      if (active.current) {
        getLocation();
      }
    }, refreshInterval);

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also listen to online/offline in case GPS needs network
    window.addEventListener("online", getLocation);

    return () => {
      active.current = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", getLocation);
    };
  }, [getLocation, refreshInterval]);

  // Optional: expose manual refresh
  const refresh = useCallback(() => {
    retryCount.current = 0;
    getLocation();
  }, [getLocation]);

  return {
    ...location,
    refresh, // Allows manual refresh if needed in parent component
  };
};

export default useLocation;