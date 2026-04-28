// class QueryBuilder {
//   constructor(query, queryStr, schema) {
//     this.originalOptions = query.getOptions(); // store BEFORE modifying
//     this.query = query;
//     this.queryStr = queryStr;
//     this.schema = schema; // mongoose model schema User.schema
//     // this.totalResult = 0;
//   }

//   // Helpers
//   isDateString(value) {
//     return !isNaN(Date.parse(value));
//   }

//   castValue(val) {
//     if (Array.isArray(val)) return val.map((v) => this.castValue(v));
//     if (!isNaN(val) && val !== "") return Number(val);
//     if (this.isDateString(val)) return new Date(val);
//     if (val === "true") return true;
//     if (val === "false") return false;
//     return val;
//   }

//   getFieldType(field) {
//     try {
//       const pathType = this.schema?.path(field)?.instance;
//       return pathType || "Mixed";
//     } catch {
//       return "Mixed";
//     }
//   }

//   buildCondition(field, operator, value) {
//     switch (operator) {
//       case "eq":
//         return { [field]: this.castValue(value) };
//       case "ne":
//         return { [field]: { $ne: this.castValue(value) } };
//       case "gt":
//         return { [field]: { $gt: this.castValue(value) } };
//       case "gte":
//         return { [field]: { $gte: this.castValue(value) } };
//       case "lt":
//         return { [field]: { $lt: this.castValue(value) } };
//       case "lte":
//         return { [field]: { $lte: this.castValue(value) } };
//       case "between": {
//         const [min, max] = value.split(",");
//         return {
//           [field]: { $gte: this.castValue(min), $lte: this.castValue(max) },
//         };
//       }

//       // String
//       case "contains":
//         return { [field]: { $regex: value, $options: "i" } };
//       case "ncontains":
//         return { [field]: { $not: { $regex: value, $options: "i" } } };
//       case "startsWith":
//         return { [field]: { $regex: `^${value}`, $options: "i" } };
//       case "endsWith":
//         return { [field]: { $regex: `${value}$`, $options: "i" } };

//       // Arrays
//       case "in":
//         return { [field]: { $in: this.castValue(value.split(",")) } };
//       case "nin":
//         return { [field]: { $nin: this.castValue(value.split(",")) } };
//       case "all":
//         return { [field]: { $all: this.castValue(value.split(",")) } };
//       case "size":
//         return { [field]: { $size: parseInt(value) } };

//       // Nested
//       case "elemMatchElement": {
//         const [nestedKey, operator, nestedVal] = value.split(":");

//         const mongoOperators = {
//           eq: "$eq",
//           ne: "$ne",
//           lt: "$lt",
//           lte: "$lte",
//           gt: "$gt",
//           gte: "$gte",
//           in: "$in",
//           nin: "$nin",
//         };

//         const mongoOp = mongoOperators[operator] || "$eq";
//         const val = this.castValue(nestedVal || operator);

//         return {
//           [field]: {
//             $elemMatch: {
//               [nestedKey]: { [mongoOp]: val },
//             },
//           },
//         };
//       }

//       case "elemMatchEntire": {
//         const [nestedKey, operator, nestedVal] = value.split(":");

//         const mongoOperators = {
//           eq: "$eq",
//           lt: "$lt",
//           lte: "$lte",
//           gt: "$gt",
//           gte: "$gte",
//           in: "$in",
//           nin: "$nin",
//           ne: "$ne",
//         };

//         const mongoOp = mongoOperators[operator] || "$eq";
//         const val = this.castValue(nestedVal || operator);

//         return {
//           [field]: {
//             $not: {
//               $elemMatch: {
//                 [nestedKey]: { [mongoOp]: val },
//               },
//             },
//           },
//         };
//       }

//       default:
//         throw new Error(`Unsupported operator: ${operator}`);
//     }
//   }

//   // filter() {
//   //   let mongoQuery = {};

//   //   Object.entries(this.queryStr).forEach(([key, value]) => {
//   //     const reserved = [
//   //       'page',
//   //       'limit',
//   //       'sort',
//   //       'fields',
//   //       'populate',
//   //       'populateLimit',
//   //       'populatePage',
//   //       'selectPopulate',
//   //       'action',
//   //     ];
//   //     if (reserved.includes(key)) return;

//   //     // let [field, operator] = key.split("_");
//   //     const parts = key == '_id' ? [key] : key.split('_');
//   //     let operator = parts.pop(); // last part = operator
//   //     const rawField = parts.join('.'); // join remaining with dot
//   //     let field = rawField.replace(/\[(\d+)\]/g, '.$1'); // array support
//   //     if (key == operator) {
//   //       operator = null;
//   //       field = key;
//   //     }
//   //     if (!operator) {
//   //       // Infer default operator
//   //       const type = this.getFieldType(field);

//   //       if (['Number', 'Date'].includes(type)) operator = 'eq';
//   //       else if (type === 'Boolean') operator = 'eq';
//   //       else if (type === 'Array') operator = 'in';
//   //       else if (type === 'ObjectId') operator = 'eq';
//   //       else operator = 'eq'; // default string
//   //     }

//   //     const condition = this.buildCondition(field, operator, value);
//   //     console.log('Condition for', key, ':', JSON.stringify(condition));
//   //     mongoQuery = { ...mongoQuery, ...condition };
//   //   });

//   //   this.query = this.query.find(mongoQuery);
//   //   // console.log("Final Mongo Query options:", this.query.getOptions());
//   //   this.query.setOptions({
//   //     ...this.originalOptions,
//   //     // ...this.query.getOptions(),
//   //   });
//   //   return this;
//   // }

//   filter() {
//     let mongoQuery = {};

//     Object.entries(this.queryStr).forEach(([key, value]) => {
//       const reserved = [
//         "page",
//         "limit",
//         "sort",
//         "fields",
//         "populate",
//         "populateLimit",
//         "populatePage",
//         "selectPopulate",
//         "action",
//       ];

//       if (reserved.includes(key)) return;

//       const parts = key === "_id" ? [key] : key.split("_");
//       let operator = parts.pop();
//       const rawField = parts.join(".");
//       let field = rawField.replace(/\[(\d+)\]/g, ".$1");

//       if (key === operator) {
//         operator = null;
//         field = key;
//       }

//       if (!operator) {
//         const type = this.getFieldType(field);

//         if (["Number", "Date", "Boolean", "ObjectId"].includes(type))
//           operator = "eq";
//         else if (type === "Array") operator = "in";
//         else operator = "eq";
//       }

//       const condition = this.buildCondition(field, operator, value);

//       Object.entries(condition).forEach(([field, val]) => {
//         if (
//           mongoQuery[field] &&
//           typeof mongoQuery[field] === "object" &&
//           !Array.isArray(mongoQuery[field]) &&
//           typeof val === "object" &&
//           !Array.isArray(val)
//         ) {
//           mongoQuery[field] = { ...mongoQuery[field], ...val };
//         } else {
//           mongoQuery[field] = val;
//         }
//       });
//     });

//     this.query = this.query.find(mongoQuery);
//     this.query.setOptions({
//       ...this.originalOptions,
//     });

//     return this;
//   }

//   sort() {
//     if (this.queryStr.sort) {
//       const str = this.queryStr.sort.split(",").join(" ");
//       this.query = this.query.sort(str);
//     }
//     return this;
//   }

//   fields() {
//     if (this.queryStr.fields) {
//       const str = this.queryStr.fields.split(",").join(" ");
//       this.query = this.query.select(str);
//     }
//     return this;
//   }

//   pagination() {
//     const page = parseInt(this.queryStr.page) || 1;
//     const limit = parseInt(this.queryStr.limit) || 100;
//     const skip = (page - 1) * limit;
//     this.query = this.query.skip(skip).limit(limit);
//     return this;
//   }

//   populate() {
//     if (this.queryStr.populate) {
//       // Define default values for page and limit
//       const page = parseInt(this.queryStr.populatePage) || 1;
//       const limit = parseInt(this.queryStr.populateLimit) || 10;
//       const skip = (page - 1) * limit;

//       // Get fields to select and path to populate from query parameters
//       const selectFields =
//         this.queryStr.selectPopulate?.split(",").join(" ") || "-__v";
//       const path = this.queryStr.populate?.split(",").join(" ");

//       // Use populate with path, select fields, and pagination options
//       this.query = this.query.populate({
//         path: path,
//         select: selectFields,
//         options: {
//           limit: limit,
//           skip: skip,
//           ...this.originalOptions,
//         },
//         strictPopulate: false, // Disable strict populate to avoid errors
//       });
//     }
//     return this;
//   }
// }

// export default QueryBuilder;




/**New Query Builder */






///  New One 

/**
 * QueryBuilder — Production-ready Mongoose query builder
 *
 * Field + operator convention (DOUBLE underscore delimiter):
 *   ?created_at__gte=2024-01-01&price__lte=500&name__contains=john
 *
 * Supported operators:
 *   Comparison : eq | ne | gt | gte | lt | lte | between
 *   String     : contains | ncontains | startsWith | endsWith
 *   Array      : in | nin | all | size
 *   Nested     : elemMatch | nElemMatch
 */

// Safe ISO-8601 date pattern — avoids over-eager Date.parse()
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]*)?$/;

const RESERVED_KEYS = new Set([
  "page",
  "limit",
  "sort",
  "fields",
  "populate",
  "populateLimit",
  "populatePage",
  "selectPopulate",
  "action",
]);

const MAX_LIMIT = 500; // Hard cap — prevent runaway queries

/** Escape all RegExp special characters in user input */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

class QueryBuilder {
  constructor(query, queryStr, schema) {
    this.originalOptions = query.getOptions();
    this.query = query;
    this.queryStr = queryStr;
    this.schema = schema;
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  isDateString(value) {
    return ISO_DATE_RE.test(value) && !isNaN(Date.parse(value));
  }

  castValue(val) {
    if (Array.isArray(val)) return val.map((v) => this.castValue(v));
    if (typeof val !== "string") return val;
    if (val === "") return val;
    if (val === "true") return true;
    if (val === "false") return false;
    if (!isNaN(val)) return Number(val);
    if (this.isDateString(val)) return new Date(val);
    return val;
  }

  getFieldType(field) {
    try {
      return this.schema?.path(field)?.instance ?? "Mixed";
    } catch {
      return "Mixed";
    }
  }

  /** Midnight UTC on the given date */
  getStartOfDay(value) {
    const d = new Date(value);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /** 23:59:59.999 UTC on the given date */
  getEndOfDay(value) {
    const d = new Date(value);
    d.setUTCHours(23, 59, 59, 999);
    return d;
  }

  // ─── Condition builder ──────────────────────────────────────────────────────

  /**
   * Build a single MongoDB condition object.
   * Handles all types — Number, Date, String, Boolean, Array, Nested.
   */
  buildCondition(field, operator, value) {
    const fieldType = this.getFieldType(field);
    const isDate = fieldType === "Date";

    switch (operator) {
      // ── Equality ────────────────────────────────────────────────────────────

      case "eq": {
        if (isDate) {
          return {
            [field]: {
              $gte: this.getStartOfDay(value),
              $lt:  this.getEndOfDay(value),   // exclusive next-day end
            },
          };
        }
        return { [field]: this.castValue(value) };
      }

      case "ne":
        return { [field]: { $ne: this.castValue(value) } };

      // ── Comparison ──────────────────────────────────────────────────────────
      //
      //  Date semantics:
      //    gt  → after end-of-day   (strictly after the given day)
      //    gte → from start-of-day  (includes the given day)
      //    lt  → before start-of-day (strictly before the given day)
      //    lte → up to end-of-day   (includes the given day)

      case "gt":
        return {
          [field]: {
            $gt: isDate ? this.getEndOfDay(value) : this.castValue(value),
          },
        };

      case "gte":
        return {
          [field]: {
            $gte: isDate ? this.getStartOfDay(value) : this.castValue(value),
          },
        };

      case "lt":
        return {
          [field]: {
            $lt: isDate ? this.getStartOfDay(value) : this.castValue(value),
          },
        };

      case "lte":
        return {
          [field]: {
            $lte: isDate ? this.getEndOfDay(value) : this.castValue(value),
          },
        };

      // ── Range ───────────────────────────────────────────────────────────────

      case "between": {
        const commaIdx = value.indexOf(",");
        if (commaIdx === -1) {
          throw new Error(
            `"between" operator requires "min,max" — no comma found in "${value}"`
          );
        }
        const min = value.slice(0, commaIdx);
        const max = value.slice(commaIdx + 1);

        if (isDate) {
          return {
            [field]: {
              $gte: this.getStartOfDay(min),
              $lte: this.getEndOfDay(max),
            },
          };
        }

        return {
          [field]: {
            $gte: this.castValue(min),
            $lte: this.castValue(max),
          },
        };
      }

      // ── String ──────────────────────────────────────────────────────────────

      case "contains":
        return { [field]: { $regex: escapeRegex(value), $options: "i" } };

      case "ncontains":
        return {
          [field]: { $not: { $regex: escapeRegex(value), $options: "i" } },
        };

      case "startsWith":
        return { [field]: { $regex: `^${escapeRegex(value)}`, $options: "i" } };

      case "endsWith":
        return { [field]: { $regex: `${escapeRegex(value)}$`, $options: "i" } };

      // ── Array ───────────────────────────────────────────────────────────────

      case "in":
        return { [field]: { $in: this.castValue(value.split(",")) } };

      case "nin":
        return { [field]: { $nin: this.castValue(value.split(",")) } };

      case "all":
        return { [field]: { $all: this.castValue(value.split(",")) } };

      case "size": {
        const size = parseInt(value, 10);
        if (isNaN(size)) throw new Error(`"size" requires an integer, got "${value}"`);
        return { [field]: { $size: size } };
      }

      // ── Nested / $elemMatch ─────────────────────────────────────────────────
      //
      //  Format: ?arrayField__elemMatch=nestedKey:operator:value
      //  e.g.  : ?items__elemMatch=status:eq:active
      //          ?items__elemMatch=price:gte:100

      case "elemMatch": {
        const { nestedKey, mongoOp, val } = this._parseElemMatch(value);
        return {
          [field]: { $elemMatch: { [nestedKey]: { [mongoOp]: val } } },
        };
      }

      // "nElemMatch" → NO element matches the condition (was misnamed "elemMatchEntire")
      case "nElemMatch": {
        const { nestedKey, mongoOp, val } = this._parseElemMatch(value);
        return {
          [field]: {
            $not: { $elemMatch: { [nestedKey]: { [mongoOp]: val } } },
          },
        };
      }

      default:
        throw new Error(`Unsupported operator: "${operator}"`);
    }
  }

  /**
   * Parse "nestedKey:operator:value" used by elemMatch operators.
   * Validates all three parts are present.
   */
  _parseElemMatch(raw) {
    const parts = raw.split(":");
    if (parts.length < 3) {
      throw new Error(
        `elemMatch value must be "nestedKey:operator:value", got "${raw}"`
      );
    }

    const [nestedKey, op, ...rest] = parts;
    const nestedVal = rest.join(":"); // re-join in case value itself contains ":"

    const mongoOperators = {
      eq:  "$eq",
      ne:  "$ne",
      lt:  "$lt",
      lte: "$lte",
      gt:  "$gt",
      gte: "$gte",
      in:  "$in",
      nin: "$nin",
    };

    const mongoOp = mongoOperators[op];
    if (!mongoOp) throw new Error(`Unknown elemMatch operator: "${op}"`);

    return {
      nestedKey,
      mongoOp,
      val: this.castValue(nestedVal),
    };
  }

  // ─── Pipeline steps ─────────────────────────────────────────────────────────

  filter() {
    const mongoQuery = {};

    for (const [key, value] of Object.entries(this.queryStr)) {
      // Guard: skip reserved keys and block prototype-pollution attempts
      if (RESERVED_KEYS.has(key)) continue;
      if (key.startsWith("__") || key === "constructor" || key === "prototype") {
        continue;
      }

      try {
        // ── Parse field + operator ────────────────────────────────────────────
        //
        //  Convention: field__operator  (DOUBLE underscore)
        //  Examples  : created_at__gte | price__between | name__contains
        //
        //  If no "__" separator → treat the whole key as a field, infer operator
        //  from the schema type.

        let field, operator;

        const sepIdx = key.lastIndexOf("__");

        if (sepIdx !== -1 && sepIdx !== 0) {
          // e.g. "created_at__gte"  →  field="created_at"  op="gte"
          field    = key.slice(0, sepIdx).replace(/\[(\d+)\]/g, ".$1");
          operator = key.slice(sepIdx + 2);
        } else {
          // No separator — infer operator from schema type
          field    = key.replace(/\[(\d+)\]/g, ".$1");
          operator = this._inferOperator(field);
        }

        // Convert dot-bracketed array notation: items[0] → items.0
        field = field.replace(/\[(\d+)\]/g, ".$1");

        const condition = this.buildCondition(field, operator, value);

        // Merge conditions on the same field (e.g. gte + lte on "price")
        for (const [f, v] of Object.entries(condition)) {
          if (
            mongoQuery[f] &&
            typeof mongoQuery[f] === "object" &&
            !Array.isArray(mongoQuery[f]) &&
            typeof v === "object" &&
            !Array.isArray(v)
          ) {
            mongoQuery[f] = { ...mongoQuery[f], ...v };
          } else {
            mongoQuery[f] = v;
          }
        }
      } catch (err) {
        // Surface bad query params as a validation error rather than a 500 crash
        const error = new Error(`Invalid filter param "${key}": ${err.message}`);
        error.status = 400;
        throw error;
      }
    }

    this.query = this.query.find(mongoQuery);
    this.query.setOptions({ ...this.originalOptions });
    return this;
  }

  /** Infer a sensible default operator based on the schema field type. */
  _inferOperator(field) {
    const type = this.getFieldType(field);
    if (type === "Array") return "in";
    return "eq"; // works for Number, Date, Boolean, String, ObjectId, Mixed
  }

  sort() {
    if (this.queryStr.sort) {
      const sortStr = this.queryStr.sort.split(",").join(" ");
      this.query = this.query.sort(sortStr);
    }
    return this;
  }

  fields() {
    if (this.queryStr.fields) {
      const fieldStr = this.queryStr.fields.split(",").join(" ");
      this.query = this.query.select(fieldStr);
    }
    return this;
  }

  pagination() {
    const page  = Math.max(1, parseInt(this.queryStr.page, 10)  || 1);
    const limit = Math.min(
      Math.max(1, parseInt(this.queryStr.limit, 10) || 100),
      MAX_LIMIT        // hard cap — prevents runaway queries
    );
    const skip  = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }

  populate() {
    if (!this.queryStr.populate) return this;

    const page  = Math.max(1, parseInt(this.queryStr.populatePage,  10) || 1);
    const limit = Math.min(
      Math.max(1, parseInt(this.queryStr.populateLimit, 10) || 10),
      MAX_LIMIT
    );
    const skip  = (page - 1) * limit;
    const select = this.queryStr.selectPopulate?.split(",").join(" ") || "-__v";

    // Mongoose object-form populate does NOT accept space-separated paths —
    // build one populate call per path instead.
    const paths = this.queryStr.populate.split(",").map((p) => p.trim()).filter(Boolean);

    for (const path of paths) {
      this.query = this.query.populate({
        path,
        select,
        options: { limit, skip, ...this.originalOptions },
        strictPopulate: false,
      });
    }

    return this;
  }
}

export default QueryBuilder;