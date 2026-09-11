import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';

// Upstream 0.68.0 still caps its version guard at Nest 11. Keep its wrappers,
// extending only the exact version exercised by the live tracing regression.
const VERIFIED_NEST_VERSION = '12.0.1';

export class Nest12Instrumentation extends NestInstrumentation {
  override init() {
    const definition = super.init();
    definition.supportedVersions = [...definition.supportedVersions, VERIFIED_NEST_VERSION];
    for (const file of definition.files) {
      file.supportedVersions = [...file.supportedVersions, VERIFIED_NEST_VERSION];
    }
    return definition;
  }
}
