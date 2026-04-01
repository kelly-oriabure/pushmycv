'use client';

import React, { createContext, useContext } from 'react';

type ResumeBuilderHeaderActionsContextValue = {
  headerRight?: React.ReactNode;
};

const ResumeBuilderHeaderActionsContext = createContext<ResumeBuilderHeaderActionsContextValue>({});

export function ResumeBuilderHeaderActionsProvider({
  headerRight,
  children,
}: {
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <ResumeBuilderHeaderActionsContext.Provider value={{ headerRight }}>
      {children}
    </ResumeBuilderHeaderActionsContext.Provider>
  );
}

export function useResumeBuilderHeaderActions() {
  return useContext(ResumeBuilderHeaderActionsContext);
}
