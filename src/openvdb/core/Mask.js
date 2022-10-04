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

  onValuesCache = null;
  offValuesCache = null;

  onIndexCache = null;

  forEachOn(callback) {
    if (this.countOn() === 0) {
      return;
    }

    if (!this.onValuesCache) {
      this.onValuesCache = [];
      this.onIndexCache = [];

      this.words.forEach((word, wordIndex) => {
        word.split('').forEach((value, bitIndex) => {
          if (value === '1') {
            const offset = wordIndex * 64 + bitIndex;

            this.onValuesCache.push(wordIndex, bitIndex, offset);
            this.onIndexCache[offset] = true;
          }
        });
      });
    }

    if (!callback) {
      return;
    }

    let i = 0;

    while(i < this.onValuesCache.length) {
      if (callback({
        wordIndex: this.onValuesCache[i++],
        bitIndex: this.onValuesCache[i++],
        offset: this.onValuesCache[i++],
      }) === 0) {
        break;
      }
    }
  }

  forEachOff(callback) {
    if (this.countOff() === 0) {
      return;
    }

    if (!this.offValuesCache) {
      this.offValuesCache = [];

      this.words.forEach((word, wordIndex) => {
        word.split('').forEach((value, bitIndex) => {
          if (value === '0') {
            this.offValuesCache.push(wordIndex, bitIndex, wordIndex * 64 + bitIndex);
          }
        });
      });
    }

    if (!callback) {
      return;
    }

    let i = 0;

    while(i < this.offValuesCache.length) {
      if (callback({
        wordIndex: this.offValuesCache[i++],
        bitIndex: this.offValuesCache[i++],
        offset: this.offValuesCache[i++],
      }) === 0) {
        break;
      }
    }
  }

  isOn(offset) {
    return this.onIndexCache[offset];
  }

  isOff(offset) {
    return !this.onIndexCache[offset];
  }
}