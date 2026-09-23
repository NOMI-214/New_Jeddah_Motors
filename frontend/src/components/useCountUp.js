import { useEffect, useRef, useState } from 'react'

/** Animates a number from 0 to `value` over `duration` ms. */
export function useCountUp(value, duration = 900) {
  const [display, setDisplay] = useState(0)
  const frame = useRef()

  useEffect(() => {
    const start = performance.now()
    const from = 0
    const to = Number(value) || 0

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out-cubic
      setDisplay(from + (to - from) * eased)
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [value, duration])

  return display
}
