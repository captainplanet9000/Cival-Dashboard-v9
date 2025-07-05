#!/usr/bin/env python3
"""
Performance Optimization Service
Advanced caching, optimization, and performance monitoring
"""

import asyncio
import json
import logging
import time
import hashlib
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Callable
from pydantic import BaseModel
from collections import defaultdict, OrderedDict
import weakref
import gc

# Configure logging
logger = logging.getLogger(__name__)

class CacheConfig(BaseModel):
    """Cache configuration settings"""
    max_size: int = 1000
    ttl_seconds: int = 300  # 5 minutes default
    cleanup_interval: int = 60  # 1 minute
    compression_enabled: bool = True
    persistence_enabled: bool = False

class PerformanceMetrics(BaseModel):
    """Performance metrics tracking"""
    endpoint: str
    avg_response_time: float
    min_response_time: float
    max_response_time: float
    request_count: int
    error_count: int
    cache_hit_rate: float
    memory_usage: float
    cpu_usage: float
    timestamp: datetime

class CacheEntry(BaseModel):
    """Cache entry with metadata"""
    key: str
    value: Any
    created_at: datetime
    last_accessed: datetime
    access_count: int
    ttl: int
    size_bytes: int
    compressed: bool = False

class RequestProfile(BaseModel):
    """Request profiling data"""
    endpoint: str
    method: str
    response_time: float
    memory_before: float
    memory_after: float
    cache_hit: bool
    timestamp: datetime
    user_agent: Optional[str] = None

class MemoryOptimizer:
    """Memory optimization and management"""
    
    def __init__(self):
        self.weak_refs = weakref.WeakValueDictionary()
        self.memory_threshold = 100 * 1024 * 1024  # 100MB
        
    def optimize_memory(self) -> Dict[str, Any]:
        """Optimize memory usage"""
        try:
            # Force garbage collection
            collected = gc.collect()
            
            # Get memory info
            memory_info = self._get_memory_info()
            
            # Clear weak references
            weak_refs_cleared = len(self.weak_refs)
            self.weak_refs.clear()
            
            return {
                "objects_collected": collected,
                "weak_refs_cleared": weak_refs_cleared,
                "memory_usage_mb": memory_info["memory_mb"],
                "memory_freed": memory_info.get("freed_mb", 0),
                "optimization_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Memory optimization failed: {e}")
            return {"error": str(e)}
    
    def _get_memory_info(self) -> Dict[str, float]:
        """Get current memory information"""
        try:
            # Fallback memory calculation
            return {"memory_mb": sys.getsizeof(gc.get_objects()) / 1024 / 1024}
        except Exception:
            return {"memory_mb": 0.0}

class AdvancedCache:
    """Advanced caching system with LRU, TTL, and compression"""
    
    def __init__(self, config: CacheConfig):
        self.config = config
        self.cache: OrderedDict = OrderedDict()
        self.hit_count = 0
        self.miss_count = 0
        self.eviction_count = 0
        self.last_cleanup = datetime.now()
        
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            if key in self.cache:
                entry = self.cache[key]
                
                # Check TTL
                if self._is_expired(entry):
                    await self.delete(key)
                    self.miss_count += 1
                    return None
                
                # Update access info
                entry.last_accessed = datetime.now()
                entry.access_count += 1
                
                # Move to end (LRU)
                self.cache.move_to_end(key)
                
                self.hit_count += 1
                return entry.value
            
            self.miss_count += 1
            return None
            
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            self.miss_count += 1
            return None
    
    async def set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set value in cache"""
        try:
            # Use default TTL if not specified
            cache_ttl = ttl or self.config.ttl_seconds
            
            # Calculate size
            size_bytes = sys.getsizeof(value)
            
            # Create cache entry
            entry = CacheEntry(
                key=key,
                value=value,
                created_at=datetime.now(),
                last_accessed=datetime.now(),
                access_count=1,
                ttl=cache_ttl,
                size_bytes=size_bytes
            )
            
            # Evict if necessary
            await self._evict_if_needed()
            
            # Store in cache
            self.cache[key] = entry
            
            return True
            
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete from cache"""
        try:
            if key in self.cache:
                del self.cache[key]
                return True
            return False
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    async def clear(self) -> bool:
        """Clear entire cache"""
        try:
            self.cache.clear()
            self.hit_count = 0
            self.miss_count = 0
            self.eviction_count = 0
            return True
        except Exception as e:
            logger.error(f"Cache clear error: {e}")
            return False
    
    async def cleanup_expired(self) -> int:
        """Clean up expired entries"""
        try:
            expired_keys = []
            for key, entry in self.cache.items():
                if self._is_expired(entry):
                    expired_keys.append(key)
            
            for key in expired_keys:
                del self.cache[key]
            
            self.last_cleanup = datetime.now()
            return len(expired_keys)
            
        except Exception as e:
            logger.error(f"Cache cleanup error: {e}")
            return 0
    
    async def _evict_if_needed(self) -> None:
        """Evict entries if cache is full"""
        while len(self.cache) >= self.config.max_size:
            # Remove oldest entry (LRU)
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
            self.eviction_count += 1
    
    def _is_expired(self, entry: CacheEntry) -> bool:
        """Check if cache entry is expired"""
        age = (datetime.now() - entry.created_at).total_seconds()
        return age > entry.ttl
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.hit_count + self.miss_count
        hit_rate = (self.hit_count / total_requests) if total_requests > 0 else 0
        
        total_size = sum(entry.size_bytes for entry in self.cache.values())
        
        return {
            "entries": len(self.cache),
            "max_size": self.config.max_size,
            "hit_count": self.hit_count,
            "miss_count": self.miss_count,
            "eviction_count": self.eviction_count,
            "hit_rate": hit_rate,
            "total_size_bytes": total_size,
            "total_size_mb": total_size / 1024 / 1024,
            "last_cleanup": self.last_cleanup.isoformat()
        }

class PerformanceMonitor:
    """Performance monitoring and profiling"""
    
    def __init__(self):
        self.request_profiles: List[RequestProfile] = []
        self.endpoint_metrics: Dict[str, List[float]] = defaultdict(list)
        self.max_profiles = 1000
        
    def start_request_timing(self) -> float:
        """Start timing a request"""
        return time.time()
    
    def end_request_timing(self, start_time: float, endpoint: str, 
                          method: str = "GET", cache_hit: bool = False) -> float:
        """End timing and record metrics"""
        try:
            response_time = time.time() - start_time
            
            # Record endpoint metrics
            self.endpoint_metrics[endpoint].append(response_time)
            
            # Limit metrics history
            if len(self.endpoint_metrics[endpoint]) > 100:
                self.endpoint_metrics[endpoint] = self.endpoint_metrics[endpoint][-100:]
            
            # Record detailed profile
            if len(self.request_profiles) < self.max_profiles:
                profile = RequestProfile(
                    endpoint=endpoint,
                    method=method,
                    response_time=response_time,
                    memory_before=0.0,  # Simplified for now
                    memory_after=0.0,
                    cache_hit=cache_hit,
                    timestamp=datetime.now()
                )
                self.request_profiles.append(profile)
            
            return response_time
            
        except Exception as e:
            logger.error(f"Performance timing error: {e}")
            return 0.0
    
    def get_endpoint_metrics(self, endpoint: str) -> Optional[PerformanceMetrics]:
        """Get metrics for specific endpoint"""
        try:
            if endpoint not in self.endpoint_metrics:
                return None
            
            response_times = self.endpoint_metrics[endpoint]
            if not response_times:
                return None
            
            # Calculate cache hit rate for this endpoint
            endpoint_profiles = [p for p in self.request_profiles if p.endpoint == endpoint]
            cache_hits = sum(1 for p in endpoint_profiles if p.cache_hit)
            cache_hit_rate = cache_hits / len(endpoint_profiles) if endpoint_profiles else 0
            
            return PerformanceMetrics(
                endpoint=endpoint,
                avg_response_time=sum(response_times) / len(response_times),
                min_response_time=min(response_times),
                max_response_time=max(response_times),
                request_count=len(response_times),
                error_count=0,  # Simplified for now
                cache_hit_rate=cache_hit_rate,
                memory_usage=0.0,  # Simplified
                cpu_usage=0.0,     # Simplified
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"Metrics calculation error for {endpoint}: {e}")
            return None
    
    def get_all_metrics(self) -> List[PerformanceMetrics]:
        """Get metrics for all endpoints"""
        metrics = []
        for endpoint in self.endpoint_metrics.keys():
            endpoint_metrics = self.get_endpoint_metrics(endpoint)
            if endpoint_metrics:
                metrics.append(endpoint_metrics)
        return metrics
    
    def clear_metrics(self) -> None:
        """Clear all metrics"""
        self.request_profiles.clear()
        self.endpoint_metrics.clear()

class PerformanceOptimizationService:
    """Main performance optimization service"""
    
    def __init__(self):
        self.cache = AdvancedCache(CacheConfig())
        self.monitor = PerformanceMonitor()
        self.memory_optimizer = MemoryOptimizer()
        self.optimization_enabled = True
        self.auto_cleanup_task = None
        
    async def initialize(self) -> bool:
        """Initialize performance optimization service"""
        try:
            # Start background cleanup task
            self.auto_cleanup_task = asyncio.create_task(self._background_cleanup())
            logger.info("Performance optimization service initialized successfully")
            return True
        except Exception as e:
            logger.error(f"Failed to initialize performance service: {e}")
            return False
    
    async def cache_get(self, key: str) -> Optional[Any]:
        """Get from cache with performance monitoring"""
        start_time = self.monitor.start_request_timing()
        result = await self.cache.get(key)
        self.monitor.end_request_timing(start_time, f"cache_get_{key}", cache_hit=result is not None)
        return result
    
    async def cache_set(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Set cache with performance monitoring"""
        start_time = self.monitor.start_request_timing()
        result = await self.cache.set(key, value, ttl)
        self.monitor.end_request_timing(start_time, f"cache_set_{key}")
        return result
    
    async def cache_key_for_request(self, endpoint: str, params: Dict[str, Any]) -> str:
        """Generate cache key for request"""
        # Create deterministic cache key
        key_data = f"{endpoint}:{json.dumps(params, sort_keys=True)}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    async def optimize_query_performance(self, query_func: Callable, 
                                       cache_key: str, 
                                       ttl: int = 300) -> Any:
        """Optimize query with caching"""
        try:
            # Try cache first
            cached_result = await self.cache_get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute query with timing
            start_time = self.monitor.start_request_timing()
            result = await query_func() if asyncio.iscoroutinefunction(query_func) else query_func()
            self.monitor.end_request_timing(start_time, "query_execution")
            
            # Cache result
            await self.cache_set(cache_key, result, ttl)
            
            return result
            
        except Exception as e:
            logger.error(f"Query optimization error: {e}")
            raise
    
    async def batch_operations(self, operations: List[Callable]) -> List[Any]:
        """Execute operations in optimized batches"""
        try:
            # Execute operations concurrently
            start_time = self.monitor.start_request_timing()
            
            if operations and asyncio.iscoroutinefunction(operations[0]):
                results = await asyncio.gather(*[op() for op in operations], return_exceptions=True)
            else:
                results = [op() for op in operations]
            
            self.monitor.end_request_timing(start_time, "batch_operations")
            
            return results
            
        except Exception as e:
            logger.error(f"Batch operations error: {e}")
            return []
    
    async def _background_cleanup(self) -> None:
        """Background task for cache cleanup and optimization"""
        while True:
            try:
                await asyncio.sleep(self.cache.config.cleanup_interval)
                
                if self.optimization_enabled:
                    # Clean expired cache entries
                    expired_count = await self.cache.cleanup_expired()
                    if expired_count > 0:
                        logger.info(f"Cleaned up {expired_count} expired cache entries")
                    
                    # Optimize memory periodically
                    if datetime.now().hour % 2 == 0:  # Every 2 hours
                        memory_result = self.memory_optimizer.optimize_memory()
                        logger.info(f"Memory optimization: {memory_result}")
                
            except Exception as e:
                logger.error(f"Background cleanup error: {e}")
    
    async def get_performance_report(self) -> Dict[str, Any]:
        """Get comprehensive performance report"""
        try:
            cache_stats = self.cache.get_stats()
            endpoint_metrics = self.monitor.get_all_metrics()
            memory_info = self.memory_optimizer._get_memory_info()
            
            return {
                "cache_performance": cache_stats,
                "endpoint_metrics": [metric.dict() for metric in endpoint_metrics],
                "memory_usage": memory_info,
                "optimization_enabled": self.optimization_enabled,
                "total_requests": len(self.monitor.request_profiles),
                "avg_response_time": sum(p.response_time for p in self.monitor.request_profiles) / len(self.monitor.request_profiles) if self.monitor.request_profiles else 0,
                "report_generated": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Performance report generation error: {e}")
            return {"error": str(e)}
    
    async def optimize_configuration(self) -> Dict[str, Any]:
        """Auto-optimize configuration based on usage patterns"""
        try:
            optimizations = []
            
            # Analyze cache performance
            cache_stats = self.cache.get_stats()
            
            if cache_stats["hit_rate"] < 0.5:
                # Low hit rate - increase TTL
                new_ttl = min(self.cache.config.ttl_seconds * 2, 3600)
                self.cache.config.ttl_seconds = new_ttl
                optimizations.append(f"Increased cache TTL to {new_ttl}s")
            
            if cache_stats["eviction_count"] > cache_stats["entries"] * 0.1:
                # High eviction rate - increase cache size
                new_size = min(self.cache.config.max_size * 2, 10000)
                self.cache.config.max_size = new_size
                optimizations.append(f"Increased cache size to {new_size}")
            
            # Analyze endpoint performance
            slow_endpoints = []
            for metric in self.monitor.get_all_metrics():
                if metric.avg_response_time > 1.0:  # > 1 second
                    slow_endpoints.append(metric.endpoint)
            
            if slow_endpoints:
                optimizations.append(f"Identified slow endpoints: {slow_endpoints}")
            
            return {
                "optimizations_applied": optimizations,
                "cache_config": self.cache.config.dict(),
                "optimization_time": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Configuration optimization error: {e}")
            return {"error": str(e)}
    
    async def get_service_status(self) -> Dict[str, Any]:
        """Get performance service status"""
        cache_stats = self.cache.get_stats()
        
        return {
            "service": "performance_optimization",
            "status": "healthy",
            "optimization_enabled": self.optimization_enabled,
            "cache_hit_rate": cache_stats["hit_rate"],
            "cache_entries": cache_stats["entries"],
            "memory_usage_mb": cache_stats["total_size_mb"],
            "total_requests": len(self.monitor.request_profiles),
            "background_cleanup_running": self.auto_cleanup_task is not None and not self.auto_cleanup_task.done(),
            "last_check": datetime.now().isoformat()
        }

# Global service instance
performance_service = PerformanceOptimizationService()