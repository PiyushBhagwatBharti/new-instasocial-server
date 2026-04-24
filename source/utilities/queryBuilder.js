class QueryBuilder {
  constructor(query, queryStr, schema) {
    this.originalOptions = query.getOptions(); // store BEFORE modifying
    this.query = query;
    this.queryStr = queryStr;
    this.schema = schema; // mongoose model schema User.schema
    // this.totalResult = 0;
  }
 
  // Helpers
  isDateString(value) {
    return !isNaN(Date.parse(value));
  }
 
  castValue(val) {
    if (Array.isArray(val)) return val.map((v) => this.castValue(v));
    if (!isNaN(val) && val !== '') return Number(val);
    if (this.isDateString(val)) return new Date(val);
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }
 
  getFieldType(field) {
    try {
      const pathType = this.schema?.path(field)?.instance;
      return pathType || 'Mixed';
    } catch {
      return 'Mixed';
    }
  }
 
  buildCondition(field, operator, value) {
    switch (operator) {
      case 'eq':
        return { [field]: this.castValue(value) };
      case 'ne':
        return { [field]: { $ne: this.castValue(value) } };
      case 'gt':
        return { [field]: { $gt: this.castValue(value) } };
      case 'gte':
        return { [field]: { $gte: this.castValue(value) } };
      case 'lt':
        return { [field]: { $lt: this.castValue(value) } };
      case 'lte':
        return { [field]: { $lte: this.castValue(value) } };
      case 'between': {
        const [min, max] = value.split(',');
        return {
          [field]: { $gte: this.castValue(min), $lte: this.castValue(max) },
        };
      }
 
      // String
      case 'contains':
        return { [field]: { $regex: value, $options: 'i' } };
      case 'ncontains':
        return { [field]: { $not: { $regex: value, $options: 'i' } } };
      case 'startsWith':
        return { [field]: { $regex: `^${value}`, $options: 'i' } };
      case 'endsWith':
        return { [field]: { $regex: `${value}$`, $options: 'i' } };
 
      // Arrays
      case 'in':
        return { [field]: { $in: this.castValue(value.split(',')) } };
      case 'nin':
        return { [field]: { $nin: this.castValue(value.split(',')) } };
      case 'all':
        return { [field]: { $all: this.castValue(value.split(',')) } };
      case 'size':
        return { [field]: { $size: parseInt(value) } };
 
      // Nested
      case 'elemMatchElement': {
        const [nestedKey, operator, nestedVal] = value.split(':');
 
        const mongoOperators = {
          eq: '$eq',
          ne: '$ne',
          lt: '$lt',
          lte: '$lte',
          gt: '$gt',
          gte: '$gte',
          in: '$in',
          nin: '$nin',
        };
 
        const mongoOp = mongoOperators[operator] || '$eq';
        const val = this.castValue(nestedVal || operator);
 
        return {
          [field]: {
            $elemMatch: {
              [nestedKey]: { [mongoOp]: val },
            },
          },
        };
      }
 
      case 'elemMatchEntire': {
        const [nestedKey, operator, nestedVal] = value.split(':');
 
        const mongoOperators = {
          eq: '$eq',
          lt: '$lt',
          lte: '$lte',
          gt: '$gt',
          gte: '$gte',
          in: '$in',
          nin: '$nin',
          ne: '$ne',
        };
 
        const mongoOp = mongoOperators[operator] || '$eq';
        const val = this.castValue(nestedVal || operator);
 
        return {
          [field]: {
            $not: {
              $elemMatch: {
                [nestedKey]: { [mongoOp]: val },
              },
            },
          },
        };
      }
 
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
 
  filter() {
    let mongoQuery = {};
 
    Object.entries(this.queryStr).forEach(([key, value]) => {
      const reserved = [
        'page',
        'limit',
        'sort',
        'fields',
        'populate',
        'populateLimit',
        'populatePage',
        'selectPopulate',
        'action',
      ];
      if (reserved.includes(key)) return;
 
      // let [field, operator] = key.split("_");
      const parts = key == '_id' ? [key] : key.split('_');
      let operator = parts.pop(); // last part = operator
      const rawField = parts.join('.'); // join remaining with dot
      let field = rawField.replace(/\[(\d+)\]/g, '.$1'); // array support
      if (key == operator) {
        operator = null;
        field = key;
      }
      if (!operator) {
        // Infer default operator
        const type = this.getFieldType(field);
 
        if (['Number', 'Date'].includes(type)) operator = 'eq';
        else if (type === 'Boolean') operator = 'eq';
        else if (type === 'Array') operator = 'in';
        else if (type === 'ObjectId') operator = 'eq';
        else operator = 'eq'; // default string
      }
 
      const condition = this.buildCondition(field, operator, value);
      console.log('Condition for', key, ':', JSON.stringify(condition));
      mongoQuery = { ...mongoQuery, ...condition };
    });
 
    this.query = this.query.find(mongoQuery);
    // console.log("Final Mongo Query options:", this.query.getOptions());
    this.query.setOptions({
      ...this.originalOptions,
      // ...this.query.getOptions(),
    });
    return this;
  }
 
  sort() {
    if (this.queryStr.sort) {
      const str = this.queryStr.sort.split(',').join(' ');
      this.query = this.query.sort(str);
    }
    return this;
  }
 
  fields() {
    if (this.queryStr.fields) {
      const str = this.queryStr.fields.split(',').join(' ');
      this.query = this.query.select(str);
    }
    return this;
  }
 
  pagination() {
    const page = parseInt(this.queryStr.page) || 1;
    const limit = parseInt(this.queryStr.limit) || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
 
  populate() {
    if (this.queryStr.populate) {
      // Define default values for page and limit
      const page = parseInt(this.queryStr.populatePage) || 1;
      const limit = parseInt(this.queryStr.populateLimit) || 10;
      const skip = (page - 1) * limit;
 
      // Get fields to select and path to populate from query parameters
      const selectFields = this.queryStr.selectPopulate?.split(',').join(' ') || '-__v';
      const path = this.queryStr.populate?.split(',').join(' ');
 
      // Use populate with path, select fields, and pagination options
      this.query = this.query.populate({
        path: path,
        select: selectFields,
        options: {
          limit: limit,
          skip: skip,
          ...this.originalOptions,
        },
        strictPopulate: false, // Disable strict populate to avoid errors
      });
    }
    return this;
  }
}
 
export default QueryBuilder;
