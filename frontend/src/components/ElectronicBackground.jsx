import { useEffect, useRef } from 'react'

export function ElectronicBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const lines = []
    const numLines = 20
    for (let i = 0; i < numLines; i++) {
      lines.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        length: Math.random() * 150 + 60,
        speed: Math.random() * 0.3 + 0.1,
        angle: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.08 + 0.05,
        pulsePhase: Math.random() * Math.PI * 2,
        thickness: Math.random() * 1 + 0.5,
      })
    }

    let animationFrameId
    const animate = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      lines.forEach((line) => {
        line.pulsePhase += 0.025
        const pulse = Math.sin(line.pulsePhase) * 0.5 + 0.5
        const endX = line.x + Math.cos(line.angle) * line.length
        const endY = line.y + Math.sin(line.angle) * line.length
        const gradient = ctx.createLinearGradient(line.x, line.y, endX, endY)
        gradient.addColorStop(0, `rgba(37, 99, 235, ${line.opacity * pulse * 0.6})`)
        gradient.addColorStop(0.3, `rgba(59, 130, 246, ${line.opacity * pulse * 0.8})`)
        gradient.addColorStop(0.6, `rgba(96, 165, 250, ${line.opacity * pulse * 0.7})`)
        gradient.addColorStop(1, `rgba(147, 197, 253, ${line.opacity * pulse * 0.4})`)
        ctx.strokeStyle = gradient
        ctx.lineWidth = line.thickness
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(line.x, line.y)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        const glowGradient = ctx.createRadialGradient(line.x, line.y, 0, line.x, line.y, 8)
        glowGradient.addColorStop(0, `rgba(59, 130, 246, ${line.opacity * pulse * 0.8})`)
        glowGradient.addColorStop(0.5, `rgba(96, 165, 250, ${line.opacity * pulse * 0.4})`)
        glowGradient.addColorStop(1, 'rgba(59, 130, 246, 0)')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(line.x, line.y, 8, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(line.x, line.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(37, 99, 235, ${line.opacity * pulse * 0.9})`
        ctx.fill()
        line.x += Math.cos(line.angle) * line.speed
        line.y += Math.sin(line.angle) * line.speed
        if (line.x < -line.length) line.x = canvas.width + line.length
        if (line.x > canvas.width + line.length) line.x = -line.length
        if (line.y < -line.length) line.y = canvas.height + line.length
        if (line.y > canvas.height + line.length) line.y = -line.length
      })
      animationFrameId = requestAnimationFrame(animate)
    }
    animate(0)
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  )
}
