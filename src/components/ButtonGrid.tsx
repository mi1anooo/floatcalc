import { CalcMode } from '../types';
import './ButtonGrid.css';

interface ButtonGridProps {
  onInput: (value: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onEquals: () => void;
  calcMode: CalcMode;
}

type ButtonDef = {
  label: string;
  value: string;
  variant?: 'operator' | 'equals' | 'clear' | 'function' | 'mem';
  wide?: boolean;
};

// ── Standard layout ──────────────────────────────────────────
const STANDARD: ButtonDef[][] = [
  [
    { label: 'C',  value: 'C',  variant: 'clear' },
    { label: '⌫', value: '⌫', variant: 'clear' },
    { label: '%',  value: '%',  variant: 'operator' },
    { label: '÷',  value: '÷',  variant: 'operator' },
  ],
  [
    { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' },
    { label: '×', value: '×', variant: 'operator' },
  ],
  [
    { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
    { label: '-', value: '-', variant: 'operator' },
  ],
  [
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '+', value: '+', variant: 'operator' },
  ],
  [
    { label: '√',  value: '√',  variant: 'function' },
    { label: '0',  value: '0' },
    { label: '.',  value: '.' },
    { label: '=',  value: '=',  variant: 'equals' },
  ],
];

// ── Scientific layout ─────────────────────────────────────────
const SCIENTIFIC: ButtonDef[][] = [
  [
    { label: 'sin',  value: 'Math.sin(',  variant: 'function' },
    { label: 'cos',  value: 'Math.cos(',  variant: 'function' },
    { label: 'tan',  value: 'Math.tan(',  variant: 'function' },
    { label: 'log',  value: 'Math.log10(', variant: 'function' },
    { label: 'ln',   value: 'Math.log(',   variant: 'function' },
  ],
  [
    { label: 'x²',  value: '^2',   variant: 'function' },
    { label: 'xʸ',  value: '^',    variant: 'function' },
    { label: '√',   value: '√',    variant: 'function' },
    { label: 'π',   value: String(Math.PI), variant: 'function' },
    { label: 'e',   value: String(Math.E),  variant: 'function' },
  ],
  [
    { label: 'C',  value: 'C',  variant: 'clear' },
    { label: '⌫', value: '⌫', variant: 'clear' },
    { label: '(',  value: '(',  variant: 'operator' },
    { label: ')',  value: ')',  variant: 'operator' },
    { label: '÷',  value: '÷',  variant: 'operator' },
  ],
  [
    { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' },
    { label: '%', value: '%', variant: 'operator' },
    { label: '×', value: '×', variant: 'operator' },
  ],
  [
    { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
    { label: '+', value: '+', variant: 'operator' },
    { label: '-', value: '-', variant: 'operator' },
  ],
  [
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '0', value: '0' }, { label: '.', value: '.' },
  ],
  [
    { label: '(−)', value: '-1×(', variant: 'function' },
    { label: '1/x', value: '1÷(',  variant: 'function' },
    { label: '=',   value: '=',    variant: 'equals' },
  ],
];

// ── Programmer layout ─────────────────────────────────────────
const PROGRAMMER: ButtonDef[][] = [
  [
    { label: 'C',   value: 'C',   variant: 'clear' },
    { label: '⌫',  value: '⌫',  variant: 'clear' },
    { label: 'AND', value: '&',   variant: 'function' },
    { label: 'OR',  value: '|',   variant: 'function' },
  ],
  [
    { label: 'XOR', value: '^',   variant: 'function' },
    { label: 'NOT', value: '~',   variant: 'function' },
    { label: '<<',  value: '<<',  variant: 'function' },
    { label: '>>',  value: '>>',  variant: 'function' },
  ],
  [
    { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' },
    { label: '÷', value: '÷', variant: 'operator' },
  ],
  [
    { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' },
    { label: '×', value: '×', variant: 'operator' },
  ],
  [
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' },
    { label: '-', value: '-', variant: 'operator' },
  ],
  [
    { label: '0', value: '0' }, { label: '00', value: '00' }, { label: '.', value: '.' },
    { label: '+', value: '+', variant: 'operator' },
  ],
  [
    { label: 'HEX', value: '0x', variant: 'function' },
    { label: 'MOD', value: '%',  variant: 'function' },
    { label: '=',   value: '=',  variant: 'equals' },
  ],
];

const LAYOUTS: Record<CalcMode, ButtonDef[][]> = {
  standard:   STANDARD,
  scientific: SCIENTIFIC,
  programmer: PROGRAMMER,
};

// Derive grid columns from the widest row in layout
function getCols(layout: ButtonDef[][]): number {
  return Math.max(...layout.map(row => row.length));
}

export function ButtonGrid({ onInput, onClear, onDelete, onEquals, calcMode }: ButtonGridProps) {
  const layout = LAYOUTS[calcMode];
  const cols = getCols(layout);

  const handleClick = (btn: ButtonDef) => {
    if (btn.value === 'C')  return onClear();
    if (btn.value === '⌫') return onDelete();
    if (btn.value === '=')  return onEquals();
    onInput(btn.value);
  };

  return (
    <div
      className={`btn-grid btn-grid--${calcMode}`}
      style={{ '--grid-cols': cols } as React.CSSProperties}
    >
      {layout.flat().map((btn, i) => (
        <button
          key={i}
          className={[
            'btn-grid__btn',
            btn.variant ? `btn-grid__btn--${btn.variant}` : '',
            btn.wide ? 'btn-grid__btn--wide' : '',
          ].join(' ')}
          onClick={() => handleClick(btn)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
