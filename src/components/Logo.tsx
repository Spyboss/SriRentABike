import React from 'react';
import { BRANDING } from '../config/branding';

interface LogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  width,
  height
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={BRANDING.logo.url}
        alt={BRANDING.logo.alt}
        className="object-contain"
        style={{
          width: width || undefined,
          height: height || undefined,
          minWidth: `${BRANDING.logo.width.mobile}px`,
          maxWidth: '100%',
          aspectRatio: BRANDING.logo.aspectRatio,
        }}
      />
    </div>
  );
};
