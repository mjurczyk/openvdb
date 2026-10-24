import { GridSharedContext } from './GridSharedContext';

export class Mask {
  readMask(targetNode) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    this.dim = 1 << targetNode.log2dim;
    this.size = 1 << (3 * targetNode.log2dim);
    this.wordCount = this.size >> 6;
    this.words = [];

    Array(this.wordCount)
      .fill(0)
      .forEach(() => {
        const fillShift = Array(8).fill('0').join('');
        let byte = Array(8)
          .fill(0)
          .map(() =>
            `${fillShift}${bufferIterator.readBytes(1).toString(2).split('-').join('')}`
              .substr(-8)
              .split('')
              .reverse()
              .join('')
          );

        byte = byte.join('');
        this.words.push(`${Array(64).fill('0').join('')}${byte}`.substr(-64));
      });

    this.onCache = this.countOn();
    this.offCache = this.countOff();
  }

  countOn() {
    if (this.onCache !== undefined) {
      return this.onCache;
    }

    let count = 0;

    this.words.forEach((word) => {
      count += word.split('').filter((bit) => bit === '1').length;
    });

    return count;
  }

  countOff() {
    if (this.offCache !== undefined) {
      return this.offCache;
    }

    return this.size - this.countOn();
  }

  forEachOn(callback) {
    if (this.countOn() === 0) {
      return;
    }

    if (!callback) {
      return;
    }

    let wordIndex = 0;
    let bitIndex = 0;

    for (wordIndex = 0; wordIndex < this.words.length; wordIndex++) {
      const word = this.words[wordIndex].split('');

      for (bitIndex = 0; bitIndex < word.length; bitIndex++) {
        if (word[bitIndex] === '1') {
          const offset = wordIndex * 64 + bitIndex;

          if (callback({ wordIndex, bitIndex, offset }) === 0.0) {
            bitIndex = word.length;
            wordIndex = this.words.length;
          }
        }
      }
    }
  }

  forEachOff(callback) {
    if (this.countOff() === 0) {
      return;
    }

    if (!callback) {
      return;
    }

    let wordIndex = 0;
    let bitIndex = 0;

    for (wordIndex = 0; wordIndex < this.words.length; wordIndex++) {
      const word = this.words[wordIndex].split('');

      for (bitIndex = 0; bitIndex < word.length; bitIndex++) {
        if (word[bitIndex] === '0') {
          const offset = wordIndex * 64 + bitIndex;

          if (callback({ wordIndex, bitIndex, offset }) === 0) {
            bitIndex = word.length;
            wordIndex = this.words.length;
          }
        }
      }
    }
  }

  isOn(offset) {
    return this.words[offset >> 6][offset & 63] === '1';
  }

  isOff(offset) {
    return !this.isOn(offset);
  }
}
