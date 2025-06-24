/**
 * Lightweight re-export of the Google API client so other modules can
 * `import { google } from "@/lib/google"`.
 *
 * Only the parts you actually import will be bundled.
 */
import { google as googleApis } from "googleapis"

export const google = googleApis
