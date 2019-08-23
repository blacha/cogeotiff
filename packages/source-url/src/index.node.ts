import { CogSourceUrl } from './cog.source.url';
import fetch from 'node-fetch';
CogSourceUrl.fetch = fetch as any;

export { CogSourceUrl } from './cog.source.url';
