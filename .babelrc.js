// Based on build config from https://dev.to/remshams/rolling-up-a-multi-module-system-esm-cjs-compatible-npm-library-with-typescript-and-babel-3gjg

const shared = {
	ignore: [ 'src/**/*.test.js' ],
	plugins: [
		[ 'module-resolver', {
			root: [ './src' ],
			alias: {
				'package.json': './package.json',
			},
		} ],
	],
};
const sharedPresetEnv = {
	useBuiltIns: 'usage',
	// This should match the current LTS version of Node.js, and correspond to the engine version in package.json
	targets: 'maintained node versions',
	corejs: 3,
};

module.exports = {
	env: {
		test: {
			...shared,
			ignore: [],
			plugins: [[ 'module-resolver', {
				alias: {
					'~/package.json': './package.json',
				},
			} ]],
			presets: [[ '@babel/env', {
				...sharedPresetEnv,
				modules: 'commonjs',
			} ]],
		},
		esm: {
			...shared,
			plugins: [[ 'module-resolver', {
				alias: {
					'lodash': 'lodash-es',
					'~/package.json': '../package.json',
				},
			} ]],
			presets: [[ '@babel/env', {
				...sharedPresetEnv,
				modules: false,
			} ]],
		},
		cjs: {
			...shared,
			plugins: [[ 'module-resolver', {
				alias: {
					'~/package.json': '../package.json',
				},
			} ]],
			presets: [[ '@babel/env', {
				...sharedPresetEnv,
				modules: 'commonjs',
			} ]],
		},
		bin: {
			plugins: [[ 'module-resolver', {
				alias: {
					'~/src': './cjs',
					'~/package.json': '../package.json',
				},
			} ]],
			presets: [[ '@babel/env', {
				...sharedPresetEnv,
				modules: 'commonjs',
			} ]],
		},
	},
};
