import Facebook from './assets/facebook.svg';
import Linkedin from './assets/linkedin.svg';
import React from 'react';
import TwitterX from './assets/twitter-x.svg';
import Unsplash from './assets/unsplash.svg';
import clsx from 'clsx';

const icons = {
  facebook: { src: Facebook },
  linkedin: { src: Linkedin },
  'twitter-x': { src: TwitterX },
  unsplash: { src: Unsplash },
} as const;

export type BrandIconName = keyof typeof icons;

export interface BrandIconProps {
  className?: string;
  name: BrandIconName;
  size?: number;
  style?: React.CSSProperties;
}

const BrandIcon: React.FC<BrandIconProps> = ({ name, size, className, style }) => {
  const icon = icons[name];
  const sizeStyle = size ? { width: size, height: size, ...style } : style;

  const mask = `url("${icon.src}") center / contain no-repeat`;

  return (
    <span
      aria-hidden="true"
      className={clsx('pointer-events-none inline-block shrink-0 bg-current', className)}
      style={{
        WebkitMask: mask,
        mask,
        ...sizeStyle,
      }}
    />
  );
};

export default BrandIcon;
