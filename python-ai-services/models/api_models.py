"""
Simplified API models for Phase 10 integration
"""

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class APIResponse(BaseModel):
    """Generic API response model"""
    success: bool = True
    message: str = ""
    data: Optional[Dict[str, Any]] = None
    timestamp: datetime = datetime.now()

class ErrorResponse(BaseModel):
    """Error response model"""
    success: bool = False
    error: str
    details: Optional[str] = None
    timestamp: datetime = datetime.now()

class TradingAnalysisCrewRequest(BaseModel):
    """Trading analysis crew request model"""
    symbol: str
    analysis_type: str = "comprehensive"
    market_data: Optional[Dict[str, Any]] = None
    portfolio_context: Optional[Dict[str, Any]] = None

class CrewRunResponse(BaseModel):
    """Crew run response model"""
    crew_id: str
    status: str
    result: Optional[Dict[str, Any]] = None
    execution_time: Optional[float] = None
    timestamp: datetime = datetime.now()

# Trading models
class TradeDecisionAction(str, Enum):
    """Trade decision actions"""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"

class TradingSignal(BaseModel):
    """Trading signal model"""
    symbol: str
    action: TradeDecisionAction
    confidence: float
    reasoning: str
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    timestamp: datetime = datetime.now()

class BaseResponseModel(BaseModel):
    """Base response model"""
    success: bool = True
    message: str = ""
    timestamp: datetime = datetime.now()

class ErrorDetail(BaseModel):
    """Error detail model"""
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None

class TradingDecision(BaseModel):
    """Trading decision model"""
    symbol: str
    action: TradeDecisionAction
    quantity: float
    confidence: float
    reasoning: str
    risk_level: str = "medium"

class ExecuteTradeRequest(BaseModel):
    """Execute trade request"""
    agent_id: str
    symbol: str
    action: TradeDecisionAction
    quantity: float
    price: Optional[float] = None

class ExecuteTradeResponse(BaseModel):
    """Execute trade response"""
    success: bool
    trade_id: Optional[str] = None
    message: str
    timestamp: datetime = datetime.now()

class RegisterAgentRequest(BaseModel):
    """Register agent request"""
    agent_id: str
    name: str
    strategy: str
    config: Dict[str, Any]

class RegisterAgentResponse(BaseModel):
    """Register agent response"""
    success: bool
    agent_id: str
    message: str
    timestamp: datetime = datetime.now()

class AgentStatusResponse(BaseModel):
    """Agent status response"""
    agent_id: str
    status: str
    performance: Dict[str, Any]
    positions: List[Dict[str, Any]]
    timestamp: datetime = datetime.now()

class AgentTradingHistoryResponse(BaseModel):
    """Agent trading history response"""
    agent_id: str
    trades: List[Dict[str, Any]]
    summary: Dict[str, Any]
    timestamp: datetime = datetime.now()

class TradeExecutionResult(BaseModel):
    """Trade execution result"""
    success: bool
    execution_id: str
    symbol: str
    quantity: float
    price: float
    timestamp: datetime = datetime.now()

class SetTradeExecutionModeRequest(BaseModel):
    """Set trade execution mode request"""
    mode: str  # "paper" or "live"
    agent_id: Optional[str] = None

class SetTradeExecutionModeResponse(BaseModel):
    """Set trade execution mode response"""
    success: bool
    mode: str
    message: str
    timestamp: datetime = datetime.now()

class GetTradeExecutionModeResponse(BaseModel):
    """Get trade execution mode response"""
    mode: str
    agents: Dict[str, str]
    timestamp: datetime = datetime.now()