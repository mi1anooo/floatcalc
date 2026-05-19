import { CalcMode } from '../types';
import { formatResult, getProgrammerInfo } from '../utils/calculator';
import './Display.css';

interface DisplayProps {
  expression: string;
  preview: string;
  isError: boolean;
  compact?: boolean;
  calcMode?: CalcMode;
}

export function Display({ expression, preview, isError, compact = false, calcMode }: DisplayProps) {
  const displayExpr = expression || '0';
  const displayPreview = preview ? formatResult(preview) : '';

  // Programmer mode: show hex/bin/oct of current result
  const progInfo = calcMode === 'programmer' && displayPreview && !isError
    ? getProgrammerInfo(displayPreview)
    : null;

  const fontSize = expression.length > 18 ? '16px'
    : expression.length > 12 ? '20px'
    : '26px';

  return (
    <div className={`display ${compact ? 'display--compact' : ''}`}>
      <div className="display__expression" style={{ fontSize }}>
        {displayExpr}
      </div>

      {displayPreview && (
        <div className={`display__preview ${isError ? 'display__preview--error' : ''}`}>
          {isError ? displayPreview : `= ${displayPreview}`}
        </div>
      )}

      {/* Programmer mode extra info */}
      {progInfo && (
        <div className="display__prog-info">
          <span className="display__prog-row"><span className="display__prog-label">HEX</span>{progInfo.hex}</span>
          <span className="display__prog-row"><span className="display__prog-label">OCT</span>{progInfo.oct}</span>
          <span className="display__prog-row"><span className="display__prog-label">BIN</span>{progInfo.bin}</span>
        </div>
      )}
    </div>
  );
}
