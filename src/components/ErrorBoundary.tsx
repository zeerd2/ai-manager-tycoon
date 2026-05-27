import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  local?: boolean;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.local) {
      if (this.props.onReset) {
        this.props.onReset();
      }
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      if (this.props.local) {
        return (
          <div className="panel error-boundary-local" style={{ padding: '20px', border: '1px solid var(--accent-red)', borderRadius: '6px', margin: '16px 0', textAlign: 'center', backgroundColor: 'var(--bg-dark)' }}>
            <span style={{ fontSize: '24px' }}>⚠️</span>
            <h4 style={{ color: 'var(--accent-red)', margin: '8px 0 4px', fontSize: '16px' }}>组件加载失败</h4>
            <p className="subtitle" style={{ fontSize: '12px', margin: '0 0 12px', opacity: 0.8 }}>
              {this.state.error?.message || '资源加载出错或网络连接断开'}
            </p>
            <button className="btn-reset" onClick={this.handleReset} style={{ padding: '6px 16px', fontSize: '13px' }}>
              🔄 重试
            </button>
          </div>
        );
      }

      return (
        <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
          <div className="panel" style={{ maxWidth: '600px', width: '100%', textAlign: 'center', padding: '40px', border: '2px solid var(--accent-red)' }}>
            <span style={{ fontSize: '48px' }}>😱</span>
            <h2 style={{ color: 'var(--accent-red)', marginTop: '16px' }}>系统崩溃 (CRASHED)</h2>
            <p className="subtitle" style={{ marginBottom: '24px' }}>
              团队里有工程师把 bug 带到了生产环境！或者，可能发生了严重的事故。
            </p>
            <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '6px', textAlign: 'left', marginBottom: '24px', fontFamily: 'monospace', fontSize: '14px', overflowX: 'auto', borderLeft: '3px solid var(--accent-red)' }}>
              <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
            </div>
            <button className="btn-reset" onClick={this.handleReset} style={{ padding: '10px 24px', fontSize: '16px' }}>
              🔄 重新加载游戏
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
