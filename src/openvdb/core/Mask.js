import { uint32Size } from '../math/memory';
import { GridSharedContext } from './GridSharedContext';

const popcount = (word) => {
  word -= (word >>> 1) & 0x55555555;
  word = (word & 0x33333333) + ((word >>> 2) & 0x33333333);

  return Math.imul((word + (word >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24;
};

export class Mask {
  readMask(targetNode) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    this.size = 1 << (3 * targetNode.log2dim);

    // NOTE Files save masks as little-endian uint64 words. Two little-endian uint32 words keep the same bit offsets.
    // NOTE Masks of 8 values save one byte, see NodeMask<1>
    const wordSize = Math.min(uint32Size, this.size >> 3);

    this.words = new Uint32Array(Math.ceil(this.size / 32));
    this.onCount = 0;

    for (let wordIndex = 0; wordIndex < this.words.length; wordIndex++) {
      this.words[wordIndex] = bufferIterator.readBytes(wordSize);
      this.onCount += popcount(this.words[wordIndex]);
    }
  }

  countOn() {
    return this.onCount;
  }

  countOff() {
    return this.size - this.onCount;
  }

  forEachOn(callback) {
    this.forEachBit(false, callback);
  }

  forEachOff(callback) {
    this.forEachBit(true, callback);
  }

  forEachBit(inverted, callback) {
    if (!callback) {
      return;
    }

    for (let wordIndex = 0; wordIndex < this.words.length; wordIndex++) {
      let word = inverted ? ~this.words[wordIndex] : this.words[wordIndex];

      if (this.size < 32) {
        word &= (1 << this.size) - 1;
      }

      while (word !== 0) {
        const bitIndex = 31 - Math.clz32(word & -word);
        const offset = (wordIndex << 5) | bitIndex;

        word &= word - 1;

        if (callback({ wordIndex, bitIndex, offset }) === 0) {
          return;
        }
      }
    }
  }

  // NOTE Bool and mask leaves save values as bits
  toValues() {
    const values = new Uint8Array(this.size);

    this.forEachOn(({ offset }) => {
      values[offset] = 1;
    });

    return values;
  }

  isOn(offset) {
    return ((this.words[offset >> 5] >>> (offset & 31)) & 1) !== 0;
  }

  isOff(offset) {
    return !this.isOn(offset);
  }
}
