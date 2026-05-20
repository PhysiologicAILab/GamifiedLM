import { openai } from '@ai-sdk/openai';
import { convertToModelMessages, streamText, UIMessage } from 'ai';
import fs from 'fs';
import path from 'path';
import type { GeneratedCharacter, GameState } from '@/app/components/types';
import { generateSystemPrompt } from '@/app/lib/character-config';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

interface LearningContextPayload {
  materialName?: string;
  currentSectionId?: string | null;
  gameState?: GameState;
  playerScore?: number;
  completedSectionIds?: string[];
  totalSections?: number;
  selectedBlockId?: string | null;
}

const GAME_STATE_DESCRIPTIONS: Record<GameState, string> = {
  roadmap: 'Browsing the learning roadmap, choosing which subtask to tackle next (NOT yet inside a subtask)',
  intro: 'On the introduction screen of a subtask, about to start reading',
  reading: 'Actively reading the learning material for the current subtask',
  challenge: 'Answering exercise questions for the current subtask',
  'partial-score': 'Reviewing partial exercise results before re-reading',
  reward: 'Celebrating completion of a subtask',
  completed: 'Has completed all subtasks of this material',
};

function truncate(text: string, max = 800): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}

function buildLearningContext(
  context: LearningContextPayload | undefined,
): string {
  if (!context?.materialName) return '';

  const {
    materialName,
    currentSectionId,
    gameState,
    playerScore,
    completedSectionIds,
    totalSections,
    selectedBlockId,
  } = context;

  let organizedContent: any = null;
  let roadmap: any = null;
  try {
    const organizedContentPath = path.join(
      process.cwd(),
      'data',
      'learning-materials',
      materialName,
      'organized-content.json',
    );
    if (fs.existsSync(organizedContentPath)) {
      organizedContent = JSON.parse(
        fs.readFileSync(organizedContentPath, 'utf8'),
      );
    }

    const roadmapPath = path.join(
      process.cwd(),
      'data',
      'learning-materials',
      materialName,
      'roadmap.json',
    );
    if (fs.existsSync(roadmapPath)) {
      roadmap = JSON.parse(fs.readFileSync(roadmapPath, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading learning context:', error);
    return '';
  }

  const sections: any[] = roadmap?.subtasks || roadmap?.sections || [];
  const currentSection = currentSectionId
    ? sections.find((s) => s.id === currentSectionId)
    : null;
  const focused =
    selectedBlockId && organizedContent?.blocks
      ? organizedContent.blocks.find((b: any) => b.id === selectedBlockId)
      : null;

  const completed = completedSectionIds?.length ?? 0;
  const total = totalSections ?? sections.length;

  // ---- LIVE STATE (top) ---------------------------------------------------
  // Compact, key/value style so the model can quickly anchor its answer.
  const liveState: string[] = ['<live_learner_state>'];
  liveState.push(`material: ${roadmap?.title || materialName}`);
  if (gameState) {
    liveState.push(
      `activity: ${gameState} — ${GAME_STATE_DESCRIPTIONS[gameState] ?? ''}`,
    );
  }
  if (currentSection) {
    liveState.push(
      `current_subtask: "${currentSection.title}" (id: ${currentSection.id})`,
    );
    liveState.push(`inside_subtask: true`);
  } else {
    liveState.push(`inside_subtask: false`);
  }
  if (total > 0) {
    liveState.push(`progress: ${completed}/${total} subtasks completed`);
  }
  if (typeof playerScore === 'number') {
    liveState.push(`player_score: ${playerScore}`);
  }
  liveState.push(`focused_paragraph: ${focused ? 'yes' : 'no'}`);
  liveState.push('</live_learner_state>');

  // ---- DETAIL blocks (only when relevant) ---------------------------------
  const detail: string[] = [];

  if (currentSection) {
    detail.push('');
    detail.push('<current_subtask_detail>');
    detail.push(`title: ${currentSection.title}`);
    if (currentSection.description) {
      detail.push(`description: ${currentSection.description}`);
    }
    if (currentSection.estimatedTime) {
      detail.push(`estimated_time_minutes: ${currentSection.estimatedTime}`);
    }
    const sectionBlocks: any[] =
      organizedContent?.blocks?.filter((b: any) =>
        currentSection.blockIds?.includes(b.id),
      ) || [];
    if (sectionBlocks.length > 0) {
      detail.push('content:');
      sectionBlocks.forEach((block, index) => {
        detail.push(`  ${index + 1}. ${truncate(block.content, 400)}`);
      });
    }
    detail.push('</current_subtask_detail>');
  } else if (sections.length > 0) {
    // Only list subtasks when the learner is actually on the roadmap.
    detail.push('');
    detail.push('<roadmap_overview>');
    sections.forEach((section: any, index: number) => {
      const done = completedSectionIds?.includes(section.id) ? ' (done)' : '';
      detail.push(
        `${index + 1}. ${section.title}${done} — ${section.description ?? ''}`,
      );
    });
    detail.push('</roadmap_overview>');
  }

  if (focused) {
    detail.push('');
    detail.push('<focused_paragraph>');
    detail.push(`block_id: ${focused.id}`);
    detail.push(`text: "${truncate(focused.content, 1200)}"`);
    detail.push('</focused_paragraph>');
  }

  // ---- Behavioural guidance ----------------------------------------------
  const guidance = [
    '',
    'GROUNDING RULES (must follow):',
    '- The <live_learner_state> block is the ground truth about where the learner is RIGHT NOW. Trust it over any older message in the conversation.',
    '- If the learner asks "where am I" / "what am I doing" / "我在哪 / 现在在做什么 / 我现在在看什么", answer from <live_learner_state> and <current_subtask_detail>.',
    '- If <focused_paragraph> is present, treat it as the specific text the learner is pointing at — anchor explanations and examples to it whenever the question is about content.',
    '- Never claim the learner is on the roadmap if inside_subtask is true. Never claim they have a focused paragraph if focused_paragraph is "no".',
  ];

  return `\n\n${[...liveState, ...detail, ...guidance].join('\n')}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const messages: UIMessage[] = body.messages;
  const characterId: string | undefined = body.characterId;

  // Support both the new `context` payload and the legacy flat fields
  // (`materialName`, `currentSectionId`) so existing callers keep working.
  const context: LearningContextPayload = body.context ?? {
    materialName: body.materialName,
    currentSectionId: body.currentSectionId,
  };

  let systemPrompt =
    'You are a helpful AI learning companion. You help students understand concepts, answer questions about their learning materials, and provide guidance throughout their educational journey. Be encouraging, clear, and supportive in your responses.';

  const learningContext = buildLearningContext(context);

  if (characterId) {
    try {
      const characterPath = path.join(
        process.cwd(),
        'data',
        'characters',
        characterId,
        'character.json',
      );

      if (fs.existsSync(characterPath)) {
        const characterData = fs.readFileSync(characterPath, 'utf8');
        const character = JSON.parse(characterData) as GeneratedCharacter;

        // Always recompute from the structured axis fields so any improvement
        // to the rubrics in character-config.ts applies retroactively to all
        // existing characters without requiring a migration.
        const recomputedPrompt = generateSystemPrompt({
          name: character.name,
          personality: character.personality,
          guidingStyle: character.guidingStyle,
          identity: character.identity,
          additionalTraits: character.additionalTraits,
        });

        systemPrompt = recomputedPrompt + learningContext;

        character.systemPrompt = recomputedPrompt;
        character.lastUsed = new Date().toISOString();
        fs.writeFileSync(
          characterPath,
          JSON.stringify(character, null, 2),
          'utf8',
        );
      } else {
        systemPrompt = systemPrompt + learningContext;
      }
    } catch (error) {
      console.error('Error loading character:', error);
      systemPrompt = systemPrompt + learningContext;
    }
  } else {
    systemPrompt = systemPrompt + learningContext;
  }

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
