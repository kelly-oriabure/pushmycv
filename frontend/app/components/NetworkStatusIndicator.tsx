'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';

interface NetworkStatusIndicatorProps {
    className?: string;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({ className = '' }) => {
    const [isOnline, setIsOnline] = useState(true);
    const [showWarning, setShowWarning] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            setShowWarning(false);
        };

        const handleOffline = () => {
            setIsOnline(false);
            setShowWarning(true);
        };

        // Check initial status
        setIsOnline(navigator.onLine);

        // Listen for online/offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Check for network connectivity issues
        const checkConnectivity = async () => {
            try {
                const response = await fetch('/api/health', {
                    method: 'HEAD',
                    cache: 'no-cache',
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                });

                if (!response.ok) {
                    setShowWarning(true);
                } else {
                    setShowWarning(false);
                }
            } catch (error) {
                setShowWarning(true);
            }
        };

        // Check connectivity every 30 seconds
        const interval = setInterval(checkConnectivity, 30000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    if (isOnline && !showWarning) {
        return null; // Don't show anything when everything is working
    }

    return (
        <div className={`fixed top-4 left-4 z-50 ${className}`}>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg ${!isOnline
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                {!isOnline ? (
                    <>
                        <WifiOff className="w-4 h-4" />
                        <span className="text-sm font-medium">No Internet Connection</span>
                    </>
                ) : (
                    <>
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-medium">Connection Issues</span>
                    </>
                )}
            </div>
        </div>
    );
};






