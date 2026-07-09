from pydantic import BaseModel
from typing import List, Optional


class QueryResponse(BaseModel):
    answer: str
    sources: Optional[List[str]] = None