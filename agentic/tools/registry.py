"""
Tool Registry - Unified tool management
"""

from typing import Any, Dict, List, Optional
from ..core.types import BaseTool


class ToolRegistry:
    """Registry for managing and executing tools"""
    
    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}
    
    def register(self, tool: BaseTool) -> "ToolRegistry":
        """Register a tool - returns self for chaining"""
        self._tools[tool.name] = tool
        return self
    
    def register_many(self, tools: List[BaseTool]) -> "ToolRegistry":
        """Register multiple tools"""
        for tool in tools:
            self.register(tool)
        return self
    
    def get(self, name: str) -> Optional[BaseTool]:
        """Get a tool by name"""
        return self._tools.get(name)
    
    def list_tools(self) -> List[str]:
        """List all registered tool names"""
        return list(self._tools.keys())
    
    def get_schemas(self) -> List[Dict[str, Any]]:
        """Get schemas for all tools"""
        return [tool.get_schema() for tool in self._tools.values()]
    
    async def execute(self, name: str, params: Dict[str, Any]) -> Any:
        """Execute a tool by name"""
        tool = self._tools.get(name)
        if not tool:
            raise ValueError(f"Tool '{name}' not found")
        return await tool.execute(params)
    
    def unregister(self, name: str) -> None:
        """Unregister a tool"""
        if name in self._tools:
            del self._tools[name]
    
    def clear(self) -> None:
        """Clear all tools"""
        self._tools.clear()
