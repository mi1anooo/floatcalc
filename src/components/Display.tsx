import { formatResult } from '../utils/calculator';
import './Display.css';

interface DisplayProps {
  expression: string;
  preview: string;
  isError: boolean;
  compact?: boolean;
}

export function Display({ expression, preview, isError, compact = false }: DisplayProps) {
  const displayExpr = expression || '0';
  const displayPreview = preview ? formatResult(preview) : '';

  return (
    <div className={`display ${compact ? 'display--compact' : ''}`}>
      {/* Current expression */}
      <div
        className="display__expression"
        style={{ fontSize: expression.length > 18 ? '18px' : expression.length > 12 ? '22px' : '26px' }}
      >
        {displayExpr}
      </div>

      {/* Live result preview */}
      {displayPreview && (
        <div className={`display__preview ${isError ? 'display__preview--error' : ''}`}>
          {isError ? displayPreview : `= ${displayPreview}`}
        </div>
      )}
    </div>
  );
}
