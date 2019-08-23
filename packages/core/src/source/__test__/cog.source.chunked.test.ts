import * as o from 'ospec';
import 'source-map-support/register';
import { CogSourceChunked } from '../cog.source.chunked';

o.spec('CogSourceChunked', () => {
    o('should compute byte ranges', () => {
        const chunks = CogSourceChunked.getByteRanges(['1', '2', '3'], 10);
        o(chunks.chunks).deepEquals([[1, 2, 3]]);
    });

    o('should limit max ranges', () => {
        const chunks = CogSourceChunked.getByteRanges(['1', '2', '3'], 2);
        o(chunks.chunks).deepEquals([[1, 2], [3]]);
    });

    o('should support sparse chunks', () => {
        const chunks = CogSourceChunked.getByteRanges(['1', '2', '30'], 10);
        o(chunks.chunks).deepEquals([[1, 2], [30]]);
    });

    o('should fill in blanks even though they are not requested', () => {
        const chunks = CogSourceChunked.getByteRanges(['1', '2', '6'], 10, 5);
        o(chunks.chunks).deepEquals([[1, 2, 3, 4, 5, 6]]);
        o(chunks.blankFill).deepEquals([3, 4, 5]);
    });
});
