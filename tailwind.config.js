// Poultry Intelligence Hub - NativeWind theme. Token names mirror pih-design-tokens.json.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: { 900: '#143D26', 700: '#1F5C3A', 500: '#3E8559', 100: '#DDEBE1' },
        surface: { background: '#FAF6EC', card: '#FFFFFF', border: '#E6DFCD' },
        ink: { primary: '#1C2420', muted: '#5B655F', onBrand: '#FFFFFF' },
        normal: { fg: '#1F5C3A', bg: '#DDEBE1' },
        watch: { fg: '#7A4A00', bg: '#FBEBC8' },
        act: { fg: '#9C3420', bg: '#F8DDD5', solid: '#B5412A' },
      },
      spacing: { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, touch: 48, 'touch-primary': 56 },
      borderRadius: { card: 12, control: 10 },
      fontSize: {
        display: ['28px', { lineHeight: '34px', fontWeight: '700' }],
        title: ['20px', { lineHeight: '26px', fontWeight: '600' }],
        body: ['16px', { lineHeight: '24px' }],
        label: ['14px', { lineHeight: '20px', fontWeight: '500' }],
        caption: ['12px', { lineHeight: '16px' }],
      },
    },
  },
};
