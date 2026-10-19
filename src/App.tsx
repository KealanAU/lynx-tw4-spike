import './App.css';

// Each row renders the Tailwind class next to a hand-written inline-style
// reference. If the two boxes differ, the v4 output for that class doesn't
// work in Lynx. Box size is inline so a broken spacing scale can't hide
// other results; the property under test is dropped from the class box's
// inline style, since inline would beat the class.
const BOX: Record<string, string> = {
  width: '48px',
  height: '48px',
  backgroundColor: '#3b82f6',
};

const without = (keys: Record<string, string>) =>
  Object.fromEntries(Object.entries(BOX).filter(([k]) => !(k in keys)));

const CASES: { tw: string; ref: Record<string, string>; probes: string }[] = [
  {
    tw: 'bg-[#ef4444]',
    ref: { backgroundColor: '#ef4444' },
    probes: 'control: plain declaration',
  },
  {
    tw: 'opacity-50',
    ref: { opacity: '0.5' },
    probes: 'control: no vars',
  },
  {
    tw: 'bg-red-500',
    ref: { backgroundColor: '#ef4444' },
    probes: 'oklch() via theme var',
  },
  {
    tw: 'bg-red-500/50',
    ref: { backgroundColor: 'rgba(239, 68, 68, 0.5)' },
    probes: 'color-mix()',
  },
  {
    tw: 'w-24',
    ref: { width: '96px' },
    probes: 'calc(var(--spacing) * n)',
  },
  {
    tw: 'rounded-xl',
    ref: { borderRadius: '12px' },
    probes: 'radius theme var',
  },
  {
    tw: 'rotate-45',
    ref: { transform: 'rotate(45deg)' },
    probes: '`rotate` property',
  },
  {
    tw: 'translate-x-4',
    ref: { transform: 'translateX(16px)' },
    probes: '`translate` + @property vars',
  },
  {
    tw: 'scale-50',
    ref: { transform: 'scale(0.5)' },
    probes: '`scale` + @property vars',
  },
  {
    tw: 'rotate-[45deg]',
    ref: { transform: 'rotate(45deg)' },
    probes: 'plain value in var, no calc',
  },
  {
    tw: 'translate-x-[16px]',
    ref: { transform: 'translateX(16px)' },
    probes: 'plain value in var, no calc',
  },
  {
    tw: 'scale-[0.5]',
    ref: { transform: 'scale(0.5)' },
    probes: 'plain value in var, no calc',
  },
  {
    tw: 'rotate-45 scale-50',
    ref: { transform: 'rotate(45deg) scale(0.5)' },
    probes: 'transforms compose',
  },
  {
    tw: 'shadow-md',
    ref: {
      boxShadow:
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    },
    probes: 'nested var() composition',
  },
];

export function App() {
  return (
    <scroll-view scroll-orientation='vertical' style={{ height: '100%' }}>
      <view style={{ padding: '16px', backgroundColor: '#ffffff' }}>
        <text style={{ fontSize: '12px', color: '#666666' }}>
          left: Tailwind v4 class · right: inline reference
        </text>
        {CASES.map(({ tw, ref, probes }) => (
          <view
            key={tw}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginTop: '20px',
            }}
          >
            <view style={{ width: '160px' }}>
              <text style={{ fontSize: '14px' }}>{tw}</text>
              <text style={{ fontSize: '11px', color: '#888888' }}>
                {probes}
              </text>
            </view>
            <view className={tw} style={without(ref)} />
            <view style={{ ...BOX, ...ref, marginLeft: '32px' }} />
          </view>
        ))}
        <view style={{ marginTop: '20px' }}>
          <text className='text-lg'>text-lg (font-size + calc line-height)</text>
          <text style={{ fontSize: '18px', lineHeight: '28px' }}>
            reference 18px / 28px
          </text>
        </view>
      </view>
    </scroll-view>
  );
}
