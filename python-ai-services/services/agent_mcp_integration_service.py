"""
Agent-MCP Integration Service
Automatically provides MCP server access to all created agents
Ensures agents are immediately functional with trading capabilities
"""

import asyncio
import logging
import json
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import aiohttp

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class AgentStatus(Enum):
    """Agent operational status"""
    CREATING = "creating"
    ACTIVE = "active"
    PAUSED = "paused"
    ERROR = "error"
    SUSPENDED = "suspended"

class MCPServerType(Enum):
    """Available MCP server types"""
    HFT_ARBITRAGE = "hft_arbitrage_mcp"
    MULTICHAIN_TRADING = "multichain_trading_mcp"
    AGENT_FUNDING = "agent_funding_mcp"
    REALTIME_PRICE = "realtime_price_mcp"
    RISK_MANAGEMENT = "risk_management_mcp"

@dataclass
class MCPServerConfig:
    """MCP server configuration"""
    server_type: MCPServerType
    host: str
    port: int
    endpoint: str
    capabilities: List[str]
    tools_count: int
    auto_register: bool = True

@dataclass
class AgentMCPProfile:
    """Agent's MCP integration profile"""
    agent_id: str
    agent_name: str
    created_at: datetime
    status: AgentStatus
    assigned_mcp_servers: List[str]
    available_tools: int
    registration_status: Dict[str, str]
    last_activity: Optional[datetime]
    tool_usage_stats: Dict[str, int]
    permissions: Dict[str, bool]
    funding_status: str
    auto_access_enabled: bool

class AgentMCPIntegrationService:
    """
    Service for automatic MCP integration with created agents
    """
    
    def __init__(self):
        self.agent_profiles: Dict[str, AgentMCPProfile] = {}
        self.mcp_servers: Dict[str, MCPServerConfig] = {}
        self.integration_queue: asyncio.Queue = asyncio.Queue()
        self.running = False
        
        # Default MCP server configurations
        self._initialize_mcp_servers()
        
        logger.info("Agent-MCP Integration Service initialized")
    
    def _initialize_mcp_servers(self):
        """Initialize available MCP servers"""
        self.mcp_servers = {
            "hft_arbitrage_mcp": MCPServerConfig(
                server_type=MCPServerType.HFT_ARBITRAGE,
                host="localhost",
                port=8001,
                endpoint="http://localhost:8001",
                capabilities=["arbitrage_detection", "execution", "performance_monitoring"],
                tools_count=6
            ),
            "multichain_trading_mcp": MCPServerConfig(
                server_type=MCPServerType.MULTICHAIN_TRADING,
                host="localhost", 
                port=8002,
                endpoint="http://localhost:8002",
                capabilities=["cross_chain_trading", "bridging", "portfolio_management"],
                tools_count=8
            ),
            "agent_funding_mcp": MCPServerConfig(
                server_type=MCPServerType.AGENT_FUNDING,
                host="localhost",
                port=8003,
                endpoint="http://localhost:8003",
                capabilities=["funding_requests", "performance_allocation", "analytics"],
                tools_count=4
            ),
            "realtime_price_mcp": MCPServerConfig(
                server_type=MCPServerType.REALTIME_PRICE,
                host="localhost",
                port=8004,
                endpoint="http://localhost:8004",
                capabilities=["price_feeds", "spread_monitoring", "market_data"],
                tools_count=5
            ),
            "risk_management_mcp": MCPServerConfig(
                server_type=MCPServerType.RISK_MANAGEMENT,
                host="localhost",
                port=8005,
                endpoint="http://localhost:8005",
                capabilities=["risk_assessment", "exposure_monitoring", "emergency_controls"],
                tools_count=6
            )
        }
    
    async def start_integration_service(self):
        """Start the integration service"""
        self.running = True
        
        # Start background tasks
        tasks = [
            asyncio.create_task(self._process_integration_queue()),
            asyncio.create_task(self._monitor_mcp_servers()),
            asyncio.create_task(self._periodic_health_check()),
            asyncio.create_task(self._sync_agent_statuses())
        ]
        
        logger.info("Agent-MCP Integration Service started")
        await asyncio.gather(*tasks)
    
    async def register_new_agent(self, 
                               agent_id: str,
                               agent_name: str,
                               agent_config: Dict[str, Any] = None) -> AgentMCPProfile:
        """Automatically register new agent with MCP access"""
        
        logger.info(f"Registering new agent: {agent_id}")
        
        # Create agent profile
        profile = AgentMCPProfile(
            agent_id=agent_id,
            agent_name=agent_name,
            created_at=datetime.now(timezone.utc),
            status=AgentStatus.CREATING,
            assigned_mcp_servers=[],
            available_tools=0,
            registration_status={},
            last_activity=None,
            tool_usage_stats={},
            permissions={
                "trade": True,
                "arbitrage": True,
                "cross_chain": True,
                "funding_requests": True,
                "risk_monitoring": True
            },
            funding_status="pending",
            auto_access_enabled=True
        )
        
        # Store profile
        self.agent_profiles[agent_id] = profile
        
        # Queue for automatic integration
        await self.integration_queue.put({
            "action": "register_agent",
            "agent_id": agent_id,
            "agent_config": agent_config or {}
        })
        
        logger.info(f"Agent {agent_id} queued for automatic MCP integration")
        return profile
    
    async def _process_integration_queue(self):
        """Process agent integration requests"""
        while self.running:
            try:
                # Get next integration request
                request = await asyncio.wait_for(self.integration_queue.get(), timeout=1.0)
                
                if request["action"] == "register_agent":
                    await self._integrate_agent_with_mcp(
                        request["agent_id"], 
                        request["agent_config"]
                    )
                
                self.integration_queue.task_done()
                
            except asyncio.TimeoutError:
                # No requests in queue
                continue
            except Exception as e:
                logger.error(f"Error processing integration queue: {e}")
                await asyncio.sleep(1)
    
    async def _integrate_agent_with_mcp(self, agent_id: str, agent_config: Dict[str, Any]):
        """Integrate agent with all available MCP servers"""
        
        if agent_id not in self.agent_profiles:
            logger.error(f"Agent profile not found: {agent_id}")
            return
        
        profile = self.agent_profiles[agent_id]
        profile.status = AgentStatus.CREATING
        
        logger.info(f"Integrating agent {agent_id} with MCP servers")
        
        # Register with each MCP server
        total_tools = 0
        successful_registrations = 0
        
        for server_name, server_config in self.mcp_servers.items():
            try:
                # Register agent with MCP server
                registration_result = await self._register_agent_with_server(
                    agent_id, server_name, server_config, agent_config
                )
                
                if registration_result["success"]:
                    profile.assigned_mcp_servers.append(server_name)
                    profile.registration_status[server_name] = "success"
                    total_tools += server_config.tools_count
                    successful_registrations += 1
                    
                    logger.info(f"Agent {agent_id} registered with {server_name}")
                else:
                    profile.registration_status[server_name] = f"failed: {registration_result.get('error', 'unknown')}"
                    logger.warning(f"Failed to register agent {agent_id} with {server_name}")
                
            except Exception as e:
                profile.registration_status[server_name] = f"error: {str(e)}"
                logger.error(f"Error registering agent {agent_id} with {server_name}: {e}")
        
        # Update profile
        profile.available_tools = total_tools
        profile.status = AgentStatus.ACTIVE if successful_registrations > 0 else AgentStatus.ERROR
        profile.last_activity = datetime.now(timezone.utc)
        
        # Request initial funding
        if successful_registrations > 0:
            await self._request_initial_funding(agent_id, agent_config)
        
        logger.info(f"Agent {agent_id} integration complete: {successful_registrations}/{len(self.mcp_servers)} servers registered")
    
    async def _register_agent_with_server(self, 
                                        agent_id: str, 
                                        server_name: str, 
                                        server_config: MCPServerConfig,
                                        agent_config: Dict[str, Any]) -> Dict[str, Any]:
        """Register agent with specific MCP server"""
        
        try:
            # Prepare registration data
            registration_data = {
                "name": "register_agent_for_trading" if server_name == "multichain_trading_mcp" else "register_agent",
                "arguments": {
                    "agent_id": agent_id,
                    "agent_name": self.agent_profiles[agent_id].agent_name,
                    "supported_chains": agent_config.get("supported_chains", ["ethereum", "solana", "sui"]),
                    "risk_tolerance": agent_config.get("risk_tolerance", 0.5),
                    "initial_funding": agent_config.get("initial_funding", 1000.0)
                }
            }
            
            # Make registration request
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{server_config.endpoint}/mcp/tools/call",
                    json=registration_data,
                    timeout=aiohttp.ClientTimeout(total=30)
                ) as response:
                    if response.status == 200:
                        result = await response.json()
                        return {
                            "success": result.get("success", False),
                            "data": result.get("data", {}),
                            "error": result.get("error")
                        }
                    else:
                        return {
                            "success": False,
                            "error": f"HTTP {response.status}"
                        }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def _request_initial_funding(self, agent_id: str, agent_config: Dict[str, Any]):
        """Request initial funding for new agent"""
        
        try:
            funding_service = get_registry().get_service("autonomous_agent_funding")
            if not funding_service:
                logger.warning("Funding service not available for initial funding")
                return
            
            initial_amount = agent_config.get("initial_funding", 1000.0)
            
            funding_request_id = await funding_service.request_funding(
                agent_id=agent_id,
                amount=initial_amount,
                reason="Automatic initial funding for new agent",
                urgency="medium",
                strategy_type="multi_strategy",
                expected_return=0.1  # 10% expected return
            )
            
            if agent_id in self.agent_profiles:
                self.agent_profiles[agent_id].funding_status = f"requested: {funding_request_id}"
            
            logger.info(f"Initial funding requested for agent {agent_id}: ${initial_amount}")
            
        except Exception as e:
            logger.error(f"Error requesting initial funding for agent {agent_id}: {e}")
            if agent_id in self.agent_profiles:
                self.agent_profiles[agent_id].funding_status = f"error: {str(e)}"
    
    async def _monitor_mcp_servers(self):
        """Monitor MCP server health"""
        while self.running:
            try:
                for server_name, server_config in self.mcp_servers.items():
                    try:
                        async with aiohttp.ClientSession() as session:
                            async with session.get(
                                f"{server_config.endpoint}/health",
                                timeout=aiohttp.ClientTimeout(total=5)
                            ) as response:
                                if response.status != 200:
                                    logger.warning(f"MCP server {server_name} health check failed")
                    
                    except Exception as e:
                        logger.warning(f"Cannot reach MCP server {server_name}: {e}")
                
                await asyncio.sleep(30)  # Check every 30 seconds
                
            except Exception as e:
                logger.error(f"Error monitoring MCP servers: {e}")
                await asyncio.sleep(30)
    
    async def _periodic_health_check(self):
        """Periodic health check for registered agents"""
        while self.running:
            try:
                for agent_id, profile in self.agent_profiles.items():
                    if profile.status == AgentStatus.ACTIVE:
                        # Check if agent is still responsive
                        # In full implementation, would ping agent endpoints
                        
                        # Update last seen if no recent activity
                        if profile.last_activity and \
                           (datetime.now(timezone.utc) - profile.last_activity).total_seconds() > 3600:
                            logger.info(f"Agent {agent_id} inactive for over 1 hour")
                
                await asyncio.sleep(300)  # Check every 5 minutes
                
            except Exception as e:
                logger.error(f"Error in periodic health check: {e}")
                await asyncio.sleep(300)
    
    async def _sync_agent_statuses(self):
        """Sync agent statuses with MCP servers"""
        while self.running:
            try:
                # Sync with multichain trading MCP server
                try:
                    async with aiohttp.ClientSession() as session:
                        async with session.get(
                            f"{self.mcp_servers['multichain_trading_mcp'].endpoint}/agents",
                            timeout=aiohttp.ClientTimeout(total=10)
                        ) as response:
                            if response.status == 200:
                                data = await response.json()
                                mcp_agents = {agent["agent_id"]: agent for agent in data.get("agents", [])}
                                
                                # Update local profiles with MCP data
                                for agent_id, profile in self.agent_profiles.items():
                                    if agent_id in mcp_agents:
                                        mcp_agent = mcp_agents[agent_id]
                                        profile.tool_usage_stats = {
                                            "total_calls": mcp_agent.get("tool_calls", 0),
                                            "last_activity": mcp_agent.get("last_activity")
                                        }
                
                except Exception as e:
                    logger.warning(f"Could not sync with multichain trading MCP: {e}")
                
                await asyncio.sleep(120)  # Sync every 2 minutes
                
            except Exception as e:
                logger.error(f"Error syncing agent statuses: {e}")
                await asyncio.sleep(120)
    
    async def get_agent_mcp_status(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get comprehensive MCP status for an agent"""
        
        if agent_id not in self.agent_profiles:
            return None
        
        profile = self.agent_profiles[agent_id]
        
        return {
            "agent_id": agent_id,
            "agent_name": profile.agent_name,
            "status": profile.status.value,
            "created_at": profile.created_at.isoformat(),
            "mcp_integration": {
                "total_servers": len(self.mcp_servers),
                "registered_servers": len(profile.assigned_mcp_servers),
                "available_tools": profile.available_tools,
                "registration_status": profile.registration_status,
                "auto_access_enabled": profile.auto_access_enabled
            },
            "capabilities": {
                "hft_arbitrage": "hft_arbitrage_mcp" in profile.assigned_mcp_servers,
                "multichain_trading": "multichain_trading_mcp" in profile.assigned_mcp_servers,
                "autonomous_funding": "agent_funding_mcp" in profile.assigned_mcp_servers,
                "realtime_prices": "realtime_price_mcp" in profile.assigned_mcp_servers,
                "risk_management": "risk_management_mcp" in profile.assigned_mcp_servers
            },
            "funding_status": profile.funding_status,
            "permissions": profile.permissions,
            "usage_stats": profile.tool_usage_stats,
            "last_activity": profile.last_activity.isoformat() if profile.last_activity else None
        }
    
    async def get_all_agents_status(self) -> Dict[str, Any]:
        """Get status of all registered agents"""
        
        agent_statuses = {}
        for agent_id in self.agent_profiles:
            agent_statuses[agent_id] = await self.get_agent_mcp_status(agent_id)
        
        return {
            "agents": agent_statuses,
            "summary": {
                "total_agents": len(self.agent_profiles),
                "active_agents": len([p for p in self.agent_profiles.values() if p.status == AgentStatus.ACTIVE]),
                "mcp_servers": len(self.mcp_servers),
                "total_available_tools": sum(s.tools_count for s in self.mcp_servers.values())
            },
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    
    async def update_agent_permissions(self, agent_id: str, permissions: Dict[str, bool]) -> bool:
        """Update agent permissions"""
        
        if agent_id not in self.agent_profiles:
            return False
        
        profile = self.agent_profiles[agent_id]
        profile.permissions.update(permissions)
        
        # Notify MCP servers of permission changes
        for server_name in profile.assigned_mcp_servers:
            try:
                # In full implementation, would notify servers of permission changes
                logger.info(f"Updated permissions for agent {agent_id} on {server_name}")
            except Exception as e:
                logger.error(f"Error updating permissions on {server_name}: {e}")
        
        return True
    
    async def remove_agent(self, agent_id: str) -> bool:
        """Remove agent from MCP integration"""
        
        if agent_id not in self.agent_profiles:
            return False
        
        profile = self.agent_profiles[agent_id]
        
        # Unregister from all MCP servers
        for server_name in profile.assigned_mcp_servers:
            try:
                # In full implementation, would call unregister endpoints
                logger.info(f"Unregistered agent {agent_id} from {server_name}")
            except Exception as e:
                logger.error(f"Error unregistering from {server_name}: {e}")
        
        # Remove profile
        del self.agent_profiles[agent_id]
        
        logger.info(f"Agent {agent_id} removed from MCP integration")
        return True
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get integration service status"""
        
        return {
            "service": "agent_mcp_integration",
            "status": "running" if self.running else "stopped",
            "registered_agents": len(self.agent_profiles),
            "active_agents": len([p for p in self.agent_profiles.values() if p.status == AgentStatus.ACTIVE]),
            "available_mcp_servers": len(self.mcp_servers),
            "auto_registration_enabled": True,
            "queue_size": self.integration_queue.qsize(),
            "mcp_servers": {
                name: {
                    "endpoint": config.endpoint,
                    "tools": config.tools_count,
                    "capabilities": config.capabilities
                } for name, config in self.mcp_servers.items()
            },
            "last_health_check": datetime.now(timezone.utc).isoformat()
        }

# Factory function for service registry
def create_agent_mcp_integration_service():
    """Factory function to create AgentMCPIntegrationService instance"""
    return AgentMCPIntegrationService()