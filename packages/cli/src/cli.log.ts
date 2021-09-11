import pino from 'pino';
import { PrettyTransform } from 'pretty-json-log';

export const logger = process.stdout.isTTY ? pino(PrettyTransform.stream()) : pino();
