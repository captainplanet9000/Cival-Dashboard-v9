"""
Autonomous State Persistence Service
Manages agent state persistence, checkpoints, and recovery for 24/7 operation
Ensures agents maintain memory and configuration across system restarts
"""

import asyncio
import json
import logging
from typing import Dict, List, Optional, Any, Set
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import pickle
import gzip
from pathlib import Path

from ..core.service_registry import get_registry

logger = logging.getLogger(__name__)

class StateType(Enum):
    """Types of agent state data"""
    CONFIGURATION = "configuration"
    MEMORY = "memory"
    PERFORMANCE = "performance"
    DECISIONS = "decisions"
    POSITIONS = "positions"
    STRATEGIES = "strategies"

class CheckpointStatus(Enum):
    """Checkpoint creation status"""
    CREATING = "creating"
    COMPLETED = "completed"
    FAILED = "failed"
    RESTORING = "restoring"

@dataclass
class AgentState:
    """Complete agent state snapshot"""
    agent_id: str
    state_type: StateType
    state_data: Dict[str, Any]
    version: int
    created_at: datetime
    updated_at: datetime
    checksum: str

@dataclass
class SystemCheckpoint:
    """System-wide checkpoint containing all agent states"""
    checkpoint_id: str
    checkpoint_name: str
    agents_included: List[str]
    state_snapshot: Dict[str, Dict[str, Any]]
    metadata: Dict[str, Any]
    created_at: datetime
    status: CheckpointStatus

class AutonomousStatePersistence:
    """
    Manages persistent state for autonomous agents across system restarts
    Provides checkpointing, recovery, and state synchronization
    """
    
    def __init__(self):
        self.db_service = None
        self.agent_states: Dict[str, Dict[StateType, AgentState]] = {}
        self.checkpoints: Dict[str, SystemCheckpoint] = {}
        self.state_cache: Dict[str, Any] = {}
        self.is_initialized = False
        
        # Configuration
        self.checkpoint_interval = 300  # 5 minutes
        self.max_checkpoints = 24  # Keep 24 checkpoints (2 hours)
        self.state_sync_interval = 30  # 30 seconds
        
        logger.info("Autonomous State Persistence service initialized")
    
    async def initialize(self):
        """Initialize the state persistence service"""
        try:
            # Get database service
            registry = get_registry()
            self.db_service = registry.get_service("enhanced_database_service")
            
            if not self.db_service:
                logger.warning("Database service not available, using file-based persistence")
                await self._initialize_file_persistence()
            else:
                await self._initialize_database_persistence()
            
            # Start background tasks
            asyncio.create_task(self._periodic_checkpoint_task())
            asyncio.create_task(self._periodic_state_sync_task())
            
            self.is_initialized = True
            logger.info("State persistence service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize state persistence: {e}")
            raise
    
    async def _initialize_database_persistence(self):
        """Initialize database tables for state persistence"""
        try:
            # Create tables if they don't exist
            await self._create_state_tables()
            
            # Load existing states
            await self._load_existing_states()
            
            logger.info("Database persistence initialized")
            
        except Exception as e:
            logger.error(f"Database persistence initialization failed: {e}")
            raise
    
    async def _initialize_file_persistence(self):
        """Initialize file-based persistence as fallback"""
        try:
            self.state_dir = Path("data/agent_states")
            self.checkpoint_dir = Path("data/checkpoints")
            
            # Create directories
            self.state_dir.mkdir(parents=True, exist_ok=True)
            self.checkpoint_dir.mkdir(parents=True, exist_ok=True)
            
            # Load existing states from files
            await self._load_states_from_files()
            
            logger.info("File-based persistence initialized")
            
        except Exception as e:
            logger.error(f"File persistence initialization failed: {e}")
            raise
    
    # ==================== AGENT STATE MANAGEMENT ====================
    
    async def save_agent_state(self, 
                             agent_id: str, 
                             state_type: StateType, 
                             state_data: Dict[str, Any]) -> bool:
        """Save agent state data"""
        try:
            # Create state object
            current_time = datetime.now(timezone.utc)
            checksum = self._calculate_checksum(state_data)
            
            # Get current version
            current_version = 1
            if agent_id in self.agent_states and state_type in self.agent_states[agent_id]:
                current_version = self.agent_states[agent_id][state_type].version + 1
            
            agent_state = AgentState(
                agent_id=agent_id,
                state_type=state_type,
                state_data=state_data,
                version=current_version,
                created_at=current_time,
                updated_at=current_time,
                checksum=checksum
            )
            
            # Store in memory cache
            if agent_id not in self.agent_states:
                self.agent_states[agent_id] = {}
            self.agent_states[agent_id][state_type] = agent_state
            
            # Persist to storage
            if self.db_service:
                await self._save_state_to_database(agent_state)
            else:
                await self._save_state_to_file(agent_state)
            
            logger.debug(f"Saved state for agent {agent_id}, type {state_type.value}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to save agent state: {e}")
            return False
    
    async def restore_agent_state(self, 
                                agent_id: str, 
                                state_type: Optional[StateType] = None) -> Dict[str, Any]:
        """Restore agent state data"""
        try:
            if agent_id not in self.agent_states:
                # Try to load from persistent storage
                await self._load_agent_state_from_storage(agent_id)
            
            if agent_id not in self.agent_states:
                logger.warning(f"No state found for agent {agent_id}")
                return {}
            
            if state_type:
                # Return specific state type
                if state_type in self.agent_states[agent_id]:
                    return self.agent_states[agent_id][state_type].state_data
                else:
                    return {}
            else:
                # Return all state types
                result = {}
                for state_type, agent_state in self.agent_states[agent_id].items():
                    result[state_type.value] = agent_state.state_data
                return result
                
        except Exception as e:
            logger.error(f"Failed to restore agent state: {e}")
            return {}
    
    async def get_agent_state_history(self, 
                                    agent_id: str, 
                                    state_type: StateType,
                                    limit: int = 10) -> List[AgentState]:
        """Get historical agent states"""
        try:
            if self.db_service:
                return await self._get_state_history_from_database(agent_id, state_type, limit)
            else:
                return await self._get_state_history_from_files(agent_id, state_type, limit)
                
        except Exception as e:
            logger.error(f"Failed to get state history: {e}")
            return []
    
    # ==================== CHECKPOINT MANAGEMENT ====================
    
    async def create_system_checkpoint(self, checkpoint_name: str) -> str:
        """Create a system-wide checkpoint of all agent states"""
        try:
            checkpoint_id = f"checkpoint_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
            current_time = datetime.now(timezone.utc)
            
            # Collect all agent states
            state_snapshot = {}
            agents_included = []
            
            for agent_id, agent_states in self.agent_states.items():
                agent_snapshot = {}
                for state_type, agent_state in agent_states.items():
                    agent_snapshot[state_type.value] = {
                        'data': agent_state.state_data,
                        'version': agent_state.version,
                        'checksum': agent_state.checksum,
                        'updated_at': agent_state.updated_at.isoformat()
                    }
                
                if agent_snapshot:
                    state_snapshot[agent_id] = agent_snapshot
                    agents_included.append(agent_id)
            
            # Create checkpoint object
            checkpoint = SystemCheckpoint(
                checkpoint_id=checkpoint_id,
                checkpoint_name=checkpoint_name,
                agents_included=agents_included,
                state_snapshot=state_snapshot,
                metadata={
                    'total_agents': len(agents_included),
                    'total_states': sum(len(states) for states in state_snapshot.values()),
                    'system_version': '1.0.0',
                    'created_by': 'autonomous_system'
                },
                created_at=current_time,
                status=CheckpointStatus.CREATING
            )
            
            # Store checkpoint
            self.checkpoints[checkpoint_id] = checkpoint
            
            # Persist checkpoint
            if self.db_service:
                await self._save_checkpoint_to_database(checkpoint)
            else:
                await self._save_checkpoint_to_file(checkpoint)
            
            # Update status to completed
            checkpoint.status = CheckpointStatus.COMPLETED
            
            # Clean up old checkpoints
            await self._cleanup_old_checkpoints()
            
            logger.info(f"Created system checkpoint {checkpoint_id} with {len(agents_included)} agents")
            return checkpoint_id
            
        except Exception as e:
            logger.error(f"Failed to create checkpoint: {e}")
            raise
    
    async def restore_from_checkpoint(self, checkpoint_id: str) -> bool:
        """Restore system state from a checkpoint"""
        try:
            # Load checkpoint if not in memory
            if checkpoint_id not in self.checkpoints:
                await self._load_checkpoint_from_storage(checkpoint_id)
            
            if checkpoint_id not in self.checkpoints:
                logger.error(f"Checkpoint {checkpoint_id} not found")
                return False
            
            checkpoint = self.checkpoints[checkpoint_id]
            checkpoint.status = CheckpointStatus.RESTORING
            
            # Restore agent states
            restored_agents = 0
            for agent_id, agent_snapshot in checkpoint.state_snapshot.items():
                try:
                    # Clear existing states for this agent
                    if agent_id in self.agent_states:
                        del self.agent_states[agent_id]
                    
                    # Restore each state type
                    for state_type_str, state_info in agent_snapshot.items():
                        state_type = StateType(state_type_str)
                        
                        agent_state = AgentState(
                            agent_id=agent_id,
                            state_type=state_type,
                            state_data=state_info['data'],
                            version=state_info['version'],
                            created_at=datetime.fromisoformat(state_info['updated_at']),
                            updated_at=datetime.now(timezone.utc),
                            checksum=state_info['checksum']
                        )
                        
                        if agent_id not in self.agent_states:
                            self.agent_states[agent_id] = {}
                        self.agent_states[agent_id][state_type] = agent_state
                    
                    restored_agents += 1
                    
                except Exception as e:
                    logger.error(f"Failed to restore agent {agent_id}: {e}")
            
            checkpoint.status = CheckpointStatus.COMPLETED
            
            logger.info(f"Restored {restored_agents} agents from checkpoint {checkpoint_id}")
            return restored_agents > 0
            
        except Exception as e:
            logger.error(f"Failed to restore from checkpoint: {e}")
            return False
    
    async def list_checkpoints(self) -> List[Dict[str, Any]]:
        """List available checkpoints"""
        try:
            checkpoints = []
            for checkpoint_id, checkpoint in self.checkpoints.items():
                checkpoints.append({
                    'checkpoint_id': checkpoint_id,
                    'checkpoint_name': checkpoint.checkpoint_name,
                    'agents_count': len(checkpoint.agents_included),
                    'created_at': checkpoint.created_at.isoformat(),
                    'status': checkpoint.status.value,
                    'metadata': checkpoint.metadata
                })
            
            # Sort by creation time (newest first)
            checkpoints.sort(key=lambda x: x['created_at'], reverse=True)
            return checkpoints
            
        except Exception as e:
            logger.error(f"Failed to list checkpoints: {e}")
            return []
    
    # ==================== BACKGROUND TASKS ====================
    
    async def _periodic_checkpoint_task(self):
        """Create periodic system checkpoints"""
        while True:
            try:
                await asyncio.sleep(self.checkpoint_interval)
                
                if self.agent_states:
                    checkpoint_name = f"auto_checkpoint_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    await self.create_system_checkpoint(checkpoint_name)
                    
            except Exception as e:
                logger.error(f"Periodic checkpoint failed: {e}")
    
    async def _periodic_state_sync_task(self):
        """Sync agent states to persistent storage"""
        while True:
            try:
                await asyncio.sleep(self.state_sync_interval)
                
                for agent_id, agent_states in self.agent_states.items():
                    for state_type, agent_state in agent_states.items():
                        # Check if state needs syncing (has been updated recently)
                        time_since_update = datetime.now(timezone.utc) - agent_state.updated_at
                        if time_since_update.total_seconds() < self.state_sync_interval * 2:
                            if self.db_service:
                                await self._save_state_to_database(agent_state)
                            else:
                                await self._save_state_to_file(agent_state)
                                
            except Exception as e:
                logger.error(f"Periodic state sync failed: {e}")
    
    # ==================== PERSISTENCE METHODS ====================
    
    async def _save_state_to_database(self, agent_state: AgentState):
        """Save agent state to database"""
        try:
            state_record = {
                'agent_id': agent_state.agent_id,
                'state_type': agent_state.state_type.value,
                'state_data': agent_state.state_data,
                'version': agent_state.version,
                'checksum': agent_state.checksum,
                'created_at': agent_state.created_at.isoformat(),
                'updated_at': agent_state.updated_at.isoformat()
            }
            
            # Use upsert to handle updates
            await self.db_service.execute_query(
                """
                INSERT INTO agent_states (agent_id, state_type, state_data, version, checksum, created_at, updated_at)
                VALUES (%(agent_id)s, %(state_type)s, %(state_data)s, %(version)s, %(checksum)s, %(created_at)s, %(updated_at)s)
                ON CONFLICT (agent_id, state_type) DO UPDATE SET
                    state_data = EXCLUDED.state_data,
                    version = EXCLUDED.version,
                    checksum = EXCLUDED.checksum,
                    updated_at = EXCLUDED.updated_at
                """,
                state_record
            )
            
        except Exception as e:
            logger.error(f"Failed to save state to database: {e}")
            raise
    
    async def _save_state_to_file(self, agent_state: AgentState):
        """Save agent state to file"""
        try:
            state_file = self.state_dir / f"{agent_state.agent_id}_{agent_state.state_type.value}.json"
            
            state_data = {
                'agent_id': agent_state.agent_id,
                'state_type': agent_state.state_type.value,
                'state_data': agent_state.state_data,
                'version': agent_state.version,
                'checksum': agent_state.checksum,
                'created_at': agent_state.created_at.isoformat(),
                'updated_at': agent_state.updated_at.isoformat()
            }
            
            with open(state_file, 'w') as f:
                json.dump(state_data, f, indent=2, default=str)
                
        except Exception as e:
            logger.error(f"Failed to save state to file: {e}")
            raise
    
    async def _save_checkpoint_to_database(self, checkpoint: SystemCheckpoint):
        """Save checkpoint to database"""
        try:
            checkpoint_record = {
                'checkpoint_id': checkpoint.checkpoint_id,
                'checkpoint_name': checkpoint.checkpoint_name,
                'agents_included': checkpoint.agents_included,
                'state_snapshot': checkpoint.state_snapshot,
                'metadata': checkpoint.metadata,
                'status': checkpoint.status.value,
                'created_at': checkpoint.created_at.isoformat()
            }
            
            await self.db_service.execute_query(
                """
                INSERT INTO agent_checkpoints (id, checkpoint_name, agents_included, state_snapshot, metadata, status, created_at)
                VALUES (%(checkpoint_id)s, %(checkpoint_name)s, %(agents_included)s, %(state_snapshot)s, %(metadata)s, %(status)s, %(created_at)s)
                """,
                checkpoint_record
            )
            
        except Exception as e:
            logger.error(f"Failed to save checkpoint to database: {e}")
            raise
    
    async def _save_checkpoint_to_file(self, checkpoint: SystemCheckpoint):
        """Save checkpoint to file"""
        try:
            checkpoint_file = self.checkpoint_dir / f"{checkpoint.checkpoint_id}.json.gz"
            
            checkpoint_data = {
                'checkpoint_id': checkpoint.checkpoint_id,
                'checkpoint_name': checkpoint.checkpoint_name,
                'agents_included': checkpoint.agents_included,
                'state_snapshot': checkpoint.state_snapshot,
                'metadata': checkpoint.metadata,
                'status': checkpoint.status.value,
                'created_at': checkpoint.created_at.isoformat()
            }
            
            # Compress checkpoint data
            with gzip.open(checkpoint_file, 'wt') as f:
                json.dump(checkpoint_data, f, indent=2, default=str)
                
        except Exception as e:
            logger.error(f"Failed to save checkpoint to file: {e}")
            raise
    
    # ==================== UTILITY METHODS ====================
    
    def _calculate_checksum(self, data: Dict[str, Any]) -> str:
        """Calculate checksum for state data"""
        import hashlib
        data_str = json.dumps(data, sort_keys=True, default=str)
        return hashlib.md5(data_str.encode()).hexdigest()
    
    async def _cleanup_old_checkpoints(self):
        """Remove old checkpoints beyond the limit"""
        try:
            # Sort checkpoints by creation time
            sorted_checkpoints = sorted(
                self.checkpoints.items(),
                key=lambda x: x[1].created_at,
                reverse=True
            )
            
            # Remove excess checkpoints
            if len(sorted_checkpoints) > self.max_checkpoints:
                for checkpoint_id, _ in sorted_checkpoints[self.max_checkpoints:]:
                    del self.checkpoints[checkpoint_id]
                    
                    # Also remove from persistent storage
                    if self.db_service:
                        await self.db_service.execute_query(
                            "DELETE FROM agent_checkpoints WHERE id = %s",
                            (checkpoint_id,)
                        )
                    else:
                        checkpoint_file = self.checkpoint_dir / f"{checkpoint_id}.json.gz"
                        if checkpoint_file.exists():
                            checkpoint_file.unlink()
                            
        except Exception as e:
            logger.error(f"Failed to cleanup old checkpoints: {e}")
    
    async def _create_state_tables(self):
        """Create database tables for state persistence"""
        try:
            # Create agent_states table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS agent_states (
                    agent_id UUID NOT NULL,
                    state_type TEXT NOT NULL,
                    state_data JSONB NOT NULL,
                    version INTEGER NOT NULL DEFAULT 1,
                    checksum TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    PRIMARY KEY (agent_id, state_type)
                )
            """)
            
            # Create agent_checkpoints table
            await self.db_service.execute_query("""
                CREATE TABLE IF NOT EXISTS agent_checkpoints (
                    id TEXT PRIMARY KEY,
                    checkpoint_name TEXT NOT NULL,
                    agents_included TEXT[] NOT NULL,
                    state_snapshot JSONB NOT NULL,
                    metadata JSONB,
                    status TEXT NOT NULL DEFAULT 'completed',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """)
            
            # Create indexes
            await self.db_service.execute_query("""
                CREATE INDEX IF NOT EXISTS idx_agent_states_agent_id ON agent_states(agent_id);
                CREATE INDEX IF NOT EXISTS idx_agent_states_updated_at ON agent_states(updated_at);
                CREATE INDEX IF NOT EXISTS idx_agent_checkpoints_created_at ON agent_checkpoints(created_at);
            """)
            
        except Exception as e:
            logger.error(f"Failed to create state tables: {e}")
            raise
    
    async def _load_existing_states(self):
        """Load existing states from database"""
        try:
            states = await self.db_service.fetch_all(
                "SELECT * FROM agent_states ORDER BY updated_at DESC"
            )
            
            for state_record in states:
                agent_id = state_record['agent_id']
                state_type = StateType(state_record['state_type'])
                
                agent_state = AgentState(
                    agent_id=agent_id,
                    state_type=state_type,
                    state_data=state_record['state_data'],
                    version=state_record['version'],
                    created_at=state_record['created_at'],
                    updated_at=state_record['updated_at'],
                    checksum=state_record['checksum']
                )
                
                if agent_id not in self.agent_states:
                    self.agent_states[agent_id] = {}
                self.agent_states[agent_id][state_type] = agent_state
            
            logger.info(f"Loaded {len(states)} agent states from database")
            
        except Exception as e:
            logger.error(f"Failed to load existing states: {e}")
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get service status information"""
        return {
            "service": "autonomous_state_persistence",
            "initialized": self.is_initialized,
            "agent_count": len(self.agent_states),
            "checkpoint_count": len(self.checkpoints),
            "total_states": sum(len(states) for states in self.agent_states.values()),
            "last_checkpoint": max(
                (cp.created_at for cp in self.checkpoints.values()),
                default=None
            ),
            "checkpoint_interval_seconds": self.checkpoint_interval,
            "state_sync_interval_seconds": self.state_sync_interval,
            "storage_type": "database" if self.db_service else "file"
        }

# Factory function for service registry
def create_autonomous_state_persistence():
    """Factory function to create AutonomousStatePersistence instance"""
    return AutonomousStatePersistence()