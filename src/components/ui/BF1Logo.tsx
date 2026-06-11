import React from 'react';
import { Image } from 'react-native';

const LOGO = require('../../../assets/logo.png');

const SIZES = {
  xs:  24,
  sm:  32,
  md:  40,
  lg:  52,
  xl:  80,
  xxl: 120,
} as const;

interface Props {
  size?: keyof typeof SIZES;
  style?: object;
}

export function BF1Logo({ size = 'md', style }: Props) {
  const dim = SIZES[size];
  return (
    <Image
      source={LOGO}
      style={[{ width: dim, height: dim, borderRadius: dim * 0.18 }, style]}
      resizeMode="contain"
    />
  );
}
