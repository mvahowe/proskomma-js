import xre from 'xregexp';

import ByteArray from '../byteArray';

const cvMappingType = 2;
const bcvMappingType = 3;

const bookCodes = [ // From Paratext via Scripture Burrito
    "GEN",
    "EXO",
    "LEV",
    "NUM",
    "DEU",
    "JOS",
    "JDG",
    "RUT",
    "1SA",
    "2SA",
    "1KI",
    "2KI",
    "1CH",
    "2CH",
    "EZR",
    "NEH",
    "EST",
    "JOB",
    "PSA",
    "PRO",
    "ECC",
    "SNG",
    "ISA",
    "JER",
    "LAM",
    "EZK",
    "DAN",
    "HOS",
    "JOL",
    "AMO",
    "OBA",
    "JON",
    "MIC",
    "NAM",
    "HAB",
    "ZEP",
    "HAG",
    "ZEC",
    "MAL",
    "MAT",
    "MRK",
    "LUK",
    "JHN",
    "ACT",
    "ROM",
    "1CO",
    "2CO",
    "GAL",
    "EPH",
    "PHP",
    "COL",
    "1TH",
    "2TH",
    "1TI",
    "2TI",
    "TIT",
    "PHM",
    "HEB",
    "JAS",
    "1PE",
    "2PE",
    "1JN",
    "2JN",
    "3JN",
    "JUD",
    "REV",
    "TOB",
    "JDT",
    "ESG",
    "WIS",
    "SIR",
    "BAR",
    "LJE",
    "S3Y",
    "SUS",
    "BEL",
    "1MA",
    "2MA",
    "3MA",
    "4MA",
    "1ES",
    "2ES",
    "MAN",
    "PS2",
    "ODA",
    "PSS",
    "JSA",
    "JDB",
    "TBS",
    "SST",
    "DNT",
    "BLT",
    "EZA",
    "5EZ",
    "6EZ",
    "DAG",
    "PS3",
    "2BA",
    "LBA",
    "JUB",
    "ENO",
    "1MQ",
    "2MQ",
    "3MQ",
    "REP",
    "4BA",
    "LAO"
    ];

const bookCodeIndex = () => {
    const ret = {};
    for (const [bookN, book] of Object.entries(bookCodes)) {
        ret[book] = parseInt(bookN);
    }
    return ret;
}

const vrs2json = vrsString => {
    const ret = {};

    for (
        const vrsLineBits of
        vrsString
            .split(/[\n\r]+/)
            .map(l => l.trim())
            .map(l => xre.exec(l, xre("^([A-Z1-6]{3} [0-9]+:[0-9]+(-[0-9]+)?) = ([A-Z1-6]{3} [0-9]+:[0-9]+[a-z]?(-[0-9]+)?)$")))
        ) {
        if (!vrsLineBits) {
            continue;
        }
        if (!(vrsLineBits[1] in ret)) {
            ret[vrsLineBits[1]] = [];
        }
        ret[vrsLineBits[1]].push(vrsLineBits[3]);
    }
    return {mappedVerses: ret};
}

const reverseVersification = vrsJson => {
    // Assumes each verse is only mapped from once
    const ret = {};
    for (const [fromSpec, toSpecs] of Object.entries(vrsJson.mappedVerses)) {
        for (const toSpec of toSpecs) {
            toSpec in ret ? ret[toSpec].push(fromSpec) : ret[toSpec] = [fromSpec];
        }
    }
    return {reverseMappedVerses: ret};
}

const preSuccinctVerseMapping = mappingJson => {
    const ret = {};
    for (let [fromSpec, toSpecs] of Object.entries(mappingJson)) {
        if (typeof toSpecs === 'string') {
            toSpecs = [toSpecs];
        }
        const [fromBook, fromCVV] = fromSpec.split(' ');
        const toBook = toSpecs[0].split(' ')[0];
        const record = toBook === fromBook ? ["cv"] : ["bcv"];
        let [fromCh, fromV] = fromCVV.split(':');
        let toV = fromV;
        if (fromV.includes('-')) {
            const vBits = fromV.split('-');
            fromV = vBits[0];
            toV = vBits[1];
        }
        record.push([parseInt(fromV), parseInt(toV)]);
        record.push([]);

        for (const toCVV of toSpecs.map(ts => ts.split(' ')[1])) {
            let [toCh, fromV] = toCVV.split(':');
            let toV = fromV;
            if (fromV.includes('-')) {
                const vBits = fromV.split('-');
                fromV = vBits[0];
                toV = vBits[1];
            }
            if (record[0] === 'cv') {
                record[2].push([parseInt(toCh), parseInt(fromV), parseInt(toV)]);
            } else {
                record[2].push([parseInt(toCh), parseInt(fromV), parseInt(toV), toBook]);
            }
        }
        if (!(fromBook in ret)) {
            ret[fromBook] = {};
        }
        if (!(fromCh in ret[fromBook])) {
            ret[fromBook][fromCh] = [];
        }
        ret[fromBook][fromCh].push(record);
    }
    return ret;
}

const succinctifyVerseMappings = preSuccinct => {
    const ret = {};
    const bci = bookCodeIndex();
    for (const [book, chapters] of Object.entries(preSuccinctVerseMapping(preSuccinct))) {
        ret[book] = {};
        for (const [chapter, mappings] of Object.entries(chapters)) {
            ret[book][chapter] = succinctifyVerseMapping(mappings, bci);
        }
    }
    return ret;
}

const succinctifyVerseMapping = (preSuccinctBC, bci) => {
    const makeMappingLengthByte = (recordType, length) =>
        length + (recordType * 64);

    const ret = new ByteArray(64);
    for (const [recordTypeStr, [fromVerseStart, fromVerseEnd], mappings] of preSuccinctBC) {
        const pos = ret.length;
        const recordType = recordTypeStr === 'bcv' ? bcvMappingType : cvMappingType;
        ret.pushNBytes([0, fromVerseStart, fromVerseEnd]);
        if (recordType === bcvMappingType) {
            const bookIndex = bci[mappings[0][3]];
            ret.pushNByte(bookIndex);
        }
        ret.pushNByte(mappings.length);
        for (const [ch, fromV] of mappings) {
            ret.pushNBytes([ch, fromV]);
        }
        const recordLength = ret.length - pos;
        if (recordLength > 63) {
            throw new Error(`Mapping in succinctifyVerseMapping ${JSON.stringify(mappings)} is too long (${recordLength} bytes)`);
        }
        ret.setByte(pos, makeMappingLengthByte(recordType, recordLength));
    }
    ret.trim();
    return ret;
}

const mappingLengthByte = (succinct, pos) => {
    const sByte = succinct.byte(pos);
    return [
        sByte >> 6,
        sByte % 64,
    ];
}

const unsuccinctifyVerseMapping = (succinctBC, fromBookCode, bci) => {
    const ret = [];
    let pos = 0;
    while (pos < succinctBC.length) {
        let recordPos = pos;
        const unsuccinctRecord = {};
        const [recordType, recordLength] = mappingLengthByte(succinctBC, pos);
        recordPos++;
        unsuccinctRecord.fromVerseStart = succinctBC.nByte(recordPos);
        recordPos += succinctBC.nByteLength(unsuccinctRecord.fromVerseStart);
        unsuccinctRecord.fromVerseEnd = succinctBC.nByte(recordPos);
        recordPos += succinctBC.nByteLength(unsuccinctRecord.fromVerseEnd);
        unsuccinctRecord.bookCode = fromBookCode;
        if (recordType === bcvMappingType) {
            const bookIndex = succinctBC.nByte(recordPos);
            unsuccinctRecord.bookCode = bookCodes[bookIndex];
            recordPos += succinctBC.nByteLength(bookIndex);
        }
        const nMappings = succinctBC.nByte(recordPos);
        recordPos += succinctBC.nByteLength(nMappings);
        const mappings = [];
        while(mappings.length < nMappings) {
            const mapping = {};
            mapping.ch = succinctBC.nByte(recordPos);
            recordPos += succinctBC.nByteLength(mapping.ch);
            mapping.verseStart = succinctBC.nByte(recordPos);
            recordPos += succinctBC.nByteLength(mapping.verseStart);
            mappings.push(mapping);
        }
        unsuccinctRecord.mapping = mappings;
        ret.push(unsuccinctRecord);
        pos += recordLength;
    }
    return ret;
}

const mapVerse = (succinct, b, c, v) => {
    // Succinct for one chapter.
    // Pass book and chapter to provide complete response in each case.
    let ret = null;
    let pos = 0;
    while (pos < succinct.length) {
        let recordPos = pos;
        const [recordType, recordLength] = mappingLengthByte(succinct, pos);
        recordPos++;
        const fromVerseStart = succinct.nByte(recordPos);
        recordPos += succinct.nByteLength(fromVerseStart);
        const fromVerseEnd = succinct.nByte(recordPos);
        recordPos += succinct.nByteLength(fromVerseEnd);
        if (v < fromVerseStart || v > fromVerseEnd) {
            pos += recordLength;
            continue;
        }
        let bookCode = b;
        if (recordType === bcvMappingType) {
            const bookIndex = succinct.nByte(recordPos);
            bookCode = bookCodes[bookIndex];
            recordPos += succinct.nByteLength(bookIndex);
        }
        ret = [bookCode, []];
        const nMappings = succinct.nByte(recordPos);
        recordPos += succinct.nByteLength(nMappings);
        while (ret[1].length < nMappings) {
            const ch = succinct.nByte(recordPos);
            recordPos += succinct.nByteLength(ch);
            const verseStart = succinct.nByte(recordPos);
            recordPos += succinct.nByteLength(verseStart);
            ret[1].push([ch, (v - fromVerseStart) + verseStart]);
        }
        break;
    }
    return ret || [b, [[c, v]]];
}

export {
    vrs2json,
    reverseVersification,
    preSuccinctVerseMapping,
    bookCodes,
    succinctifyVerseMapping,
    succinctifyVerseMappings,
    unsuccinctifyVerseMapping,
    bookCodeIndex,
    mapVerse,
};
