var path = require('path');
const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

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
    globalObject: "this",
    // one day we might need "library" instead of "libraryTarget"
    // https://github.com/webpack/webpack/issues/11800
    // library: {
    //   type: 'commonjs-static',
    // },
    libraryTarget: 'commonjs2',
    hashFunction: "xxhash64"
  },
  externals: {},
  module: {
    rules: [
      {
        test: /\.m?js$/,
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
  resolve: {
    fallback: {
      fs: false,
      string_decoder: false,
      stream: require.resolve('stream'),
      crypto: false,
      child_process: "empty",
      buffer: require.resolve('buffer/'),
      constants: require.resolve("constants-browserify"),
      assert: require.resolve("assert/"),
      path: require.resolve("path-browserify"),
      util: require.resolve("util/")
    },
    alias: {
      process: "process/browser"
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    new NodePolyfillPlugin()
  ],
  target: 'node'
};
