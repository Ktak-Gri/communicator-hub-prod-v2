
import { Persona, Scenario, TranscriptItem } from './types.ts';
import { AGES, PERSONALITIES, KNOWLEDGE_LEVELS, GENDERS } from './constants.ts';

export const domainTraining = {
  generateRandomPersona: (): Persona => ({
    ageGroup: AGES[Math.floor(Math.random() * AGES.length)],
    personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
    knowledgeLevel: KNOWLEDGE_LEVELS[Math.floor(Math.random() * KNOWLEDGE_LEVELS.length)],
    gender: GENDERS[Math.floor(Math.random() * GENDERS.length)]
  }),

  buildSystemInstruction: (scenario: Scenario, persona: Persona) => `
    あなたは携帯電話会社のコールセンターに入電した顧客です。
    属性: ${persona.ageGroup}, ${persona.personality}, 知識:${persona.knowledgeLevel}, 性別:${persona.gender}
    状況: スマホ:${scenario.smartphonePlan}, 光:${scenario.lightPlan}
    用件: ${scenario.initialInquiry}
    ## 指示
    - 自然な日本語の話し言葉で応対し、相手が名乗った直後に用件を切り出してください。
    - 情報は一度に全て出さず、聞かれるまで小出しにしてください。
  `,

  buildAnalysisPrompt: (scenario: Scenario, transcript: TranscriptItem[]) => `
    以下のロールプレイング対話を分析し、フィードバックをJSON形式で提供してください。
    対話ログ: ${transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}
    評価項目: 傾聴力, 共感力, 正確性, 解決力, 要約力, 敬語 (各5点満点)
  `
};
