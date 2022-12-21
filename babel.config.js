module.exports = {
  'assumptions': {
    'noDocumentAll': true,
    'pureGetters': true,
    'iterableIsArray': true,
    'ignoreToPrimitiveHint': true,
  },
  'presets': [
    [
      '@babel/preset-env',
      {
        'targets': {
          'esmodules': true,
          'browsers': 'last 2 versions, ie 10-11',
        },
        'useBuiltIns': 'entry',
        'corejs': '3.25.1',
      },
    ],
  ],
};