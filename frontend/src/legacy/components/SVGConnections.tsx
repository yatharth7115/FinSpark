import { useEffect, useRef } from 'react'

interface Connection {
  fromId: string
  toId: string
  confidence: number
}

interface SVGConnectionsProps {
  connections: Connection[]
  containerRef: React.RefObject<HTMLDivElement>
}

export default function SVGConnections({ connections, containerRef }: SVGConnectionsProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const container = containerRef.current
    if (!svg || !container) return

    const rect = container.getBoundingClientRect()
    svg.setAttribute('width', String(rect.width))
    svg.setAttribute('height', String(rect.height))

    while (svg.firstChild) svg.removeChild(svg.firstChild)

    connections.forEach((conn) => {
      const fromEl = document.getElementById(conn.fromId)
      const toEl = document.getElementById(conn.toId)
      if (!fromEl || !toEl) return

      const fromRect = fromEl.getBoundingClientRect()
      const toRect = toEl.getBoundingClientRect()

      const x1 = fromRect.right - rect.left
      const y1 = fromRect.top + fromRect.height / 2 - rect.top
      const x2 = toRect.left - rect.left
      const y2 = toRect.top + toRect.height / 2 - rect.top

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      // Use curved path (quadratic bezier) to avoid straight line crossing chaos
      const midX = (x1 + x2) / 2
      const d = `M ${x1} ${y1} Q ${midX} ${y1}, ${midX} ${(y1 + y2) / 2} T ${x2} ${y2}`
      path.setAttribute('d', d)
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke', conn.confidence > 0.8 ? '#10b981' : conn.confidence > 0.6 ? '#f59e0b' : '#ef4444')
      path.setAttribute('stroke-width', '2')
      path.setAttribute('stroke-dasharray', '5, 5')
      path.setAttribute('opacity', '0.6')
      svg.appendChild(path)
    })
  }, [connections, containerRef])

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{ overflow: 'visible' }}
    />
  )
}
