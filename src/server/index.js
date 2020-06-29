import SignalServer from './signal_server'
import devServer from 'webpack-dev-server'
import * as mediasoup from 'mediasoup'
import config from './webpack.config'
import { Server } from 'http'
import webpack from 'webpack'
import path from 'path'

const processor = async () => {

  const worker = await mediasoup.createWorker({
    logLevel: 'debug',
    rtcMinPort: 10000,
    rtcMaxPort: 20000
  })

  const server = Server()

  new SignalServer(server, worker)

  server.listen(3001)

  const devserver = new devServer(webpack(config), {
    contentBase: path.resolve('src','public'),
    hot: true,
    publicPath: '/',
    quiet: true,
    historyApiFallback: {
      disableDotRule: true,
      rewrites: [
        { from: /.*/, to: '/' }
      ]
    }
  })

  devserver.listen(3000)

}


processor()
