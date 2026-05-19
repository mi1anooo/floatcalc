import './ButtonGrid.css';

interface ButtonGridProps {
  onInput: (value: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onEquals: () => void;
}

type ButtonDef = {
  label: string;
  value?: string;
  variant?: 'operator' | 'equals' | 'clear' | 'function';
  wide?: boolean;
};

const BUTTONS: ButtonDef[][] = [
  [
    { label: 'C',   value: 'C',   variant: 'clear' },
    { label: '⌫',  value: '⌫',  variant: 'clear' },
    { label: '%',   value: '%',   variant: 'operator' },
    { label: '÷',   value: '÷',   variant: 'operator' },
  ],
  [
    { label: '7',  value: '7' },
    { label: '8',  value: '8' },
    { label: '9',  value: '9' },
    { label: '×',  value: '×',  variant: 'operator' },
  ],
  [
    { label: '4',  value: '4' },
    { label: '5',  value: '5' },
    { label: '6',  value: '6' },
    { label: '-',  value: '-',  variant: 'operator' },
  ],
  [
    { label: '1',  value: '1' },
    { label: '2',  value: '2' },
    { label: '3',  value: '3' },
    { label: '+',  value: '+',  variant: 'operator' },
  ],
  [
    { label: '√',  value: '√',  variant: 'function' },
    { label: '0',  value: '0' },
    { label: '.',  value: '.' },
    { label: '=',  value: '=',  variant: 'equals' },
  ],
];

export function ButtonGrid({ onInput, onClear, onDelete, onEquals }: ButtonGridProps) {
  const handleClick = (btn: ButtonDef) => {
    if (!btn.value) return;
    if (btn.value === 'C')  return onClear();
    if (btn.value === '⌫') return onDelete();
    if (btn.value === '=')  return onEquals();
    onInput(btn.value);
  };

  return (
    <div className="btn-grid">
      {BUTTONS.flat().map((btn, i) => (
        <button
          key={i}
          className={[
            'btn-grid__btn',
            btn.variant ? `btn-grid__btn--${btn.variant}` : '',
          ].join(' ')}
          onClick={() => handleClick(btn)}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
