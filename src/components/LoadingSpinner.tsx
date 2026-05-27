interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export function LoadingSpinner({ message = '加载中...', size = 'medium' }: LoadingSpinnerProps) {
  const sizeMap = { small: '16px', medium: '24px', large: '36px' };
  const spinnerSize = sizeMap[size];

  return (
    <div className="loading-spinner-container" role="status" aria-live="polite">
      <div
        className="loading-spinner"
        style={{ width: spinnerSize, height: spinnerSize }}
      />
      {message && <span className="loading-spinner-message">{message}</span>}
    </div>
  );
}
