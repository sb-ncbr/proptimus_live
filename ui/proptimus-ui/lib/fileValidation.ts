/**
 * File validation utilities for PDB and CIF files
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

export interface FileValidationResult {
    isValid: boolean;
    error?: string;
}

/**
 * Validates if a file is under the size limit (10MB)
 */
export function validateFileSize(file: File): FileValidationResult {
    if (file.size > MAX_FILE_SIZE) {
        return {
            isValid: false,
            error: `File size exceeds 10MB limit. Your file is ${(file.size / (1024 * 1024)).toFixed(2)}MB.`
        };
    }
    return { isValid: true };
}

/**
 * Validates if a file is a valid PDB file by checking its content structure
 */
export async function validatePDBFile(file: File): Promise<FileValidationResult> {
    try {
        // Check file extension
        const fileName = file.name.toLowerCase();
        const validExtensions = ['.pdb', '.cif', '.txt'];
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        
        if (!hasValidExtension) {
            return {
                isValid: false,
                error: 'Invalid file type. Please upload a .pdb, .cif, or .txt file.'
            };
        }

        // Read file content
        const text = await file.text();
        
        // Check if file is empty
        if (!text.trim()) {
            return {
                isValid: false,
                error: 'File is empty.'
            };
        }

        // For PDB files, check for typical PDB format markers
        if (fileName.endsWith('.pdb') || fileName.endsWith('.txt')) {
            const pdbKeywords = [
                'HEADER', 'TITLE', 'ATOM', 'HETATM', 'CRYST1', 
                'MODEL', 'ENDMDL', 'CONECT', 'END'
            ];
            
            const lines = text.split('\n').map(line => line.trim());
            const hasValidPDBContent = lines.some(line => 
                pdbKeywords.some(keyword => line.startsWith(keyword))
            );

            if (!hasValidPDBContent) {
                return {
                    isValid: false,
                    error: 'File does not appear to be a valid PDB file. Expected keywords like ATOM, HEADER, etc.'
                };
            }

            // Check for ATOM or HETATM records (essential for structure data)
            const hasAtomRecords = lines.some(line => 
                line.startsWith('ATOM') || line.startsWith('HETATM')
            );

            if (!hasAtomRecords) {
                return {
                    isValid: false,
                    error: 'PDB file must contain ATOM or HETATM records.'
                };
            }
        }

        // For CIF files, check for typical mmCIF format markers
        if (fileName.endsWith('.cif')) {
            const cifKeywords = ['data_', 'loop_', '_atom_site', '_cell', '_symmetry'];
            const hasCIFContent = cifKeywords.some(keyword => 
                text.toLowerCase().includes(keyword.toLowerCase())
            );

            if (!hasCIFContent) {
                return {
                    isValid: false,
                    error: 'File does not appear to be a valid CIF file.'
                };
            }
        }

        return { isValid: true };

    } catch (error) {
        return {
            isValid: false,
            error: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

/**
 * Validates both file size and PDB format
 */
export async function validateFile(file: File): Promise<FileValidationResult> {
    // First check size
    const sizeValidation = validateFileSize(file);
    if (!sizeValidation.isValid) {
        return sizeValidation;
    }

    // Then check PDB format
    const formatValidation = await validatePDBFile(file);
    return formatValidation;
}
