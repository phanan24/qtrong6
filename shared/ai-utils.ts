import type { AISettings } from './schema';

export function getActiveAIModel(aiSettings: AISettings | undefined): 'deepseek' | 'gpt' | 'gemma' | 'gptOss' | null {
  if (!aiSettings) return null;
  
  if (aiSettings.deepseekEnabled) return 'deepseek';
  if (aiSettings.gptEnabled) return 'gpt';
  if (aiSettings.gemmaEnabled) return 'gemma';
  if (aiSettings.gptOssEnabled) return 'gptOss';
  
  return null;
}

export function isPaidAIModel(activeModel: string | null): boolean {
  return activeModel === 'gpt'; // Only GPT-5 is paid
}

export function getAIModelCapabilities(activeModel: string | null) {
  const isPaid = isPaidAIModel(activeModel);
  
  return {
    canUploadImages: isPaid,
    hasAdvancedSubjects: isPaid,
    modelName: getModelName(activeModel),
    modelId: getModelId(activeModel)
  };
}

function getModelName(activeModel: string | null): string {
  switch (activeModel) {
    case 'deepseek': return 'DeepSeek R1';
    case 'gpt': return 'GPT-5';
    case 'gemma': return 'Google Gemma 3B';
    case 'gptOss': return 'GPT OSS 20B';
    default: return 'Không xác định';
  }
}

function getModelId(activeModel: string | null): string {
  switch (activeModel) {
    case 'deepseek': return 'deepseek/deepseek-r1-distill-qwen-14b:free';
    case 'gpt': return 'openai/gpt-5-chat';
    case 'gemma': return 'google/gemma-3n-e2b-it:free';
    case 'gptOss': return 'openai/gpt-oss-20b:free';
    default: return 'deepseek/deepseek-r1-distill-qwen-14b:free';
  }
}