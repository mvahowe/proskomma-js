module.exports = {
  "assumptions": {
    "noDocumentAll": true,
    "pureGetters": true,
    "iterableIsArray": true,
    "ignoreToPrimitiveHint": true
  },
  "presets": [
    [
      "@babel/preset-env",
      {
        "targets": {
          "esmodules": true,
        },
        useBuiltIns: "entry",
        corejs: "3.25.1"
      }
    ],
  ],
};
