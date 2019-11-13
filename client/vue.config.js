module.exports = {
  devServer: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        pathRewrite: {
          '^/api': ''
        }
      }
    }
  },

  configureWebpack: {
    devtool: 'source-map'
  },

  baseUrl: undefined,
  outputDir: undefined,
  assetsDir: undefined,
  runtimeCompiler: undefined,
  productionSourceMap: false,
  parallel: undefined,
  css: undefined
}
