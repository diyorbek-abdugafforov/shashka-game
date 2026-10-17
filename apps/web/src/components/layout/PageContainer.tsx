import React from 'react';
import { Header, HeaderProps } from './Header';
import { BottomNav } from './BottomNav';
import { cn } from '../../utils/cn';

export interface PageContainerProps {
  headerProps?: HeaderProps;
  showBottomNav?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  headerProps,
  showBottomNav = true,
  className,
  children,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 max-w-md mx-auto relative selection:bg-indigo-500/30">
      {headerProps && <Header {...headerProps} />}

      <main
        className={cn(
          'flex-1 flex flex-col p-4 w-full animate-fade-in',
          showBottomNav && 'pb-24',
          className,
        )}
      >
        {children}
      </main>

      {showBottomNav && <BottomNav />}
    </div>
  );
};
