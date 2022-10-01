import { GridSharedContext } from "./GridSharedContext";

export class Mask {
  readMask(targetNode) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    this.dim = 1 << targetNode.log2dim;
    this.size = 1 << 3 * targetNode.log2dim;
    this.wordCount = this.size >> 6;
    this.words = [];

    Array(this.wordCount).fill(0).forEach(() => {
      const fillShift = Array(8).fill('0').join('');
      let byte = Array(8).fill(0)
        .map(() =>
          `${fillShift}${bufferIterator.readBytes(1).toString(2).split('-').join('')}`.substr(-8).split('').reverse().join('')
        );

      byte = byte.join('');
      this.words.push(`${Array(64).fill('0').join('')}${byte}`.substr(-64));
    });

    this.onCache = this.countOn();
    this.offCache = this.countOff();
  }

  countOn() {
    let count = 0;

    this.words.forEach(word => {
      count += word.split('').filter(bit => bit === '1').length;
    });

    return count;
  }

  countOff() {
    return this.size - this.countOn();
  }

  forEachOn(callback) {
    this.words.forEach((word, wordIndex) => {
      word.split('').forEach((value, bitIndex) => {
        if (value === '1') {
          const offset = wordIndex * 64 + bitIndex;

          callback({ wordIndex, bitIndex, offset });
        }
      });
    });
  }

  forEachOff(callback) {
    this.words.forEach((word, wordIndex) => {
      word.split('').forEach((value, bitIndex) => {
        if (value === '0') {
          const offset = wordIndex * 64 + bitIndex;

          callback({ wordIndex, bitIndex, offset });
        }
      });
    }); 
  }
}