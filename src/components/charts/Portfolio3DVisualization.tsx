'use client'

import React, { useRef, useEffect, useState, Suspense } from 'react'
import * as THREE from 'three'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { 
  Cube, RotateCcw, Play, Pause, Settings, 
  Maximize2, Volume2, Palette 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PortfolioAsset {
  symbol: string
  name: string
  value: number
  allocation: number
  change24h: number
  color: string
}

interface Portfolio3DVisualizationProps {
  assets?: PortfolioAsset[]
  width?: number
  height?: number
  className?: string
}

// Mock portfolio data
const mockPortfolioData: PortfolioAsset[] = [
  { symbol: 'BTC', name: 'Bitcoin', value: 45000, allocation: 40, change24h: 2.5, color: '#f7931a' },
  { symbol: 'ETH', name: 'Ethereum', value: 25000, allocation: 25, change24h: 1.8, color: '#627eea' },
  { symbol: 'SOL', name: 'Solana', value: 15000, allocation: 15, change24h: -1.2, color: '#9945ff' },
  { symbol: 'ADA', name: 'Cardano', value: 8000, allocation: 8, change24h: 0.8, color: '#0033ad' },
  { symbol: 'MATIC', name: 'Polygon', value: 5000, allocation: 5, change24h: 3.2, color: '#8247e5' },
  { symbol: 'DOT', name: 'Polkadot', value: 4000, allocation: 4, change24h: -0.5, color: '#e6007a' },
  { symbol: 'LINK', name: 'Chainlink', value: 3000, allocation: 3, change24h: 1.9, color: '#375bd2' }
]

export function Portfolio3DVisualization({ 
  assets = mockPortfolioData, 
  width = 800, 
  height = 500,
  className 
}: Portfolio3DVisualizationProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const cameraRef = useRef<THREE.PerspectiveCamera>()
  const cubesRef = useRef<THREE.Mesh[]>([])
  const frameRef = useRef<number>()
  
  const [isAnimating, setIsAnimating] = useState(true)
  const [viewMode, setViewMode] = useState<'allocation' | 'performance' | 'value'>('allocation')
  const [rotationSpeed, setRotationSpeed] = useState(0.01)
  const [cameraDistance, setCameraDistance] = useState(15)
  const [selectedAsset, setSelectedAsset] = useState<PortfolioAsset | null>(null)
  const [hoveredAsset, setHoveredAsset] = useState<PortfolioAsset | null>(null)

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf8fafc)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.set(0, 5, cameraDistance)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setClearColor(0xf8fafc, 1)
    rendererRef.current = renderer

    mountRef.current.appendChild(renderer.domElement)

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Create portfolio cubes
    createPortfolioCubes()

    // Start animation loop
    animate()

    // Cleanup
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [width, height])

  // Update camera distance
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.setLength(cameraDistance)
      cameraRef.current.lookAt(0, 0, 0)
    }
  }, [cameraDistance])

  // Update cubes when view mode or data changes
  useEffect(() => {
    updateCubeVisualization()
  }, [viewMode, assets])

  const createPortfolioCubes = () => {
    if (!sceneRef.current) return

    // Clear existing cubes
    cubesRef.current.forEach(cube => {
      sceneRef.current?.remove(cube)
    })
    cubesRef.current = []

    // Create cubes for each asset
    assets.forEach((asset, index) => {
      const cubeSize = getCubeSize(asset)
      const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize)
      
      const material = new THREE.MeshLambertMaterial({
        color: asset.color,
        transparent: true,
        opacity: 0.8
      })

      const cube = new THREE.Mesh(geometry, material)
      
      // Position cubes in a circular arrangement
      const angle = (index / assets.length) * Math.PI * 2
      const radius = 8
      cube.position.x = Math.cos(angle) * radius
      cube.position.z = Math.sin(angle) * radius
      cube.position.y = cubeSize / 2

      // Add shadow
      cube.castShadow = true
      cube.receiveShadow = true

      // Store asset data in userData
      cube.userData = { asset, index }

      sceneRef.current.add(cube)
      cubesRef.current.push(cube)

      // Add text label
      createTextLabel(asset.symbol, cube.position.clone().add(new THREE.Vector3(0, cubeSize + 1, 0)))
    })

    // Add ground plane
    const planeGeometry = new THREE.PlaneGeometry(50, 50)
    const planeMaterial = new THREE.MeshLambertMaterial({ 
      color: 0xffffff, 
      transparent: true, 
      opacity: 0.5 
    })
    const plane = new THREE.Mesh(planeGeometry, planeMaterial)
    plane.rotation.x = -Math.PI / 2
    plane.receiveShadow = true
    sceneRef.current.add(plane)
  }

  const getCubeSize = (asset: PortfolioAsset): number => {
    switch (viewMode) {
      case 'allocation':
        return Math.max(asset.allocation / 10, 0.5) + 1
      case 'value':
        const maxValue = Math.max(...assets.map(a => a.value))
        return (asset.value / maxValue) * 3 + 1
      case 'performance':
        return Math.abs(asset.change24h) / 2 + 1
      default:
        return 2
    }
  }

  const createTextLabel = (text: string, position: THREE.Vector3) => {
    if (!sceneRef.current) return

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = 256
    canvas.height = 64
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.fillStyle = '#1f2937'
    context.font = 'bold 24px Arial'
    context.textAlign = 'center'
    context.fillText(text, canvas.width / 2, canvas.height / 2 + 8)

    const texture = new THREE.CanvasTexture(canvas)
    const material = new THREE.SpriteMaterial({ map: texture })
    const sprite = new THREE.Sprite(material)
    sprite.position.copy(position)
    sprite.scale.set(2, 0.5, 1)

    sceneRef.current.add(sprite)
  }

  const updateCubeVisualization = () => {
    cubesRef.current.forEach((cube, index) => {
      const asset = assets[index]
      if (!asset) return

      // Update cube size
      const newSize = getCubeSize(asset)
      cube.scale.set(newSize / 2, newSize / 2, newSize / 2)

      // Update color based on performance
      const material = cube.material as THREE.MeshLambertMaterial
      if (viewMode === 'performance') {
        if (asset.change24h > 0) {
          material.color.setHex(0x10b981) // Green for positive
        } else if (asset.change24h < 0) {
          material.color.setHex(0xef4444) // Red for negative
        } else {
          material.color.setHex(0x6b7280) // Gray for neutral
        }
      } else {
        material.color.setHex(parseInt(asset.color.replace('#', '0x')))
      }
    })
  }

  const animate = () => {
    frameRef.current = requestAnimationFrame(animate)

    if (isAnimating && sceneRef.current && cameraRef.current && rendererRef.current) {
      // Rotate cubes
      cubesRef.current.forEach((cube, index) => {
        cube.rotation.x += rotationSpeed
        cube.rotation.y += rotationSpeed * 1.5
        
        // Add floating animation
        cube.position.y = Math.sin(Date.now() * 0.001 + index) * 0.5 + getCubeSize(assets[index]) / 2
      })

      // Rotate camera around the scene
      const time = Date.now() * 0.0005
      cameraRef.current.position.x = Math.cos(time) * cameraDistance
      cameraRef.current.position.z = Math.sin(time) * cameraDistance
      cameraRef.current.lookAt(0, 0, 0)

      rendererRef.current.render(sceneRef.current, cameraRef.current)
    }
  }

  const handleReset = () => {
    setRotationSpeed(0.01)
    setCameraDistance(15)
    setViewMode('allocation')
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 5, 15)
      cameraRef.current.lookAt(0, 0, 0)
    }
  }

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cube className="h-5 w-5 text-purple-600" />
                3D Portfolio Visualization
                <Badge variant="secondary" className="text-xs">
                  Three.js Powered
                </Badge>
              </CardTitle>
              <CardDescription>
                Interactive 3D visualization of portfolio allocation and performance
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold">
                ${totalValue.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Portfolio Value
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            {/* View Mode Controls */}
            <div className="flex items-center gap-2">
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allocation">Allocation %</SelectItem>
                  <SelectItem value="value">Asset Value</SelectItem>
                  <SelectItem value="performance">24h Performance</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setIsAnimating(!isAnimating)}
              >
                {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isAnimating ? 'Pause' : 'Play'}
              </Button>

              <Button size="sm" variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>

            {/* Camera Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Distance:</span>
                <Slider
                  value={[cameraDistance]}
                  onValueChange={(value) => setCameraDistance(value[0])}
                  min={10}
                  max={30}
                  step={1}
                  className="w-20"
                />
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Speed:</span>
                <Slider
                  value={[rotationSpeed * 1000]}
                  onValueChange={(value) => setRotationSpeed(value[0] / 1000)}
                  min={0}
                  max={50}
                  step={1}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          {/* 3D Visualization */}
          <div className="border rounded-lg overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
            <Suspense fallback={
              <div className="flex items-center justify-center" style={{ width, height }}>
                <div className="text-center">
                  <Cube className="h-12 w-12 text-purple-600 mx-auto mb-4 animate-spin" />
                  <p className="text-muted-foreground">Loading 3D Portfolio...</p>
                </div>
              </div>
            }>
              <div ref={mountRef} className="w-full h-full" />
            </Suspense>
          </div>

          {/* Portfolio Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-lg font-bold text-blue-600">{assets.length}</div>
              <div className="text-xs text-muted-foreground">Assets</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {assets.filter(a => a.change24h > 0).length}
              </div>
              <div className="text-xs text-muted-foreground">Positive 24h</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {Math.max(...assets.map(a => a.allocation))}%
              </div>
              <div className="text-xs text-muted-foreground">Largest Allocation</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {(assets.reduce((sum, a) => sum + a.change24h, 0) / assets.length).toFixed(2)}%
              </div>
              <div className="text-xs text-muted-foreground">Avg 24h Change</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Details */}
      <AnimatePresence>
        {hoveredAsset && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <Card className="w-64 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: hoveredAsset.color }}
                  />
                  <div>
                    <div className="font-semibold">{hoveredAsset.name}</div>
                    <div className="text-sm text-muted-foreground">{hoveredAsset.symbol}</div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Value:</span>
                    <span className="font-medium">${hoveredAsset.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Allocation:</span>
                    <span className="font-medium">{hoveredAsset.allocation}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>24h Change:</span>
                    <span className={`font-medium ${hoveredAsset.change24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {hoveredAsset.change24h >= 0 ? '+' : ''}{hoveredAsset.change24h}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Portfolio3DVisualization