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

    // NOTE Cache mask indices
    this.forEachOn();
    this.forEachOff();
  }

  countOn() {
    if (this.onCache) {
      return this.onCache;
    }

    let count = 0;

    this.words.forEach(word => {
      count += word.split('').filter(bit => bit === '1').length;
    });

    return count;
  }

  countOff() {
    if (this.offCache) {
      return this.offCache;
    }

    return this.size - this.countOn();
  }

  onIndexCache = null;
  offIndexCache = null;

  forEachOn(callback) {
    if (this.countOn() === 0) {
      return;
    }

    if (!this.onIndexCache) {
      this.onIndexCache = [];

      this.words.forEach((word, wordIndex) => {
        word.split('').forEach((value, bitIndex) => {
          if (value === '1') {
            this.onIndexCache.push(wordIndex, bitIndex, wordIndex * 64 + bitIndex);
          }
        });
      });
    }

    if (!callback) {
      return;
    }

    let i = 0;
    const interrupt = () => i = this.onIndexCache.length;

    for (i = 0; i < this.onIndexCache.length;) {
      callback({
        wordIndex: this.onIndexCache[i++],
        bitIndex: this.onIndexCache[i++],
        offset: this.onIndexCache[i++],
      }, interrupt);
    }
  }

  forEachOff(callback) {
    if (this.countOff() === 0) {
      return;
    }

    if (!this.offIndexCache) {
      this.offIndexCache = [];

      this.words.forEach((word, wordIndex) => {
        word.split('').forEach((value, bitIndex) => {
          if (value === '0') {
            this.offIndexCache.push(wordIndex, bitIndex, wordIndex * 64 + bitIndex);
          }
        });
      });
    }

    if (!callback) {
      return;
    }

    let i = 0;
    const interrupt = () => i = this.onIndexCache.length;

    for (i = 0; i < this.offIndexCache.length;) {
      callback({
        wordIndex: this.offIndexCache[i++],
        bitIndex: this.offIndexCache[i++],
        offset: this.offIndexCache[i++],
      }, interrupt);
    }
  }
}