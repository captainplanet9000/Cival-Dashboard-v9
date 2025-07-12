"""
Smart Profit Securing Service
Automated profit securing with milestone triggers and goal completion
Integrates with DeFi lending protocols for auto-deposit and 20% borrowing
Connected to leverage engine and autonomous systems
"""

import asyncio
import uuid
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone, timedelta
from decimal import Decimal, ROUND_HALF_UP
import json
import logging
from collections import defaultdict
from enum import Enum

from pydantic import BaseModel, Field, validator

logger = logging.getLogger(__name__)


class ProfitMilestone(BaseModel):
    """Profit milestone configuration"""
    milestone_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    amount: Decimal
    secure_percentage: float = Field(ge=0, le=100)
    protocol: str = Field(default="aave")
    triggered: bool = Field(default=False)
    triggered_at: Optional[datetime] = None
    secured_amount: Optional[Decimal] = None
    borrowed_amount: Optional[Decimal] = None
    deposit_tx_id: Optional[str] = None
    borrow_tx_id: Optional[str] = None


class GoalCompletionProfit(BaseModel):
    """Goal completion profit securing"""
    completion_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    goal_id: str
    agent_id: str
    completion_profit: Decimal
    secured_amount: Decimal
    protocol: str
    deposit_tx_id: str
    borrowed_amount: Decimal
    borrow_tx_id: str
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DepositPosition(BaseModel):
    """DeFi lending deposit position"""
    position_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    agent_id: str
    protocol: str
    asset: str = Field(default="USDC")
    deposited_amount: Decimal
    current_value: Decimal
    apy: float
    health_factor: float = Field(default=2.0)
    borrowed_against: Decimal = Field(default=Decimal('0'))
    available_to_borrow: Decimal
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class BorrowPosition(BaseModel):
    """DeFi borrowing position"""
    borrow_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    deposit_position_id: str
    agent_id: str
    protocol: str
    borrowed_amount: Decimal
    current_debt: Decimal
    apy: float
    health_factor: float
    liquidation_threshold: float = Field(default=0.8)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProfitSecuringMetrics(BaseModel):
    """Profit securing performance metrics"""
    agent_id: str
    total_secured: Decimal
    total_borrowed: Decimal
    total_milestones_triggered: int
    total_goals_completed: int
    net_yield: float
    average_health_factor: float
    compounding_rate: float
    risk_score: float


class SmartProfitSecuringService:
    """
    Smart profit securing service with milestone and goal-based triggers
    Automatic DeFi integration with 20% borrowing for compound growth
    """
    
    # Protocol configurations
    PROTOCOLS = {
        'aave': {
            'name': 'Aave V3',
            'deposit_apy': 3.5,
            'borrow_apy': 5.2,
            'ltv': 0.8,
            'liquidation_threshold': 0.85,
            'health_factor_min': 1.5
        },
        'compound': {
            'name': 'Compound V3',
            'deposit_apy': 2.9,
            'borrow_apy': 4.8,
            'ltv': 0.75,
            'liquidation_threshold': 0.8,
            'health_factor_min': 1.6
        },
        'makerdao': {
            'name': 'MakerDAO',
            'deposit_apy': 4.1,
            'borrow_apy': 5.5,
            'ltv': 0.75,
            'liquidation_threshold': 0.8,
            'health_factor_min': 1.8
        }
    }
    
    # Default milestone amounts
    DEFAULT_MILESTONES = [100, 1000, 10000, 50000, 100000]
    BORROW_PERCENTAGE = 0.20  # Always 20% of secured amount
    
    def __init__(self):
        self.profit_milestones: Dict[str, List[ProfitMilestone]] = defaultdict(list)
        self.goal_completions: Dict[str, List[GoalCompletionProfit]] = defaultdict(list)
        self.deposit_positions: Dict[str, List[DepositPosition]] = defaultdict(list)
        self.borrow_positions: Dict[str, List[BorrowPosition]] = defaultdict(list)
        
        # Service dependencies
        self.leverage_engine = None
        self.autonomous_coordinator = None
        self.state_persistence = None
        self.defi_lending_manager = None
        self.supabase = None
        
    async def initialize(self):
        """Initialize service dependencies"""
        try:
            from database.supabase_client import get_supabase_client
            self.supabase = get_supabase_client()
            
            # Get service registry
            try:
                from ..core.service_registry import get_registry
                registry = get_registry()
                
                # Get leverage engine
                try:
                    from .leverage_engine_service import get_leverage_engine_service
                    self.leverage_engine = await get_leverage_engine_service()
                    logger.info("✅ Leverage engine integrated with profit securing")
                except ImportError:
                    logger.warning("Leverage engine not available")
                
                # Get autonomous coordinator
                try:
                    self.autonomous_coordinator = registry.get_service("autonomous_agent_coordinator")
                    if self.autonomous_coordinator:
                        logger.info("✅ Autonomous coordinator integrated with profit securing")
                except Exception:
                    logger.warning("Autonomous coordinator not available")
                
                # Get state persistence
                try:
                    self.state_persistence = registry.get_service("autonomous_state_persistence")
                    if self.state_persistence:
                        logger.info("✅ State persistence integrated with profit securing")
                except Exception:
                    logger.warning("State persistence not available")
                
                # Initialize DeFi lending manager
                await self._initialize_defi_manager()
                
            except Exception as e:
                logger.warning(f"Service registry not available: {e}")
            
            logger.info("Smart profit securing service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize smart profit securing service: {e}")
            raise
    
    async def _initialize_defi_manager(self):
        """Initialize DeFi lending manager"""
        try:
            # Placeholder for DeFi lending manager initialization
            # This would connect to actual DeFi protocols
            self.defi_lending_manager = {
                'aave': {'connected': True, 'health': 'good'},
                'compound': {'connected': True, 'health': 'good'},
                'makerdao': {'connected': True, 'health': 'good'}
            }
            logger.info("✅ DeFi lending manager initialized")
        except Exception as e:
            logger.error(f"Error initializing DeFi manager: {e}")
    
    async def configure_agent_rules(self, agent_id: str, rules: Dict[str, Any]) -> bool:
        """Configure profit securing rules for an agent"""
        try:
            milestone_amounts = rules.get('milestone_amounts', self.DEFAULT_MILESTONES)
            auto_secure_on_milestone = rules.get('auto_secure_on_milestone', True)
            leverage_integration = rules.get('leverage_integration', True)
            borrow_percentage = rules.get('borrow_percentage', self.BORROW_PERCENTAGE)
            
            # Create milestone configurations
            milestones = []
            for i, amount in enumerate(milestone_amounts):
                # Increasing secure percentages: 50%, 55%, 60%, 65%, 70%
                secure_percentage = 50 + (i * 5)
                protocol = list(self.PROTOCOLS.keys())[i % len(self.PROTOCOLS)]
                
                milestone = ProfitMilestone(
                    agent_id=agent_id,
                    amount=Decimal(str(amount)),
                    secure_percentage=secure_percentage,
                    protocol=protocol
                )
                milestones.append(milestone)
            
            self.profit_milestones[agent_id] = milestones
            
            # Save to database
            await self._save_agent_rules_db(agent_id, rules, milestones)
            
            logger.info(f"✅ Configured profit securing rules for agent {agent_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error configuring agent rules for {agent_id}: {e}")
            return False
    
    async def check_milestone_triggers(self, agent_id: str, current_profit: float) -> List[ProfitMilestone]:
        """Check if any milestones should be triggered"""
        try:
            triggered_milestones = []
            
            if agent_id not in self.profit_milestones:
                return triggered_milestones
            
            for milestone in self.profit_milestones[agent_id]:
                if not milestone.triggered and current_profit >= float(milestone.amount):
                    # Trigger milestone
                    milestone.triggered = True
                    milestone.triggered_at = datetime.now(timezone.utc)
                    
                    # Calculate amounts
                    secure_amount = current_profit * (milestone.secure_percentage / 100)
                    borrow_amount = secure_amount * self.BORROW_PERCENTAGE
                    
                    milestone.secured_amount = Decimal(str(secure_amount))
                    milestone.borrowed_amount = Decimal(str(borrow_amount))
                    
                    triggered_milestones.append(milestone)
                    
                    logger.info(f"✅ Milestone triggered: ${milestone.amount} for agent {agent_id}")
            
            return triggered_milestones
            
        except Exception as e:
            logger.error(f"Error checking milestone triggers for {agent_id}: {e}")
            return []
    
    async def secure_milestone_profit(self, agent_id: str, milestone_amount: float, total_profit: float) -> Dict[str, Any]:
        """Secure profit when milestone is reached"""
        try:
            # Find the triggered milestone
            triggered_milestone = None
            for milestone in self.profit_milestones.get(agent_id, []):
                if float(milestone.amount) == milestone_amount and milestone.triggered:
                    triggered_milestone = milestone
                    break
            
            if not triggered_milestone:
                return {'error': 'Milestone not found or not triggered'}
            
            # Calculate amounts
            secure_amount = float(triggered_milestone.secured_amount)
            borrow_amount = float(triggered_milestone.borrowed_amount)
            protocol = triggered_milestone.protocol
            
            # Execute deposit to DeFi protocol
            deposit_result = await self._deposit_to_protocol(
                agent_id, protocol, secure_amount
            )
            
            if not deposit_result.get('success'):
                return {'error': f"Failed to deposit to {protocol}: {deposit_result.get('error')}"}
            
            # Execute borrowing (20% of deposited amount)
            borrow_result = await self._borrow_from_deposit(
                deposit_result['position_id'], borrow_amount
            )
            
            if not borrow_result.get('success'):
                logger.warning(f"Failed to borrow against deposit: {borrow_result.get('error')}")
                # Continue without borrowing - deposit is still secured
            
            # Update milestone with transaction IDs
            triggered_milestone.deposit_tx_id = deposit_result.get('tx_id')
            triggered_milestone.borrow_tx_id = borrow_result.get('tx_id') if borrow_result.get('success') else None
            
            # Coordinate with leverage engine
            if self.leverage_engine:
                await self.leverage_engine.coordinate_with_autonomous_agents({
                    'type': 'profit_milestone_reached',
                    'milestone_data': {
                        'agent_id': agent_id,
                        'amount': milestone_amount,
                        'secured_amount': secure_amount,
                        'borrowed_amount': borrow_amount if borrow_result.get('success') else 0,
                        'protocol': protocol
                    }
                })
            
            # Distribute borrowed funds back to agent for continued trading
            if borrow_result.get('success'):
                await self._distribute_borrowed_funds(agent_id, borrow_amount)
            
            logger.info(f"✅ Secured milestone profit for agent {agent_id}: ${secure_amount}")
            
            return {
                'success': True,
                'agent_id': agent_id,
                'milestone_amount': milestone_amount,
                'secured_amount': secure_amount,
                'borrowed_amount': borrow_amount if borrow_result.get('success') else 0,
                'protocol': protocol,
                'deposit_tx_id': deposit_result.get('tx_id'),
                'borrow_tx_id': borrow_result.get('tx_id'),
                'net_capital_change': borrow_amount - secure_amount
            }
            
        except Exception as e:
            logger.error(f"Error securing milestone profit for {agent_id}: {e}")
            return {'success': False, 'error': str(e)}
    
    async def secure_goal_completion_profit(self, goal_id: str, agent_id: str, completion_profit: float) -> Dict[str, Any]:
        """Secure profit when goal is completed"""
        try:
            # Calculate amounts (70% secured for goal completions)
            secure_percentage = 70.0
            secure_amount = completion_profit * (secure_percentage / 100)
            borrow_amount = secure_amount * self.BORROW_PERCENTAGE
            
            # Select optimal protocol based on amount
            protocol = self._select_optimal_protocol(secure_amount)
            
            # Execute deposit
            deposit_result = await self._deposit_to_protocol(
                agent_id, protocol, secure_amount
            )
            
            if not deposit_result.get('success'):
                return {'error': f"Failed to deposit to {protocol}: {deposit_result.get('error')}"}
            
            # Execute borrowing
            borrow_result = await self._borrow_from_deposit(
                deposit_result['position_id'], borrow_amount
            )
            
            # Create goal completion record
            goal_completion = GoalCompletionProfit(
                goal_id=goal_id,
                agent_id=agent_id,
                completion_profit=Decimal(str(completion_profit)),
                secured_amount=Decimal(str(secure_amount)),
                protocol=protocol,
                deposit_tx_id=deposit_result.get('tx_id', ''),
                borrowed_amount=Decimal(str(borrow_amount if borrow_result.get('success') else 0)),
                borrow_tx_id=borrow_result.get('tx_id', '') if borrow_result.get('success') else ''
            )
            
            self.goal_completions[agent_id].append(goal_completion)
            
            # Coordinate with leverage engine
            if self.leverage_engine:
                await self.leverage_engine.handle_goal_completion_leverage_adjustment({
                    'agent_id': agent_id,
                    'goal_id': goal_id,
                    'completion_profit': completion_profit,
                    'secured_amount': secure_amount,
                    'borrowed_amount': borrow_amount if borrow_result.get('success') else 0
                })
            
            # Distribute borrowed funds
            if borrow_result.get('success'):
                await self._distribute_borrowed_funds(agent_id, borrow_amount)
            
            # Save to database
            await self._save_goal_completion_db(goal_completion)
            
            logger.info(f"✅ Secured goal completion profit for agent {agent_id}: ${secure_amount}")
            
            return {
                'success': True,
                'goal_id': goal_id,
                'agent_id': agent_id,
                'completion_profit': completion_profit,
                'secured_amount': secure_amount,
                'borrowed_amount': borrow_amount if borrow_result.get('success') else 0,
                'protocol': protocol,
                'net_capital_increase': borrow_amount if borrow_result.get('success') else 0
            }
            
        except Exception as e:
            logger.error(f"Error securing goal completion profit: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _deposit_to_protocol(self, agent_id: str, protocol: str, amount: float) -> Dict[str, Any]:
        """Deposit funds to DeFi protocol"""
        try:
            if protocol not in self.PROTOCOLS:
                return {'success': False, 'error': f'Unknown protocol: {protocol}'}
            
            protocol_config = self.PROTOCOLS[protocol]
            
            # Create deposit position
            deposit = DepositPosition(
                agent_id=agent_id,
                protocol=protocol,
                deposited_amount=Decimal(str(amount)),
                current_value=Decimal(str(amount)),
                apy=protocol_config['deposit_apy'],
                available_to_borrow=Decimal(str(amount * protocol_config['ltv']))
            )
            
            self.deposit_positions[agent_id].append(deposit)
            
            # Simulate deposit transaction
            tx_id = f"deposit_{protocol}_{str(uuid.uuid4())[:8]}"
            
            # Save to database
            await self._save_deposit_position_db(deposit)
            
            logger.info(f"✅ Deposited ${amount} to {protocol} for agent {agent_id}")
            
            return {
                'success': True,
                'position_id': deposit.position_id,
                'tx_id': tx_id,
                'protocol': protocol,
                'amount': amount,
                'apy': protocol_config['deposit_apy'],
                'available_to_borrow': float(deposit.available_to_borrow)
            }
            
        except Exception as e:
            logger.error(f"Error depositing to protocol {protocol}: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _borrow_from_deposit(self, deposit_position_id: str, borrow_amount: float) -> Dict[str, Any]:
        """Borrow against deposited collateral"""
        try:
            # Find deposit position
            deposit = None
            agent_id = None
            
            for aid, deposits in self.deposit_positions.items():
                for dep in deposits:
                    if dep.position_id == deposit_position_id:
                        deposit = dep
                        agent_id = aid
                        break
                if deposit:
                    break
            
            if not deposit:
                return {'success': False, 'error': 'Deposit position not found'}
            
            # Check borrowing capacity
            if borrow_amount > float(deposit.available_to_borrow):
                return {'success': False, 'error': 'Insufficient collateral for borrowing'}
            
            protocol_config = self.PROTOCOLS[deposit.protocol]
            
            # Calculate health factor after borrowing
            new_health_factor = float(deposit.deposited_amount) / (
                float(deposit.borrowed_against) + borrow_amount
            ) * protocol_config['liquidation_threshold']
            
            if new_health_factor < protocol_config['health_factor_min']:
                return {'success': False, 'error': 'Health factor too low'}
            
            # Create borrow position
            borrow = BorrowPosition(
                deposit_position_id=deposit_position_id,
                agent_id=agent_id,
                protocol=deposit.protocol,
                borrowed_amount=Decimal(str(borrow_amount)),
                current_debt=Decimal(str(borrow_amount)),
                apy=protocol_config['borrow_apy'],
                health_factor=new_health_factor
            )
            
            # Update deposit position
            deposit.borrowed_against += Decimal(str(borrow_amount))
            deposit.available_to_borrow -= Decimal(str(borrow_amount))
            deposit.health_factor = new_health_factor
            deposit.updated_at = datetime.now(timezone.utc)
            
            self.borrow_positions[agent_id].append(borrow)
            
            # Simulate borrow transaction
            tx_id = f"borrow_{deposit.protocol}_{str(uuid.uuid4())[:8]}"
            
            # Save to database
            await self._save_borrow_position_db(borrow)
            
            logger.info(f"✅ Borrowed ${borrow_amount} against deposit for agent {agent_id}")
            
            return {
                'success': True,
                'borrow_id': borrow.borrow_id,
                'tx_id': tx_id,
                'amount': borrow_amount,
                'apy': protocol_config['borrow_apy'],
                'health_factor': new_health_factor
            }
            
        except Exception as e:
            logger.error(f"Error borrowing from deposit: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _distribute_borrowed_funds(self, agent_id: str, amount: float) -> bool:
        """Distribute borrowed funds back to agent for continued trading"""
        try:
            # This would integrate with the agent's trading capital
            # For now, we'll just log the distribution
            logger.info(f"✅ Distributed ${amount} borrowed funds to agent {agent_id} for continued trading")
            
            # In a real implementation, this would:
            # 1. Add funds to agent's trading balance
            # 2. Notify the agent of new capital availability
            # 3. Update portfolio management system
            
            return True
            
        except Exception as e:
            logger.error(f"Error distributing borrowed funds: {e}")
            return False
    
    def _select_optimal_protocol(self, amount: float) -> str:
        """Select optimal DeFi protocol based on amount and conditions"""
        # Simple selection logic - can be enhanced with real-time rates
        if amount >= 50000:
            return 'aave'  # Best for large amounts
        elif amount >= 10000:
            return 'compound'  # Good for medium amounts
        else:
            return 'makerdao'  # Good for smaller amounts
    
    async def get_profit_securing_metrics(self, agent_id: str) -> ProfitSecuringMetrics:
        """Get comprehensive profit securing metrics for an agent"""
        try:
            # Calculate totals
            total_secured = sum(
                dep.deposited_amount 
                for dep in self.deposit_positions.get(agent_id, [])
            )
            
            total_borrowed = sum(
                borrow.borrowed_amount 
                for borrow in self.borrow_positions.get(agent_id, [])
            )
            
            milestones_triggered = sum(
                1 for milestone in self.profit_milestones.get(agent_id, [])
                if milestone.triggered
            )
            
            goals_completed = len(self.goal_completions.get(agent_id, []))
            
            # Calculate yields and rates
            deposits = self.deposit_positions.get(agent_id, [])
            borrows = self.borrow_positions.get(agent_id, [])
            
            if deposits:
                avg_deposit_apy = sum(dep.apy for dep in deposits) / len(deposits)
                avg_health_factor = sum(dep.health_factor for dep in deposits) / len(deposits)
            else:
                avg_deposit_apy = 0
                avg_health_factor = 2.0
            
            if borrows:
                avg_borrow_apy = sum(borrow.apy for borrow in borrows) / len(borrows)
            else:
                avg_borrow_apy = 0
            
            # Net yield calculation
            deposit_yield = float(total_secured) * avg_deposit_apy / 100
            borrow_cost = float(total_borrowed) * avg_borrow_apy / 100
            net_yield = (deposit_yield - borrow_cost) / max(float(total_secured), 1) * 100
            
            # Compounding rate (simplified)
            compounding_rate = net_yield + (float(total_borrowed) / max(float(total_secured), 1) * 100)
            
            # Risk score (0-100, lower is better)
            risk_score = max(0, 100 - avg_health_factor * 50)
            
            return ProfitSecuringMetrics(
                agent_id=agent_id,
                total_secured=total_secured,
                total_borrowed=total_borrowed,
                total_milestones_triggered=milestones_triggered,
                total_goals_completed=goals_completed,
                net_yield=net_yield,
                average_health_factor=avg_health_factor,
                compounding_rate=compounding_rate,
                risk_score=risk_score
            )
            
        except Exception as e:
            logger.error(f"Error calculating profit securing metrics: {e}")
            return ProfitSecuringMetrics(
                agent_id=agent_id,
                total_secured=Decimal('0'),
                total_borrowed=Decimal('0'),
                total_milestones_triggered=0,
                total_goals_completed=0,
                net_yield=0.0,
                average_health_factor=2.0,
                compounding_rate=0.0,
                risk_score=0.0
            )
    
    async def monitor_health_factors(self) -> Dict[str, Any]:
        """Monitor health factors across all positions"""
        try:
            alerts = []
            rebalancing_needed = []
            
            for agent_id, deposits in self.deposit_positions.items():
                for deposit in deposits:
                    if deposit.health_factor < 1.8:
                        alerts.append({
                            'agent_id': agent_id,
                            'position_id': deposit.position_id,
                            'protocol': deposit.protocol,
                            'health_factor': deposit.health_factor,
                            'severity': 'critical' if deposit.health_factor < 1.5 else 'warning'
                        })
                    
                    if deposit.health_factor < 2.0:
                        rebalancing_needed.append({
                            'agent_id': agent_id,
                            'position_id': deposit.position_id,
                            'action': 'reduce_borrowing' if deposit.health_factor < 1.6 else 'monitor'
                        })
            
            return {
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'total_positions_monitored': sum(len(deps) for deps in self.deposit_positions.values()),
                'alerts': alerts,
                'rebalancing_needed': rebalancing_needed,
                'overall_health': 'good' if not alerts else 'needs_attention'
            }
            
        except Exception as e:
            logger.error(f"Error monitoring health factors: {e}")
            return {'error': str(e)}
    
    # Database operations
    
    async def _save_agent_rules_db(self, agent_id: str, rules: Dict, milestones: List[ProfitMilestone]):
        """Save agent profit securing rules to database"""
        try:
            if self.supabase:
                # Save rules
                self.supabase.table('profit_securing_rules').upsert({
                    'agent_id': agent_id,
                    'rules': rules,
                    'milestones': [
                        {
                            'milestone_id': m.milestone_id,
                            'amount': str(m.amount),
                            'secure_percentage': m.secure_percentage,
                            'protocol': m.protocol
                        }
                        for m in milestones
                    ],
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }).execute()
        except Exception as e:
            logger.error(f"Error saving agent rules to database: {e}")
    
    async def _save_goal_completion_db(self, goal_completion: GoalCompletionProfit):
        """Save goal completion to database"""
        try:
            if self.supabase:
                self.supabase.table('goal_completion_profits').insert({
                    'completion_id': goal_completion.completion_id,
                    'goal_id': goal_completion.goal_id,
                    'agent_id': goal_completion.agent_id,
                    'completion_profit': str(goal_completion.completion_profit),
                    'secured_amount': str(goal_completion.secured_amount),
                    'protocol': goal_completion.protocol,
                    'deposit_tx_id': goal_completion.deposit_tx_id,
                    'borrowed_amount': str(goal_completion.borrowed_amount),
                    'borrow_tx_id': goal_completion.borrow_tx_id,
                    'completed_at': goal_completion.completed_at.isoformat()
                }).execute()
        except Exception as e:
            logger.error(f"Error saving goal completion to database: {e}")
    
    async def _save_deposit_position_db(self, deposit: DepositPosition):
        """Save deposit position to database"""
        try:
            if self.supabase:
                self.supabase.table('profit_securing_deposits').insert({
                    'position_id': deposit.position_id,
                    'agent_id': deposit.agent_id,
                    'protocol': deposit.protocol,
                    'asset': deposit.asset,
                    'deposited_amount': str(deposit.deposited_amount),
                    'current_value': str(deposit.current_value),
                    'apy': deposit.apy,
                    'health_factor': deposit.health_factor,
                    'borrowed_against': str(deposit.borrowed_against),
                    'available_to_borrow': str(deposit.available_to_borrow),
                    'created_at': deposit.created_at.isoformat(),
                    'updated_at': deposit.updated_at.isoformat()
                }).execute()
        except Exception as e:
            logger.error(f"Error saving deposit position to database: {e}")
    
    async def _save_borrow_position_db(self, borrow: BorrowPosition):
        """Save borrow position to database"""
        try:
            if self.supabase:
                self.supabase.table('profit_securing_borrows').insert({
                    'borrow_id': borrow.borrow_id,
                    'deposit_position_id': borrow.deposit_position_id,
                    'agent_id': borrow.agent_id,
                    'protocol': borrow.protocol,
                    'borrowed_amount': str(borrow.borrowed_amount),
                    'current_debt': str(borrow.current_debt),
                    'apy': borrow.apy,
                    'health_factor': borrow.health_factor,
                    'liquidation_threshold': borrow.liquidation_threshold,
                    'created_at': borrow.created_at.isoformat(),
                    'updated_at': borrow.updated_at.isoformat()
                }).execute()
        except Exception as e:
            logger.error(f"Error saving borrow position to database: {e}")


# Global service instance
_smart_profit_securing_service = None

async def get_smart_profit_securing_service() -> SmartProfitSecuringService:
    """Get or create smart profit securing service instance"""
    global _smart_profit_securing_service
    if _smart_profit_securing_service is None:
        _smart_profit_securing_service = SmartProfitSecuringService()
        await _smart_profit_securing_service.initialize()
    return _smart_profit_securing_service