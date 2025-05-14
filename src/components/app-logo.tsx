import type { SVGProps } from 'react';
import { APP_NAME } from '@/lib/constants';

export function AppLogo(props: SVGProps<SVGSVGElement> & { showText?: boolean }) {
  const { showText = true, ...rest } = props;
  return (
    <div className="flex items-center gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-8 w-8 text-primary"
        aria-label="GlobaTalk Lite Logo Icon"
        {...rest}
      >
        {/* Speech bubble outline */}
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        {/* Simplified globe inside */}
        <circle cx="12" cy="10" r="4"></circle>
        <line x1="8" y1="10" x2="16" y2="10"></line>
        <line x1="12" y1="6" x2="12" y2="14"></line>
      </svg>
      {showText && <span className="text-2xl font-semibold text-foreground">{APP_NAME}</span>}
    </div>
  );
}
