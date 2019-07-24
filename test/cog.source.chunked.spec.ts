import 'source-map-support/register';

import { LogLevel } from 'bblog';
import * as o from 'ospec';
import { LoggerConfig } from '../src/util/util.log';
import { CogSourceChunked } from '../src';

LoggerConfig.level = 99 as LogLevel;

o.spec('CogSourceChunked', () => {
    o('should compute byte ranges', () => {
        const chunks = CogSourceChunked.getByteRanges(['1', '2', '3'], 10);
        o(chunks).deepEquals([[1, 2, 3]]);
    });

    o('should limit max ranges', () => {
        const chunks = CogSourceChunked.getByteRanges(['1', '2', '3'], 2);
        o(chunks).deepEquals([[1, 2], [3]]);
    });

    o('should support sparse chunks', () => {
        const chunks = CogSourceChunked.getByteRanges(['1', '2', '30'], 10);
        o(chunks).deepEquals([[1, 2], [30]]);
    });

    o('should fill in blanks even though they are not requested', () => {
        const chunks = CogSourceChunked.getByteRanges(['1', '2', '6'], 10, 5);
        o(chunks).deepEquals([[1, 2, 3, 4, 5, 6]]);
    });
});
