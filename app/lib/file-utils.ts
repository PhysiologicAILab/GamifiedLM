import fs from 'fs';

/**
 * Check if a file is newer than a source file based on modification time
 * @param filePath - Path to the file to check
 * @param sourceFilePath - Path to the source file to compare against
 * @returns true if the file exists and is newer than the source file
 */
export function isFileNewer(filePath: string, sourceFilePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }
    
    const fileStats = fs.statSync(filePath);
    const sourceStats = fs.statSync(sourceFilePath);
    
    // File is valid if it's newer than the source file
    return fileStats.mtime >= sourceStats.mtime;
  } catch (error) {
    console.error('Error checking file validity:', error);
    return false;
  }
}

/**
 * Ensure a directory exists, creating it if necessary
 * @param dirPath - Path to the directory
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}
