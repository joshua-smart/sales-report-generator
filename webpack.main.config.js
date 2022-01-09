const path = require('path');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: require('./webpack.rules')
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx', '.css', '.json'],
  },
};
