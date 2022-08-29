var path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  devtool: false,
  performance: {
    maxEntrypointSize: 2048000,
    maxAssetSize: 2048000
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'index',
    globalObject: "this",
    libraryTarget: 'commonjs2'
  },
  externals: {},
  module: {
    rules: [
      {
        test: /\.js$/,
        include: path.join(__dirname, 'src'),
        exclude: path.join(__dirname, '/node_modules/'),
        loader: 'babel-loader',
        options: {
          plugins: ['@babel/plugin-proposal-optional-chaining'],
        },
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      }
    ]
  },
  node: {
    child_process: 'empty',
    fs: 'empty',
    // "os": require.resolve("os-browserify/browser"),
    // "stream": require.resolve("stream-browserify")
  }
};
