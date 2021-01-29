// Assign fetch function for nodejs imports
// This allows CogSourceUrl to be used without configuration inside nodejs environments
import fetch from 'node-fetch';
import { SourceUrl } from './source.url';

SourceUrl.fetch = fetch as any;

export { SourceUrl } from './source.url';
