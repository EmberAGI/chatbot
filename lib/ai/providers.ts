import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { groq } from '@ai-sdk/groq';
import { xai } from '@ai-sdk/xai';
import {
  createOpenRouter,
  type OpenRouterProvider,
} from '@openrouter/ai-sdk-provider';
import { isTestEnvironment } from '../constants';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';

export const grokProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : customProvider({
      languageModels: {
        'chat-model': xai('grok-2-1212'),
        'chat-model-reasoning': wrapLanguageModel({
          model: groq('deepseek-r1-distill-llama-70b'),
          middleware: extractReasoningMiddleware({ tagName: 'think' }),
        }),
        'title-model': xai('grok-2-1212'),
        'artifact-model': xai('grok-2-1212'),
      },
      imageModels: {
        'small-model': xai.image('grok-2-image'),
      },
    });

export const openRouterProvider = isTestEnvironment
  ? customProvider({
      languageModels: {
        'chat-model': chatModel,
        'chat-model-reasoning': reasoningModel,
        'title-model': titleModel,
        'artifact-model': artifactModel,
      },
    })
  : (() => {
      console.log('== Creating OpenRouter provider ==');
      console.log('== OPENROUTER_API_KEY ==', process.env.OPENROUTER_API_KEY);
      // Use an immediately invoked function expression (IIFE) to ensure that
      // createOpenRouter is called only once when the module is loaded in a
      // non-test environment, preventing re-initialization on every import/use.
      // Initialize OpenRouter provider only for non-test environments
      let openRouter: OpenRouterProvider;
      try {
        openRouter = createOpenRouter({
          apiKey: process.env.OPENROUTER_API_KEY,
        });
        console.log('== OpenRouter provider created ==');
      } catch (error) {
        console.error('Error creating OpenRouter provider:', error);
        return grokProvider;
      }

      return customProvider({
        languageModels: {
          'chat-model': openRouter('google/gemini-2.5-pro-preview-03-25', {
            reasoning: {
              effort: 'low',
            },
          }),
          'chat-model-reasoning': openRouter(
            'google/gemini-2.5-pro-preview-03-25',
            {
              reasoning: {
                effort: 'medium',
              },
            },
          ),
          'title-model': openRouter('google/gemini-2.5-flash-preview'),
          'artifact-model': openRouter('google/gemini-2.5-flash-preview'),
        },
        imageModels: {
          'small-model': xai.image('grok-2-image'),
        },
        // No fallbackProvider needed when defining all models explicitly
      });
    })();
