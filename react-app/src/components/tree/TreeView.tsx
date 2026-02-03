import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { Member, MemberDict } from '../../lib/types';
import TreeNode from './TreeNode';
import TreePopup from './TreePopup';

interface Props {
  rootId: string;
  members: MemberDict;
}

function computeInitialCollapsed(
  rootId: string,
  members: MemberDict,
  maxDepth: number,
): Set<string> {
  const collapsed = new Set<string>();

  const walk = (id: string, depth: number, visited: Set<string>) => {
    if (!members[id] || visited.has(id)) return;
    visited.add(id);
    const m = members[id];
    const kids = (m.children || []).filter((c) => members[c] && !visited.has(c));
    if (kids.length > 0 && depth >= maxDepth) {
      collapsed.add(id);
    }
    for (const kid of kids) {
      walk(kid, depth + 1, visited);
    }
  };

  walk(rootId, 0, new Set());
  return collapsed;
}

function getAllWithChildren(rootId: string, members: MemberDict): Set<string> {
  const result = new Set<string>();

  const walk = (id: string, visited: Set<string>) => {
    if (!members[id] || visited.has(id)) return;
    visited.add(id);
    const m = members[id];
    const kids = (m.children || []).filter((c) => members[c] && !visited.has(c));
    if (kids.length > 0) {
      result.add(id);
    }
    for (const kid of kids) {
      walk(kid, visited);
    }
  };

  walk(rootId, new Set());
  return result;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.15;

export default function TreeView({ rootId, members }: Props) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() =>
    computeInitialCollapsed(rootId, members, 3),
  );
  const [popupMember, setPopupMember] = useState<Member | null>(null);
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const needsFitRef = useRef(true);

  useEffect(() => {
    setCollapsed(computeInitialCollapsed(rootId, members, 3));
    needsFitRef.current = true;
  }, [rootId, members]);

  // Auto-fit after layout settles
  useEffect(() => {
    if (!needsFitRef.current) return;
    const timer = setTimeout(() => {
      fitToView();
      needsFitRef.current = false;
    }, 80);
    return () => clearTimeout(timer);
  });

  const fitToView = useCallback(() => {
    if (!viewportRef.current || !canvasRef.current) return;
    const vw = viewportRef.current.clientWidth;
    const cw = canvasRef.current.scrollWidth;
    if (cw > 0 && vw > 0 && cw > vw) {
      setZoom(Math.max(MIN_ZOOM, (vw / cw) * 0.92));
    } else {
      setZoom(1);
    }
  }, []);

  const handleToggle = useCallback((id: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleNodeClick = useCallback((member: Member) => {
    setPopupMember(member);
  }, []);

  const expandAll = useCallback(() => {
    setCollapsed(new Set());
  }, []);

  const collapseAll = useCallback(() => {
    const all = getAllWithChildren(rootId, members);
    all.delete(rootId);
    setCollapsed(all);
  }, [rootId, members]);

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2))),
    [],
  );

  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2))),
    [],
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.08 : 0.08;
      setZoom((z) => Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, +(z + delta).toFixed(2))));
    }
  }, []);

  const visitedIds = useMemo(() => new Set<string>(), []);

  if (!members[rootId]) return null;

  return (
    <div className="tree-view-wrapper">
      <div className="tree-view-toolbar">
        <div className="tree-toolbar-group">
          <button className="tree-toolbar-btn" onClick={expandAll}>
            Tout ouvrir
          </button>
          <button className="tree-toolbar-btn" onClick={collapseAll}>
            Tout fermer
          </button>
        </div>
        <div className="tree-zoom-controls">
          <button className="tree-zoom-btn" onClick={zoomOut} title="D&eacute;zoomer">
            &minus;
          </button>
          <span className="tree-zoom-level">{Math.round(zoom * 100)}%</span>
          <button className="tree-zoom-btn" onClick={zoomIn} title="Zoomer">
            +
          </button>
          <button className="tree-zoom-btn tree-zoom-fit" onClick={fitToView} title="Ajuster">
            Ajuster
          </button>
        </div>
      </div>
      <div
        className="tree-view-scroll"
        ref={viewportRef}
        onWheel={handleWheel}
      >
        <div
          className="tree-view-canvas"
          ref={canvasRef}
          style={{ zoom }}
        >
          <TreeNode
            memberId={rootId}
            members={members}
            collapsed={collapsed}
            onToggle={handleToggle}
            onNodeClick={handleNodeClick}
            visitedIds={visitedIds}
          />
        </div>
      </div>
      {popupMember && (
        <TreePopup
          member={popupMember}
          members={members}
          onClose={() => setPopupMember(null)}
        />
      )}
    </div>
  );
}
