class ByteArray {

    constructor(initialSize) {
        initialSize = initialSize || 64 * 1024;
        this.growMax = 1024*512;
        this.length = 0;
        this.byteArray = new Uint8Array(initialSize);
    }

    byte(n) {
        if (n > this.length - 1) {
            throw Error(`Attempt to read byte ${n} of ByteArray of length ${this.length}`);
        }
        return this.byteArray[n];
    }

    bytes(n, l) {
        if ((n + l) > this.length) {
            throw Error(`Attempt to read ${l} bytes from start ${n} of ByteArray of length ${this.length}`);
        }
        return Array.from(this.byteArray.subarray(n, n + l));
    }

    setByte(n, v) {
        if (n > this.length - 1) {
            throw Error(`Attempt to set byte ${n} of ByteArray of length ${this.length}`);
        }
        if (typeof(v) !==  "number" || v < 0 || v > 255) {
            throw Error(`Expected value 0-255 when setting ByteArray, found ${v}`);
        }
        this.byteArray[n] = v;
    }

    setBytes(n, v) {
        if ((n + v.length) > this.length) {
            throw Error(`Attempt to set ${v.length} bytes from start ${n} of ByteArray of length ${this.length}`);
        }
        this.byteArray.set(v, n);
    }

    pushByte(v) {
        if (typeof(v) !==  "number" || v < 0 || v > 255) {
            throw Error(`Expected value 0-255 when pushing to ByteArray, found ${v}`);
        }
        if (this.length === this.byteArray.length) {
            this.grow();
        }
        this.byteArray[this.length] = v;
        this.length++;
    }

    pushBytes(v) {
        for (const ve of v) {
            this.pushByte(ve);
        }
    }

    grow() {
        const newBytes = new Uint8Array(this.byteArray.length + (Math.min(this.growMax, this.byteArray.length)));
        newBytes.set(this.byteArray);
        this.byteArray = newBytes;
    }

}

module.exports = ByteArray