'use client'

import React, { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'

interface CyberCablesProps {
  cableColor?: string
  pulseColor?: string
  tunnelColor?: string
  tunnelOpacity?: number
  speed?: number
  flowDirection?: 'outward' | 'inward'
  pulseSpeed?: number
  pulseLength?: number
  pulseBlend?: number
  pulseWidth?: number
  cableCount?: number
  thickness?: number
  rimWidth?: number
  waviness?: number
  sway?: number
  size?: number
  centerOffsetX?: number
  centerOffsetY?: number
  glow?: number
  fadeNear?: number
  fadeFar?: number
  brightness?: number
  colorVariance?: boolean
  grain?: boolean
  grainIntensity?: number
  opacity?: number
  cursorParallax?: boolean
  cursorStrength?: number
  className?: string
  style?: React.CSSProperties
}

const hexToRgb = (hex: string): [number, number, number] => {
  const value = hex.trim().replace(/^#/, '')
  const normalized = value.length === 3 ? value.replace(/./g, (c) => c + c) : value
  const match = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized)
  if (!match) return [1, 1, 1]
  return [
    parseInt(match[1], 16) / 255,
    parseInt(match[2], 16) / 255,
    parseInt(match[3], 16) / 255,
  ]
}

const vertexShader = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec3 uCableColor;
uniform vec3 uPulseColor;
uniform vec3 uTunnelColor;
uniform float uTunnelOpacity;
uniform float uSpeed;
uniform float uFlowDirection;
uniform float uPulseSpeed;
uniform float uPulseLength;
uniform float uPulseBlend;
uniform float uPulseWidth;
uniform float uCableCount;
uniform float uThickness;
uniform float uRimWidth;
uniform float uWaviness;
uniform float uSway;
uniform float uSize;
uniform vec2 uCenterOffset;
uniform float uGlow;
uniform float uFadeNear;
uniform float uFadeFar;
uniform float uBrightness;
uniform float uColorVariance;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uOpacity;
uniform vec2 uMouse;
uniform float uCursorStrength;

out vec4 fragColor;

#define PI 3.14159265359
#define TWO_PI 6.28318530718

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.y, uResolution.x);
  
  // Center offset & cursor parallax
  uv -= uCenterOffset;
  uv -= uMouse * uCursorStrength * 0.1;
  
  // Size zoom
  uv /= max(uSize, 0.001);
  
  float r = length(uv);
  if (r < 0.0001) r = 0.0001;
  
  float phi = atan(uv.y, uv.x);
  
  // Tunnel Z coordinate with flow direction
  float z = (1.0 / r) + (uFlowDirection * uTime * uSpeed * 3.0);
  
  // Waviness and sway deformation
  float waveOffset = sin(z * (2.0 + uWaviness * 4.0) + uTime * uSway * 2.0) * (uWaviness * 0.15)
                   + cos(z * 1.5 - uTime * (uSway + 0.2)) * (uSway * 0.1);
  float angle = phi + waveOffset;
  
  // Normalize angle to [0, TWO_PI]
  angle = mod(angle, TWO_PI);
  if (angle < 0.0) angle += TWO_PI;
  
  // Cable repetition around tunnel circumference
  float sector = TWO_PI / max(uCableCount, 1.0);
  float cableIdx = floor(angle / sector);
  float cableCenter = (cableIdx + 0.5) * sector;
  float diffAngle = abs(angle - cableCenter);
  if (diffAngle > PI) diffAngle = TWO_PI - diffAngle;
  
  // Distance to cable in screen space
  float distToCable = diffAngle * r;
  
  // Thickness and rim calculation
  float baseThickness = uThickness * 0.012;
  float cableCore = smoothstep(baseThickness * (1.0 + uRimWidth), 0.0, distToCable);
  float cableGlow = exp(-distToCable / (baseThickness * (uGlow + 0.5))) * uGlow * 0.5;
  
  // Pulse animation travelling through cables
  float cableSeed = random(vec2(cableIdx, 1.37));
  float pulseZ = z * (uPulseLength * 1.5) - (uTime * uPulseSpeed * 4.0) + (cableSeed * 5.0);
  float pulsePhase = fract(pulseZ);
  float pulseVal = smoothstep(uPulseWidth * 0.5, 0.0, abs(pulsePhase - 0.5));
  pulseVal = pow(pulseVal, 1.8);
  
  // Color calculation
  vec3 cableCol = uCableColor;
  if (uColorVariance > 0.5) {
    cableCol = mix(uCableColor, uPulseColor, cableSeed * 0.6);
  }
  
  vec3 pulseCol = uPulseColor;
  vec3 finalCableCol = mix(cableCol, pulseCol, pulseVal * uPulseBlend);
  
  // Combine core + glow
  vec3 color = finalCableCol * (cableCore * 1.4 + cableGlow) * uBrightness;
  
  // Tunnel background ambient glow
  if (uTunnelOpacity > 0.001) {
    float tunnelAtmosphere = exp(-r * 1.5);
    color += uTunnelColor * uTunnelOpacity * tunnelAtmosphere;
  }
  
  // Depth fading
  float depthFade = smoothstep(uFadeFar, uFadeNear, 1.0 / r);
  color *= depthFade;
  
  // Vignette outer edge
  float vig = smoothstep(1.8, 0.2, r);
  color *= vig;
  
  // Optional grain
  if (uGrain > 0.5) {
    float noise = (random(gl_FragCoord.xy + fract(uTime)) - 0.5) * uGrainIntensity;
    color += noise;
  }
  
  fragColor = vec4(clamp(color, 0.0, 1.0), uOpacity);
}
`

export default function CyberCables({
  cableColor = '#fc0000',
  pulseColor = '#001aea',
  tunnelColor = '#fff400',
  tunnelOpacity = 0,
  speed = 0.2,
  flowDirection = 'outward',
  pulseSpeed = 0.7,
  pulseLength = 0.28,
  pulseBlend = 1,
  pulseWidth = 1,
  cableCount = 20,
  thickness = 0.79,
  rimWidth = 0.11,
  waviness = 0.53,
  sway = 0.42,
  size = 1.9,
  centerOffsetX = -0.01,
  centerOffsetY = -0.05,
  glow = 3,
  fadeNear = 0.5,
  fadeFar = 2.5,
  brightness = 2.5,
  colorVariance = false,
  grain = false,
  grainIntensity = 0.07,
  opacity = 1,
  cursorParallax = false,
  cursorStrength = 0.1,
  className = '',
  style = {},
}: CyberCablesProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseRef = useRef<[number, number]>([0, 0])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let renderer: Renderer | null = null
    let animationFrameId: number
    let gl: any

    try {
      renderer = new Renderer({
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio || 1, 2),
      })

      gl = renderer.gl
      gl.clearColor(0, 0, 0, 0)
      container.appendChild(gl.canvas)
      gl.canvas.style.position = 'absolute'
      gl.canvas.style.top = '0'
      gl.canvas.style.left = '0'
      gl.canvas.style.width = '100%'
      gl.canvas.style.height = '100%'
      gl.canvas.style.pointerEvents = 'none'

      const geometry = new Triangle(gl)

      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uResolution: { value: [container.clientWidth, container.clientHeight] },
          uTime: { value: 0 },
          uCableColor: { value: hexToRgb(cableColor) },
          uPulseColor: { value: hexToRgb(pulseColor) },
          uTunnelColor: { value: hexToRgb(tunnelColor) },
          uTunnelOpacity: { value: tunnelOpacity },
          uSpeed: { value: speed },
          uFlowDirection: { value: flowDirection === 'outward' ? 1.0 : -1.0 },
          uPulseSpeed: { value: pulseSpeed },
          uPulseLength: { value: pulseLength },
          uPulseBlend: { value: pulseBlend },
          uPulseWidth: { value: pulseWidth },
          uCableCount: { value: cableCount },
          uThickness: { value: thickness },
          uRimWidth: { value: rimWidth },
          uWaviness: { value: waviness },
          uSway: { value: sway },
          uSize: { value: size },
          uCenterOffset: { value: [centerOffsetX, centerOffsetY] },
          uGlow: { value: glow },
          uFadeNear: { value: fadeNear },
          uFadeFar: { value: fadeFar },
          uBrightness: { value: brightness },
          uColorVariance: { value: colorVariance ? 1.0 : 0.0 },
          uGrain: { value: grain ? 1.0 : 0.0 },
          uGrainIntensity: { value: grainIntensity },
          uOpacity: { value: opacity },
          uMouse: { value: [0, 0] },
          uCursorStrength: { value: cursorStrength },
        },
      })

      const mesh = new Mesh(gl, { geometry, program })

      const handleResize = () => {
        if (!container || !renderer) return
        const width = container.clientWidth || window.innerWidth
        const height = container.clientHeight || window.innerHeight
        renderer.setSize(width, height)
        program.uniforms.uResolution.value = [width, height]
      }

      const handleMouseMove = (e: MouseEvent) => {
        if (!cursorParallax || !container) return
        const rect = container.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
        const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
        mouseRef.current = [x, y]
      }

      window.addEventListener('resize', handleResize)
      if (cursorParallax) {
        window.addEventListener('mousemove', handleMouseMove)
      }

      handleResize()

      let startTime = performance.now()

      const render = (now: number) => {
        const elapsed = (now - startTime) * 0.001
        program.uniforms.uTime.value = elapsed

        if (cursorParallax) {
          program.uniforms.uMouse.value = [
            program.uniforms.uMouse.value[0] + (mouseRef.current[0] - program.uniforms.uMouse.value[0]) * 0.05,
            program.uniforms.uMouse.value[1] + (mouseRef.current[1] - program.uniforms.uMouse.value[1]) * 0.05,
          ]
        }

        renderer?.render({ scene: mesh })
        animationFrameId = requestAnimationFrame(render)
      }

      animationFrameId = requestAnimationFrame(render)

      return () => {
        cancelAnimationFrame(animationFrameId)
        window.removeEventListener('resize', handleResize)
        if (cursorParallax) {
          window.removeEventListener('mousemove', handleMouseMove)
        }
        if (gl?.canvas && gl.canvas.parentNode === container) {
          container.removeChild(gl.canvas)
        }
        gl?.getExtension('WEBGL_lose_context')?.loseContext()
      }
    } catch (err) {
      console.warn('CyberCables WebGL failed to initialize:', err)
    }
  }, [
    cableColor,
    pulseColor,
    tunnelColor,
    tunnelOpacity,
    speed,
    flowDirection,
    pulseSpeed,
    pulseLength,
    pulseBlend,
    pulseWidth,
    cableCount,
    thickness,
    rimWidth,
    waviness,
    sway,
    size,
    centerOffsetX,
    centerOffsetY,
    glow,
    fadeNear,
    fadeFar,
    brightness,
    colorVariance,
    grain,
    grainIntensity,
    opacity,
    cursorParallax,
    cursorStrength,
  ])

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    />
  )
}
