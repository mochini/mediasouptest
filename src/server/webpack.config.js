import HtmlWebpackPlugin from 'html-webpack-plugin'
import autoprefixer from 'autoprefixer'
import webpack from 'webpack'
import cssnano from 'cssnano'
import path from 'path'
import fs from 'fs'

const webpackConfig = {
  devtool: 'none',
  entry: [
    `webpack-dev-server/client?localhost`,
    'webpack/hot/only-dev-server',
    path.resolve('src','client','index.js'),
    path.resolve('src','client','index.less')
  ],
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.less$/,
        exclude: /(node_modules)/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: {
            url: false, sourceMap: false }
          },
          { loader: 'postcss-loader', options: {
            plugins: [autoprefixer, cssnano] }
          },
          'less-loader'
        ]
      }, {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
          plugins: ['react-hot-loader/babel'],
          presets: ['es2015', 'react', 'stage-0']
        }
      }
    ]
  },
  node: {
    fs: 'empty'
  },
  output: {
    path: path.resolve('src','client','public'),
    filename: path.join('js','[name].js'),
    publicPath: '/'
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {}
    }),
    new webpack.HotModuleReplacementPlugin(),
    ...fs.existsSync(path.resolve('src','client','index.html')) ? [
      new HtmlWebpackPlugin({
        template: path.resolve('src','client','index.html'),
        filename: 'index.html'
      })
    ] : []
  ]
}

export default webpackConfig
