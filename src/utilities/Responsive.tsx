import { moderateScale } from 'react-native-size-matters';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';

/* ---------------------------------- */
/* Types */
/* ---------------------------------- */

type ScaleMap = Record<number, number>;

interface SizeHelper {
  wp: (value: number) => number;
  hp: (value: number) => number;
}

/* ---------------------------------- */
/* Scale generator (1 → 100) */
/* ---------------------------------- */

const createScale = (): ScaleMap => {
  const scale: ScaleMap = {};
  for (let i = 1; i <= 100; i++) {
    scale[i] = moderateScale(i);
  }
  return scale;
};

/* ---------------------------------- */
/* Generated scales */
/* ---------------------------------- */

const SCALE = createScale();

/* ---------------------------------- */
/* Theme exports */
/* ---------------------------------- */

export const SPACING = SCALE;       // margin / padding
export const FONTSIZE = SCALE;      // font sizes
export const BORDERRADIUS = SCALE;  // border radius

export const SIZE: SizeHelper = {
  wp: (value: number) => wp(`${value}%`),
  hp: (value: number) => hp(`${value}%`),
};

/* ---------------------------------- */
/* Colors */
/* ---------------------------------- */

export const COLORS = {
  primaryRedHex: '#DC3535',
  primaryOrangeHex: '#D17842',
  primaryBlackHex: '#0C0F14',
  primaryDarkGreyHex: '#141921',
  secondaryDarkGreyHex: '#21262E',
  primaryGreyHex: '#252A32',
  secondaryGreyHex: '#252A32',
  primaryLightGreyHex: '#52555A',
  secondaryLightGreyHex: '#AEAEAE',
  primaryWhiteHex: '#FFFFFF',
  primaryBlackRGBA: 'rgba(12,15,20,0.5)',
  secondaryBlackRGBA: 'rgba(0,0,0,0.7)',
};

/* ---------------------------------- */
/* Font family */
/* ---------------------------------- */

export const FONTFAMILY = {
  poppins_black: 'Poppins-Black',
  poppins_bold: 'Poppins-Bold',
  poppins_extrabold: 'Poppins-ExtraBold',
  poppins_extralight: 'Poppins-ExtraLight',
  poppins_light: 'Poppins-Light',
  poppins_medium: 'Poppins-Medium',
  poppins_regular: 'Poppins-Regular',
  poppins_semibold: 'Poppins-SemiBold',
  poppins_thin: 'Poppins-Thin',
};
