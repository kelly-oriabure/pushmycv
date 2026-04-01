"""
Tool Base Classes and Registry
"""

from abc import abstractmethod
from typing import Any, Dict, Generic, TypeVar

from ..core.types import BaseTool


T = TypeVar('T')


class ResumeTool(BaseTool[T]):
    """Base class for resume-related tools"""
    
    def __init__(self, name: str, description: str):
        super().__init__(name, description)
    
    @abstractmethod
    async def execute(self, params: Dict[str, Any]) -> T:
        """Execute the tool with resume-related parameters"""
        pass


class TextTool(BaseTool[T]):
    """Base class for text processing tools"""
    
    def __init__(self, name: str, description: str):
        super().__init__(name, description)


class AnalysisTool(BaseTool[T]):
    """Base class for analysis tools"""
    
    def __init__(self, name: str, description: str):
        super().__init__(name, description)
