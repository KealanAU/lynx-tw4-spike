import { createContext, useContext, useGlobalProps, useState } from '@lynx-js/react';
import type { ReactNode } from '@lynx-js/react';

import '@entry.css';
import './hand.css';

declare const __RUN__: string;

// Lynx doesn't manage __globalProps; Explorer sets `theme` to Light or Dark.
declare module '@lynx-js/types' {
  interface GlobalProps {
    theme?: string;
  }
}

// Each tile renders a Tailwind class (left) next to a hand-written inline
// reference (right). If the two differ, the v4 output for that class doesn't
// work in Lynx. References use `rem` wherever Tailwind does, so a tile compares
// the utility, not the 14px-or-16px decision; the `rem` tile measures that alone.
//
// Colours are v4's real sRGB values (red-500 is #fb2c36, not v3's #ef4444).
// Class names are written out in full because Tailwind only generates classes
// it finds as complete strings in the source.
type Style = Record<string, string>;

const RED = '#ef4444';
const BLUE = '#3b82f6';
const SIZE = { width: '28px', height: '28px' };
// Wide tiles overflow, and shrinking would hide the width under test.
const BOX: Style = { ...SIZE, backgroundColor: BLUE, flexShrink: '0' };

const without = (keys: Style) =>
  Object.fromEntries(Object.entries(BOX).filter(([k]) => !(k in keys)));

const BOXES: { tw: string; ref: Style; probes: string }[] = [
  { tw: 'bg-[#ef4444]', ref: { backgroundColor: RED }, probes: 'control' },
  { tw: 'opacity-50', ref: { opacity: '0.5' }, probes: 'percentage' },
  { tw: 'bg-red-500', ref: { backgroundColor: '#fb2c36' }, probes: 'oklch() theme var' },
  { tw: 'bg-red-500/50', ref: { backgroundColor: 'rgba(251, 44, 54, 0.5)' }, probes: 'color-mix()' },
  { tw: 'bg-linear-to-r from-red-500 to-blue-500', ref: { backgroundColor: 'transparent', backgroundImage: 'linear-gradient(to right, #fb2c36, #2b7fff)' }, probes: 'gradient vars' },
  { tw: 'w-10', ref: { width: '2.5rem' }, probes: 'calc(var(--spacing) * n)' },
  { tw: 'size-10', ref: { width: '2.5rem', height: '2.5rem' }, probes: 'v4 only' },
  { tw: 'ml-4', ref: { marginLeft: '1rem' }, probes: 'physical margin' },
  { tw: 'mx-2', ref: { marginLeft: '0.5rem', marginRight: '0.5rem' }, probes: 'margin-inline' },
  { tw: 'rounded-xl', ref: { borderRadius: '0.75rem' }, probes: 'radius theme var' },
  { tw: 'rounded-full', ref: { borderRadius: '9999px' }, probes: 'calc(infinity * 1px)' },
  { tw: 'border-2 border-red-500', ref: { borderWidth: '2px', borderStyle: 'solid', borderColor: '#fb2c36' }, probes: 'var(--tw-border-style)' },
  { tw: 'rotate-45', ref: { transform: 'rotate(45deg)' }, probes: '`rotate`' },
  { tw: 'translate-x-4', ref: { transform: 'translateX(1rem)' }, probes: '`translate`, calc in var' },
  { tw: 'translate-x-[16px]', ref: { transform: 'translateX(16px)' }, probes: '`translate`, plain' },
  { tw: 'scale-50', ref: { transform: 'scale(0.5)' }, probes: '`scale`' },
  { tw: 'rotate-45 scale-50', ref: { transform: 'rotate(45deg) scale(0.5)' }, probes: 'transforms compose' },
  { tw: 'skew-x-12', ref: { transform: 'skewX(12deg)' }, probes: '`transform` var list' },
  { tw: 'shadow-md', ref: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)' }, probes: 'nested var()' },
  { tw: 'ring-2', ref: { boxShadow: '0 0 0 2px #000000' }, probes: 'ring vars' },
  { tw: 'blur-xs', ref: { filter: 'blur(4px)' }, probes: '`filter` var list' },
];

const TEXTS: { tw: string; ref: Style; probes: string }[] = [
  { tw: 'text-lg', ref: { fontSize: '1.125rem', lineHeight: '1.75rem' }, probes: 'calc() line height' },
  { tw: 'text-red-500', ref: { color: '#fb2c36' }, probes: 'oklch() on text' },
  { tw: 'font-bold', ref: { fontWeight: '700' }, probes: '--tw-font-weight' },
  { tw: 'leading-6', ref: { lineHeight: '1.5rem' }, probes: '--tw-leading' },
  { tw: 'tracking-wide', ref: { letterSpacing: '0.025em' }, probes: '--tw-tracking' },
  { tw: 'uppercase', ref: { textTransform: 'uppercase' }, probes: 'text-transform' },
  { tw: 'text-center', ref: { textAlign: 'center' }, probes: 'control' },
  { tw: 'underline', ref: { textDecoration: 'underline' }, probes: 'text-decoration-line' },
];

const FROM_TO = 'from-red-500 to-blue-500';
const gradient = (image: string): Style => ({ backgroundColor: 'transparent', backgroundImage: image });
const STOPS = '#fb2c36, #2b7fff';

const V4_BOXES: { tw: string; ref: Style; probes: string }[] = [
  { tw: 'bg-[oklch(0.628_0.2577_29.23)]', ref: { backgroundColor: '#ff0000' }, probes: 'arbitrary oklch()' },
  { tw: 'bg-brand', ref: { backgroundColor: '#ff0000' }, probes: 'app @theme oklch()' },
  { tw: 'bg-brand/50', ref: { backgroundColor: 'rgba(255, 0, 0, 0.5)' }, probes: 'color-mix() on app oklch()' },
  { tw: 'w-brand', ref: { width: '2rem' }, probes: 'app @theme spacing' },
  { tw: 'from-plugin', ref: { backgroundColor: RED }, probes: '@plugin' },
  { tw: 'bg-from-config', ref: { backgroundColor: RED }, probes: '@config' },
  { tw: `bg-linear-45 ${FROM_TO}`, ref: gradient(`linear-gradient(45deg, ${STOPS})`), probes: 'angle, @supports fallback' },
  { tw: `bg-linear-to-r/oklch ${FROM_TO}`, ref: gradient(`linear-gradient(to right, ${STOPS})`), probes: 'renders as sRGB' },
  { tw: `bg-radial ${FROM_TO}`, ref: gradient(`radial-gradient(ellipse at center, ${STOPS})`), probes: '`in oklab` position' },
  { tw: `bg-conic ${FROM_TO}`, ref: gradient(`conic-gradient(from 0deg, ${STOPS})`), probes: '`in oklab` position' },
  { tw: `bg-conic-90 ${FROM_TO}`, ref: gradient(`conic-gradient(from 90deg, ${STOPS})`), probes: '`from n in oklab`' },
  { tw: 'rotate-x-45', ref: { transform: 'rotateX(45deg)' }, probes: '3D, `transform`' },
  { tw: 'rotate-y-45', ref: { transform: 'rotateY(45deg)' }, probes: '3D, `transform`' },
  { tw: 'perspective-near rotate-y-45', ref: { perspective: '300px', transform: 'rotateY(45deg)' }, probes: 'on the element itself' },
  { tw: 'perspective-near translate-z-4', ref: { perspective: '300px', transform: 'translateZ(1rem)' }, probes: '`translate`, z' },
  { tw: 'inset-shadow-sm', ref: { boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)' }, probes: 'theme value' },
  { tw: 'inset-shadow-[0_4px_4px_#000]', ref: { boxShadow: 'inset 0 4px 4px #000' }, probes: 'arbitrary value' },
  { tw: 'inset-ring-2', ref: { boxShadow: 'inset 0 0 0 2px #000' }, probes: 'default colour' },
  { tw: 'inset-ring-2 inset-ring-red-500', ref: { boxShadow: 'inset 0 0 0 2px #fb2c36' }, probes: 'colour var' },
  { tw: 'mask-none', ref: { maskImage: 'none' }, probes: 'both vanish, web keeps them' },
  { tw: 'mask-[linear-gradient(to_right,#000,transparent)]', ref: { maskImage: 'linear-gradient(to right, #000, transparent)' }, probes: 'arbitrary mask-image' },
];

const V4_TEXTS: { tw: string; ref: Style; probes: string }[] = [
  { tw: 'text-shadow-md', ref: { textShadow: '0px 1px 1px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.1), 0px 2px 4px rgba(0, 0, 0, 0.1)' }, probes: 'theme value' },
  { tw: 'text-shadow-[0_2px_2px_#ff0000]', ref: { textShadow: '0 2px 2px #ff0000' }, probes: 'arbitrary value' },
];

const ROW = { display: 'flex', flexDirection: 'row' };
const LAYOUTS: { tw: string; ref: Style; probes: string }[] = [
  { tw: 'flex flex-row', ref: ROW, probes: 'control' },
  { tw: 'flex flex-row justify-between', ref: { ...ROW, justifyContent: 'space-between' }, probes: 'justify' },
  { tw: 'flex flex-row items-end', ref: { ...ROW, alignItems: 'flex-end' }, probes: 'align' },
  { tw: 'flex flex-row gap-2', ref: { ...ROW, gap: '0.5rem' }, probes: 'gap' },
  { tw: 'flex flex-row p-2', ref: { ...ROW, padding: '0.5rem' }, probes: 'padding' },
  { tw: 'flex flex-row px-2', ref: { ...ROW, paddingLeft: '0.5rem', paddingRight: '0.5rem' }, probes: 'padding-inline' },
  { tw: 'flex flex-row py-2', ref: { ...ROW, paddingTop: '0.5rem', paddingBottom: '0.5rem' }, probes: 'padding-block' },
  { tw: 'flex flex-row space-x-2', ref: { ...ROW, gap: '0.5rem' }, probes: ':where(> :not())' },
  { tw: 'grid grid-cols-2', ref: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, probes: 'grid' },
];

const KNOWN_COLOUR = '#16a34a';
const TESTING_COLOUR = '#2563eb';

const KNOWN_PROBLEMS = new Set([
  'dark:bg-[#ef4444]',
  'prefers-color-scheme',
  'first:bg-[#ef4444]',
  'ring-2',
  'uppercase',
  'flex flex-row space-x-2',
  'hover:bg-[#ef4444]',
  'mask-none',
  'peer-active:bg-[#ef4444]',
  'not-first:bg-[#ef4444]',
  'nth-2:bg-[#ef4444]',
  'has-[.on]:bg-[#ef4444]',
  '@[1px]:bg-[#ef4444]',
  'starting:bg-[#ef4444]',
]);

// The new tiles, plus the old ones this change could break: colours lost the generated
// palette, and transforms gained the 3D functions.
const TESTING = new Set([
  ...V4_BOXES.map(({ tw }) => tw),
  ...V4_TEXTS.map(({ tw }) => tw),
  'group-[.on]:bg-[#ef4444]',
  'group-active:bg-[#ef4444]',
  'group-active, parent has background',
  'peer-[.on]:bg-[#ef4444]',
  'in-[.on]:bg-[#ef4444]',
  'not-active:bg-[#ef4444]',
  '*:bg-[#ef4444]',
  'active:bg-[#ef4444]',
  'bg-red-500',
  'bg-red-500/50',
  'bg-linear-to-r from-red-500 to-blue-500',
  'border-2 border-red-500',
  'text-red-500',
  'rotate-45',
  'translate-x-4',
  'translate-x-[16px]',
  'scale-50',
  'rotate-45 scale-50',
  'skew-x-12',
  'transform vars inherit?',
]);

const TABS = {
  Testing: (name: string) => TESTING.has(name),
  Known: (name: string) => KNOWN_PROBLEMS.has(name),
  All: (_name: string) => true,
};
type TabName = keyof typeof TABS;
const TileFilter = createContext<(name: string) => boolean>(TABS.All);

const signalBorder = (name: string): Style => {
  const borderColor = KNOWN_PROBLEMS.has(name) ? KNOWN_COLOUR : TESTING.has(name) ? TESTING_COLOUR : undefined;
  return borderColor ? { borderWidth: '2px', borderStyle: 'solid', borderColor } : {};
};

const CONTAINER: Style = { width: '52px', height: '32px', backgroundColor: '#dddddd', flexShrink: '0' };
const CHILD: Style = { width: '10px', height: '10px' };
const TEXT: Style = { width: '52px', backgroundColor: '#eeeeee', flexShrink: '0' };
const GAP = { marginLeft: '14px' };
const HEADING: Style = { fontSize: '11px', color: '#000000', fontWeight: '700', marginTop: '8px', marginBottom: '8px' };

function Tile({ name, probes, children }: { name: string; probes: string; children: ReactNode }) {
  const visible = useContext(TileFilter);
  if (!visible(name)) return null;

  return (
    <view style={{ width: '33.33%', paddingRight: '4px', marginBottom: '12px', ...signalBorder(name) }}>
      <view style={{ ...ROW, alignItems: 'center', minHeight: '28px' }}>{children}</view>
      <text style={{ fontSize: '10px', marginTop: '4px', color: '#000000' }}>{name}</text>
      <text style={{ fontSize: '9px', color: '#777777' }}>{probes}</text>
    </view>
  );
}

// Not display: none, which left the headings piled up at the page's origin.
function Heading({ children }: { children: ReactNode }) {
  return useContext(TileFilter) === TABS.All ? <text style={HEADING}>{children}</text> : null;
}

const Reference = ({ color = RED }: { color?: string }) => (
  <view style={{ ...BOX, ...GAP, backgroundColor: color }} />
);

const Grid = ({ children }: { children: ReactNode }) => (
  <view style={{ ...ROW, flexWrap: 'wrap' }}>{children}</view>
);

const BoxGrid = ({ items }: { items: typeof BOXES }) => (
  <Grid>
    {items.map(({ tw, ref, probes }) => (
      <Tile key={tw} name={tw} probes={probes}>
        <view className={tw} style={without(ref)} />
        <view style={{ ...BOX, ...GAP, ...ref }} />
      </Tile>
    ))}
  </Grid>
);

const TextGrid = ({ items }: { items: typeof TEXTS }) => (
  <Grid>
    {items.map(({ tw, ref, probes }) => (
      <Tile key={tw} name={tw} probes={probes}>
        <text className={tw} style={TEXT}>Ag xy</text>
        <text style={{ ...TEXT, marginLeft: '6px', ...ref }}>Ag xy</text>
      </Tile>
    ))}
  </Grid>
);

const PEER: Style = { width: '12px', height: '28px', backgroundColor: '#dddddd', flexShrink: '0', marginRight: '2px' };
const NOTHING: Style = { width: '0px', height: '0px' };

export function App() {
  const theme = useGlobalProps().theme ?? 'unset';
  const isDark = theme.toLowerCase() === 'dark';
  const darkExpected = isDark ? RED : BLUE;
  const [tab, setTab] = useState<TabName>('Testing');

  return (
    <scroll-view scroll-orientation='vertical' style={{ height: '100%' }}>
      <view
        className={isDark ? 'dark' : 'light'}
        style={{ padding: '12px', backgroundColor: '#ffffff' }}
      >
        <text style={{ fontSize: '11px', color: '#000000' }}>{__RUN__}</text>
        <text style={{ fontSize: '11px', color: '#000000' }}>
          {`${process.env.NODE_ENV} · ${SystemInfo.platform} · SDK ${SystemInfo.lynxSdkVersion} · engine ${SystemInfo.engineVersion} · theme ${theme}`}
        </text>
        <text style={{ fontSize: '11px', fontWeight: '700', color: KNOWN_COLOUR, marginTop: '4px' }}>Green box: known problem, expected to mismatch</text>
        <text style={{ fontSize: '11px', fontWeight: '700', color: TESTING_COLOUR }}>Blue box: testing now, should match at rest</text>
        <text style={{ fontSize: '11px', color: '#000000' }}>No box: already recorded</text>

        <view style={{ ...ROW, marginTop: '8px', marginBottom: '12px' }}>
          {(Object.keys(TABS) as TabName[]).map(name => (
            <view
              key={name}
              bindtap={() => setTab(name)}
              style={{ paddingLeft: '12px', paddingRight: '12px', paddingTop: '8px', paddingBottom: '8px', marginRight: '4px', backgroundColor: name === tab ? '#000000' : '#dddddd' }}
            >
              <text style={{ fontSize: '12px', fontWeight: '700', color: name === tab ? '#ffffff' : '#000000' }}>{name}</text>
            </view>
          ))}
        </view>

        <TileFilter.Provider value={TABS[tab]}>

        <Heading>hand-written @layer: left matches red</Heading>
        <Grid>
          <Tile name='plain rule' probes='control'>
            <view className='hand-plain' style={SIZE} />
            <Reference />
          </Tile>
          <Tile name='@layer x' probes='rule in a layer'>
            <view className='hand-layer' style={SIZE} />
            <Reference />
          </Tile>
          <Tile name='@layer + @media' probes='nested in a layer'>
            <view className='hand-layer-media' style={SIZE} />
            <Reference />
          </Tile>
          <Tile name='layer order' probes='@layer low, high;'>
            <view className='hand-order' style={SIZE} />
            <Reference />
          </Tile>
          <Tile name='unlayered wins' probes='over a later layer'>
            <view className='hand-unlayered' style={SIZE} />
            <Reference />
          </Tile>
          <Tile name=':root var in layer' probes='read outside it'>
            <view className='hand-var' style={SIZE} />
            <Reference />
          </Tile>
        </Grid>

        <Heading>{`dark: left matches right, red only in dark (theme ${theme})`}</Heading>
        <Grid>
          <Tile name='dark:bg-[#ef4444]' probes='Tailwind, per the run entry'>
            <view className='bg-[#3b82f6] dark:bg-[#ef4444]' style={SIZE} />
            <Reference color={darkExpected} />
          </Tile>
          <Tile name='prefers-color-scheme' probes='hand-written @media'>
            <view className='hand-dark-media' style={SIZE} />
            <Reference color={darkExpected} />
          </Tile>
          <Tile name='.dark class' probes='hand-written, from theme prop'>
            <view className='hand-dark-class' style={SIZE} />
            <Reference color={darkExpected} />
          </Tile>
          <Tile name='hot reload' probes='edit this class in App.tsx'>
            <view className='bg-[#60a5fa]' style={SIZE} />
          </Tile>
        </Grid>

        <Heading>variants: left matches right</Heading>
        <Grid>
          <Tile name='max-sm:bg-[#ef4444]' probes='@media (width < 40rem)'>
            <view className='bg-[#3b82f6] max-sm:bg-[#ef4444]' style={SIZE} />
            <Reference />
          </Tile>
          <Tile name='sm:bg-[#ef4444]' probes='stays blue, phone is narrower'>
            <view className='bg-[#3b82f6] sm:bg-[#ef4444]' style={SIZE} />
            <Reference color={BLUE} />
          </Tile>
          <Tile name='first:bg-[#ef4444]' probes=':first-child'>
            <view style={SIZE}>
              <view className='bg-[#3b82f6] first:bg-[#ef4444]' style={SIZE} />
            </view>
            <Reference />
          </Tile>
          <Tile name='*:bg-[#ef4444]' probes=':is(.x > *)'>
            <view className='*:bg-[#ef4444]' style={SIZE}>
              <view className='bg-[#3b82f6]' style={SIZE} />
            </view>
            <Reference />
          </Tile>
          <Tile name='active:bg-[#ef4444]' probes='left turns red on press'>
            <view className='bg-[#3b82f6] active:bg-[#ef4444]' style={SIZE} />
            <Reference color={BLUE} />
          </Tile>
          <Tile name='transform vars inherit?' probes='rotate-45 in translate-x-[16px]'>
            <view className='translate-x-[16px]' style={SIZE}>
              <view className='rotate-45' style={{ ...SIZE, backgroundColor: BLUE }} />
            </view>
            <view style={{ ...SIZE, ...GAP, transform: 'translateX(16px)' }}>
              <view style={{ ...SIZE, backgroundColor: BLUE, transform: 'rotate(45deg)' }} />
            </view>
          </Tile>
          <Tile name='1rem · 14px · 16px' probes='which is 1rem?'>
            <view style={{ width: '1rem', height: '28px', backgroundColor: RED, flexShrink: '0' }} />
            <view style={{ width: '14px', height: '28px', backgroundColor: BLUE, flexShrink: '0', marginLeft: '6px' }} />
            <view style={{ width: '16px', height: '28px', backgroundColor: '#10b981', flexShrink: '0', marginLeft: '6px' }} />
          </Tile>
        </Grid>

        <Heading>boxes: left is the class, right is inline</Heading>
        <BoxGrid items={BOXES} />

        <Heading>text: left is the class, right is inline</Heading>
        <TextGrid items={TEXTS} />

        <Heading>v4 features: left is the class, right is inline</Heading>
        <BoxGrid items={V4_BOXES} />
        <TextGrid items={V4_TEXTS} />

        <Heading>v4 variants: left matches right</Heading>
        <Grid>
          <Tile name='hover:bg-[#ef4444]' probes='@media (hover: hover), never fires on touch'>
            <view className='bg-[#3b82f6] hover:bg-[#ef4444]' style={SIZE} />
            <Reference color={BLUE} />
          </Tile>
          <Tile name='group-[.on]:bg-[#ef4444]' probes='static, .group.on .x'>
            <view className='group on' style={SIZE}>
              <view className='bg-[#3b82f6] group-[.on]:bg-[#ef4444]' style={SIZE} />
            </view>
            <Reference />
          </Tile>
          <Tile name='group-active:bg-[#ef4444]' probes='left turns red on press'>
            <view className='group' style={SIZE}>
              <view className='bg-[#3b82f6] group-active:bg-[#ef4444]' style={SIZE} />
            </view>
            <Reference color={BLUE} />
          </Tile>
          <Tile name='group-active, parent has background' probes='left turns red on press'>
            <view className='group' style={{ ...SIZE, backgroundColor: '#dddddd' }}>
              <view className='bg-[#3b82f6] group-active:bg-[#ef4444]' style={SIZE} />
            </view>
            <Reference color={BLUE} />
          </Tile>
          <Tile name='peer-[.on]:bg-[#ef4444]' probes='static, grey is the peer'>
            <view className='peer on' style={PEER} />
            <view className='bg-[#3b82f6] peer-[.on]:bg-[#ef4444]' style={SIZE} />
            <Reference />
          </Tile>
          <Tile name='peer-active:bg-[#ef4444]' probes='press the grey, needs invalidation'>
            <view className='peer' style={PEER} />
            <view className='bg-[#3b82f6] peer-active:bg-[#ef4444]' style={SIZE} />
            <Reference color={BLUE} />
          </Tile>
          <Tile name='in-[.on]:bg-[#ef4444]' probes='static, .on .x'>
            <view className='on' style={SIZE}>
              <view className='bg-[#3b82f6] in-[.on]:bg-[#ef4444]' style={SIZE} />
            </view>
            <Reference />
          </Tile>
          <Tile name='not-active:bg-[#ef4444]' probes='left turns blue on press'>
            <view className='bg-[#3b82f6] not-active:bg-[#ef4444]' style={SIZE} />
            <Reference />
          </Tile>
          <Tile name='not-first:bg-[#ef4444]' probes='first child, red is the defect'>
            <view style={SIZE}>
              <view className='bg-[#3b82f6] not-first:bg-[#ef4444]' style={SIZE} />
            </view>
            <Reference color={BLUE} />
          </Tile>
          <Tile name='nth-2:bg-[#ef4444]' probes='no matcher case, expect blue'>
            <view style={SIZE}>
              <view style={NOTHING} />
              <view className='bg-[#3b82f6] nth-2:bg-[#ef4444]' style={SIZE} />
            </view>
            <Reference />
          </Tile>
          <Tile name='has-[.on]:bg-[#ef4444]' probes='rejected, expect blue'>
            <view className='bg-[#3b82f6] has-[.on]:bg-[#ef4444]' style={SIZE}>
              <view className='on' style={NOTHING} />
            </view>
            <Reference />
          </Tile>
          <Tile name='@[1px]:bg-[#ef4444]' probes='removed, expect blue'>
            <view className='@container' style={SIZE}>
              <view className='bg-[#3b82f6] @[1px]:bg-[#ef4444]' style={SIZE} />
            </view>
            <Reference />
          </Tile>
          <Tile name='starting:bg-[#ef4444]' probes='removed, stays blue'>
            <view className='bg-[#3b82f6] starting:bg-[#ef4444]' style={SIZE} />
            <Reference color={BLUE} />
          </Tile>
        </Grid>

        <Heading>layout: left is the class, right is inline</Heading>
        <Grid>
          {LAYOUTS.map(({ tw, ref, probes }) => (
            <Tile key={tw} name={tw} probes={probes}>
              <view className={tw} style={CONTAINER}>
                <view style={{ ...CHILD, backgroundColor: BLUE }} />
                <view style={{ ...CHILD, backgroundColor: RED }} />
              </view>
              <view style={{ ...CONTAINER, ...ref, marginLeft: '6px' }}>
                <view style={{ ...CHILD, backgroundColor: BLUE }} />
                <view style={{ ...CHILD, backgroundColor: RED }} />
              </view>
            </Tile>
          ))}
        </Grid>
        </TileFilter.Provider>
      </view>
    </scroll-view>
  );
}
