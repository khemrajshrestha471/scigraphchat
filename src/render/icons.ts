import createElement from 'lucide/dist/esm/createElement.mjs';

// Explicit static imports (not a dynamic import map) so Vite can tree-shake
// to exactly the icons this project actually uses.
import DoorOpen from 'lucide/dist/esm/icons/door-open.mjs';
import ShieldCheck from 'lucide/dist/esm/icons/shield-check.mjs';
import ShieldAlert from 'lucide/dist/esm/icons/shield-alert.mjs';
import GitBranch from 'lucide/dist/esm/icons/git-branch.mjs';
import Network from 'lucide/dist/esm/icons/network.mjs';
import BookOpen from 'lucide/dist/esm/icons/book-open.mjs';
import Sparkles from 'lucide/dist/esm/icons/sparkles.mjs';
import Waypoints from 'lucide/dist/esm/icons/waypoints.mjs';
import Database from 'lucide/dist/esm/icons/database.mjs';
import RefreshCw from 'lucide/dist/esm/icons/refresh-cw.mjs';
import KeyRound from 'lucide/dist/esm/icons/key-round.mjs';
import MessageSquare from 'lucide/dist/esm/icons/message-square.mjs';
import FingerprintPattern from 'lucide/dist/esm/icons/fingerprint-pattern.mjs';
import Gauge from 'lucide/dist/esm/icons/gauge.mjs';
import CloudDownload from 'lucide/dist/esm/icons/cloud-download.mjs';
import Layers from 'lucide/dist/esm/icons/layers.mjs';
import Share2 from 'lucide/dist/esm/icons/share-2.mjs';
import HardDrive from 'lucide/dist/esm/icons/hard-drive.mjs';
import ListChecks from 'lucide/dist/esm/icons/list-checks.mjs';
import PenLine from 'lucide/dist/esm/icons/pen-line.mjs';
import Cpu from 'lucide/dist/esm/icons/cpu.mjs';
import Search from 'lucide/dist/esm/icons/search.mjs';
import ChartColumn from 'lucide/dist/esm/icons/chart-column.mjs';
import ScrollText from 'lucide/dist/esm/icons/scroll-text.mjs';
import ChartBar from 'lucide/dist/esm/icons/chart-bar.mjs';
import X from 'lucide/dist/esm/icons/x.mjs';
import ChevronDown from 'lucide/dist/esm/icons/chevron-down.mjs';
import RotateCcw from 'lucide/dist/esm/icons/rotate-ccw.mjs';
import Sun from 'lucide/dist/esm/icons/sun.mjs';
import Moon from 'lucide/dist/esm/icons/moon.mjs';
import ExternalLink from 'lucide/dist/esm/icons/external-link.mjs';
import Languages from 'lucide/dist/esm/icons/languages.mjs';

const ICONS: Record<string, unknown> = {
  'door-open': DoorOpen,
  'shield-check': ShieldCheck,
  'shield-alert': ShieldAlert,
  'git-branch': GitBranch,
  network: Network,
  'book-open': BookOpen,
  sparkles: Sparkles,
  waypoints: Waypoints,
  database: Database,
  'refresh-cw': RefreshCw,
  'key-round': KeyRound,
  'message-square': MessageSquare,
  'fingerprint-pattern': FingerprintPattern,
  gauge: Gauge,
  'cloud-download': CloudDownload,
  layers: Layers,
  'share-2': Share2,
  'hard-drive': HardDrive,
  'list-checks': ListChecks,
  'pen-line': PenLine,
  cpu: Cpu,
  search: Search,
  'chart-column': ChartColumn,
  'scroll-text': ScrollText,
  'chart-bar': ChartBar,
  x: X,
  'chevron-down': ChevronDown,
  'rotate-ccw': RotateCcw,
  sun: Sun,
  moon: Moon,
  'external-link': ExternalLink,
  languages: Languages,
};

/** Builds an <svg> element for the given lucide icon name. Falls back to a
 * plain circle (never silently renders nothing) if a name is unrecognized. */
export function icon(name: string, size = 18): SVGSVGElement {
  const node = ICONS[name];
  const el = node
    ? (createElement as unknown as (n: unknown, a: Record<string, unknown>) => SVGSVGElement)(node, {
        width: size,
        height: size,
        'stroke-width': 1.8,
      })
    : (createElement as unknown as (n: unknown, a: Record<string, unknown>) => SVGSVGElement)(
        [['circle', { cx: 12, cy: 12, r: 9 }]],
        { width: size, height: size }
      );
  el.classList.add('icon');
  return el;
}
