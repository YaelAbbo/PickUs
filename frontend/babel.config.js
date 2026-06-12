export default function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 1. MUST run TypeScript transform fir st to handle 'declare' fields in Expo modules
      ['@babel/plugin-transform-typescript', { allowDeclareFields: true }],

      // 2. Transpile the private properties so Hermes doesn't crash on #x or #y
      '@babel/plugin-transform-class-properties',
      '@babel/plugin-transform-private-methods',
      '@babel/plugin-transform-private-property-in-object',
    ],
  };
}
