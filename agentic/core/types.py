"""
Core types for the WAT Framework
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum, auto
from typing import Any, Callable, Dict, Generic, List, Optional, TypeVar, Union
from pydantic import BaseModel, Field
import uuid


class WorkflowStatus(str, Enum):
    """Workflow execution status"""
    PENDING = "pending"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class StepStatus(str, Enum):
    """Individual step status"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class AgentActionType(str, Enum):
    """Types of agent actions"""
    REASONING = "reasoning"
    TOOL_CALL = "tool_call"
    OBSERVATION = "observation"
    FINAL_ANSWER = "final_answer"


@dataclass
class WorkflowState:
    """Represents the current state of a workflow execution"""
    workflow_id: str
    status: WorkflowStatus
    current_step: int = 0
    context: Dict[str, Any] = field(default_factory=dict)
    checkpoints: List[Dict[str, Any]] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)
    error_message: Optional[str] = None
    result: Optional[Any] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "workflow_id": self.workflow_id,
            "status": self.status.value,
            "current_step": self.current_step,
            "context": self.context,
            "checkpoints": self.checkpoints,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "error_message": self.error_message,
            "result": self.result
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "WorkflowState":
        return cls(
            workflow_id=data["workflow_id"],
            status=WorkflowStatus(data["status"]),
            current_step=data.get("current_step", 0),
            context=data.get("context", {}),
            checkpoints=data.get("checkpoints", []),
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            error_message=data.get("error_message"),
            result=data.get("result")
        )


@dataclass
class WorkflowStep:
    """A single step in a workflow"""
    name: str
    description: str
    executor: Callable[..., Any]
    retry_count: int = 3
    retry_delay: float = 1.0
    depends_on: Optional[List[str]] = None
    
    async def execute(self, context: Dict[str, Any]) -> Any:
        """Execute the step with the given context"""
        return await self.executor(context)


@dataclass
class WorkflowDefinition:
    """Definition of a complete workflow"""
    name: str
    description: str
    steps: List[WorkflowStep]
    version: str = "1.0.0"
    
    def get_step_index(self, step_name: str) -> int:
        """Get the index of a step by name"""
        for i, step in enumerate(self.steps):
            if step.name == step_name:
                return i
        return -1


class ToolDefinition(BaseModel):
    """Definition of a tool that can be used by agents"""
    name: str
    description: str
    parameters: Dict[str, Any] = Field(default_factory=dict)
    required_params: List[str] = Field(default_factory=list)
    
    def validate_params(self, params: Dict[str, Any]) -> bool:
        """Validate that all required parameters are present"""
        return all(param in params for param in self.required_params)


@dataclass
class AgentAction:
    """An action taken by an agent"""
    action_type: AgentActionType
    content: str
    tool_name: Optional[str] = None
    tool_params: Optional[Dict[str, Any]] = None
    observation: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AgentConfig:
    """Configuration for an agent"""
    name: str
    model: str = "gpt-4"
    temperature: float = 0.7
    max_tokens: int = 2000
    system_prompt: str = ""
    tools: List[str] = field(default_factory=list)
    memory_enabled: bool = True
    max_iterations: int = 10


@dataclass
class AgentObservation:
    """Observation from tool execution"""
    tool_name: str
    result: Any
    success: bool
    error_message: Optional[str] = None
    timestamp: datetime = field(default_factory=datetime.utcnow)


T = TypeVar('T')


class BaseTool(ABC, Generic[T]):
    """Base class for all tools"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self._definition = ToolDefinition(
            name=name,
            description=description
        )
    
    @property
    def definition(self) -> ToolDefinition:
        return self._definition
    
    @abstractmethod
    async def execute(self, params: Dict[str, Any]) -> T:
        """Execute the tool with given parameters"""
        pass
    
    def get_schema(self) -> Dict[str, Any]:
        """Get the tool schema for LLM function calling"""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self._definition.parameters
        }


class WorkflowError(Exception):
    """Base exception for workflow errors"""
    pass


class StepExecutionError(WorkflowError):
    """Error during step execution"""
    pass


class ToolExecutionError(WorkflowError):
    """Error during tool execution"""
    pass


class AgentError(WorkflowError):
    """Error during agent execution"""
    pass
