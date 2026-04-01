import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Extract job title from professional summary or resume text
 */
export function extractJobTitle(text: string): string | null {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const normalizedText = text.toLowerCase();

  // Common job title patterns
  const jobTitlePatterns = [
    // Direct patterns like "Software Engineer", "Data Scientist", etc.
    /(?:^|\s)((?:senior|junior|lead|principal|staff|associate)\s+)?(?:software|web|mobile|frontend|backend|full[\s-]?stack|data|machine\s+learning|ai|devops|cloud|security|qa|quality\s+assurance|product|project|technical|systems?)\s+(?:engineer|developer|architect|scientist|analyst|manager|lead|specialist|consultant|administrator|coordinator)/gi,

    // Role-based patterns
    /(?:^|\s)((?:senior|junior|lead|principal|staff|associate)\s+)?(?:marketing|sales|business|financial|operations|human\s+resources|hr|customer\s+success|account|content|digital|social\s+media)\s+(?:manager|director|analyst|specialist|coordinator|executive|representative|associate)/gi,

    // Executive patterns
    /(?:^|\s)(chief\s+(?:executive|technology|financial|marketing|operations|data|security)\s+officer|ceo|cto|cfo|cmo|coo|cdo|ciso)/gi,

    // Professional titles
    /(?:^|\s)((?:senior|junior|lead|principal|staff|associate)\s+)?(?:consultant|advisor|designer|researcher|writer|editor|photographer|videographer|teacher|instructor|professor|doctor|nurse|lawyer|attorney|accountant)/gi,

    // Industry-specific titles
    /(?:^|\s)((?:senior|junior|lead|principal|staff|associate)\s+)?(?:ux|ui|graphic|web|product)\s+designer/gi,
    /(?:^|\s)((?:senior|junior|lead|principal|staff|associate)\s+)?(?:scrum\s+master|product\s+owner|business\s+analyst|data\s+analyst|research\s+scientist)/gi
  ];

  // Try to find job title using patterns
  for (const pattern of jobTitlePatterns) {
    const matches = normalizedText.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first match, cleaned up
      const jobTitle = matches[0].trim();
      return jobTitle.charAt(0).toUpperCase() + jobTitle.slice(1);
    }
  }

  // Fallback: look for common job title keywords in the first few sentences
  const firstParagraph = text.split('\n')[0] || text.substring(0, 200);
  const commonTitles = [
    'engineer', 'developer', 'manager', 'analyst', 'specialist', 'consultant',
    'director', 'coordinator', 'administrator', 'architect', 'designer',
    'scientist', 'researcher', 'executive', 'officer', 'lead', 'senior'
  ];

  for (const title of commonTitles) {
    if (firstParagraph.toLowerCase().includes(title)) {
      // Extract surrounding context
      const words = firstParagraph.split(/\s+/);
      const titleIndex = words.findIndex(word => word.toLowerCase().includes(title));
      if (titleIndex !== -1) {
        // Get 1-2 words before and the title word
        const start = Math.max(0, titleIndex - 2);
        const end = Math.min(words.length, titleIndex + 1);
        const extractedTitle = words.slice(start, end).join(' ');
        return extractedTitle.charAt(0).toUpperCase() + extractedTitle.slice(1);
      }
    }
  }

  return null;
}

/**
 * Duplicate detection result interface
 */
export interface DuplicateDetectionResult {
  isDuplicate: boolean;
  isPartialMatch: boolean;
  shouldUpdate: boolean;
  existingRecord?: any;
  existingAnalysis?: any; // Added: existing analysis data if available
  action: 'create' | 'duplicate' | 'update' | 'use_existing'; // Added 'use_existing'
  message: string;
}

/**
 * Comprehensive duplicate detection with multi-tier logic
 */
export async function detectDuplicateResume(
  supabase: SupabaseClient,
  extractedData: {
    contentHash?: string;
    emailHash?: string | null;
    phoneHash?: string | null;
    compositeHash?: string;
    fullText: string;
  },
  userId: string
): Promise<DuplicateDetectionResult> {
  try {
    console.log('=== DUPLICATE DETECTION DEBUG START ===');
    console.log('Input data:', {
      userId,
      contentHash: extractedData.contentHash,
      emailHash: extractedData.emailHash,
      phoneHash: extractedData.phoneHash,
      compositeHash: extractedData.compositeHash,
      fullTextLength: extractedData.fullText?.length || 0,
      hasContentHash: !!extractedData.contentHash,
      hasEmailHash: !!extractedData.emailHash,
      hasPhoneHash: !!extractedData.phoneHash,
      hasCompositeHash: !!extractedData.compositeHash
    });

    // Validate input data
    if (!userId) {
      console.error('ERROR: userId is missing or empty');
      return {
        isDuplicate: false,
        isPartialMatch: false,
        shouldUpdate: false,
        action: 'create',
        message: 'Error: userId missing - defaulting to create new record'
      };
    }

    // Tier 1: Check for exact duplicate using composite hash
    console.log('--- TIER 1: Composite Hash Check ---');
    if (extractedData.compositeHash && extractedData.compositeHash.trim() !== '') {
      console.log('Checking for exact duplicate with composite hash:', extractedData.compositeHash);

      // Avoid .single(): if duplicates already exist, .single() throws and hides the fact that a duplicate exists.
      const { data: exactMatches, error: exactError } = await supabase
        .from('resume_uploads')
        .select('*')
        .eq('user_id', userId)
        .eq('composite_hash', extractedData.compositeHash)
        .order('created_at', { ascending: false })
        .limit(1);

      const exactDuplicate = exactMatches && exactMatches.length > 0 ? exactMatches[0] : null;

      console.log('Tier 1 query result:', {
        found: !!exactDuplicate,
        error: exactError?.message,
        recordId: exactDuplicate?.id
      });

      if (exactError) {
        console.error('Error checking for exact duplicates:', exactError);
      }

      if (exactDuplicate) {
        console.log('EXACT DUPLICATE FOUND:', {
          existingId: exactDuplicate.id,
          existingFileName: exactDuplicate.file_name,
          existingCreatedAt: exactDuplicate.created_at
        });

        // Check if analysis exists for this duplicate
        const { data: existingAnalysis, error: analysisError } = await supabase
          .from('resume_analyses')
          .select('*')
          .eq('upload_id', exactDuplicate.id)
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (analysisError) {
          console.log('No completed analysis found for duplicate:', exactDuplicate.id);
        }

        if (existingAnalysis) {
          console.log('EXISTING ANALYSIS FOUND:', {
            analysisId: existingAnalysis.id,
            overallScore: existingAnalysis.overall_score,
            status: existingAnalysis.status
          });
          console.log('=== DUPLICATE DETECTION DEBUG END ===');
          return {
            isDuplicate: true,
            isPartialMatch: false,
            shouldUpdate: false,
            existingRecord: exactDuplicate,
            existingAnalysis: existingAnalysis,
            action: 'use_existing',
            message: 'Exact duplicate found with existing analysis - redirecting to results'
          };
        }

        console.log('=== DUPLICATE DETECTION DEBUG END ===');
        return {
          isDuplicate: true,
          isPartialMatch: false,
          shouldUpdate: false,
          existingRecord: exactDuplicate,
          action: 'duplicate',
          message: 'Exact duplicate found - same content, email, and phone'
        };
      }
    } else {
      console.log('Skipping Tier 1: No composite hash available');
    }

    // Tier 2: Check for partial match (same email and phone, different content)
    console.log('--- TIER 2: Partial Match Check ---');
    if (extractedData.emailHash && extractedData.phoneHash &&
      extractedData.emailHash.trim() !== '' && extractedData.phoneHash.trim() !== '') {

      console.log('Checking for partial match with:', {
        emailHash: extractedData.emailHash,
        phoneHash: extractedData.phoneHash,
        contentHash: extractedData.contentHash
      });

      const { data: partialMatches, error: partialError } = await supabase
        .from('resume_uploads')
        .select('*')
        .eq('user_id', userId)
        .eq('email_hash', extractedData.emailHash)
        .eq('phone_hash', extractedData.phoneHash)
        .neq('content_hash', extractedData.contentHash || '')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('Tier 2 query result:', {
        found: !!(partialMatches && partialMatches.length > 0),
        count: partialMatches?.length || 0,
        error: partialError?.message,
        errorCode: partialError?.code,
        recordIds: partialMatches?.map(r => r.id) || []
      });

      if (partialError) {
        console.error('Error checking for partial matches:', partialError);
      }

      if (partialMatches && partialMatches.length > 0) {
        const existingRecord = partialMatches[0];

        console.log('PARTIAL MATCH FOUND:', {
          existingId: existingRecord.id,
          existingFileName: existingRecord.file_name,
          existingContentHash: existingRecord.content_hash,
          newContentHash: extractedData.contentHash,
          existingEmailHash: existingRecord.email_hash,
          existingPhoneHash: existingRecord.phone_hash
        });

        // Extract job titles from both resumes
        const newJobTitle = extractJobTitle(extractedData.fullText);
        const existingJobTitle = extractJobTitle(existingRecord.extracted_text || '');

        console.log('Job title comparison:', {
          newJobTitle,
          existingJobTitle,
          areEqual: newJobTitle === existingJobTitle,
          bothTitlesExist: !!(newJobTitle && existingJobTitle)
        });

        // If job titles are different, suggest update
        if (newJobTitle && existingJobTitle && newJobTitle !== existingJobTitle) {
          console.log('SUGGESTING UPDATE: Different job titles detected');
          console.log('=== DUPLICATE DETECTION DEBUG END ===');
          return {
            isDuplicate: false,
            isPartialMatch: true,
            shouldUpdate: true,
            existingRecord,
            action: 'update',
            message: `Partial match found - same contact info but different job title (${existingJobTitle} → ${newJobTitle})`
          };
        } else {
          // Same job title or couldn't extract titles, treat as duplicate
          console.log('TREATING AS DUPLICATE: Same or missing job titles');
          console.log('=== DUPLICATE DETECTION DEBUG END ===');
          return {
            isDuplicate: true,
            isPartialMatch: true,
            shouldUpdate: false,
            existingRecord,
            action: 'duplicate',
            message: 'Partial match found - same contact info and similar job title'
          };
        }
      }
    } else {
      console.log('Skipping Tier 2: Missing email or phone hash', {
        hasEmailHash: !!extractedData.emailHash,
        hasPhoneHash: !!extractedData.phoneHash,
        emailHashEmpty: extractedData.emailHash === '' || extractedData.emailHash === null,
        phoneHashEmpty: extractedData.phoneHash === '' || extractedData.phoneHash === null
      });
    }

    // Tier 3: Check for individual hash matches (for logging purposes)
    console.log('--- TIER 3: Individual Hash Checks ---');
    const individualChecks = [];

    if (extractedData.contentHash && extractedData.contentHash.trim() !== '') {
      console.log('Checking for content hash matches:', extractedData.contentHash);
      const { data: contentMatch } = await supabase
        .from('resume_uploads')
        .select('id, file_name')
        .eq('user_id', userId)
        .eq('content_hash', extractedData.contentHash)
        .limit(1);

      console.log('Content hash query result:', {
        found: !!(contentMatch && contentMatch.length > 0),
        count: contentMatch?.length || 0,
        recordIds: contentMatch?.map(r => r.id) || []
      });

      if (contentMatch && contentMatch.length > 0) {
        individualChecks.push('content');
      }
    }

    if (extractedData.emailHash && extractedData.emailHash.trim() !== '') {
      console.log('Checking for email hash matches:', extractedData.emailHash);
      const { data: emailMatch } = await supabase
        .from('resume_uploads')
        .select('id, file_name')
        .eq('user_id', userId)
        .eq('email_hash', extractedData.emailHash)
        .limit(1);

      console.log('Email hash query result:', {
        found: !!(emailMatch && emailMatch.length > 0),
        count: emailMatch?.length || 0,
        recordIds: emailMatch?.map(r => r.id) || []
      });

      if (emailMatch && emailMatch.length > 0) {
        individualChecks.push('email');
      }
    }

    if (extractedData.phoneHash && extractedData.phoneHash.trim() !== '') {
      console.log('Checking for phone hash matches:', extractedData.phoneHash);
      const { data: phoneMatch } = await supabase
        .from('resume_uploads')
        .select('id, file_name')
        .eq('user_id', userId)
        .eq('phone_hash', extractedData.phoneHash)
        .limit(1);

      console.log('Phone hash query result:', {
        found: !!(phoneMatch && phoneMatch.length > 0),
        count: phoneMatch?.length || 0,
        recordIds: phoneMatch?.map(r => r.id) || []
      });

      if (phoneMatch && phoneMatch.length > 0) {
        individualChecks.push('phone');
      }
    }

    console.log('Individual hash matches summary:', {
      matches: individualChecks,
      totalMatches: individualChecks.length
    });

    // No significant duplicates found, create new record
    console.log('FINAL DECISION: Creating new record - no significant duplicates found');
    console.log('=== DUPLICATE DETECTION DEBUG END ===');
    return {
      isDuplicate: false,
      isPartialMatch: false,
      shouldUpdate: false,
      action: 'create',
      message: 'No duplicates found - creating new record'
    };

  } catch (error) {
    console.error('CRITICAL ERROR in duplicate detection:', error);
    console.log('=== DUPLICATE DETECTION DEBUG END (ERROR) ===');
    // On error, default to creating new record
    return {
      isDuplicate: false,
      isPartialMatch: false,
      shouldUpdate: false,
      action: 'create',
      message: 'Error during duplicate detection - defaulting to create new record'
    };
  }
}

/**
 * Update existing resume record with new content
 */
export async function updateExistingResume(
  supabase: SupabaseClient,
  existingRecordId: string,
  updateData: {
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
    resume_url: string;
    pdf_url?: string;
    content_hash: string | null;
    composite_hash: string | null;
    extracted_text: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error: updateError } = await supabase
      .from('resume_uploads')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingRecordId);

    if (updateError) {
      console.error('Error updating existing resume:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('Successfully updated existing resume record:', existingRecordId);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error updating resume:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown update error'
    };
  }
}