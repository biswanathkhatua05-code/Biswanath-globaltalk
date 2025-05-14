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
        {/* Network/Connection Icon */}
        <circle cx="12" cy="7.5" r="1.2" fill="none" strokeWidth="1.5"></circle>
        <circle cx="9.5" cy="11.5" r="1.2" fill="none" strokeWidth="1.5"></circle>
        <circle cx="14.5" cy="11.5" r="1.2" fill="none" strokeWidth="1.5"></circle>
        <line x1="12" y1="7.5" x2="9.5" y2="11.5" strokeWidth="1.5"></line>
        <line x1="9.5" y1="11.5" x2="14.5" y2="11.5" strokeWidth="1.5"></line>
        <line x1="14.5" y1="11.5" x2="12" y2="7.5" strokeWidth="1.5"></line>
      </svg>
      {showText && <span className="text-2xl font-semibold text-foreground">{APP_NAME}</span>}
    </div>
  );
}
