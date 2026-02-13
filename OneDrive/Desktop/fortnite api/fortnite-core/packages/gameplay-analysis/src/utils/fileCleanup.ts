/**
 * File cleanup utilities
 */

import * as fs from 'fs-extra';

export function deleteFileSafe(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.warn('Failed to delete file', filePath, e);
  }
}

