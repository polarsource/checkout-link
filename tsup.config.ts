import { defineConfig } from 'tsup';

export default defineConfig({
	entry: ['./src/cli.tsx'],
	format: ['esm'],
	external: [
		'react',
		'ink',
		'@inkjs/ui',
		'ink-link',
		'@polar-sh/sdk',
		'meow',
		'prompts',
		'open',
		'mime-types',
		'cross-spawn',
	],
	noExternal: [],
});

