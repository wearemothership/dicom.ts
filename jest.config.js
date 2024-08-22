/** @type {import('jest').Config} */

const config = {
	verbose: true,
	transform: {
		"^.+\\.[t|j]sx?$": "babel-jest"
	},
	testPathIgnorePatterns: [
		"example",
		"example-vs-cornerstone"
	],
	globals: {
		fetch: global.fetch
	}
};

module.exports = config;
