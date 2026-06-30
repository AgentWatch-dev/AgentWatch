// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Generated from llm_pricing_database.csv

export interface ModelPricing {
  prompt: number; // USD per 1M prompt tokens
  completion: number; // USD per 1M completion tokens
  prompt_cache_write: number;
  prompt_cache_read: number;
}

export interface FuzzyModelPricing extends ModelPricing {
  operator: "includes" | "startsWith";
  model: string;
}

export const EXACT_MATCH_PRICING: Record<string, ModelPricing> = {
  "claude-2": {
    "prompt": 8,
    "completion": 24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "claude-2.0": {
    "prompt": 11.02,
    "completion": 32.68,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "claude-3-5-haiku-20241022": {
    "prompt": 0.8,
    "completion": 4,
    "prompt_cache_write": 1,
    "prompt_cache_read": 0.08
  },
  "claude-3-5-sonnet-20240620": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  "claude-3-5-sonnet-20241022": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  "claude-3-7-sonnet-20250219": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  "claude-3-haiku-20240307": {
    "prompt": 0.25,
    "completion": 1.25,
    "prompt_cache_write": 0.3125,
    "prompt_cache_read": 0.025
  },
  "claude-3-opus-20240229": {
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 18.75,
    "prompt_cache_read": 1.5
  },
  "claude-3-sonnet-20240229": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "claude-haiku-4-5-20251001": {
    "prompt": 1,
    "completion": 5,
    "prompt_cache_write": 1.25,
    "prompt_cache_read": 0.1
  },
  "claude-instant-1": {
    "prompt": 1.63,
    "completion": 55.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "claude-instant-1.2": {
    "prompt": 1.63,
    "completion": 5.51,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "claude-opus-4-1-20250805": {
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 18.75,
    "prompt_cache_read": 1.5
  },
  "claude-opus-4-20250514": {
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 18.75,
    "prompt_cache_read": 1.5
  },
  "claude-sonnet-4-20250514": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  "claude-sonnet-4-5-20250929": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  "claude-sonnet-4-6": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  "claude-sonnet-4-6-20260217": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  "claude-v1": {
    "prompt": 8,
    "completion": 24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Meta-Llama-3.1-405B-Instruct": {
    "prompt": 1.5,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Meta-Llama-3.1-70B-Instruct": {
    "prompt": 0.45,
    "completion": 0.45,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Meta-Llama-3.1-8B-Instruct": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Meta-Llama-3.3-70B-Instruct": {
    "prompt": 0.45,
    "completion": 0.45,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "amazon.nova-lite-v1%3A0": {
    "prompt": 0.06,
    "completion": 0.24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.015
  },
  "amazon.nova-micro-v1%3A0": {
    "prompt": 0.035,
    "completion": 0.14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.00875
  },
  "amazon.nova-premier-v1%3A0": {
    "prompt": 2.5,
    "completion": 12.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.625
  },
  "amazon.nova-pro-v1%3A0": {
    "prompt": 0.8,
    "completion": 3.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.2
  },
  "eu.amazon.nova-lite-v1%3A0": {
    "prompt": 0.06,
    "completion": 0.24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.015
  },
  "eu.amazon.nova-micro-v1%3A0": {
    "prompt": 0.035,
    "completion": 0.14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.00875
  },
  "eu.amazon.nova-premier-v1%3A0": {
    "prompt": 2.5,
    "completion": 12.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.625
  },
  "eu.amazon.nova-pro-v1%3A0": {
    "prompt": 0.8,
    "completion": 3.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.2
  },
  "meta.llama3-8b-instruct-v1%3A0": {
    "prompt": 0.00022,
    "completion": 0.00072,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "us.amazon.nova-lite-v1%3A0": {
    "prompt": 0.06,
    "completion": 0.24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.015
  },
  "us.amazon.nova-micro-v1%3A0": {
    "prompt": 0.035,
    "completion": 0.14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.00875
  },
  "us.amazon.nova-premier-v1%3A0": {
    "prompt": 2.5,
    "completion": 12.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.625
  },
  "us.amazon.nova-pro-v1%3A0": {
    "prompt": 0.8,
    "completion": 3.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.2
  },
  "ada": {
    "prompt": 0.4,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "ada-batch": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "babbage": {
    "prompt": 0.5,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "babbage-batch": {
    "prompt": 0.25,
    "completion": 0.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "chatgpt-4o-latest": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "chatgpt-4o-latest-batch": {
    "prompt": 2.5,
    "completion": 7.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "codex-mini-latest": {
    "prompt": 1.5,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.375
  },
  "codex-mini-latest-batch": {
    "prompt": 0.75,
    "completion": 3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "curie": {
    "prompt": 2,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "curie-batch": {
    "prompt": 1,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "davinci": {
    "prompt": 20,
    "completion": 20,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "davinci-batch": {
    "prompt": 10,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-0125": {
    "prompt": 0.5,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-0125-batch": {
    "prompt": 0.25,
    "completion": 0.75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-0301": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-0301-batch": {
    "prompt": 0.75,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-0613": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-0613-batch": {
    "prompt": 0.75,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-1106": {
    "prompt": 1,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-1106-batch": {
    "prompt": 0.5,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-16k-0613": {
    "prompt": 3,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-16k-0613-batch": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-batch": {
    "prompt": 0.75,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-instruct": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-instruct-0914": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-instruct-0914-batch": {
    "prompt": 0.75,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-3.5-turbo-instruct-batch": {
    "prompt": 0.75,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-16k": {
    "prompt": 3,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-turbo": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-turbo-0613": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-turbo-1106": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-turbo-16k": {
    "prompt": 3,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-turbo-16k-0613": {
    "prompt": 3,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-turbo-16k-0613-batch": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-turbo-16k-batch": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-35-turbo-batch": {
    "prompt": 0.75,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4": {
    "prompt": 30,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-0125-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-0125-preview-batch": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-0314": {
    "prompt": 30,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-0314-batch": {
    "prompt": 15,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-0613": {
    "prompt": 30,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-0613-batch": {
    "prompt": 15,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-1106-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-1106-preview-batch": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-1106-vision-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-1106-vision-preview-batch": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-32k": {
    "prompt": 60,
    "completion": 120,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-32k-0314": {
    "prompt": 60,
    "completion": 120,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-32k-0314-batch": {
    "prompt": 30,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-32k-0613": {
    "prompt": 60,
    "completion": 120,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-32k-0613-batch": {
    "prompt": 30,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-32k-batch": {
    "prompt": 30,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-batch": {
    "prompt": 15,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-preview-1106": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-turbo": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-turbo-0125-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-turbo-0125-preview-batch": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-turbo-2024-04-09": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-turbo-2024-04-09-batch": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-turbo-batch": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-turbo-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-vision": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-vision-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4-vision-preview-batch": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4.1": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.5
  },
  "gpt-4.1-2025-04-14": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.5
  },
  "gpt-4.1-2025-04-14-batch": {
    "prompt": 1,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4.1-batch": {
    "prompt": 1,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4.1-mini": {
    "prompt": 0.4,
    "completion": 1.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.1
  },
  "gpt-4.1-mini-2025-04-14": {
    "prompt": 0.4,
    "completion": 1.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.1
  },
  "gpt-4.1-mini-2025-04-14-batch": {
    "prompt": 0.2,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4.1-mini-batch": {
    "prompt": 0.2,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4.1-nano": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.025
  },
  "gpt-4.1-nano-2025-04-14": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.025
  },
  "gpt-4.1-nano-2025-04-14-batch": {
    "prompt": 0.05,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4.1-nano-batch": {
    "prompt": 0.05,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-45-turbo": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 1.25
  },
  "gpt-4o-2024-05-13": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-2024-05-13-batch": {
    "prompt": 2.5,
    "completion": 7.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-2024-08-06": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "gpt-4o-2024-08-06-batch": {
    "prompt": 1.25,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-2024-11-20": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "gpt-4o-2024-11-20-batch": {
    "prompt": 1.25,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-batch": {
    "prompt": 1.25,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-mini": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.075
  },
  "gpt-4o-mini-2024-07-18": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.075
  },
  "gpt-4o-mini-2024-07-18-batch": {
    "prompt": 0.075,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-mini-batch": {
    "prompt": 0.075,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-mini-realtime-batch": {
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-realtime-batch": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-4o-search-preview-batch": {
    "prompt": 1.25,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "gpt-5-2025-08-07": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "gpt-5-2025-08-07-batch": {
    "prompt": 0.625,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5-batch": {
    "prompt": 0.625,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5-chat-latest": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "gpt-5-chat-latest-batch": {
    "prompt": 0.625,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5-mini": {
    "prompt": 0.25,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.025
  },
  "gpt-5-mini-2025-08-07": {
    "prompt": 0.25,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.025
  },
  "gpt-5-mini-2025-08-07-batch": {
    "prompt": 0.125,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5-mini-batch": {
    "prompt": 0.125,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5-nano": {
    "prompt": 0.05,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.005
  },
  "gpt-5-nano-2025-08-07": {
    "prompt": 0.05,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.005
  },
  "gpt-5-nano-2025-08-07-batch": {
    "prompt": 0.025,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5-nano-batch": {
    "prompt": 0.025,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.1": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "gpt-5.1-batch": {
    "prompt": 0.625,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.1-chat-latest": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "gpt-5.1-chat-latest-batch": {
    "prompt": 0.625,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.1-codex": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.125
  },
  "gpt-5.1-codex-batch": {
    "prompt": 0.625,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.1-codex-mini": {
    "prompt": 0.25,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.025
  },
  "gpt-5.1-codex-mini-batch": {
    "prompt": 0.125,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.2": {
    "prompt": 1.75,
    "completion": 14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.175
  },
  "gpt-5.2-2025-12-11": {
    "prompt": 1.75,
    "completion": 14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.175
  },
  "gpt-5.2-2025-12-11-batch": {
    "prompt": 0.875,
    "completion": 7,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.2-batch": {
    "prompt": 0.875,
    "completion": 7,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.2-chat-latest": {
    "prompt": 1.75,
    "completion": 14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.175
  },
  "gpt-5.2-chat-latest-batch": {
    "prompt": 0.875,
    "completion": 7,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.2-pro": {
    "prompt": 21,
    "completion": 168,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt-5.2-pro-batch": {
    "prompt": 10.5,
    "completion": 84,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt35": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gpt4-turbo-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1": {
    "prompt": 15,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 7.5
  },
  "o1-2024-12-17": {
    "prompt": 15,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-2024-12-17-batch": {
    "prompt": 7.5,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-batch": {
    "prompt": 7.5,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-mini": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.55
  },
  "o1-mini-2024-09-12": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.55
  },
  "o1-mini-2024-09-12-batch": {
    "prompt": 0.55,
    "completion": 2.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-mini-batch": {
    "prompt": 0.55,
    "completion": 2.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-preview": {
    "prompt": 15,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-preview-2024-09-12": {
    "prompt": 15,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-preview-2024-09-12-batch": {
    "prompt": 7.5,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-preview-batch": {
    "prompt": 7.5,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o1-pro-batch": {
    "prompt": 75,
    "completion": 300,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o3-2025-04-16": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.5
  },
  "o3-2025-04-16-batch": {
    "prompt": 1,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o3-mini": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.55
  },
  "o3-mini-2025-01-31": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.55
  },
  "o3-mini-2025-01-31-batch": {
    "prompt": 0.55,
    "completion": 2.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o3-mini-batch": {
    "prompt": 0.55,
    "completion": 2.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o3-pro-batch": {
    "prompt": 10,
    "completion": 40,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o4-mini-2025-04-16-batch": {
    "prompt": 0.55,
    "completion": 2.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "o4-mini-batch": {
    "prompt": 0.55,
    "completion": 2.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-mini-search-preview-batch": {
    "prompt": 0.075,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-ada-001": {
    "prompt": 0.4,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-ada-001-batch": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-curie-001": {
    "prompt": 2,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-curie-001-batch": {
    "prompt": 1,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-davinci-001": {
    "prompt": 20,
    "completion": 20,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-davinci-001-batch": {
    "prompt": 10,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-davinci-002": {
    "prompt": 20,
    "completion": 20,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-davinci-002-batch": {
    "prompt": 10,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-davinci-003": {
    "prompt": 20,
    "completion": 20,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-davinci-003-batch": {
    "prompt": 10,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-3-large": {
    "prompt": 0.13,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-3-large-batch": {
    "prompt": 0.065,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-3-small": {
    "prompt": 0.02,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-3-small-batch": {
    "prompt": 0.01,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-ada": {
    "prompt": 0.1,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-ada-002": {
    "prompt": 0.1,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-ada-002-batch": {
    "prompt": 0.05,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-ada-002-v2": {
    "prompt": 0.1,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-ada-002-v2-batch": {
    "prompt": 0.05,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "text-embedding-ada-batch": {
    "prompt": 0.05,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cohere/command-r": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek-chat": {
    "prompt": 0.014,
    "completion": 0.028,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/deepseek-v3": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/gpt-oss-120b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/gpt-oss-20b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/japanese-stable-diffusion-xl": {
    "prompt": 130,
    "completion": 130,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/japanese-stable-diffusion-xl-ControlNet": {
    "prompt": 200,
    "completion": 200,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/kimi-k2-thinking": {
    "prompt": 0.6,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/llama-v3p1-405b-instruct": {
    "prompt": 3,
    "completion": 3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/mixtral-8x22b-instruct": {
    "prompt": 1.2,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/mixtral-8x7b-instruct": {
    "prompt": 0.5,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/playground-v2-1024px-aesthetic": {
    "prompt": 130,
    "completion": 130,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/playground-v2-1024px-aesthetic-ControlNet": {
    "prompt": 200,
    "completion": 200,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/playground-v2-5-1024px-aesthetic": {
    "prompt": 130,
    "completion": 130,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/playground-v2-5-1024px-aesthetic-ControlNet": {
    "prompt": 200,
    "completion": 200,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/sd3": {
    "prompt": 130,
    "completion": 130,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/sd3-ControlNet": {
    "prompt": 200,
    "completion": 200,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/sd3-medium": {
    "prompt": 130,
    "completion": 130,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/sd3-medium-ControlNet": {
    "prompt": 200,
    "completion": 200,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/sd3-turbo": {
    "prompt": 130,
    "completion": 130,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/sd3-turbo-ControlNet": {
    "prompt": 200,
    "completion": 200,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/SSD-1B": {
    "prompt": 130,
    "completion": 130,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/SSD-1B-ControlNet": {
    "prompt": 200,
    "completion": 200,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/stable-diffusion-xl-1024-v1-0": {
    "prompt": 130,
    "completion": 130,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/stable-diffusion-xl-1024-v1-0-ControlNet": {
    "prompt": 200,
    "completion": 200,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "accounts/fireworks/models/yi-large": {
    "prompt": 3,
    "completion": 3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gemini-1.0-pro": {
    "prompt": 0.125,
    "completion": 0.375,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gemini-1.0-pro-vision-001": {
    "prompt": 0.125,
    "completion": 0.375,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gemini-2.5-flash": {
    "prompt": 0.3,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.075
  },
  "gemini-2.5-pro": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.31
  },
  "gemini-2.5-pro-exp-03-25": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gemini-flash-1.5-8b": {
    "prompt": 0.0375,
    "completion": 0.15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek-r1-distill-llama-70b": {
    "prompt": 0.75,
    "completion": 0.99,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gemma-7b-it": {
    "prompt": 0.07,
    "completion": 0.07,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gemma2-9b-it": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "llama-3.1-8b-instant": {
    "prompt": 0.05,
    "completion": 0.08,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "llama-3.3-70b-versatile": {
    "prompt": 0.59,
    "completion": 0.79,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "llama-guard-3-8b": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "llama2-70b-4096": {
    "prompt": 0.7,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "llama3-70b-8192": {
    "prompt": 0.59,
    "completion": 0.79,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "llama3-8b-8192": {
    "prompt": 0.05,
    "completion": 0.08,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "llama3-groq-70b-8192-tool-use-preview": {
    "prompt": 0.89,
    "completion": 0.89,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "llama3-groq-8b-8192-tool-use-preview": {
    "prompt": 0.19,
    "completion": 0.19,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-4-maverick-17b-128e-instruct": {
    "prompt": 0.2,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-4-scout-17b-16e-instruct": {
    "prompt": 0.11,
    "completion": 0.34,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-guard-4-12b": {
    "prompt": 0.18,
    "completion": 0.18,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-saba-24b": {
    "prompt": 0.79,
    "completion": 0.79,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mixtral-8x7b-32768": {
    "prompt": 0.24,
    "completion": 0.24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "moonshotai/kimi-k2-instruct": {
    "prompt": 1,
    "completion": 3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-oss-120b": {
    "prompt": 0.04,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-oss-20b": {
    "prompt": 0.03,
    "completion": 0.14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-32b": {
    "prompt": 0.05,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Cerebras-Llama-4-Maverick-17B-128E-Instruct": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Cerebras-Llama-4-Scout-17B-16E-Instruct": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Groq-Llama-4-Maverick-17B-128E-Instruct": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Llama-3.3-70B-Instruct": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Llama-3.3-8B-Instruct": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Llama-4-Maverick-17B-128E-Instruct-FP8": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Llama-4-Scout-17B-16E-Instruct-FP8": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "codestral": {
    "prompt": 0.3,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "devstral-medium": {
    "prompt": 0.4,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "magistral-medium": {
    "prompt": 2,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-7b-instruct": {
    "prompt": 0.14,
    "completion": 0.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-7b-instruct-v0.1": {
    "prompt": 0.14,
    "completion": 0.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-7b-instruct-v0.2": {
    "prompt": 0.14,
    "completion": 0.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-7b-instruct-v0.3": {
    "prompt": 0.14,
    "completion": 0.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-embed": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-large": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-large-latest": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-medium": {
    "prompt": 2.39,
    "completion": 7.17,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-medium-3": {
    "prompt": 400,
    "completion": 2000,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-medium-latest": {
    "prompt": 2.39,
    "completion": 7.17,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-saba": {
    "prompt": 200,
    "completion": 600,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-small": {
    "prompt": 0.14,
    "completion": 0.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-small-3.2": {
    "prompt": 100,
    "completion": 300,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-small-latest": {
    "prompt": 0.14,
    "completion": 0.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral-tiny": {
    "prompt": 0.14,
    "completion": 0.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mixtral-8x22b": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mixtral-8x22b-instruct": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mixtral-8x7b-instruct": {
    "prompt": 0.14,
    "completion": 0.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "open-mistral-7b": {
    "prompt": 0.25,
    "completion": 0.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "open-mixtral-8x7b": {
    "prompt": 0.7,
    "completion": 0.7,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "pixtral-large": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "black-forest-labs/flux-dev": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "black-forest-labs/flux-schnell": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "stability-ai/sdxl": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cognitivecomputations/dolphin-mixtral-8x22b": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek_v3": {
    "prompt": 0.89,
    "completion": 0.89,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1": {
    "prompt": 0.55,
    "completion": 2.19,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-distill-llama-70b": {
    "prompt": 0.75,
    "completion": 0.99,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-distill-llama-8b": {
    "prompt": 0.04,
    "completion": 0.04,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-distill-qwen-14b": {
    "prompt": 0.15,
    "completion": 0.15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-distill-qwen-32b": {
    "prompt": 0.27,
    "completion": 0.27,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-2-9b-it": {
    "prompt": 0.01,
    "completion": 0.03,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "gryphe/mythomax-l2-13b": {
    "prompt": 0.05,
    "completion": 0.09,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "jondurbin/airoboros-l2-70b": {
    "prompt": 0.5,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3-70b-instruct": {
    "prompt": 0.3,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3-8b-instruct": {
    "prompt": 0.03,
    "completion": 0.06,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.1-70b-instruct": {
    "prompt": 0.4,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.1-8b-instruct": {
    "prompt": 0.02,
    "completion": 0.03,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.1-8b-instruct-bf16": {
    "prompt": 0.06,
    "completion": 0.06,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.1-8b-instruct-max": {
    "prompt": 0.05,
    "completion": 0.05,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.2-11b-vision-instruct": {
    "prompt": 0.049,
    "completion": 0.049,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.2-1b-instruct": {
    "prompt": 0.005,
    "completion": 0.01,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.2-3b-instruct": {
    "prompt": 0.02,
    "completion": 0.02,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.3-70b-instruct": {
    "prompt": 0.13,
    "completion": 0.38,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/wizardlm-2-8x22b": {
    "prompt": 0.48,
    "completion": 0.48,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-7b-instruct": {
    "prompt": 0.028,
    "completion": 0.054,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-nemo": {
    "prompt": 0.02,
    "completion": 0.04,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/hermes-2-pro-llama-3-8b": {
    "prompt": 0.025,
    "completion": 0.08,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/nous-hermes-llama2-13b": {
    "prompt": 0.17,
    "completion": 0.17,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openchat/openchat-7b": {
    "prompt": 0.06,
    "completion": 0.06,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-2-7b-instruct": {
    "prompt": 0.054,
    "completion": 0.054,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-2-vl-72b-instruct": {
    "prompt": 0.45,
    "completion": 0.45,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-2.5-72b-instruct": {
    "prompt": 0.07,
    "completion": 0.26,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sao10k/l3-70b-euryale-v2.1": {
    "prompt": 1.48,
    "completion": 1.48,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sao10k/l3-8b-lunaris": {
    "prompt": 0.05,
    "completion": 0.05,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Sao10K/L3-8B-Stheno-v3.2": {
    "prompt": 0.05,
    "completion": 0.05,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sao10k/l31-70b-euryale-v2.2": {
    "prompt": 1.48,
    "completion": 1.48,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sophosympatheia/midnight-rose-70b": {
    "prompt": 0.8,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "teknium/openhermes-2.5-mistral-7b": {
    "prompt": 0.17,
    "completion": 0.17,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "agentica-org/deepcoder-14b-preview": {
    "prompt": 0.015,
    "completion": 0.015,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "agentica-org/deepcoder-14b-preview:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "ai21/jamba-large-1.7": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "ai21/jamba-mini-1.7": {
    "prompt": 0.2,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "aion-labs/aion-1.0": {
    "prompt": 4,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "aion-labs/aion-1.0-mini": {
    "prompt": 0.7,
    "completion": 1.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "aion-labs/aion-rp-llama-3.1-8b": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alfredpros/codellama-7b-instruct-solidity": {
    "prompt": 0.8,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alibaba/tongyi-deepresearch-30b-a3b": {
    "prompt": 0.09,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alibaba/tongyi-deepresearch-30b-a3b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "allenai/molmo-7b-d": {
    "prompt": 0.1,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "allenai/olmo-2-0325-32b-instruct": {
    "prompt": 0.2,
    "completion": 0.35,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alpindale/goliath-120b": {
    "prompt": 4,
    "completion": 5.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "amazon/nova-lite-v1": {
    "prompt": 0.06,
    "completion": 0.24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "amazon/nova-micro-v1": {
    "prompt": 0.035,
    "completion": 0.14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "amazon/nova-pro-v1": {
    "prompt": 0.8,
    "completion": 3.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthracite-org/magnum-v2-72b": {
    "prompt": 3,
    "completion": 3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthracite-org/magnum-v4-72b": {
    "prompt": 3,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3-haiku": {
    "prompt": 0.25,
    "completion": 1.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3-opus": {
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3.5-haiku": {
    "prompt": 0.8,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3.5-haiku-20241022": {
    "prompt": 0.8,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3.5-sonnet": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3.5-sonnet-20240620": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3.7-sonnet": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3.7-sonnet:thinking": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-4.6-opus-20260205": {
    "prompt": 5.275,
    "completion": 26.375,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-haiku-4.5": {
    "prompt": 1,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-opus-4": {
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-opus-4.1": {
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-opus-4.6": {
    "prompt": 5.275,
    "completion": 26.375,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-opus-4.6-20260205": {
    "prompt": 5.275,
    "completion": 26.375,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-sonnet-4": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-sonnet-4.5": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "arcee-ai/afm-4.5b": {
    "prompt": 0.048,
    "completion": 0.15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "arcee-ai/coder-large": {
    "prompt": 0.5,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "arcee-ai/maestro-reasoning": {
    "prompt": 0.9,
    "completion": 3.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "arcee-ai/spotlight": {
    "prompt": 0.18,
    "completion": 0.18,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "arcee-ai/virtuoso-large": {
    "prompt": 0.75,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "arliai/qwq-32b-arliai-rpr-v1": {
    "prompt": 0.03,
    "completion": 0.11,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "arliai/qwq-32b-arliai-rpr-v1:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "baidu/ernie-4.5-21b-a3b": {
    "prompt": 0.07,
    "completion": 0.28,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "baidu/ernie-4.5-21b-a3b-thinking": {
    "prompt": 0.07,
    "completion": 0.28,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "baidu/ernie-4.5-300b-a47b": {
    "prompt": 0.28,
    "completion": 1.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "baidu/ernie-4.5-vl-28b-a3b": {
    "prompt": 0.14,
    "completion": 0.56,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "baidu/ernie-4.5-vl-424b-a47b": {
    "prompt": 0.42,
    "completion": 1.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "bytedance/ui-tars-1.5-7b": {
    "prompt": 0.1,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cognitivecomputations/dolphin3.0-mistral-24b": {
    "prompt": 0.04,
    "completion": 0.17,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cognitivecomputations/dolphin3.0-mistral-24b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cohere/command-a": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cohere/command-r-08-2024": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cohere/command-r-plus-08-2024": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cohere/command-r7b-12-2024": {
    "prompt": 0.0375,
    "completion": 0.15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepcogito/cogito-v2-preview-deepseek-671b": {
    "prompt": 1.25,
    "completion": 1.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepcogito/cogito-v2-preview-llama-109b-moe": {
    "prompt": 0.18,
    "completion": 0.59,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepcogito/cogito-v2-preview-llama-405b": {
    "prompt": 3.5,
    "completion": 3.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepcogito/cogito-v2-preview-llama-70b": {
    "prompt": 0.88,
    "completion": 0.88,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-chat": {
    "prompt": 0.3,
    "completion": 0.85,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-chat-v3-0324": {
    "prompt": 0.24,
    "completion": 0.84,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-chat-v3-0324:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-chat-v3.1": {
    "prompt": 0.27,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-chat-v3.1:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-prover-v2": {
    "prompt": 0.5,
    "completion": 2.18,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-0528": {
    "prompt": 0.4,
    "completion": 1.75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-0528-qwen3-8b": {
    "prompt": 0.03,
    "completion": 0.11,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-0528-qwen3-8b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-0528:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1-distill-llama-70b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-r1:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-v3.1-terminus": {
    "prompt": 0.23,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-v3.2-exp": {
    "prompt": 0.27,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "eleutherai/llemma_7b": {
    "prompt": 0.8,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.0-flash-001": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.0-flash-exp:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.0-flash-lite-001": {
    "prompt": 0.075,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-flash": {
    "prompt": 0.3,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-flash-image": {
    "prompt": 0.3,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-flash-image-preview": {
    "prompt": 0.3,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-flash-lite": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-flash-lite-preview-06-17": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-flash-lite-preview-09-2025": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-flash-preview-09-2025": {
    "prompt": 0.3,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-pro": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-pro-preview": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.5-pro-preview-05-06": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-3-pro-preview": {
    "prompt": 2,
    "completion": 12,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.2
  },
  "google/gemini-3.1-pro-preview": {
    "prompt": 2.11,
    "completion": 12.66,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.211
  },
  "google/gemma-2-27b-it": {
    "prompt": 0.65,
    "completion": 0.65,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-2-9b-it:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3-12b-it": {
    "prompt": 0.03,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3-12b-it:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3-27b-it": {
    "prompt": 0.09,
    "completion": 0.16,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3-27b-it:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3-4b-it": {
    "prompt": 0.01703012,
    "completion": 0.0681536,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3-4b-it:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3n-e2b-it:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3n-e4b-it": {
    "prompt": 0.02,
    "completion": 0.04,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-3n-e4b-it:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "ibm-granite/granite-4.0-h-micro": {
    "prompt": 0.017,
    "completion": 0.11,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "inception/mercury": {
    "prompt": 0.25,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "inception/mercury-coder": {
    "prompt": 0.25,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "inclusionai/ling-1t": {
    "prompt": 0.4,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "inclusionai/ring-1t": {
    "prompt": 0.57,
    "completion": 2.28,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "inflection/inflection-3-pi": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "inflection/inflection-3-productivity": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mancer/weaver": {
    "prompt": 1.125,
    "completion": 1.125,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meituan/longcat-flash-chat": {
    "prompt": 0.15,
    "completion": 0.75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meituan/longcat-flash-chat:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.1-405b": {
    "prompt": 4,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.1-405b-instruct": {
    "prompt": 0.8,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.2-3b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.2-90b-vision-instruct": {
    "prompt": 0.35,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.3-70b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-3.3-8b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-4-maverick": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-4-maverick:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-4-scout": {
    "prompt": 0.08,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-4-scout:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-guard-2-8b": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/llama-guard-3-8b": {
    "prompt": 0.02,
    "completion": 0.06,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/mai-ds-r1": {
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/mai-ds-r1:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/phi-3-medium-128k-instruct": {
    "prompt": 1,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/phi-3-mini-128k-instruct": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/phi-3.5-mini-128k-instruct": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/phi-4": {
    "prompt": 0.06,
    "completion": 0.14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/phi-4-multimodal-instruct": {
    "prompt": 0.05,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/phi-4-reasoning-plus": {
    "prompt": 0.07,
    "completion": 0.35,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "minimax/minimax-01": {
    "prompt": 0.2,
    "completion": 1.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "minimax/minimax-m1": {
    "prompt": 0.4,
    "completion": 2.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/codestral-2501": {
    "prompt": 0.3,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/codestral-2508": {
    "prompt": 0.3,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/devstral-medium": {
    "prompt": 0.4,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/devstral-small": {
    "prompt": 0.07,
    "completion": 0.28,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/devstral-small-2505": {
    "prompt": 0.05,
    "completion": 0.22,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/devstral-small-2505:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/magistral-medium-2506": {
    "prompt": 2,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/magistral-medium-2506:thinking": {
    "prompt": 2,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/magistral-small-2506": {
    "prompt": 0.5,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/ministral-3b": {
    "prompt": 0.04,
    "completion": 0.04,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/ministral-8b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-7b-instruct-v0.1": {
    "prompt": 0.11,
    "completion": 0.19,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-7b-instruct-v0.2": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-7b-instruct-v0.3": {
    "prompt": 0.028,
    "completion": 0.054,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-7b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-large": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-large-2407": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-large-2411": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-medium-3": {
    "prompt": 0.4,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-medium-3.1": {
    "prompt": 0.4,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-nemo:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-saba": {
    "prompt": 0.2,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-small": {
    "prompt": 0.2,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-small-24b-instruct-2501": {
    "prompt": 0.05,
    "completion": 0.08,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-small-24b-instruct-2501:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-small-3.1-24b-instruct": {
    "prompt": 0.05,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-small-3.1-24b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-small-3.2-24b-instruct": {
    "prompt": 0.06,
    "completion": 0.18,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-small-3.2-24b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mistral-tiny": {
    "prompt": 0.25,
    "completion": 0.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mixtral-8x22b-instruct": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/mixtral-8x7b-instruct": {
    "prompt": 0.54,
    "completion": 0.54,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/pixtral-12b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/pixtral-large-2411": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "moonshotai/kimi-dev-72b": {
    "prompt": 0.29,
    "completion": 1.15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "moonshotai/kimi-dev-72b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "moonshotai/kimi-k2": {
    "prompt": 0.55,
    "completion": 2.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "moonshotai/kimi-k2-0905": {
    "prompt": 0.39,
    "completion": 1.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "moonshotai/kimi-k2:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "morph/morph-v3-fast": {
    "prompt": 0.8,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "morph/morph-v3-large": {
    "prompt": 0.9,
    "completion": 1.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "neversleep/llama-3.1-lumimaid-8b": {
    "prompt": 0.09,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "neversleep/noromaid-20b": {
    "prompt": 1,
    "completion": 1.75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/deephermes-3-llama-3-8b-preview": {
    "prompt": 0.03,
    "completion": 0.11,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/deephermes-3-llama-3-8b-preview:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/deephermes-3-mistral-24b-preview": {
    "prompt": 0.15,
    "completion": 0.59,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/hermes-3-llama-3.1-405b": {
    "prompt": 1,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/hermes-3-llama-3.1-70b": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/hermes-4-405b": {
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nousresearch/hermes-4-70b": {
    "prompt": 0.11,
    "completion": 0.38,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nvidia/llama-3.1-nemotron-70b-instruct": {
    "prompt": 0.6,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nvidia/llama-3.1-nemotron-ultra-253b-v1": {
    "prompt": 0.6,
    "completion": 1.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nvidia/llama-3.3-nemotron-super-49b-v1.5": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nvidia/nemotron-nano-9b-v2": {
    "prompt": 0.04,
    "completion": 0.16,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "nvidia/nemotron-nano-9b-v2:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/chatgpt-4o-latest": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/codex-mini": {
    "prompt": 1.5,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/codex-mini-latest": {
    "prompt": 1.5,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-3.5-turbo": {
    "prompt": 0.5,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-3.5-turbo-0613": {
    "prompt": 1,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-3.5-turbo-16k": {
    "prompt": 3,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-3.5-turbo-instruct": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4": {
    "prompt": 30,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4-0314": {
    "prompt": 30,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4-1106-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4-turbo": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4-turbo-preview": {
    "prompt": 10,
    "completion": 30,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4.1": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4.1-mini": {
    "prompt": 0.4,
    "completion": 1.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4.1-nano": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-2024-05-13": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-2024-08-06": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-2024-11-20": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-audio-preview": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-mini": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-mini-2024-07-18": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-mini-search-preview": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o-search-preview": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4o:extended": {
    "prompt": 6,
    "completion": 18,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5-chat": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5-codex": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5-image": {
    "prompt": 10,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5-image-mini": {
    "prompt": 2.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5-mini": {
    "prompt": 0.25,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5-nano": {
    "prompt": 0.05,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5-pro": {
    "prompt": 15,
    "completion": 120,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5.1": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5.1-chat-latest": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5.1-codex": {
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-5.1-codex-mini": {
    "prompt": 0.25,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-oss-20b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o1": {
    "prompt": 15,
    "completion": 60,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o1-mini": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o1-mini-2024-09-12": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o1-pro": {
    "prompt": 150,
    "completion": 600,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o3": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o3-deep-research": {
    "prompt": 10,
    "completion": 40,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o3-mini": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o3-mini-high": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o3-pro": {
    "prompt": 20,
    "completion": 80,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o4-mini": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o4-mini-deep-research": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/o4-mini-high": {
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "opengvlab/internvl3-78b": {
    "prompt": 0.07,
    "completion": 0.26,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openrouter/auto": {
    "prompt": -1000000,
    "completion": -1000000,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "perplexity/sonar": {
    "prompt": 1,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "perplexity/sonar-deep-research": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "perplexity/sonar-pro": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "perplexity/sonar-reasoning": {
    "prompt": 1,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "perplexity/sonar-reasoning-pro": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-2.5-72b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-2.5-7b-instruct": {
    "prompt": 0.04,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-2.5-coder-32b-instruct": {
    "prompt": 0.04,
    "completion": 0.16,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-2.5-coder-32b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-2.5-vl-7b-instruct": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-max": {
    "prompt": 1.6,
    "completion": 6.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-plus": {
    "prompt": 0.4,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-plus-2025-07-28": {
    "prompt": 0.4,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-plus-2025-07-28:thinking": {
    "prompt": 0.4,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-turbo": {
    "prompt": 0.05,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-vl-max": {
    "prompt": 0.8,
    "completion": 3.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen-vl-plus": {
    "prompt": 0.21,
    "completion": 0.63,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen2.5-coder-7b-instruct": {
    "prompt": 0.03,
    "completion": 0.09,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen2.5-vl-32b-instruct": {
    "prompt": 0.05,
    "completion": 0.22,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen2.5-vl-32b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen2.5-vl-72b-instruct": {
    "prompt": 0.08,
    "completion": 0.33,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen2.5-vl-72b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-14b": {
    "prompt": 0.05,
    "completion": 0.22,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-14b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-235b-a22b": {
    "prompt": 0.18,
    "completion": 0.54,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-235b-a22b-2507": {
    "prompt": 0.08,
    "completion": 0.55,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-235b-a22b-thinking-2507": {
    "prompt": 0.11,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-235b-a22b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-30b-a3b": {
    "prompt": 0.06,
    "completion": 0.22,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-30b-a3b-instruct-2507": {
    "prompt": 0.08,
    "completion": 0.33,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-30b-a3b-thinking-2507": {
    "prompt": 0.08,
    "completion": 0.29,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-30b-a3b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-4b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-8b": {
    "prompt": 0.035,
    "completion": 0.138,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-8b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-coder": {
    "prompt": 0.22,
    "completion": 0.95,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-coder-30b-a3b-instruct": {
    "prompt": 0.06,
    "completion": 0.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-coder-flash": {
    "prompt": 0.3,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-coder-plus": {
    "prompt": 1,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-coder:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-max": {
    "prompt": 1.2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-next-80b-a3b-instruct": {
    "prompt": 0.1,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-next-80b-a3b-thinking": {
    "prompt": 0.14,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-vl-235b-a22b-instruct": {
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-vl-235b-a22b-thinking": {
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-vl-30b-a3b-instruct": {
    "prompt": 0.2,
    "completion": 0.7,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-vl-30b-a3b-thinking": {
    "prompt": 0.2,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-vl-8b-instruct": {
    "prompt": 0.08,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwen3-vl-8b-thinking": {
    "prompt": 0.18,
    "completion": 2.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "qwen/qwq-32b": {
    "prompt": 0.15,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "raifle/sorcererlm-8x22b": {
    "prompt": 4.5,
    "completion": 4.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "relace/relace-apply-3": {
    "prompt": 0.85,
    "completion": 1.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sao10k/l3-euryale-70b": {
    "prompt": 1.48,
    "completion": 1.48,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sao10k/l3-lunaris-8b": {
    "prompt": 0.04,
    "completion": 0.05,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sao10k/l3.1-70b-hanami-x1": {
    "prompt": 3,
    "completion": 3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sao10k/l3.1-euryale-70b": {
    "prompt": 0.65,
    "completion": 0.75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sao10k/l3.3-euryale-70b": {
    "prompt": 0.65,
    "completion": 0.75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "shisa-ai/shisa-v2-llama3.3-70b": {
    "prompt": 0.05,
    "completion": 0.22,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "shisa-ai/shisa-v2-llama3.3-70b:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "stepfun-ai/step3": {
    "prompt": 0.57,
    "completion": 1.42,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "switchpoint/router": {
    "prompt": 0.85,
    "completion": 3.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "tencent/hunyuan-a13b-instruct": {
    "prompt": 0.03,
    "completion": 0.03,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "tencent/hunyuan-a13b-instruct:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "thedrummer/anubis-70b-v1.1": {
    "prompt": 0.65,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "thedrummer/cydonia-24b-v4.1": {
    "prompt": 0.3,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "thedrummer/rocinante-12b": {
    "prompt": 0.17,
    "completion": 0.43,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "thedrummer/skyfall-36b-v2": {
    "prompt": 0.08,
    "completion": 0.33,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "thedrummer/unslopnemo-12b": {
    "prompt": 0.4,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "thudm/glm-4.1v-9b-thinking": {
    "prompt": 0.035,
    "completion": 0.138,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "thudm/glm-z1-32b": {
    "prompt": 0.05,
    "completion": 0.22,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "tngtech/deepseek-r1t-chimera": {
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "tngtech/deepseek-r1t-chimera:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "tngtech/deepseek-r1t2-chimera": {
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "tngtech/deepseek-r1t2-chimera:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "undi95/remm-slerp-l2-13b": {
    "prompt": 0.45,
    "completion": 0.65,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "x-ai/grok-3": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "x-ai/grok-3-beta": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "x-ai/grok-3-mini": {
    "prompt": 0.3,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "x-ai/grok-3-mini-beta": {
    "prompt": 0.3,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "x-ai/grok-4": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "x-ai/grok-4-fast": {
    "prompt": 0.2,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "x-ai/grok-code-fast-1": {
    "prompt": 0.2,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "z-ai/glm-4-32b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "z-ai/glm-4.5": {
    "prompt": 0.3,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "z-ai/glm-4.5-air": {
    "prompt": 0.13,
    "completion": 0.85,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "z-ai/glm-4.5-air:free": {
    "prompt": 0,
    "completion": 0,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "z-ai/glm-4.5v": {
    "prompt": 0.6,
    "completion": 1.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "z-ai/glm-4.6": {
    "prompt": 0.5,
    "completion": 1.75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sonar": {
    "prompt": 1,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sonar-deep-research": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sonar-pro": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sonar-reasoning": {
    "prompt": 1,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "sonar-reasoning-pro": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "allenai/OLMo-7B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "allenai/OLMo-7B-Instruct": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "allenai/OLMo-7B-Twin-2T": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Austism/chronos-hermes-13b": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "codellama/CodeLlama-13b-Instruct-hf": {
    "prompt": 0.225,
    "completion": 0.225,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "codellama/CodeLlama-34b-Instruct-hf": {
    "prompt": 0.776,
    "completion": 0.776,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "codellama/CodeLlama-70b-Instruct-hf": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "codellama/CodeLlama-7b-Instruct-hf": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek-ai/deepseek-coder-33b-instruct": {
    "prompt": 0.8,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek-ai/DeepSeek-R1": {
    "prompt": 3,
    "completion": 7,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek-ai/DeepSeek-R1-0528-tput": {
    "prompt": 0.55,
    "completion": 2.19,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek-ai/DeepSeek-V3": {
    "prompt": 1.25,
    "completion": 1.25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "garage-bAInd/Platypus2-70B-instruct": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-2b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-2b-it": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-7b": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-7b-it": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Gryphe/MythoMax-L2-13b": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "lmsys/vicuna-13b-v1.5": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "lmsys/vicuna-7b-v1.5": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Llama-2-13b-chat-hf": {
    "prompt": 0.225,
    "completion": 0.225,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Llama-2-70b-chat-hf": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Llama-2-7b-chat-hf": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Llama-3-70b-chat-hf": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Llama-3-8b-chat-hf": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Llama-3.3-70B-Instruct-Turbo": {
    "prompt": 0.88,
    "completion": 0.88,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8": {
    "prompt": 0.27,
    "completion": 0.85,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Llama-4-Scout-17B-16E-Instruct": {
    "prompt": 0.18,
    "completion": 0.59,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Meta-Llama-3-70B-Instruct-Lite": {
    "prompt": 0.54,
    "completion": 0.54,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Meta-Llama-3-70B-Instruct-Turbo": {
    "prompt": 0.88,
    "completion": 0.88,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Meta-Llama-3-8B-Instruct-Lite": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Meta-Llama-3-8B-Instruct-Turbo": {
    "prompt": 0.18,
    "completion": 0.18,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo": {
    "prompt": 5,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo": {
    "prompt": 0.88,
    "completion": 0.88,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo": {
    "prompt": 0.18,
    "completion": 0.18,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo": {
    "prompt": 0.88,
    "completion": 0.88,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/phi-2": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "microsoft/WizardLM-2-8x22B": {
    "prompt": 1.2,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/Mistral-7B-Instruct-v0.1": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/Mistral-7B-Instruct-v0.2": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/Mistral-7B-v0.1": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/Mixtral-8x22B-Instruct-v0.1": {
    "prompt": 2.4,
    "completion": 2.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/Mixtral-8x7B-Instruct-v0.1": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistralai/Mixtral-8x7B-v0.1": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Nexusflow/NexusRaven-V2-13B": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "NousResearch/Nous-Capybara-7B-V1p9": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "NousResearch/Nous-Hermes-2-Yi-34B": {
    "prompt": 0.8,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "NousResearch/Nous-Hermes-llama-2-7b": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "NousResearch/Nous-Hermes-Llama2-13b": {
    "prompt": 0.225,
    "completion": 0.225,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Open-Orca/Mistral-7B-OpenOrca": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openchat/openchat-3.5-1210": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-0.5B": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-0.5B-Chat": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-1.8B": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-1.8B-Chat": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-14B": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-14B-Chat": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-4B": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-4B-Chat": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-72B": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-7B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen1.5-7B-Chat": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen2.5-72B-Instruct-Turbo": {
    "prompt": 1.2,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen2.5-7B-Instruct-Turbo": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen2.5-Coder-32B-Instruct": {
    "prompt": 0.8,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Qwen/Qwen2.5-VL-72B-Instruct": {
    "prompt": 1.2,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "snorkelai/Snorkel-Mistral-PairRM-DPO": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "teknium/OpenHermes-2-Mistral-7B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "teknium/OpenHermes-2p5-Mistral-7B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/alpaca-7b": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/GPT-JT-Moderation-6B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/Llama-2-7B-32K-Instruct": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/RedPajama-INCITE-7B-Base": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/RedPajama-INCITE-7B-Chat": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/RedPajama-INCITE-7B-Instruct": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/RedPajama-INCITE-Base-3B-v1": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/RedPajama-INCITE-Chat-3B-v1": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/RedPajama-INCITE-Instruct-3B-v1": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/StripedHyena-Hessian-7B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "togethercomputer/StripedHyena-Nous-7B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Undi95/ReMM-SLERP-L2-13B": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "Undi95/Toppy-M-7B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "upstage/SOLAR-10.7B-Instruct-v1.0": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "WizardLM/WizardLM-13B-V1.2": {
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "zero-one-ai/Yi-34B": {
    "prompt": 0.8,
    "completion": 0.8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "zero-one-ai/Yi-6B": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alibaba/qwen-3-14b": {
    "prompt": 0.08,
    "completion": 0.24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alibaba/qwen-3-235b": {
    "prompt": 0.2,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alibaba/qwen-3-30b": {
    "prompt": 0.1,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alibaba/qwen-3-32b": {
    "prompt": 0.1,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "alibaba/qwen3-coder": {
    "prompt": 0.4,
    "completion": 1.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "amazon/nova-lite": {
    "prompt": 0.06,
    "completion": 0.24,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "amazon/nova-micro": {
    "prompt": 0.035,
    "completion": 0.14,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "amazon/nova-pro": {
    "prompt": 0.8,
    "completion": 3.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3-5-haiku": {
    "prompt": 0.8,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3-5-sonnet": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-3-7-sonnet": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-4-opus": {
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "anthropic/claude-4-sonnet": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "cohere/command-r-plus": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "deepseek/deepseek-v3": {
    "prompt": 0.9,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2-0-flash": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2-0-flash-lite": {
    "prompt": 0.075,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2-5-flash": {
    "prompt": 0.3,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2-5-pro": {
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.0-flash": {
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemini-2.0-flash-lite": {
    "prompt": 0.075,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "google/gemma-2-9b": {
    "prompt": 0.2,
    "completion": 0.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "inception/mercury-coder-small": {
    "prompt": 0.25,
    "completion": 1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-1-70b": {
    "prompt": 0.72,
    "completion": 0.72,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-1-8b": {
    "prompt": 0.05,
    "completion": 0.08,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-2-11b": {
    "prompt": 0.16,
    "completion": 0.16,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-2-1b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-2-3b": {
    "prompt": 0.15,
    "completion": 0.15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-2-90b": {
    "prompt": 0.72,
    "completion": 0.72,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-3-70b": {
    "prompt": 0.72,
    "completion": 0.72,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-70b": {
    "prompt": 0.59,
    "completion": 0.79,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3-8b": {
    "prompt": 0.05,
    "completion": 0.08,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3.1-70b": {
    "prompt": 0.72,
    "completion": 0.72,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3.1-8b": {
    "prompt": 0.05,
    "completion": 0.08,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3.2-11b": {
    "prompt": 0.16,
    "completion": 0.16,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3.2-1b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3.2-3b": {
    "prompt": 0.15,
    "completion": 0.15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3.2-90b": {
    "prompt": 0.72,
    "completion": 0.72,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-3.3-70b": {
    "prompt": 0.72,
    "completion": 0.72,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-4-maverick": {
    "prompt": 0.2,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "meta/llama-4-scout": {
    "prompt": 0.1,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/codestral": {
    "prompt": 0.3,
    "completion": 0.9,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/devstral-small": {
    "prompt": 0.07,
    "completion": 0.28,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/magistral-medium": {
    "prompt": 2,
    "completion": 5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/magistral-small": {
    "prompt": 0.5,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/ministral-3b": {
    "prompt": 0.04,
    "completion": 0.04,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/ministral-8b": {
    "prompt": 0.1,
    "completion": 0.1,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/mistral-large": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/mistral-saba-24b": {
    "prompt": 0.79,
    "completion": 0.79,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/mistral-small": {
    "prompt": 0.1,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/mixtral-8x22b-instruct": {
    "prompt": 1.2,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/pixtral-12b": {
    "prompt": 0.15,
    "completion": 0.15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "mistral/pixtral-large": {
    "prompt": 2,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-3-5-turbo": {
    "prompt": 0.5,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-3-5-turbo-instruct": {
    "prompt": 1.5,
    "completion": 2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4-1": {
    "prompt": 2,
    "completion": 8,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4-1-mini": {
    "prompt": 0.4,
    "completion": 1.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "openai/gpt-4-1-nano": {
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "vercel/v0-1-0-md": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "vercel/v0-1-5-md": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "vercel/v0-1.0-md": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "vercel/v0-1.5-md": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "xai/grok-2": {
    "prompt": 2,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "xai/grok-2-vision": {
    "prompt": 2,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "xai/grok-3": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "xai/grok-3-fast": {
    "prompt": 5,
    "completion": 25,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "xai/grok-3-mini": {
    "prompt": 0.3,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "xai/grok-3-mini-fast": {
    "prompt": 0.6,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "xai/grok-4": {
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "grok-2-1212": {
    "prompt": 2,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "grok-2-vision-1212": {
    "prompt": 2,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "grok-beta": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "grok-vision-beta": {
    "prompt": 5,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  "default": {
    "prompt": 0.5,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  }
};

export const FUZZY_MATCH_PRICING: FuzzyModelPricing[] = [
  {
    "operator": "includes",
    "model": "claude-opus-4-5",
    "prompt": 5,
    "completion": 25,
    "prompt_cache_write": 6.25,
    "prompt_cache_read": 0.5
  },
  {
    "operator": "includes",
    "model": "claude-opus-4-6",
    "prompt": 5,
    "completion": 25,
    "prompt_cache_write": 6.25,
    "prompt_cache_read": 0.5
  },
  {
    "operator": "includes",
    "model": "claude-3-5-haiku",
    "prompt": 0.8,
    "completion": 4,
    "prompt_cache_write": 1,
    "prompt_cache_read": 0.08
  },
  {
    "operator": "includes",
    "model": "claude-3-5-sonnet",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  {
    "operator": "includes",
    "model": "claude-3-7-sonnet",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  {
    "operator": "includes",
    "model": "claude-3-haiku",
    "prompt": 0.25,
    "completion": 1.25,
    "prompt_cache_write": 0.3125,
    "prompt_cache_read": 0.025
  },
  {
    "operator": "includes",
    "model": "claude-opus-4",
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 18.75,
    "prompt_cache_read": 1.5
  },
  {
    "operator": "includes",
    "model": "claude-opus-4-1",
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 18.75,
    "prompt_cache_read": 1.5
  },
  {
    "operator": "includes",
    "model": "claude-sonnet-4",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  {
    "operator": "includes",
    "model": "gpt-4o-mini-realtime",
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gpt-4o-mini-realtime",
    "prompt": 0.6,
    "completion": 2.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.3
  },
  {
    "operator": "includes",
    "model": "gpt-4o-realtime",
    "prompt": 5,
    "completion": 20,
    "prompt_cache_write": 0,
    "prompt_cache_read": 2.5
  },
  {
    "operator": "includes",
    "model": "gpt-4o-realtime",
    "prompt": 4,
    "completion": 16,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.4
  },
  {
    "operator": "includes",
    "model": "gpt-4o-search-preview",
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "grok-3",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "grok-3-mini",
    "prompt": 0.25,
    "completion": 1.27,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "o1-pro",
    "prompt": 150,
    "completion": 600,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "o3-pro",
    "prompt": 20,
    "completion": 80,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "o4-mini",
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.275
  },
  {
    "operator": "includes",
    "model": "o4-mini-2025-04-16",
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.275
  },
  {
    "operator": "includes",
    "model": "openai/gpt-4o-mini-search-preview",
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "claude-3-5-haiku",
    "prompt": 0.8,
    "completion": 4,
    "prompt_cache_write": 1,
    "prompt_cache_read": 0.08
  },
  {
    "operator": "includes",
    "model": "claude-3-5-sonnet",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  {
    "operator": "includes",
    "model": "claude-3-7-sonnet",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  {
    "operator": "includes",
    "model": "claude-3-haiku",
    "prompt": 0.25,
    "completion": 1.25,
    "prompt_cache_write": 0.3125,
    "prompt_cache_read": 0.025
  },
  {
    "operator": "includes",
    "model": "claude-opus-4",
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 18.75,
    "prompt_cache_read": 1.5
  },
  {
    "operator": "includes",
    "model": "claude-opus-4-1",
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 18.75,
    "prompt_cache_read": 1.5
  },
  {
    "operator": "includes",
    "model": "claude-sonnet-4",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 3.75,
    "prompt_cache_read": 0.3
  },
  {
    "operator": "includes",
    "model": "claude-3-5-haiku",
    "prompt": 0.8,
    "completion": 4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "claude-3-5-sonnet",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "claude-3-7-sonnet",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "claude-3-opus",
    "prompt": 15,
    "completion": 75,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-1.5-flash",
    "prompt": 0.35,
    "completion": 1.05,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-1.5-pro",
    "prompt": 3.5,
    "completion": 10.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-2.0-flash",
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-2.0-flash",
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-2.0-flash-lite",
    "prompt": 0.075,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-2.5-flash-image",
    "prompt": 0.3,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.075
  },
  {
    "operator": "includes",
    "model": "gemini-2.5-flash-lite",
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-2.5-flash-lite-preview-06-17",
    "prompt": 0.1,
    "completion": 0.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-2.5-flash-preview",
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-2.5-flash-preview-image",
    "prompt": 0.3,
    "completion": 2.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.075
  },
  {
    "operator": "includes",
    "model": "gemini-2.5-pro-preview",
    "prompt": 1.25,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gemini-3-flash-preview",
    "prompt": 0.5,
    "completion": 3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.05
  },
  {
    "operator": "includes",
    "model": "gemini-3-pro-preview",
    "prompt": 2,
    "completion": 12,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.2
  },
  {
    "operator": "includes",
    "model": "gemini-3.1-pro-preview",
    "prompt": 2,
    "completion": 12,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.2
  },
  {
    "operator": "includes",
    "model": "gemini-pro",
    "prompt": 0.125,
    "completion": 0.375,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "startsWith",
    "model": "ft:gpt-3.5-turbo-",
    "prompt": 3,
    "completion": 6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "startsWith",
    "model": "ft:gpt-4o-2024-08-06:",
    "prompt": 3.75,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "startsWith",
    "model": "ft:gpt-4o-mini-2024-07-18:",
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "startsWith",
    "model": "gpt-4o-mini-2024-07-18.ft-",
    "prompt": 0.3,
    "completion": 1.2,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "gpt-4o-mini-realtime",
    "prompt": 0.6,
    "completion": 2.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.3
  },
  {
    "operator": "includes",
    "model": "gpt-4o-realtime",
    "prompt": 4,
    "completion": 16,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.4
  },
  {
    "operator": "includes",
    "model": "gpt-4o-search-preview",
    "prompt": 2.5,
    "completion": 10,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "o1-pro",
    "prompt": 150,
    "completion": 600,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "o3-pro",
    "prompt": 20,
    "completion": 80,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "o4-mini",
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.275
  },
  {
    "operator": "includes",
    "model": "o4-mini-2025-04-16",
    "prompt": 1.1,
    "completion": 4.4,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0.275
  },
  {
    "operator": "includes",
    "model": "openai/gpt-4o-mini-search-preview",
    "prompt": 0.15,
    "completion": 0.6,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "llama",
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "mistral",
    "prompt": 0.3,
    "completion": 0.3,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "grok-3",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "grok-3-mini",
    "prompt": 0.3,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "grok-4",
    "prompt": 3,
    "completion": 15,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "grok-4-fast",
    "prompt": 0.2,
    "completion": 0.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  },
  {
    "operator": "includes",
    "model": "grok-code-fast-1",
    "prompt": 0.2,
    "completion": 1.5,
    "prompt_cache_write": 0,
    "prompt_cache_read": 0
  }
];

/**
 * Calculates the exact cost in USD for a given request.
 * Cost calculation is per 1 million tokens.
 *
 * @param promptTokens The number of prompt/input tokens.
 * @param completionTokens The number of completion/output tokens.
 * @param model The ID of the model used.
 * @returns The total cost in USD.
 */
export function calculateCost(promptTokens: number, completionTokens: number, model: string | null | undefined): number {
  if (!model) return 0;
  
  let pricing = EXACT_MATCH_PRICING[model];
  
  // If the exact model ID isn't found, try fuzzy matching
  if (!pricing) {
    for (const rule of FUZZY_MATCH_PRICING) {
      if (rule.operator === "includes" && model.includes(rule.model)) {
        pricing = rule;
        break;
      }
      if (rule.operator === "startsWith" && model.startsWith(rule.model)) {
        pricing = rule;
        break;
      }
    }
  }

  // Fallback to default if absolutely no match
  if (!pricing) {
    pricing = EXACT_MATCH_PRICING["default"];
  }

  const promptCost = (promptTokens / 1_000_000) * pricing.prompt;
  const completionCost = (completionTokens / 1_000_000) * pricing.completion;

  return promptCost + completionCost;
}
