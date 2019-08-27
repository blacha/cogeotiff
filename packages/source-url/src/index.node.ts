// Assign fetch function for nodejs imports
// This allows CogSourceUrl to be used without configuration inside nodejs environments
import fetch from 'node-fetch';
import { CogSourceUrl } from './cog.source.url';

CogSourceUrl.fetch = fetch as any;

export { CogSourceUrl } from './cog.source.url';
