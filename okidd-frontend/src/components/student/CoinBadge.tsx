interface Props {
  points: number
  size?: 'sm' | 'md' | 'lg'
}

export default function CoinBadge({ points, size = 'md' }: Props) {
  const cfg = {
    sm: { padding: '4px 12px', fontSize: 14, starSize: 16, borderRadius: 20 },
    md: { padding: '6px 18px', fontSize: 18, starSize: 22, borderRadius: 24 },
    lg: { padding: '10px 24px', fontSize: 24, starSize: 28, borderRadius: 30 },
  }[size]

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'linear-gradient(135deg, #FDE68A, #F59E0B)',
        borderRadius: cfg.borderRadius,
        padding: cfg.padding,
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.45)',
        fontFamily: "'Nunito', 'Segoe UI', sans-serif",
        fontWeight: 800,
        transition: 'transform 0.15s ease',
        cursor: 'default',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span style={{ fontSize: cfg.starSize, lineHeight: 1 }}>⭐</span>
      <span style={{ fontSize: cfg.fontSize, color: '#78350F', letterSpacing: 0.5 }}>
        {points.toLocaleString('fa-IR')}
      </span>
      <span style={{ fontSize: cfg.fontSize * 0.65, color: '#92400E', fontWeight: 600 }}>امتیاز</span>
    </div>
  )
}
