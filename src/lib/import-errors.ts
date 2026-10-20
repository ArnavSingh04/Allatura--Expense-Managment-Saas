import { ApiError } from '@/lib/api-client';

/**
 * Human text for the import pipeline's error codes.
 *
 * The backend throws `BadRequestException('snake_case_code')`, which arrives as
 * the raw code in the response `message`. Rendering that verbatim is the
 * difference between a user who knows how to fix their file and one who does
 * not, so every code the pipeline can raise is mapped here.
 */
export const IMPORT_ERROR_MESSAGES: Record<string, string> = {
  // upload
  file_required: 'No file was attached. Choose a file and try again.',
  empty_file: "That file is empty. Check you saved it before uploading.",
  file_too_large:
    'That file is too large. Split large datasets and import them in parts.',
  unsupported_file_type:
    'Unsupported file type. Upload a .csv or .xlsx file, or a .zip pack.',

  // spreadsheet parsing
  too_many_rows:
    'That file has too many rows for a single import. Split it into smaller files and import them one after another.',
  malformed_spreadsheet:
    "We couldn't read that spreadsheet. Make sure the first row is column headings, then re-save it as .csv or .xlsx.",

  // zip packs
  malformed_zip: "We couldn't open that zip file. Re-create it and try again.",
  too_many_zip_entries:
    'That pack contains too many files. A pack should hold one file per entity type — at most five.',
  nested_zip_not_allowed:
    'That pack contains another zip inside it. Zip the spreadsheets directly, with no nested archives.',
  unknown_pack_file:
    'Each file in a pack must be named after the type it holds — suppliers, subcontractors, projects, contracts or variations — optionally with a number in front, like 01-suppliers.csv or projects.xlsx.',
  duplicate_pack_entity:
    'The pack contains two files for the same type. Include at most one file per entity type.',
  zip_too_large:
    'That pack is too large. Import each entity type separately, or reduce the number of rows.',
  empty_zip: 'That zip file contains no spreadsheets.',
  pack_requires_zip:
    'A pack import needs a .zip file. Choose a single entity type for a .csv or .xlsx.',
  zip_requires_pack:
    "Zip files are imported as a pack. We've switched the import type to Pack for you.",

  // session / mapping
  unsupported_entity_type:
    "That import type isn't available. Reload the page and pick a type from the list.",
  required_fields_unmapped:
    "Some required fields still aren't mapped to a column. Go back to Map columns and fill the highlighted rows.",

  // plan gating
  feature_required:
    "Importing this type isn't included in your current plan. Contact your account owner to enable it.",
  plan_limit_reached:
    "This import would exceed your plan's limits. Remove some records or upgrade your plan to continue.",

  // proxy
  backend_unreachable:
    "We couldn't reach the server. Check your connection and try again.",
};

/**
 * Turn anything thrown by the import service into something worth showing.
 *
 * Falls back to the raw message rather than a blank alert: an unmapped code is
 * still more useful on screen than nothing.
 */
/**
 * Filenames the server named in a structured error, e.g. the entries in a
 * pack it could not classify. Naming them turns "something is wrong" into
 * "rename these two files".
 */
function offendingFiles(error: ApiError): string[] {
  const body = error.body as { files?: unknown } | undefined;
  if (!body || !Array.isArray(body.files)) return [];
  return body.files.filter((f): f is string => typeof f === 'string');
}

export function importErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const mapped = IMPORT_ERROR_MESSAGES[error.message.trim()];
    if (mapped) {
      const files = offendingFiles(error);
      return files.length ? `${mapped} Found: ${files.join(', ')}.` : mapped;
    }

    switch (error.status) {
      case 401:
        return 'Your session has expired. Sign in again to continue.';
      case 403:
        return "Your role can't run imports. Ask an owner or project manager.";
      case 404:
        return 'That import session no longer exists. Start a new import.';
      case 413:
        return IMPORT_ERROR_MESSAGES.file_too_large;
      default:
        break;
    }
    if (error.status >= 500) {
      return 'Something went wrong on our side. Try again in a moment.';
    }
    return error.message || 'That import could not be completed.';
  }

  if (error instanceof Error && error.message) {
    return IMPORT_ERROR_MESSAGES[error.message.trim()] ?? error.message;
  }
  return 'That import could not be completed.';
}
