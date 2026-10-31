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
  // Wide rows overflow, and shrinking would hide the width under test.
  flexShrink: '0',
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

// Each variant box should match the reference beside it, red (#ef4444) unless
// `ref` says otherwise. Blue comes from a class, not inline style, so the
// variant can override it. Class names are written out in full because Tailwind
// only generates classes it finds as complete strings in the source.
const SIZE = { width: '48px', height: '48px' };
const VARIANTS = [
  {
    name: 'max-sm:bg-[#ef4444]',
    probes: '@media (width < 40rem)',
    el: <view className='bg-[#3b82f6] max-sm:bg-[#ef4444]' style={SIZE} />,
  },
  {
    name: 'sm:bg-[#ef4444] (stays blue)',
    probes: '@media (width >= 40rem), phone is narrower',
    el: <view className='bg-[#3b82f6] sm:bg-[#ef4444]' style={SIZE} />,
    ref: '#3b82f6',
  },
  {
    name: 'first:bg-[#ef4444]',
    probes: ':first-child',
    el: (
      <view style={SIZE}>
        <view className='bg-[#3b82f6] first:bg-[#ef4444]' style={SIZE} />
      </view>
    ),
  },
  {
    name: '*:bg-[#ef4444]',
    probes: ':is(.x > *) child variant',
    el: (
      <view className='*:bg-[#ef4444]' style={SIZE}>
        <view className='bg-[#3b82f6]' style={SIZE} />
      </view>
    ),
  },
  {
    name: 'active:bg-[#ef4444]',
    probes: ':active, press and hold',
    el: <view className='bg-[#3b82f6] active:bg-[#ef4444]' style={SIZE} />,
  },
  {
    name: 'dark:bg-[#ef4444]',
    probes: 'prefers-color-scheme, toggle sim dark mode',
    el: <view className='bg-[#3b82f6] dark:bg-[#ef4444]' style={SIZE} />,
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
        <text style={{ fontSize: '12px', color: '#666666', marginTop: '32px' }}>
          variants: left should match right
        </text>
        {VARIANTS.map(({ name, probes, el, ref = '#ef4444' }) => (
          <view
            key={name}
            style={{ display: 'flex', alignItems: 'center', marginTop: '20px' }}
          >
            <view style={{ width: '160px' }}>
              <text style={{ fontSize: '14px' }}>{name}</text>
              <text style={{ fontSize: '11px', color: '#888888' }}>
                {probes}
              </text>
            </view>
            {el}
            <view style={{ ...BOX, backgroundColor: ref, marginLeft: '32px' }} />
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
