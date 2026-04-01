'use client';

import React from 'react';
import { SyncState } from '@/lib/services/unifiedSyncService';
// Removed granular sync - using unified sync only
import { CheckCircle, AlertCircle, Loader2, Clock, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SyncStatusIndicatorProps {
  syncState: SyncState;
  onRetry?: () => void;
  className?: string;
  showLabel?: boolean;
}

/**
 * Visual indicator for sync status with user feedback
 */
export function SyncStatusIndicator({
  syncState,
  onRetry,
  className = '',
  showLabel = false
}: SyncStatusIndicatorProps) {
  const { isSyncing, lastSyncTime, error, hasPendingChanges, consecutiveErrors } = syncState;

  // Determine status and appearance
  const getStatusInfo = () => {
    if (isSyncing) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        label: 'Saving...',
        className: 'text-blue-500',
        tooltip: 'Your changes are being saved',
      };
    }

    if (error && consecutiveErrors > 3) {
      return {
        icon: <WifiOff className="w-4 h-4" />,
        label: 'Save failed',
        className: 'text-red-500',
        tooltip: `Failed to save: ${error}. Click to retry.`,
        clickable: true,
      };
    }

    if (error && consecutiveErrors <= 3) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Retrying...',
        className: 'text-yellow-500',
        tooltip: `Retrying save... (attempt ${consecutiveErrors}/3)`,
      };
    }

    if (hasPendingChanges) {
      return {
        icon: <Clock className="w-4 h-4" />,
        label: 'Saving soon...',
        className: 'text-gray-500',
        tooltip: 'Changes will be saved automatically',
      };
    }

    if (lastSyncTime) {
      const timeAgo = getTimeAgo(lastSyncTime);
      const label = 'Saved';
      const tooltip = `Last saved ${timeAgo}`;

      return {
        icon: <CheckCircle className="w-4 h-4" />,
        label,
        className: 'text-green-500',
        tooltip,
      };
    }

    return {
      icon: <Clock className="w-4 h-4" />,
      label: 'Ready',
      className: 'text-gray-400',
      tooltip: 'Ready to save changes',
    };
  };

  const statusInfo = getStatusInfo();

  const handleClick = () => {
    if (statusInfo.clickable && onRetry) {
      onRetry();
    }
  };

  const content = (
    <div
      className={`flex items-center gap-1 ${statusInfo.className} ${className} ${statusInfo.clickable ? 'cursor-pointer hover:opacity-75' : ''
        }`}
      onClick={handleClick}
    >
      {statusInfo.icon}
      {showLabel && (
        <span className="text-sm font-medium">{statusInfo.label}</span>
      )}
    </div>
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {statusInfo.clickable ? (
            <Button variant="ghost" size="sm" className="h-auto p-1">
              {content}
            </Button>
          ) : (
            content
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{statusInfo.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Helper function to format time ago
 */
function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) { // Less than 1 minute
    return 'just now';
  } else if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
}