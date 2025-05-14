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
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="10" r="3"></circle>
        <path d="M12 10c1.5-2.5 4-2.5 4-2.5"></path>
        <path d="M12 10c-1.5-2.5-4-2.5-4-2.5"></path>
         <path d="M12 10c0 2.5-1.5 5-1.5 5"></path>
         <path d="M12 10c0 2.5 1.5 5 1.5 5"></path>
      </svg>
      {showText && <span className="text-2xl font-semibold text-foreground">{APP_NAME}</span>}
    </div>
  );
}
