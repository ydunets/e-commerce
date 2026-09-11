import { parseConfiguration } from './configuration.js';

export { LogLevel } from './configuration.js';

// One process-wide value, also available before a future Nest provider is initialized.
export default parseConfiguration(process.env);
