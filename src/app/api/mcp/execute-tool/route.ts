/**
 * MCP Tool Execution API Route
 * Handles tool execution requests from the dashboard to MCP servers
 * Provides secure bridge between frontend and MCP backend services
 */

import { NextRequest, NextResponse } from 'next/server';

// MCP Server configurations
const MCP_SERVERS = {
  hft_arbitrage_mcp: 'http://localhost:8001',
  multichain_trading_mcp: 'http://localhost:8002',
  agent_funding_mcp: 'http://localhost:8003',
  realtime_price_mcp: 'http://localhost:8004',
  risk_management_mcp: 'http://localhost:8005'
};

// Tool to server mapping
const TOOL_SERVER_MAP: Record<string, string> = {
  // HFT Arbitrage tools
  'detect_arbitrage_opportunities': 'hft_arbitrage_mcp',
  'execute_arbitrage': 'hft_arbitrage_mcp',
  'get_arbitrage_performance': 'hft_arbitrage_mcp',
  'monitor_price_spreads': 'hft_arbitrage_mcp',
  'get_market_conditions': 'hft_arbitrage_mcp',
  'emergency_stop_arbitrage': 'hft_arbitrage_mcp',

  // Multi-chain Trading tools
  'register_agent_for_trading': 'multichain_trading_mcp',
  'execute_multichain_trade': 'multichain_trading_mcp',
  'bridge_assets_cross_chain': 'multichain_trading_mcp',
  'get_chain_status': 'multichain_trading_mcp',
  'get_agent_portfolio': 'multichain_trading_mcp',
  'get_trading_opportunities': 'multichain_trading_mcp',
  'request_agent_funding': 'multichain_trading_mcp',
  'get_mcp_server_access': 'multichain_trading_mcp',

  // Agent Funding tools
  'request_funding': 'agent_funding_mcp',
  'get_funding_status': 'agent_funding_mcp',
  'update_performance_metrics': 'agent_funding_mcp',
  'get_funding_analytics': 'agent_funding_mcp',
  'get_funding_opportunities': 'agent_funding_mcp',
  'emergency_funding_stop': 'agent_funding_mcp',

  // Real-time Price tools
  'subscribe_real_time_prices': 'realtime_price_mcp',
  'get_live_market_data': 'realtime_price_mcp',
  'monitor_cross_exchange_spreads': 'realtime_price_mcp',
  'get_price_analytics': 'realtime_price_mcp',
  'get_market_liquidity_data': 'realtime_price_mcp',

  // Risk Management tools
  'assess_portfolio_risk': 'risk_management_mcp',
  'monitor_real_time_risk': 'risk_management_mcp',
  'calculate_position_sizing': 'risk_management_mcp',
  'execute_emergency_stop': 'risk_management_mcp',
  'get_risk_metrics': 'risk_management_mcp',
  'validate_trading_limits': 'risk_management_mcp'
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool_name, arguments: toolArgs, agent_id, timeout_ms = 30000 } = body;

    // Validate required fields
    if (!tool_name) {
      return NextResponse.json(
        { success: false, error: 'Tool name is required' },
        { status: 400 }
      );
    }

    // Find the appropriate server for this tool
    const serverName = TOOL_SERVER_MAP[tool_name];
    if (!serverName) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Unknown tool: ${tool_name}. Available tools: ${Object.keys(TOOL_SERVER_MAP).join(', ')}` 
        },
        { status: 400 }
      );
    }

    const serverUrl = MCP_SERVERS[serverName as keyof typeof MCP_SERVERS];
    if (!serverUrl) {
      return NextResponse.json(
        { success: false, error: `Server configuration not found for: ${serverName}` },
        { status: 500 }
      );
    }

    // Prepare the request to the MCP server
    const mcpRequest = {
      name: tool_name,
      arguments: toolArgs || {},
      agent_id
    };

    // Make the request to the MCP server with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout_ms);

    try {
      const response = await fetch(`${serverUrl}/mcp/tools/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(mcpRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { 
            success: false, 
            error: `MCP server error: ${response.status} ${response.statusText}`,
            server_used: serverName
          },
          { status: response.status }
        );
      }

      const result = await response.json();
      
      // Add metadata to the response
      return NextResponse.json({
        ...result,
        server_used: serverName,
        tool_name,
        agent_id
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            success: false, 
            error: `Tool execution timeout after ${timeout_ms}ms`,
            server_used: serverName
          },
          { status: 408 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
          server_used: serverName
        },
        { status: 503 }
      );
    }

  } catch (error) {
    console.error('MCP tool execution error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'health') {
    // Check health of all MCP servers
    const healthChecks = await Promise.allSettled(
      Object.entries(MCP_SERVERS).map(async ([name, url]) => {
        try {
          const response = await fetch(`${url}/health`, {
            method: 'GET',
            timeout: 5000
          });
          
          const data = response.ok ? await response.json() : null;
          
          return {
            name,
            url,
            status: response.ok ? 'online' : 'error',
            health_data: data,
            latency: response.ok ? Date.now() - performance.now() : null
          };
        } catch (error) {
          return {
            name,
            url,
            status: 'offline',
            error: error instanceof Error ? error.message : 'Unknown error',
            latency: null
          };
        }
      })
    );

    const serverHealth = healthChecks.map(result => 
      result.status === 'fulfilled' ? result.value : {
        name: 'unknown',
        status: 'error',
        error: 'Health check failed'
      }
    );

    const onlineServers = serverHealth.filter(s => s.status === 'online').length;
    const totalServers = serverHealth.length;

    return NextResponse.json({
      success: true,
      data: {
        servers: serverHealth,
        summary: {
          total_servers: totalServers,
          online_servers: onlineServers,
          offline_servers: totalServers - onlineServers,
          health_score: (onlineServers / totalServers) * 100
        }
      }
    });
  }

  if (action === 'tools') {
    // Get available tools from all servers
    const toolDiscovery = await Promise.allSettled(
      Object.entries(MCP_SERVERS).map(async ([name, url]) => {
        try {
          const response = await fetch(`${url}/mcp/tools`, {
            method: 'GET',
            timeout: 5000
          });
          
          if (response.ok) {
            const data = await response.json();
            return {
              server: name,
              tools: data.tools || [],
              status: 'online'
            };
          } else {
            return {
              server: name,
              tools: [],
              status: 'error'
            };
          }
        } catch (error) {
          return {
            server: name,
            tools: [],
            status: 'offline'
          };
        }
      })
    );

    const serverTools = toolDiscovery.map(result => 
      result.status === 'fulfilled' ? result.value : {
        server: 'unknown',
        tools: [],
        status: 'error'
      }
    );

    const allTools = serverTools.flatMap(st => 
      st.tools.map((tool: any) => ({
        ...tool,
        server: st.server,
        available: st.status === 'online'
      }))
    );

    return NextResponse.json({
      success: true,
      data: {
        servers: serverTools,
        tools: allTools,
        summary: {
          total_tools: allTools.length,
          available_tools: allTools.filter(t => t.available).length,
          servers_online: serverTools.filter(s => s.status === 'online').length
        }
      }
    });
  }

  if (action === 'servers') {
    // Get server configurations
    return NextResponse.json({
      success: true,
      data: {
        servers: Object.entries(MCP_SERVERS).map(([name, url]) => ({
          name,
          url,
          port: parseInt(url.split(':')[2] || '8000'),
          tools: Object.entries(TOOL_SERVER_MAP)
            .filter(([_, server]) => server === name)
            .map(([tool, _]) => tool)
        })),
        tool_server_map: TOOL_SERVER_MAP
      }
    });
  }

  return NextResponse.json(
    { success: false, error: 'Invalid action. Use ?action=health, ?action=tools, or ?action=servers' },
    { status: 400 }
  );
}