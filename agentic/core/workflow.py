"""
Workflow Engine - Core state machine and execution logic
"""

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

from .types import (
    WorkflowState, WorkflowStatus, WorkflowStep, WorkflowDefinition,
    WorkflowError, StepExecutionError
)

logger = logging.getLogger(__name__)


class WorkflowCheckpoint:
    """Manages workflow checkpoints for recovery"""
    
    def __init__(self, storage: Optional[Any] = None):
        self.storage = storage
        self._memory_checkpoints: Dict[str, List[Dict]] = {}
    
    async def save(self, workflow_id: str, state: Dict[str, Any]) -> None:
        """Save a checkpoint"""
        checkpoint = {
            "workflow_id": workflow_id,
            "state": state,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if self.storage:
            # Save to persistent storage (e.g., Supabase)
            pass  # Implementation depends on storage backend
        else:
            # In-memory storage
            if workflow_id not in self._memory_checkpoints:
                self._memory_checkpoints[workflow_id] = []
            self._memory_checkpoints[workflow_id].append(checkpoint)
    
    async def load(self, workflow_id: str, step_index: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Load a checkpoint"""
        if self.storage:
            # Load from persistent storage
            pass
        else:
            # In-memory storage
            checkpoints = self._memory_checkpoints.get(workflow_id, [])
            if not checkpoints:
                return None
            
            if step_index is not None:
                # Find checkpoint at or before step_index
                for cp in reversed(checkpoints):
                    if cp["state"].get("current_step", 0) <= step_index:
                        return cp["state"]
            return checkpoints[-1]["state"]
    
    async def list_checkpoints(self, workflow_id: str) -> List[Dict[str, Any]]:
        """List all checkpoints for a workflow"""
        if self.storage:
            pass
        else:
            return self._memory_checkpoints.get(workflow_id, [])


class WorkflowEngine:
    """
    Core workflow engine that manages workflow execution.
    Uses Pushmycv-fastify database for state persistence.
    """
    
    def __init__(
        self,
        workflow_def: WorkflowDefinition,
        checkpoint_storage: Optional[Any] = None,
        on_step_complete: Optional[Callable[[str, int, Any], None]] = None,
        on_error: Optional[Callable[[str, Exception], None]] = None
    ):
        self.workflow_def = workflow_def
        self.checkpoint_manager = WorkflowCheckpoint(checkpoint_storage)
        self.on_step_complete = on_step_complete
        self.on_error = on_error
        self._states: Dict[str, WorkflowState] = {}
    
    async def create_workflow(
        self,
        workflow_id: Optional[str] = None,
        initial_context: Optional[Dict[str, Any]] = None
    ) -> WorkflowState:
        """Create a new workflow instance"""
        workflow_id = workflow_id or f"wf_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{id(self)}"
        
        state = WorkflowState(
            workflow_id=workflow_id,
            status=WorkflowStatus.PENDING,
            context=initial_context or {},
            current_step=0
        )
        
        self._states[workflow_id] = state
        logger.info(f"Created workflow {workflow_id}")
        return state
    
    async def run(
        self,
        workflow_id: str,
        from_step: int = 0,
        resume: bool = False
    ) -> WorkflowState:
        """
        Execute the workflow from a specific step.
        
        Args:
            workflow_id: The workflow instance ID
            from_step: Step index to start from (for resuming)
            resume: Whether to resume from last checkpoint
        """
        state = self._states.get(workflow_id)
        if not state:
            raise WorkflowError(f"Workflow {workflow_id} not found")
        
        if resume:
            checkpoint = await self.checkpoint_manager.load(workflow_id)
            if checkpoint:
                state = WorkflowState.from_dict(checkpoint)
                self._states[workflow_id] = state
                from_step = state.current_step
        
        state.status = WorkflowStatus.RUNNING
        state.updated_at = datetime.utcnow()
        
        try:
            for i in range(from_step, len(self.workflow_def.steps)):
                step = self.workflow_def.steps[i]
                state.current_step = i
                
                logger.info(f"Executing step {i}: {step.name}")
                
                # Execute with retry logic
                result = await self._execute_step_with_retry(step, state.context)
                
                # Update context with step result
                state.context[f"step_{step.name}"] = result
                state.context[f"step_{i}_result"] = result
                
                # Save checkpoint
                await self.checkpoint_manager.save(workflow_id, state.to_dict())
                
                # Trigger callback
                if self.on_step_complete:
                    self.on_step_complete(workflow_id, i, result)
                
                state.updated_at = datetime.utcnow()
            
            # Mark as completed
            state.status = WorkflowStatus.COMPLETED
            state.result = state.context
            logger.info(f"Workflow {workflow_id} completed successfully")
            
        except Exception as e:
            state.status = WorkflowStatus.FAILED
            state.error_message = str(e)
            logger.error(f"Workflow {workflow_id} failed: {e}")
            
            if self.on_error:
                self.on_error(workflow_id, e)
            
            raise WorkflowError(f"Workflow failed at step {state.current_step}: {e}") from e
        
        finally:
            state.updated_at = datetime.utcnow()
            await self.checkpoint_manager.save(workflow_id, state.to_dict())
        
        return state
    
    async def _execute_step_with_retry(
        self,
        step: WorkflowStep,
        context: Dict[str, Any]
    ) -> Any:
        """Execute a step with retry logic"""
        last_error = None
        
        for attempt in range(step.retry_count):
            try:
                if asyncio.iscoroutinefunction(step.executor):
                    result = await step.executor(context)
                else:
                    result = step.executor(context)
                return result
                
            except Exception as e:
                last_error = e
                logger.warning(f"Step {step.name} attempt {attempt + 1} failed: {e}")
                
                if attempt < step.retry_count - 1:
                    await asyncio.sleep(step.retry_delay * (attempt + 1))
        
        raise StepExecutionError(
            f"Step {step.name} failed after {step.retry_count} attempts: {last_error}"
        )
    
    async def pause(self, workflow_id: str) -> WorkflowState:
        """Pause a running workflow"""
        state = self._states.get(workflow_id)
        if not state:
            raise WorkflowError(f"Workflow {workflow_id} not found")
        
        if state.status == WorkflowStatus.RUNNING:
            state.status = WorkflowStatus.PAUSED
            state.updated_at = datetime.utcnow()
            await self.checkpoint_manager.save(workflow_id, state.to_dict())
            logger.info(f"Workflow {workflow_id} paused")
        
        return state
    
    async def cancel(self, workflow_id: str) -> WorkflowState:
        """Cancel a workflow"""
        state = self._states.get(workflow_id)
        if not state:
            raise WorkflowError(f"Workflow {workflow_id} not found")
        
        state.status = WorkflowStatus.CANCELLED
        state.updated_at = datetime.utcnow()
        await self.checkpoint_manager.save(workflow_id, state.to_dict())
        logger.info(f"Workflow {workflow_id} cancelled")
        
        return state
    
    def get_state(self, workflow_id: str) -> Optional[WorkflowState]:
        """Get current state of a workflow"""
        return self._states.get(workflow_id)
    
    async def get_checkpoints(self, workflow_id: str) -> List[Dict[str, Any]]:
        """Get all checkpoints for a workflow"""
        return await self.checkpoint_manager.list_checkpoints(workflow_id)


class WorkflowRegistry:
    """Registry for workflow definitions"""
    
    def __init__(self):
        self._workflows: Dict[str, WorkflowDefinition] = {}
    
    def register(self, workflow: WorkflowDefinition) -> None:
        """Register a workflow definition"""
        self._workflows[workflow.name] = workflow
        logger.info(f"Registered workflow: {workflow.name}")
    
    def get(self, name: str) -> Optional[WorkflowDefinition]:
        """Get a workflow definition by name"""
        return self._workflows.get(name)
    
    def list_workflows(self) -> List[str]:
        """List all registered workflow names"""
        return list(self._workflows.keys())
    
    def unregister(self, name: str) -> None:
        """Unregister a workflow"""
        if name in self._workflows:
            del self._workflows[name]
            logger.info(f"Unregistered workflow: {name}")


# Global registry instance
_registry = WorkflowRegistry()


def register_workflow(workflow: WorkflowDefinition) -> None:
    """Register a workflow in the global registry"""
    _registry.register(workflow)


def get_workflow(name: str) -> Optional[WorkflowDefinition]:
    """Get a workflow from the global registry"""
    return _registry.get(name)


def list_workflows() -> List[str]:
    """List all workflows in the global registry"""
    return _registry.list_workflows()
