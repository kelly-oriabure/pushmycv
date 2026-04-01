"""
Agentic layer - ReAct pattern implementation with LLM integration
"""

import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime
from typing import Any, Dict, List, Optional, Callable

from .types import (
    AgentConfig, AgentAction, AgentActionType, AgentObservation,
    BaseTool, ToolDefinition, AgentError
)
from ..llm.client import LLMClient

logger = logging.getLogger(__name__)


class AgentMemory:
    """Short-term memory for agent conversations and context"""
    
    def __init__(self, max_history: int = 10):
        self.max_history = max_history
        self._actions: List[AgentAction] = []
        self._observations: List[AgentObservation] = []
        self._context: Dict[str, Any] = {}
    
    def add_action(self, action: AgentAction) -> None:
        """Add an action to memory"""
        self._actions.append(action)
        if len(self._actions) > self.max_history:
            self._actions.pop(0)
    
    def add_observation(self, observation: AgentObservation) -> None:
        """Add an observation to memory"""
        self._observations.append(observation)
        if len(self._observations) > self.max_history:
            self._observations.pop(0)
    
    def set_context(self, key: str, value: Any) -> None:
        """Set a context variable"""
        self._context[key] = value
    
    def get_context(self, key: str) -> Optional[Any]:
        """Get a context variable"""
        return self._context.get(key)
    
    def get_history(self) -> List[Dict[str, Any]]:
        """Get the full action-observation history"""
        history = []
        for action, obs in zip(self._actions, self._observations):
            history.append({
                "action": {
                    "type": action.action_type.value,
                    "content": action.content,
                    "tool_name": action.tool_name,
                    "timestamp": action.timestamp.isoformat()
                },
                "observation": {
                    "tool_name": obs.tool_name,
                    "success": obs.success,
                    "result": str(obs.result)[:200],  # Truncate for brevity
                    "timestamp": obs.timestamp.isoformat()
                } if obs else None
            })
        return history
    
    def clear(self) -> None:
        """Clear all memory"""
        self._actions.clear()
        self._observations.clear()
        self._context.clear()


class ToolRegistry:
    """Registry for agent tools"""
    
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
    
    def register(self, tool: BaseTool) -> None:
        """Register a tool"""
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")
    
    def register_many(self, tools: List[BaseTool]) -> None:
        """Register multiple tools"""
        for tool in tools:
            self.register(tool)
    
    def get(self, name: str) -> Optional[BaseTool]:
        """Get a tool by name"""
        return self._tools.get(name)
    
    def list_tools(self) -> List[str]:
        """List all registered tool names"""
        return list(self._tools.keys())
    
    def get_schemas(self) -> List[Dict[str, Any]]:
        """Get schemas for all tools (for LLM function calling)"""
        return [tool.get_schema() for tool in self._tools.values()]
    
    async def execute(self, name: str, params: Dict[str, Any]) -> AgentObservation:
        """Execute a tool by name"""
        tool = self._tools.get(name)
        if not tool:
            return AgentObservation(
                tool_name=name,
                result=None,
                success=False,
                error_message=f"Tool '{name}' not found"
            )
        
        try:
            result = await tool.execute(params)
            return AgentObservation(
                tool_name=name,
                result=result,
                success=True
            )
        except Exception as e:
            logger.error(f"Tool execution error: {e}")
            return AgentObservation(
                tool_name=name,
                result=None,
                success=False,
                error_message=str(e)
            )
    
    def unregister(self, name: str) -> None:
        """Unregister a tool"""
        if name in self._tools:
            del self._tools[name]
            logger.info(f"Unregistered tool: {name}")


class BaseAgent(ABC):
    """
    Base agent implementing the ReAct (Reasoning + Acting) pattern.
    
    The agent follows this loop:
    1. REASON: Think about what to do next
    2. ACT: Choose a tool to use or provide final answer
    3. OBSERVE: Get result from tool execution
    4. Repeat until final answer or max iterations
    """
    
    def __init__(
        self,
        config: AgentConfig,
        llm_client: Optional[LLMClient] = None,
        tool_registry: Optional[ToolRegistry] = None
    ):
        self.config = config
        self.llm = llm_client or LLMClient()
        self.tools = tool_registry or ToolRegistry()
        self.memory = AgentMemory() if config.memory_enabled else None
        self._iteration = 0
    
    async def run(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        max_iterations: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Run the agent on a task using ReAct pattern.
        
        Args:
            task: The task description/prompt
            context: Additional context variables
            max_iterations: Override max iterations from config
        
        Returns:
            Dict with final_answer, history, and metadata
        """
        max_iter = max_iterations or self.config.max_iterations
        
        if context:
            for key, value in context.items():
                if self.memory:
                    self.memory.set_context(key, value)
        
        # Initialize with reasoning step
        current_prompt = task
        
        for iteration in range(max_iter):
            self._iteration = iteration
            
            # Step 1: REASON - Think about what to do
            reasoning = await self._reason(current_prompt)
            
            if self.memory:
                self.memory.add_action(AgentAction(
                    action_type=AgentActionType.REASONING,
                    content=reasoning
                ))
            
            # Step 2: ACT - Decide on action
            action = await self._act(reasoning)
            
            if self.memory:
                self.memory.add_action(action)
            
            # Check if final answer
            if action.action_type == AgentActionType.FINAL_ANSWER:
                return {
                    "final_answer": action.content,
                    "history": self.memory.get_history() if self.memory else [],
                    "iterations": iteration + 1,
                    "success": True
                }
            
            # Step 3: OBSERVE - Execute tool and observe result
            if action.action_type == AgentActionType.TOOL_CALL and action.tool_name:
                observation = await self.tools.execute(
                    action.tool_name,
                    action.tool_params or {}
                )
                
                if self.memory:
                    self.memory.add_observation(observation)
                
                # Update prompt for next iteration
                current_prompt = self._format_observation(observation)
            else:
                # No tool call, treat as observation
                observation = AgentObservation(
                    tool_name="reasoning",
                    result=action.content,
                    success=True
                )
                if self.memory:
                    self.memory.add_observation(observation)
                current_prompt = action.content
        
        # Max iterations reached
        return {
            "final_answer": None,
            "history": self.memory.get_history() if self.memory else [],
            "iterations": max_iter,
            "success": False,
            "error": "Maximum iterations reached"
        }
    
    async def _reason(self, prompt: str) -> str:
        """Generate reasoning about the next step"""
        system_prompt = self._build_system_prompt()
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        # Add history if available
        if self.memory:
            history = self.memory.get_history()
            if history:
                messages.append({
                    "role": "user",
                    "content": f"Previous actions: {json.dumps(history[-3:], indent=2)}"
                })
        
        response = await self.llm.chat(
            messages=messages,
            model=self.config.model,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens
        )
        
        return response
    
    async def _act(self, reasoning: str) -> AgentAction:
        """Decide on the next action based on reasoning"""
        tool_schemas = self.tools.get_schemas()
        
        system_prompt = """Based on your reasoning, decide on the next action.
You can either:
1. Call a tool with parameters
2. Provide a final answer

Respond in JSON format:
{
    "action_type": "tool_call" | "final_answer",
    "tool_name": "name_of_tool" (if tool_call),
    "tool_params": {param: value} (if tool_call),
    "content": "your reasoning or final answer"
}"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": reasoning},
            {"role": "user", "content": f"Available tools: {json.dumps(tool_schemas)}"}
        ]
        
        response = await self.llm.chat(
            messages=messages,
            model=self.config.model,
            temperature=0.3,  # Lower temp for structured output
            max_tokens=1000
        )
        
        try:
            # Try to parse as JSON
            action_data = json.loads(response)
            return AgentAction(
                action_type=AgentActionType(action_data.get("action_type", "reasoning")),
                content=action_data.get("content", ""),
                tool_name=action_data.get("tool_name"),
                tool_params=action_data.get("tool_params", {})
            )
        except (json.JSONDecodeError, ValueError):
            # If not valid JSON, treat as reasoning
            return AgentAction(
                action_type=AgentActionType.REASONING,
                content=response
            )
    
    def _build_system_prompt(self) -> str:
        """Build the system prompt for the agent"""
        base_prompt = self.config.system_prompt or """You are a helpful AI assistant that can use tools to accomplish tasks.
Think step by step about what needs to be done, then take action.
Be thorough but concise in your reasoning."""
        
        tool_info = "\n\nAvailable tools:\n"
        for tool_name in self.tools.list_tools():
            tool = self.tools.get(tool_name)
            if tool:
                tool_info += f"- {tool_name}: {tool.description}\n"
        
        return base_prompt + tool_info
    
    def _format_observation(self, observation: AgentObservation) -> str:
        """Format observation for next reasoning step"""
        if observation.success:
            return f"Tool '{observation.tool_name}' returned: {json.dumps(observation.result, default=str)}"
        else:
            return f"Tool '{observation.tool_name}' failed: {observation.error_message}"
    
    def reset(self) -> None:
        """Reset the agent state"""
        self._iteration = 0
        if self.memory:
            self.memory.clear()


class PlanAndSolveAgent(BaseAgent):
    """
    Agent that first creates a plan, then executes it step by step.
    Good for complex multi-step tasks.
    """
    
    async def run(
        self,
        task: str,
        context: Optional[Dict[str, Any]] = None,
        max_iterations: Optional[int] = None
    ) -> Dict[str, Any]:
        """Run with planning phase first"""
        
        # Step 1: Create plan
        plan = await self._create_plan(task, context)
        logger.info(f"Created plan with {len(plan)} steps")
        
        # Step 2: Execute plan
        results = []
        for i, step in enumerate(plan):
            logger.info(f"Executing plan step {i+1}: {step}")
            
            step_context = {
                **(context or {}),
                "plan_step": i + 1,
                "plan_total": len(plan),
                "step_description": step,
                "previous_results": results
            }
            
            result = await super().run(step, step_context, max_iterations=3)
            results.append(result)
            
            if not result.get("success"):
                return {
                    "final_answer": None,
                    "plan": plan,
                    "results": results,
                    "success": False,
                    "error": f"Plan step {i+1} failed"
                }
        
        # Step 3: Synthesize final answer
        final_answer = await self._synthesize_results(task, plan, results)
        
        return {
            "final_answer": final_answer,
            "plan": plan,
            "results": results,
            "success": True
        }
    
    async def _create_plan(
        self,
        task: str,
        context: Optional[Dict[str, Any]]
    ) -> List[str]:
        """Create a step-by-step plan for the task"""
        system_prompt = """You are a planning assistant. Break down the given task into clear, actionable steps.
Respond with a JSON array of steps."""

        prompt = f"Task: {task}\n\nCreate a plan with specific steps."
        if context:
            prompt += f"\nContext: {json.dumps(context, default=str)}"
        
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
        
        response = await self.llm.chat(
            messages=messages,
            model=self.config.model,
            temperature=0.5,
            max_tokens=1000
        )
        
        try:
            plan = json.loads(response)
            if isinstance(plan, list):
                return plan
            elif isinstance(plan, dict) and "steps" in plan:
                return plan["steps"]
            else:
                return [str(plan)]
        except json.JSONDecodeError:
            # If not JSON, split by lines
            return [line.strip() for line in response.split("\n") if line.strip()]
    
    async def _synthesize_results(
        self,
        task: str,
        plan: List[str],
        results: List[Dict[str, Any]]
    ) -> str:
        """Synthesize results from plan execution"""
        system_prompt = "Synthesize the results from executed plan steps into a coherent final answer."
        
        synthesis_prompt = f"""Original task: {task}

Plan executed:
{json.dumps(plan, indent=2)}

Results from each step:
{json.dumps([r.get("final_answer", "") for r in results], indent=2)}

Provide a final synthesized answer."""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": synthesis_prompt}
        ]
        
        return await self.llm.chat(
            messages=messages,
            model=self.config.model,
            temperature=0.7,
            max_tokens=self.config.max_tokens
        )
