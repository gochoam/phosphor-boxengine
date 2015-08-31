require('dts-generator').generate({
  name: 'phosphor-boxengine',
  main: 'phosphor-boxengine/index',
  baseDir: 'lib',
  files: ['index.d.ts'],
  out: 'lib/phosphor-boxengine.d.ts',
});
