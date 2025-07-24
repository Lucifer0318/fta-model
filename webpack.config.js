const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'fta-model.js',
		library: 'fta-model',
		libraryTarget: 'umd',
		globalObject: 'window', // 确保全局变量绑定到 window 上（而非 this）
	},
	resolve: {
		alias: {
			'@': path.join(__dirname, 'src'),
		},
	},
	module: {
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
			},
			// {
			// 	test: /src\/libs\/.*\.js$/, // 处理静态JS依赖
			// 	use: 'script-loader', // 暴露为全局变量
			// },
			{
				test: /\.css$/,
				use: ['vue-style-loader', 'css-loader'],
			},
			// 添加字体文件处理规则
			{
				test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: 'fonts/[name].[hash:7].[ext]',
				},
			},
		],
	},
	plugins: [new VueLoaderPlugin()],
	externals: {
		vue: {
			root: 'Vue',
			commonjs: 'vue',
			commonjs2: 'vue',
			amd: 'vue',
		},
	},
}
