const [cr] = Buffer.from("\r");
const [nl] = Buffer.from("\n");

/**
 * @typedef CSVParserOptions
 * @property {string} [escape='"'] - The escape character
 * @property {string[]} [headers=null] - An array of headers to use
 * @property {function} [mapHeaders=({ header }) => header] - A function to map headers
 * @property {function} [mapValues=({ value }) => value] - A function to map values
 * @property {string} [newline="\n"] - The newline character
 * @property {string} [quote='"'] - The quote character
 * @property {string} [separator=','] - The separator character
 * @property {boolean|string} [skipComments=false] - Skip lines that start with a comment character
 * @property {number} [skipLines=null] - Skip a number of lines at the start of the file
 * @property {number} [maxRowBytes=Number.MAX_SAFE_INTEGER] - The maximum number of bytes per row
 * @property {boolean} [strict=false] - Throw an error if the number of columns in a row does not match the number of headers
 */

/**
 * @type {CSVParserOptions}
 */
const defaults = {
  escape: '"',
  headers: null,
  mapHeaders: ({ header }) => header,
  mapValues: ({ value }) => value,
  newline: "\n",
  quote: '"',
  separator: ",",
  skipComments: false,
  skipLines: null,
  maxRowBytes: Number.MAX_SAFE_INTEGER,
  strict: false,
};

class InternalCsvParser {
  constructor(opts = {}) {
    //super({ objectMode: true, highWaterMark: 16 });

    if (Array.isArray(opts)) opts = { headers: opts };

    const options = Object.assign({}, defaults, opts);

    options.customNewline = options.newline !== defaults.newline;

    for (const key of ["newline", "quote", "separator"]) {
      if (typeof options[key] !== "undefined") {
        [options[key]] = Buffer.from(options[key]);
      }
    }

    // if escape is not defined on the passed options, use the end value of quote
    options.escape = (opts || {}).escape ? Buffer.from(options.escape)[0] : options.quote;

    this.state = {
      empty: options.raw ? Buffer.alloc(0) : "",
      escaped: false,
      first: true,
      lineNumber: 0,
      previousEnd: 0,
      rowLength: 0,
      quoted: false,
    };

    this._prev = null;

    if (options.headers === false) {
      // enforce, as the column length check will fail if headers:false
      options.strict = false;
    }

    if (options.headers || options.headers === false) {
      this.state.first = false;
    }

    this.options = options;
    this.headers = options.headers;
  }

  parseCell(buffer, start, end) {
    const { escape, quote } = this.options;
    // remove quotes from quoted cells
    if (buffer[start] === quote && buffer[end - 1] === quote) {
      start++;
      end--;
    }

    let y = start;

    for (let i = start; i < end; i++) {
      // check for escape characters and skip them
      if (buffer[i] === escape && i + 1 < end && buffer[i + 1] === quote) {
        i++;
      }

      if (y !== i) {
        buffer[y] = buffer[i];
      }
      y++;
    }

    return this.parseValue(buffer, start, y);
  }

  parseLine(buffer, start, end, cb) {
    const {
      customNewline,
      escape,
      mapHeaders,
      mapValues,
      quote,
      separator,
      skipComments,
      skipLines,
    } = this.options;

    end--; // trim newline
    if (!customNewline && buffer.length && buffer[end - 1] === cr) {
      end--;
    }

    const comma = separator;
    const cells = [];
    let isQuoted = false;
    let offset = start;

    if (skipComments) {
      const char = typeof skipComments === "string" ? skipComments : "#";
      if (buffer[start] === Buffer.from(char)[0]) {
        return;
      }
    }

    const mapValue = value => {
      if (this.state.first) {
        return value;
      }

      const index = cells.length;
      const header = this.headers[index];

      return mapValues({ header, index, value });
    };

    for (let i = start; i < end; i++) {
      const isStartingQuote = !isQuoted && buffer[i] === quote;
      const isEndingQuote =
        isQuoted && buffer[i] === quote && i + 1 <= end && buffer[i + 1] === comma;
      const isEscape = isQuoted && buffer[i] === escape && i + 1 < end && buffer[i + 1] === quote;

      if (isStartingQuote || isEndingQuote) {
        isQuoted = !isQuoted;
        continue;
      }
      if (isEscape) {
        i++;
        continue;
      }

      if (buffer[i] === comma && !isQuoted) {
        let value = this.parseCell(buffer, offset, i);
        value = mapValue(value);
        cells.push(value);
        offset = i + 1;
      }
    }

    if (offset < end) {
      let value = this.parseCell(buffer, offset, end);
      value = mapValue(value);
      cells.push(value);
    }

    if (buffer[end - 1] === comma) {
      cells.push(mapValue(this.state.empty));
    }

    const skip = skipLines && skipLines > this.state.lineNumber;
    this.state.lineNumber++;

    if (this.state.first && !skip) {
      this.state.first = false;
      this.headers = cells.map((header, index) => mapHeaders({ header, index }));

      //this.emit("headers", this.headers);
      return;
    }

    if (!skip && this.options.strict && cells.length !== this.headers.length) {
      const e = new RangeError("Row length does not match headers");
      cb(e);
    } else {
      if (!skip) this.writeRow(cells, cb);
    }
  }

  parseValue(buffer, start, end) {
    if (this.options.raw) {
      return buffer.slice(start, end);
    }

    return buffer.toString("utf-8", start, end);
  }

  writeRow(cells, cb) {
    const headers = this.headers === false ? cells.map((_value, index) => index) : this.headers;

    const row = cells.reduce((o, cell, index) => {
      const header = headers[index];
      if (header === null) return o; // skip columns
      if (header !== undefined) {
        o[header] = cell;
      } else {
        o[`_${index}`] = cell;
      }
      return o;
    }, {});

    cb(null, row);
  }

  flush(cb) {
    if (this.state.escaped || !this._prev) return;
    this.parseLine(this._prev, this.state.previousEnd, this._prev.length + 1, cb); // plus since online -1s
  }

  transform(data, cb) {
    if (typeof data === "string") {
      data = Buffer.from(data);
    } else if (data instanceof Uint8Array) {
      const decoder = new TextDecoder();
      data = Buffer.from(decoder.decode(data));
    }

    const { escape, quote } = this.options;
    let start = 0;
    let buffer = data;

    if (this._prev) {
      start = this._prev.length;
      buffer = Buffer.concat([this._prev, data]);
      this._prev = null;
    }

    const bufferLength = buffer.length;

    for (let i = start; i < bufferLength; i++) {
      const chr = buffer[i];
      const nextChr = i + 1 < bufferLength ? buffer[i + 1] : null;

      this.state.rowLength++;
      if (this.state.rowLength > this.options.maxRowBytes) {
        return cb(new Error("Row exceeds the maximum size"));
      }

      if (!this.state.escaped && chr === escape && nextChr === quote && i !== start) {
        this.state.escaped = true;
        continue;
      }
      if (chr === quote) {
        if (this.state.escaped) {
          this.state.escaped = false;
          // non-escaped quote (quoting the cell)
        } else {
          this.state.quoted = !this.state.quoted;
        }
        continue;
      }

      if (!this.state.quoted) {
        if (this.state.first && !this.options.customNewline) {
          if (chr === nl) {
            this.options.newline = nl;
          } else if (chr === cr) {
            if (nextChr !== nl) {
              this.options.newline = cr;
            }
          }
        }

        if (chr === this.options.newline) {
          this.parseLine(buffer, this.state.previousEnd, i + 1, cb);
          this.state.previousEnd = i + 1;
          this.state.rowLength = 0;
        }
      }
    }

    if (this.state.previousEnd === bufferLength) {
      this.state.previousEnd = 0;
      return;
    }

    if (bufferLength - this.state.previousEnd < data.length) {
      this._prev = data;
      this.state.previousEnd -= bufferLength - data.length;
      return;
    }

    this._prev = buffer;
  }
}

const CsvParser = (opts = {}) => {
  const parser = new InternalCsvParser(opts);
  return new TransformStream({
    start() {},
    transform(chunk, controller) {
      parser.transform(chunk, (error, data) => {
        if (error) {
          controller.error(error);
        } else {
          controller.enqueue(data);
        }
      });
    },
    flush(controller) {
      parser.flush((error, data) => {
        if (error) {
          controller.error(error);
        } else {
          controller.enqueue(data);
        }
      });
    },
  });
};

export default CsvParser;
