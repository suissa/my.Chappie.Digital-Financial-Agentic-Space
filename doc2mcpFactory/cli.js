#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { createRouteManifest, createToolsFromOpenApi } from './index.js';

function usage() {
  console.error('Usage: node doc2mcpFactory/cli.js <openapi.json> [--tools|--manifest]');
  process.exitCode = 2;
}

const [, , file, ...args] = process.argv;
if (!file || args.some(arg => !['--tools', '--manifest'].includes(arg)) || args.length > 1) {
  usage();
} else {
  try {
    const document = JSON.parse(await readFile(file, 'utf8'));
    const mode = args[0] ?? '--manifest';
    const output = mode === '--tools'
      ? createToolsFromOpenApi(document)
      : createRouteManifest(document);
    process.stdout.write(JSON.stringify(output, null, 2) + '\n');
  } catch (error) {
    console.error(`doc2mcpFactory: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
