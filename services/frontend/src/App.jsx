import TaskBoard from './components/TaskBoard';
import './index.css';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__brand">
            <span className="app-header__logo">WT</span>
            <h1>WhisTech Platform</h1>
          </div>
          <span className="app-header__build">
            {process.env.REACT_APP_GIT_SHA
              ? `build ${process.env.REACT_APP_GIT_SHA.slice(0, 7)}`
              : 'development'}
          </span>
        </div>
      </header>
      <main className="app-main">
        <TaskBoard />
      </main>
      <footer className="app-footer">
        <p>
          WhisTech Platform &mdash; containerised with Docker &middot;
          deployed via <a href="https://github.com" target="_blank" rel="noreferrer">GitHub Actions</a>
        </p>
      </footer>
    </div>
  );
}
