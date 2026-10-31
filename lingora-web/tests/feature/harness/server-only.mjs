import { mock } from 'node:test';
// Node tests supply the framework boundary; browser compilation retains the real marker.
mock.module('server-only', { exports: {} });
