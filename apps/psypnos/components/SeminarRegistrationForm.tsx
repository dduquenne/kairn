// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
/**
 * Seminar Registration Form - Backward Compatibility Layer
 *
 * This file re-exports the modular SeminarRegistrationForm for backward compatibility.
 * New code should import directly from "./SeminarRegistration/index".
 *
 * The form has been split into the following modules for better maintainability:
 * - SeminarRegistration/types.ts       - Type definitions
 * - SeminarRegistration/schema.ts      - Zod validation schema
 * - SeminarRegistration/constants.ts   - Constants and messages
 * - SeminarRegistration/utils.ts       - Utility functions
 * - SeminarRegistration/hooks/         - Custom hooks
 * - SeminarRegistration/components/    - Section components
 */

import SeminarRegistrationForm from "./SeminarRegistration/index";
export default SeminarRegistrationForm;
