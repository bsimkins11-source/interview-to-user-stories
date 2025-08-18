import { z } from 'zod';

// Base validation schemas
export const BaseSchemas = {
  id: z.string().min(1, 'ID is required').max(100, 'ID too long'),
  name: z.string().min(1, 'Name is required').max(200, 'Name too long').trim(),
  description: z.string().max(1000, 'Description too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  url: z.string().url('Invalid URL format').optional(),
  timestamp: z.string().datetime('Invalid timestamp format').optional(),
};

// Construct validation schema
export const ConstructSchema = z.object({
  name: BaseSchemas.name,
  description: BaseSchemas.description,
  output_schema: z.array(z.string().min(1, 'Schema field cannot be empty'))
    .min(1, 'At least one output schema field is required')
    .max(50, 'Too many schema fields'),
  pattern: z.string().min(1, 'Pattern is required').max(500, 'Pattern too long'),
  defaults: z.record(z.string(), z.string()).optional(),
  priority_rules: z.array(z.string()).optional(),
});

// Transcript validation schema
export const TranscriptSchema = z.object({
  id: BaseSchemas.id,
  type: z.enum(['file', 'folder', 'document'], { 
    errorMap: () => ({ message: 'Type must be file, folder, or document' })
  }),
  name: BaseSchemas.name,
  source: z.string().min(1, 'Source is required').max(500, 'Source too long'),
  status: z.enum(['pending', 'uploading', 'completed', 'error'], {
    errorMap: () => ({ message: 'Invalid status' })
  }),
  size: z.number().positive('Size must be positive').optional(),
  file_count: z.number().int().positive('File count must be positive integer').optional(),
  file: z.instanceof(File).optional(),
});

// Job validation schema
export const JobSchema = z.object({
  name: BaseSchemas.name.optional(),
  description: BaseSchemas.description,
  construct: ConstructSchema,
  transcripts: z.array(TranscriptSchema)
    .min(1, 'At least one transcript is required')
    .max(100, 'Too many transcripts'),
});

// User Story validation schema
export const UserStorySchema = z.object({
  user_story_id: BaseSchemas.id,
  user_story: z.string().min(10, 'User story too short').max(1000, 'User story too long'),
  team: z.string().max(100, 'Team name too long').optional(),
  category: z.enum(['Workflow', 'DAM', 'Integration', 'Security', 'Other'], {
    errorMap: () => ({ message: 'Invalid category' })
  }).optional(),
  lifecycle_phase: z.string().max(100, 'Lifecycle phase too long').optional(),
  capability: z.string().max(200, 'Capability too long').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Priority must be LOW, MEDIUM, or HIGH' })
  }).optional(),
  source: z.string().max(200, 'Source too long').optional(),
  snippet: z.string().max(500, 'Snippet too long').optional(),
  match_score: z.number().min(0).max(1).optional(),
  tags: z.array(z.string().max(50, 'Tag too long')).max(20, 'Too many tags').optional(),
});

// Requirement validation schema
export const RequirementSchema = z.object({
  req_id: BaseSchemas.id,
  requirement: z.string().min(10, 'Requirement too short').max(500, 'Requirement too long'),
  priority_level: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Priority level must be LOW, MEDIUM, or HIGH' })
  }),
  req_details: z.string().min(10, 'Requirement details too short').max(2000, 'Requirement details too long'),
  source_story_id: BaseSchemas.id.optional(),
});

// File validation schemas
export const FileValidation: {
  maxSize: {
    zip: number;
    document: number;
    text: number;
  };
  allowedTypes: {
    zip: string[];
    document: string[];
    text: string[];
  };
  validateFileSize: (file: File, type: 'zip' | 'document' | 'text') => boolean;
  validateFileType: (file: File, type: 'zip' | 'document' | 'text') => boolean;
  validateFile: (file: File, type: 'zip' | 'document' | 'text') => {
    isValid: boolean;
    errors: string[];
  };
} = {
  // File size limits (in bytes)
  maxSize: {
    zip: 100 * 1024 * 1024, // 100MB
    document: 50 * 1024 * 1024, // 50MB
    text: 10 * 1024 * 1024, // 10MB
  },
  
  // Allowed file types
  allowedTypes: {
    zip: ['.zip'],
    document: ['.docx', '.pdf'],
    text: ['.txt', '.md'],
  },
  
  // Validate file size
  validateFileSize: (file: File, type: keyof typeof FileValidation.maxSize): boolean => {
    return file.size <= FileValidation.maxSize[type];
  },
  
  // Validate file type
  validateFileType: (file: File, type: keyof typeof FileValidation.allowedTypes): boolean => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return FileValidation.allowedTypes[type].includes(extension);
  },
  
  // Comprehensive file validation
  validateFile: (file: File, type: keyof typeof FileValidation.maxSize): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];
    
    if (!FileValidation.validateFileSize(file, type)) {
      errors.push(`File size exceeds ${FileValidation.maxSize[type] / (1024 * 1024)}MB limit`);
    }
    
    if (!FileValidation.validateFileType(file, type)) {
      errors.push(`File type not allowed. Allowed types: ${FileValidation.allowedTypes[type].join(', ')}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// Input sanitization functions
export const Sanitization = {
  // Remove HTML tags and dangerous content
  sanitizeHtml: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  },
  
  // Sanitize file names
  sanitizeFileName: (fileName: string): string => {
    return fileName
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 255);
  },
  
  // Sanitize user input
  sanitizeUserInput: (input: string): string => {
    return input
      .replace(/[<>]/g, '')
      .trim()
      .substring(0, 1000);
  },
  
  // Validate and sanitize email
  sanitizeEmail: (email: string): string | null => {
    const sanitized = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized) ? sanitized : null;
  },
  
  // Validate and sanitize URL
  sanitizeUrl: (url: string): string | null => {
    try {
      const sanitized = url.trim();
      new URL(sanitized);
      return sanitized;
    } catch {
      return null;
    }
  }
};

// Validation helper functions
export const ValidationHelpers = {
  // Validate construct with detailed error messages
  validateConstruct: (data: any): { isValid: boolean; errors: string[]; data?: any } => {
    try {
      const validated = ConstructSchema.parse(data);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  },
  
  // Validate transcripts with detailed error messages
  validateTranscripts: (data: any[]): { isValid: boolean; errors: string[]; data?: any[] } => {
    try {
      const validated = z.array(TranscriptSchema).parse(data);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  },
  
  // Validate job with detailed error messages
  validateJob: (data: any): { isValid: boolean; errors: string[]; data?: any } => {
    try {
      const validated = JobSchema.parse(data);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  },
  
  // Validate user stories with detailed error messages
  validateUserStories: (data: any[]): { isValid: boolean; errors: string[]; data?: any[] } => {
    try {
      const validated = z.array(UserStorySchema).parse(data);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  },
  
  // Validate requirements with detailed error messages
  validateRequirements: (data: any[]): { isValid: boolean; errors: string[]; data?: any[] } => {
    try {
      const validated = z.array(RequirementSchema).parse(data);
      return { isValid: true, data: validated, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
        return { isValid: false, errors };
      }
      return { isValid: false, errors: ['Unknown validation error'] };
    }
  }
};

// Export types
export type Construct = z.infer<typeof ConstructSchema>;
export type Transcript = z.infer<typeof TranscriptSchema>;
export type Job = z.infer<typeof JobSchema>;
export type UserStory = z.infer<typeof UserStorySchema>;
export type Requirement = z.infer<typeof RequirementSchema>;
