class ByteArray {

    constructor(initialSize) {
        initialSize = initialSize || 64 * 1024;
        this.growMax = 1024*512;
        this.length = 0;
        this.bytes = new Uint8Array(initialSize);
    }

    byte(n) {
        if (n > this.length) {
            throw Error(`Attempt to read byte ${n} of ByteArray of length ${this.length}`);
        }
        return this.bytes[n];
    }

    bytes(n, l) {
        if ((n + l) > this.length) {
            throw Error(`Attempt to read ${l} bytes from start ${n} of ByteArray of length ${this.length}`);
        }
        return this.bytes.subarray(n, l);
    }

    setByte(n, v) {
        if (n > this.length) {
            throw Error(`Attempt to set byte ${n} of ByteArray of length ${this.length}`);
        }
        if (typeof(v) !==  "number" || v < 0 || v > 255) {
            throw Error(`Expected value 0-255 when setting ByteArray, found ${v}`);
        }
        this.bytes[n] = v;
    }

    setBytes(n, v) {
        if ((n + v.length) > this.length) {
            throw Error(`Attempt to set ${v.length} bytes from start ${n} of ByteArray of length ${this.length}`);
        }
        this.bytes.set(v, n);
    }

    pushByte(v) {
        if (typeof(v) !==  "number" || v < 0 || v > 255) {
            throw Error(`Expected value 0-255 when pushing to ByteArray, found ${v}`);
        }
        if (this.length === this.bytes.length) {
            this.grow();
        }
        this.bytes[this.length + 1] = v;
        this.length++;
    }

    pushBytes(v) {
        for (const ve of v) {
            this.pushByte(ve);
        }
    }

    grow() {
        const newBytes = new Uint8Array(this.bytes.length + (Math.min(this.growMax, this.bytes.length)));
        newBytes.set(this.bytes);
        this.bytes = newBytes;
    }

}

module.exports = { ByteArray }