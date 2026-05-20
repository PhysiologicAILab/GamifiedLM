import { generateObject, streamObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { exerciseSetSchema } from './schema';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;


export async function POST(request: NextRequest) {
  try {
    const { materialName, sectionId, currentSection } = await request.json();

    if (!materialName || !sectionId || !currentSection) {
      return NextResponse.json({ 
        error: 'Material name, section ID, and current section data are required' 
      }, { status: 400 });
    }

    // Read the organized content to get the specific blocks for this section
    const organizedContentPath = path.join(process.cwd(), 'data', 'learning-materials', materialName, 'organized-content.json');
    
    let organizedContent: any;
    
    try {
      const organizedContentData = await fs.readFile(organizedContentPath, 'utf-8');
      organizedContent = JSON.parse(organizedContentData);
    } catch (error) {
      return NextResponse.json({ 
        error: `Organized learning material "${materialName}" not found. Please ensure the content has been processed first.` 
      }, { status: 404 });
    }

    // Filter blocks that belong to the current section
    const sectionBlocks = organizedContent.blocks.filter((block: any) => 
      currentSection.blockIds.includes(block.id)
    );

    if (sectionBlocks.length === 0) {
      return NextResponse.json({ 
        error: `No content blocks found for section "${sectionId}"` 
      }, { status: 404 });
    }

    // Generate the exercise set using AI SDK streaming
    const result = streamObject({
      model: openai('o3-mini'),
      schema: exerciseSetSchema,
      prompt: `
        Create a comprehensive set of learning exercises that systematically assess understanding of ALL key conceptual content in this learning section. Focus EXCLUSIVELY on meaningful educational concepts while avoiding superficial details like names, dates, or trivial facts.

        Section Information:
        - Title: ${currentSection.title}
        - Description: ${currentSection.description}

        Content Blocks for this Section:
        ${JSON.stringify(sectionBlocks, null, 2)}

        CORE CONTENT ANALYSIS REQUIREMENTS:
        1. IDENTIFY KEY LEARNING CONCEPTS: Before creating questions, systematically identify the 4-6 most important conceptual learning objectives from the content:
           - Core theoretical frameworks, models, or methodologies described
           - Essential processes, procedures, or systematic approaches explained
           - Critical distinctions, comparisons, or relationships between concepts
           - Fundamental principles, rules, or guidelines that learners must understand
           - Important applications, implications, or practical considerations discussed
           
        2. COMPREHENSIVE CONCEPTUAL COVERAGE: Generate 4-5 questions that systematically test EACH major learning concept identified:
           - Ensure every significant conceptual area is addressed
           - Prioritize depth of understanding over breadth of topics
           - Test both explicit knowledge and conceptual connections
           - Cover different cognitive levels: recognition, comprehension, application, analysis

        3. AVOID SUPERFICIAL/TRIVIAL CONTENT:
           - EXCLUDE questions about: people's names (unless central to the concept), specific dates, publication years, page numbers
           - EXCLUDE questions about: minor examples used for illustration, incidental details, peripheral information
           - EXCLUDE questions about: formatting, structure, or organizational elements unless they're key to understanding
           - FOCUS ON: core concepts, methodological approaches, theoretical principles, procedural steps, critical distinctions

        4. SYSTEMATIC CONTENT DEPENDENCY VERIFICATION:
           For each question, verify:
           - [IMPORTANT!] Answer is directly stated in the provided content, or clearly derivable through logical analysis of provided content
           - Question assesses genuine comprehension of meaningful educational content
           - Helps learners demonstrate mastery of essential learning objectives

        5. DIVERSE MULTIPLE CHOICE QUESTION DESIGN:
           All questions should be multiple choice format but with diverse styles and approaches that test common misconceptions:
           - Traditional Multiple Choice: Direct concept questions with 4 options with only 1 correct answer and 3 wrong answers
           - True/False Style: Present a statement and offer "True" and "False" as the ONLY two options with only 1 correct answer and 1 wrong answer
           - Fill-in-the-Blank Style: Present a sentence with a missing term or concept and offer 4 possible completions with only 1 correct answer and 3 wrong answers
           - Statements Judgment: Present 4 claims in the options with only 1 correct claim and 3 wrong claims, with question text asking the learner to pick the correct claim
           - In the above four styles, you can integrate scenarios or comparisons to make the questions more interesting and challenging
           - Do not explicitly indicate the question types to the user, it is just for you to know the question type
           - AGAIN, PLEASE MAKE SURE THAT THE ANSWER IS DIRECTLY STATED IN THE PROVIDED CONTENT, OR CLEARLY DERIVABLE THROUGH LOGICAL ANALYSIS OF PROVIDED CONTENT
           
        6. ANSWER FORMAT REQUIREMENTS:
           - For each question, provide the "correctAnswerIndex" as a number (0-based index) indicating which option in the options array is correct
           - Do NOT repeat the answer text in the correctAnswerIndex field - only provide the numerical index
           - This saves AI processing costs by avoiding repetition of option text
           - Example: if the correct answer is the 3rd option in the array, set correctAnswerIndex to 2 (since it's 0-based)

        7. CONTENT COMPLETENESS VALIDATION:
           - Review all content blocks to ensure no major concept is missed
           - Verify that questions collectively assess understanding of the section's main learning objectives
           - Check that the exercise set enables comprehensive evaluation of learner comprehension
           - Ensure coverage spans all significant theoretical and practical aspects discussed

        FINAL VALIDATION: The complete exercise set should enable thorough assessment of learner understanding of ALL key concepts in this section. A student who answers all questions correctly should demonstrate comprehensive mastery of the essential learning objectives, not just surface-level familiarity with random facts.
      `,
      onFinish: async ({ object, error }) => {
        if (object && !error) {
          try {
            // Save the completed exercise set directly
            const subTaskDir = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId);
            await fs.mkdir(subTaskDir, { recursive: true });
            
            const exercisePath = path.join(subTaskDir, 'exercises.json');
            await fs.writeFile(exercisePath, JSON.stringify(object, null, 2));
            
            console.log(`Exercise set saved successfully to ${exercisePath}`);

            // Note: Background image generation is handled separately and in parallel
          } catch (saveError) {
            console.error('Error saving exercise set:', saveError);
          }
        }
      }
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Error generating exercise set:', error);
    return NextResponse.json({ 
      error: 'Failed to generate exercise set',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to retrieve existing exercise set
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const materialName = searchParams.get('materialName');
    const sectionId = searchParams.get('sectionId');

    if (!materialName || !sectionId) {
      return NextResponse.json({ 
        error: 'Material name and section ID are required' 
      }, { status: 400 });
    }

    // Updated path to use new subtask structure: data/learning-materials/[learning-material-id]/[subtask-id]/exercises.json
    const exercisePath = path.join(process.cwd(), 'data', 'learning-materials', materialName, sectionId, 'exercises.json');
    
    try {
      const exerciseContent = await fs.readFile(exercisePath, 'utf-8');
      const exerciseSet = JSON.parse(exerciseContent);
      return NextResponse.json({ exerciseSet });
    } catch (error) {
      return NextResponse.json({ 
        error: `Exercise set not found for section "${sectionId}" in material "${materialName}"` 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error retrieving exercise set:', error);
    return NextResponse.json({ 
      error: 'Failed to retrieve exercise set',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
