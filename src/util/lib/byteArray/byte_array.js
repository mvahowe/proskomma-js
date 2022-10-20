import {utf8ByteArrayToString, stringToUtf8ByteArray} from 'utf8-string-bytes';
import base64 from "base64-js";

const checkNum = (n, func, field) => {
    if (typeof n !== 'number') {
        throw new Error(`Argument ${field} of ${func} should be a number, not '${n}' (${typeof n})`);
    }
}

export default class ByteArray {

    constructor(initialArraySize, initialLength) {
        initialArraySize = initialArraySize || 64;
        initialLength = initialLength || 0;
        this.growMax = 1024 * 16;
        this.length = initialLength;
        this.byteArray = new Uint8Array(initialArraySize);
    }

    byte(n) {
        checkNum(n, 'byte', 'n');
        if (n > this.length - 1) {
            throw Error(`Attempt to read byte ${n} of ByteArray of length ${this.length}`);
        }
        return this.byteArray[n];
    }

    bytes(n, l) {
        checkNum(n, 'bytes', 'n');
        checkNum(l, 'bytes', 'l');
        if ((n + l) > this.length) {
            throw Error(`Attempt to read ${l} bytes from start ${n} of ByteArray of length ${this.length}`);
        }
        return this.byteArray.subarray(n, n + l);
    }

    setByte(n, v) {
        checkNum(n, 'setByte', 'n');
        checkNum(v, 'setByte', 'v');
        if (n > this.length - 1) {
            throw Error(`Attempt to set byte ${n} of ByteArray of length ${this.length}`);
        }
        if (typeof (v) !== "number" || v < 0 || v > 255) {
            throw Error(`Expected value 0-255 when setting ByteArray, found ${v}`);
        }
        this.byteArray[n] = v;
    }

    setBytes(n, v) {
        checkNum(n, 'setBytes', 'n');
        if ((n + v.length) > this.length) {
            throw Error(`Attempt to set ${v.length} bytes from start ${n} of ByteArray of length ${this.length}`);
        }
        this.byteArray.set(v, n);
    }

    pushByte(v) {
        if (typeof (v) !== "number" || v < 0 || v > 255) {
            throw Error(`Expected value 0-255 when pushing to ByteArray, found ${v}`);
        }
        if (this.length === this.byteArray.length) {
            this.grow();
        }
        this.byteArray[this.length] = v;
        this.length++;
    }

    grow(minNewSize) {
        const newBytes = new Uint8Array(
            Math.max(
                minNewSize || 0,
                this.byteArray.length + (
                    Math.min(
                        this.growMax,
                        Math.max(
                            16,
                            this.byteArray.length
                        )
                    )
                )
            )
        );
        newBytes.set(this.byteArray);
        this.byteArray = newBytes;
    }

    trim() {
        const newBytes = new Uint8Array(this.length);
        newBytes.set(this.byteArray.subarray(0, this.length));
        this.byteArray = newBytes;
    }

    pushBytes(v) {
        for (const ve of v) {
            this.pushByte(ve);
        }
    }

    pushNByte(v) {
        checkNum(v, 'pushNByte', 'v');
        // Low byte(s) first
        if (typeof (v) !== "number" || v < 0) {
            throw Error(`Expected positive number in pushNByte, found ${v}`);
        }
        if (v < 128) {
            this.pushByte(v + 128);
        } else {
            const modulo = v % 128;
            this.pushByte(modulo);
            this.pushNByte(v >> 7);
        }
    }

    pushNBytes(vArray) {
        for (const v of vArray) {
            try {
                this.pushNByte(v);
            } catch (err) {
                throw Error(`Error from pushNByte, called as pushNBytes(${JSON.stringify(vArray)})`);
            }
        }
    }

    nByte(n) {
        checkNum(n, 'nByte', 'n');
        if (n > this.length - 1) {
            throw Error(`Attempt to read nByte ${n} of ByteArray of length ${this.length}`);
        }
        const v = this.byteArray[n];
        if (v > 127) {
            return v - 128;
        } else {
            return v + (128 * this.nByte(n + 1));
        }
    }

    nBytes(n, nValues) {
        checkNum(n, 'nBytes', 'n');
        checkNum(nValues, 'nBytes', 'nValues');
        const ret = [];
        while (nValues > 0) {
            let done = false;
            let currentValue = 0;
            let multiplier = 1;
            do {
                if (n > this.length - 1) {
                    throw Error(`Attempt to read nByte ${n} of ByteArray of length ${this.length} in nBytes(${n}, ${nValues})`);
                }
                const v = this.byteArray[n];
                if (v > 127) {
                    currentValue += ((v - 128) * multiplier);
                    ret.push(currentValue);
                    currentValue = 0;
                    done = true;
                } else {
                    currentValue += (v * multiplier);
                    multiplier *= 128;
                }
                n++;
            } while (!done);
            nValues--;
        }
        return ret;
    }

    nByteLength(v) {
        checkNum(v, 'nByteLength', 'v');
        if (v >= 128 ** 4) {
            throw new Error("> 4 bytes found in nByteLength");
        }
        let ret = 1;
        while (v > 127) {
            v = v >> 7;
            ret += 1;
        }
        return ret;
    }

    pushCountedString(s) {
        const sA = stringToUtf8ByteArray(s);
        this.pushByte(sA.length);
        this.pushBytes(sA);
    }

    countedString(n) {
        checkNum(n, 'countedString', 'n');
        const sLength = this.byte(n);
        return utf8ByteArrayToString(this.bytes(n + 1, sLength));
    }

    clear() {
        this.byteArray.fill(0);
        this.length = 0;
    }

    base64() {
        return base64.fromByteArray(this.byteArray);
    }

    fromBase64(s) {
        this.byteArray = base64.toByteArray(s);
        this.length = this.byteArray.length;
    }

    deleteItem(n) {
        checkNum(n, 'deleteItem', 'n');
        const itemLength = this.byte(n) & 0x0000003F;
        this.length -= itemLength;
        if (this.length > n) {
            const remainingBytes = this.byteArray.slice(n + itemLength);
            this.byteArray.set(remainingBytes, n);
        }
    }

    insert(n, iba) {
        checkNum(n, 'insert', 'n');
        const insertLength = iba.length;
        const newLength = this.length + insertLength;
        if (newLength >= (this.byteArray.length + insertLength)) {
            this.grow(newLength);
        }
        if (n < newLength) {
            const displacedBytes = this.byteArray.slice(n, this.length);
            this.byteArray.set(displacedBytes, n + insertLength);
        }
        this.byteArray.set(iba.byteArray.slice(0, iba.length), n);
        this.length = newLength;
    }

}
