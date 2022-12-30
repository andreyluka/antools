const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const SpriteLoaderPlugin = require("svg-sprite-loader/plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = (env, argv) => {
  const isProductionBuild = argv.mode === "production";
  const publicPath = "/antools/dist/";

  const pcss = {
    test: /\.(p|post|)css$/,
    use: [
      MiniCssExtractPlugin.loader,
      "css-loader",
      "postcss-loader",
    ],
  };

  const js = {
    test: /\.js$/,
    loader: "babel-loader",
    exclude: /node_modules/,
    options: {
      presets: ["@babel/preset-env"],
      plugins: ["@babel/plugin-syntax-dynamic-import"],
    },
  };

  const files = {
    test: /\.(png|jpe?g|gif|woff2?)$/i,
    loader: "file-loader",
    options: {
      name: "[hash].[ext]",
    },
  };

  const svg = {
    test: /\.svg$/,
    use: [
      {
        loader: "svg-sprite-loader",
        options: {
          extract: true,
          spriteFilename: (svgPath) => `sprite${svgPath.substr(-4)}`,
        },
      },
      "svg-transform-loader",
      {
        loader: "svgo-loader",
        options: {
          plugins: [
            { removeTitle: true },
            {
              removeAttrs: {
                attrs: "(fill|stroke)",
              },
            },
          ],
        },
      },
    ],
  };

  const pug = {
    test: /\.pug$/,
    oneOf: [
      {
        resourceQuery: /^\?vue/,
        use: ["pug-plain-loader"],
      },
      {
        use: ["pug-loader"],
      },
    ],
  };

  const config = {
    entry: {
      main: "./src/main.js",
    },
    output: {
      path: path.resolve(__dirname, "./dist"),
      filename: "[name].[hash].build.js",
      publicPath: isProductionBuild ? publicPath : "",
      chunkFilename: "[chunkhash].js",
    },
    module: {
      rules: [pcss, js, files, svg, pug],
    },
    resolve: {
      alias: {
        images: path.resolve(__dirname, "./src/images"),
        components: path.resolve(__dirname, "./src/components"),
        styles: path.resolve(__dirname, "./src/styles"),
      },
      extensions: ["*", ".js", ".json"],
    },
    devServer: {
      historyApiFallback: true,
      noInfo: false,
      overlay: true,
    },
    performance: {
      hints: false,
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "src/index.pug",
        chunks: ["main"],
      }),
      new SpriteLoaderPlugin({ plainSprite: true }),
      new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css",
        chunkFilename: "[contenthash].css",
      }),
    ],
    devtool: "#eval-source-map",
  };

  if (isProductionBuild) {
    config.devtool = "none";
    config.plugins = (config.plugins || []).concat([
      new CleanWebpackPlugin(),
      new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: '"production"',
        },
      }),
    ]);

    config.optimization = {};

    config.optimization.minimizer = [
      new TerserPlugin({
        cache: true,
        parallel: true,
        sourceMap: false,
      }),
      new OptimizeCSSAssetsPlugin({}),
    ];
  }

  return config;
};
