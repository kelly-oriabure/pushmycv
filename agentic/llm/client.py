"""
LLM Client - Unified interface for OpenAI and Anthropic APIs
"""

import os
import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class BaseLLMClient(ABC):
    """Abstract base class for LLM clients"""
    
    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> str:
        """Send a chat completion request"""
        pass
    
    @abstractmethod
    async def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        """Get embeddings for texts"""
        pass


class OpenAIClient(BaseLLMClient):
    """OpenAI API client"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OpenAI API key not provided")
        
        try:
            import openai
            self.client = openai.AsyncOpenAI(api_key=self.api_key)
        except ImportError:
            raise ImportError("OpenAI package not installed. Run: pip install openai")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> str:
        """Send chat completion request to OpenAI"""
        model = model or "gpt-4"
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            raise
    
    async def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        """Get embeddings from OpenAI"""
        model = model or "text-embedding-3-small"
        
        try:
            response = await self.client.embeddings.create(
                model=model,
                input=texts
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            logger.error(f"OpenAI embedding error: {e}")
            raise


class OpenRouterClient(BaseLLMClient):
    """OpenRouter API client - OpenAI-compatible API for multiple models"""
    
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.getenv("APP_LLM_API_KEY") or os.getenv("OPENROUTER_API_KEY")
        self.base_url = base_url or os.getenv("APP_LLM_BASE_URL") or os.getenv("OPENROUTER_BASE_URL") or "https://openrouter.ai/api/v1"
        if not self.api_key:
            raise ValueError("OpenRouter API key not provided. Set APP_LLM_API_KEY or OPENROUTER_API_KEY")
        
        try:
            import openai
            self.client = openai.AsyncOpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
        except ImportError:
            raise ImportError("OpenAI package not installed. Run: pip install openai")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> str:
        """Send chat completion request to OpenRouter"""
        model = model or os.getenv("APP_LLM_MODEL") or "deepseek/deepseek-chat"
        
        try:
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            logger.error(f"OpenRouter API error: {e}")
            raise
    
    async def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        """Get embeddings from OpenRouter (if supported) or fall back to OpenAI"""
        # Try to use OpenRouter for embeddings if available, otherwise use text-embedding model
        model = model or "openai/text-embedding-3-small"
        
        try:
            response = await self.client.embeddings.create(
                model=model,
                input=texts
            )
            return [item.embedding for item in response.data]
        except Exception as e:
            logger.error(f"OpenRouter embedding error: {e}")
            raise


class AnthropicClient(BaseLLMClient):
    """Anthropic Claude API client"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self.api_key:
            raise ValueError("Anthropic API key not provided")
        
        try:
            import anthropic
            self.client = anthropic.AsyncAnthropic(api_key=self.api_key)
        except ImportError:
            raise ImportError("Anthropic package not installed. Run: pip install anthropic")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> str:
        """Send chat completion request to Anthropic"""
        model = model or "claude-3-sonnet-20240229"
        
        # Convert messages to Anthropic format
        system_message = None
        chat_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                chat_messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        try:
            response = await self.client.messages.create(
                model=model,
                messages=chat_messages,
                system=system_message or "",
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
            return response.content[0].text if response.content else ""
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            raise
    
    async def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        """Anthropic doesn't have embeddings API yet"""
        raise NotImplementedError("Anthropic does not support embeddings. Use OpenAI for embeddings.")


class LLMClient:
    """
    Unified LLM client that supports multiple providers.
    Auto-detects provider from model name.
    """
    
    def __init__(
        self,
        provider: Optional[str] = None,
        openai_key: Optional[str] = None,
        anthropic_key: Optional[str] = None,
        openrouter_key: Optional[str] = None
    ):
        self.provider = provider or os.getenv("LLM_PROVIDER", "openrouter")
        self._openai_client: Optional[OpenAIClient] = None
        self._anthropic_client: Optional[AnthropicClient] = None
        self._openrouter_client: Optional[OpenRouterClient] = None
        self._openai_key = openai_key
        self._anthropic_key = anthropic_key
        self._openrouter_key = openrouter_key
    
    def _get_client(self, model: Optional[str] = None) -> BaseLLMClient:
        """Get appropriate client based on model or provider setting"""
        
        # Detect provider from model name
        if model:
            if "claude" in model.lower():
                provider = "anthropic"
            elif "gpt" in model.lower() or model.startswith("text-"):
                provider = "openai"
            elif "/" in model:  # OpenRouter uses provider/model format
                provider = "openrouter"
            else:
                provider = self.provider
        else:
            provider = self.provider
        
        if provider == "openai":
            if not self._openai_client:
                self._openai_client = OpenAIClient(self._openai_key)
            return self._openai_client
        elif provider == "anthropic":
            if not self._anthropic_client:
                self._anthropic_client = AnthropicClient(self._anthropic_key)
            return self._anthropic_client
        elif provider == "openrouter":
            if not self._openrouter_client:
                self._openrouter_client = OpenRouterClient(self._openrouter_key)
            return self._openrouter_client
        else:
            raise ValueError(f"Unknown provider: {provider}")
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs
    ) -> str:
        """Send chat completion request"""
        client = self._get_client(model)
        return await client.chat(messages, model, temperature, max_tokens, **kwargs)
    
    async def embed(self, texts: List[str], model: Optional[str] = None) -> List[List[float]]:
        """Get embeddings (uses OpenRouter or OpenAI)"""
        if self.provider == "openrouter":
            if not self._openrouter_client:
                self._openrouter_client = OpenRouterClient(self._openrouter_key)
            return await self._openrouter_client.embed(texts, model)
        else:
            if not self._openai_client:
                self._openai_client = OpenAIClient(self._openai_key)
            return await self._openai_client.embed(texts, model)


# Convenience function for quick LLM calls
async def llm_chat(
    prompt: str,
    system_prompt: Optional[str] = None,
    model: str = None,
    temperature: float = 0.7,
    max_tokens: int = 2000
) -> str:
    """Quick chat completion with a single prompt"""
    client = LLMClient()
    
    # Use model from env if not provided
    if model is None:
        model = os.getenv("APP_LLM_MODEL", "deepseek/deepseek-chat")
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    
    return await client.chat(messages, model, temperature, max_tokens)
