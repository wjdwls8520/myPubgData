import { Component, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Crosshair, ArrowUpRight } from 'lucide-react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { WeaponRepository } from '../domain/weapon/repository';
import { useDataset } from '../hooks/useDataset';
import { Explorer } from '../features/weapon-explorer/Explorer';
import { Detail } from '../features/weapon-detail/Detail';
import { Methodology } from './Methodology';
function ScrollReset() { const { pathname } = useLocation(); useEffect(() => { window.scrollTo(0, 0); document.title = pathname === '/methodology' ? '계산 기준 / FIELDNOTES' : `${pathname.startsWith('/weapons/') ? pathname.split('/').at(-1)?.toUpperCase() : '무기 분석실'} / FIELDNOTES`; }, [pathname]); return null; }
class ErrorBoundary extends Component<{ children: ReactNode }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Application error', error, info.componentStack); }
  render() { return this.state.error ? <main className="empty" role="alert"><h1>화면을 표시할 수 없습니다</h1><p>데이터 또는 설정을 확인한 뒤 다시 시도해 주세요.</p><a href="/weapons">기본 설정으로 열기</a></main> : this.props.children; }
}
export function App({ repository }: { repository: WeaponRepository }) {
  const { data, error } = useDataset(repository);
  const location = useLocation();
  return <ErrorBoundary><ScrollReset/><a className="skip-link" href="#main">본문으로 건너뛰기</a><header className="site-header"><Link className="brand" to="/weapons"><span className="brand-mark"><Crosshair size={22}/></span><span>FIELDNOTES<small>PUBG 무기 분석</small></span></Link><nav aria-label="주 탐색"><Link className={location.pathname.startsWith('/weapons') ? 'active' : ''} to="/weapons">무기 분석</Link><Link className={location.pathname === '/methodology' ? 'active' : ''} to="/methodology">데이터 & 계산 기준</Link></nav><a className="reference-link" href="https://pubgstatistics.com/weapons" target="_blank" rel="noreferrer">참고 자료 <ArrowUpRight size={14}/></a></header><main id="main">{error ? <div className="empty error" role="alert"><h1>데이터 검증 실패</h1><p>무기 데이터 형식이 올바르지 않거나 불러올 수 없습니다.</p><p>잘못된 값으로 계산하지 않도록 로딩을 중단했습니다.</p></div> : !data ? <div className="empty" role="status">무기 데이터를 확인하는 중…</div> : <Routes><Route path="/" element={<Navigate to="/weapons" replace/>}/><Route path="/weapons" element={<Explorer data={data}/>}/><Route path="/weapons/:slug" element={<Detail data={data}/>}/><Route path="/methodology" element={<Methodology data={data}/>}/><Route path="*" element={<div className="empty"><h1>페이지를 찾을 수 없습니다</h1><Link to="/weapons">무기 분석실로 이동</Link></div>}/></Routes>}</main><footer className="site-footer"><span>FIELDNOTES <span className="muted">/ 독립 PUBG 무기 분석</span></span><span>데이터 확인 2026.09.22 · 비공식 팬 프로젝트</span></footer></ErrorBoundary>;
}
