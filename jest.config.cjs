module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleFileExtensions: ['ts', 'tsx', 'js'],
	transform: {
		'^.+\\.[tj]sx?$': 'ts-jest',
	},
	transformIgnorePatterns: [
		"/node_modules/(?!(yocto-spinner)/)"
	],
	testMatch: [
		'**/?(*.)+(spec|test).[jt]s?(x)'
	],
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.json'
		}
	}
};
