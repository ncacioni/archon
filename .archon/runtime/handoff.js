import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __moduleDir = path.dirname(fileURLToPath(import.meta.url));
const SCHEMAS_DIR = path.join(__moduleDir, 'schemas');
const SCRATCHPAD_DIR = path.resolve(__moduleDir, '..', '..', '.claude', 'scratchpad');

// --- Minimal JSON Schema validator (draft-07 subset) ---
// Supports: type, required, properties, enum, additionalProperties, $ref (local definitions),
//           minimum, maximum, minItems, items, format (ignored)

function validateValue(value, schema, definitions, path) {
  const errors = [];

  if (schema.$ref) {
    const refName = schema.$ref.replace(/^#\/definitions\//, '');
    const refSchema = definitions?.[refName];
    if (!refSchema) {
      errors.push(`${path}: unknown $ref "${schema.$ref}"`);
      return errors;
    }
    return validateValue(value, refSchema, definitions, path);
  }

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const rawType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    // JSON Schema: "integer" is a subtype of "number" — typeof returns "number" for both
    const actualType = rawType === 'number' && Number.isInteger(value) ? 'integer' : rawType;
    const typeMatches = types.includes(actualType) || (actualType === 'integer' && types.includes('number'));
    if (!typeMatches) {
      errors.push(`${path}: expected type "${types.join('|')}", got "${actualType}"`);
      return errors;
    }
  }

  if (schema.enum !== undefined) {
    if (!schema.enum.includes(value)) {
      errors.push(`${path}: value "${value}" not in enum [${schema.enum.join(', ')}]`);
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: ${value} < minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path}: ${value} > maximum ${schema.maximum}`);
    }
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (schema.required) {
      for (const key of schema.required) {
        if (!(key in value)) {
          errors.push(`${path}: missing required property "${key}"`);
        }
      }
    }

    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in value) {
          errors.push(...validateValue(value[key], propSchema, definitions, `${path}.${key}`));
        }
      }
    }

    if (schema.additionalProperties === false && schema.properties) {
      for (const key of Object.keys(value)) {
        if (!(key in schema.properties)) {
          errors.push(`${path}: additional property "${key}" not allowed`);
        }
      }
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: array length ${value.length} < minItems ${schema.minItems}`);
    }
    if (schema.items) {
      value.forEach((item, i) => {
        errors.push(...validateValue(item, schema.items, definitions, `${path}[${i}]`));
      });
    }
  }

  return errors;
}

function validate(schema, data) {
  const definitions = schema.definitions || {};
  const errors = validateValue(data, schema, definitions, '$');
  return { valid: errors.length === 0, errors };
}

// --- Schema loading ---

export function listSchemas() {
  if (!fs.existsSync(SCHEMAS_DIR)) return [];
  return fs.readdirSync(SCHEMAS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.basename(f, '.json'));
}

export function loadSchema(schemaName) {
  const schemaPath = path.join(SCHEMAS_DIR, `${schemaName}.json`);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema not found: ${schemaName} (looked in ${schemaPath})`);
  }
  return JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
}

// --- Handoff operations ---

export function validateHandoff(schemaName, data) {
  const schema = loadSchema(schemaName);
  return validate(schema, data);
}

export function writeHandoff(schemaName, data) {
  const result = validateHandoff(schemaName, data);
  if (!result.valid) {
    throw new Error(`Validation failed for "${schemaName}":\n${result.errors.join('\n')}`);
  }

  fs.mkdirSync(SCRATCHPAD_DIR, { recursive: true });
  const outPath = path.join(SCRATCHPAD_DIR, `${schemaName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
  return outPath;
}

export function readHandoff(schemaName) {
  const filePath = path.join(SCRATCHPAD_DIR, `${schemaName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Handoff file not found: ${filePath}`);
  }
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const result = validateHandoff(schemaName, data);
  if (!result.valid) {
    throw new Error(`Existing handoff "${schemaName}" failed validation:\n${result.errors.join('\n')}`);
  }
  return data;
}

// --- CLI ---

const [,, subcmd, ...args] = process.argv;

if (subcmd) {
  if (subcmd === 'schemas') {
    const schemas = listSchemas();
    if (schemas.length === 0) {
      console.log('No schemas found.');
    } else {
      console.log(schemas.join('\n'));
    }
  } else if (subcmd === 'validate') {
    const [schemaName, jsonFile] = args;
    if (!schemaName || !jsonFile) {
      console.error('Usage: handoff.js validate <schema-name> <json-file>');
      process.exit(1);
    }
    try {
      const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      const result = validateHandoff(schemaName, data);
      if (result.valid) {
        console.log(`✓ Valid "${schemaName}"`);
      } else {
        console.error(`✗ Invalid "${schemaName}":`);
        result.errors.forEach(e => console.error(`  ${e}`));
        process.exit(1);
      }
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (subcmd === 'write') {
    const [schemaName, jsonFile] = args;
    if (!schemaName || !jsonFile) {
      console.error('Usage: handoff.js write <schema-name> <json-file>');
      process.exit(1);
    }
    try {
      const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
      const outPath = writeHandoff(schemaName, data);
      console.log(`Written: ${outPath}`);
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else if (subcmd === 'read') {
    const [schemaName] = args;
    if (!schemaName) {
      console.error('Usage: handoff.js read <schema-name>');
      process.exit(1);
    }
    try {
      const data = readHandoff(schemaName);
      console.log(JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(e.message);
      process.exit(1);
    }
  } else {
    console.error(`Unknown subcommand: ${subcmd}`);
    process.exit(1);
  }
}
