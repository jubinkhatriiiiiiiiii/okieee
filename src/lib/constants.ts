import * as RNFS from '@dr.pogodin/react-native-fs';

export const FLAGS = {
  GLOBAL: 'https://utfs.io/f/ImOWJajUmXfyRKHTpylsELpB6QlYA4OdG9Jfr3hagoCN5Mzt',
  INDIA: 'https://utfs.io/f/ImOWJajUmXfyYCEwdELCDZIMxNG5H27Bouwvb4fyVJrdqj3X',
  ENGLISH: 'https://utfs.io/f/ImOWJajUmXfyN1E0dlnILrEMR3DJQX7OUvixCSHp6YWGNVPc',
  ITALY: 'https://utfs.io/f/ImOWJajUmXfynpGlTaXrTMAELcs2W76PyY4IRJVBXCHOofa5',
};

export const downloadFolder = RNFS.DownloadDirectoryPath + '/vega';

export const themes: {name: string; color: string}[] = [
  {
    name: 'Vega',
    color: '#FF6347',
  },
  {
    name: 'Hayasaka',
    color: '#00e6e6',
  },
  {
    name: 'Lavender',
    color: '#B2A4D4',
  },
  {
    name: 'Sky',
    color: '#87CEEB',
  },
  {
    name: 'Mint',
    color: '#98FB98',
  },
  {
    name: 'Sunset',
    color: '#FFA07A',
  },
  {
    name: 'Flix',
    color: '#E50914',
  },
  {
    name: 'Material',
    color: '#2196F3',
  },
  {
    name: 'Custom',
    color: '#FFFFFF',
  },
];

export const socialLinks = {
  github: 'https://github.com/Zenda-Cross/vega-app',
  sponsor: 'https://github.com/sponsors/Zenda-Cross',
  instagram: 'https://www.instagram.com/jubinkhatrii',
  facebook: 'https://www.facebook.com/jubin.khatri.75',
  website: 'https://jubinkhatri.com.np',
};
