import { useState } from 'react';
import { Unlink, Link2, RefreshCw } from 'lucide-react';
import useSimulationStore from '../../store/simulationStore';
import useSimulation from '../../hooks/useSimulation';

/**
 * Controls for simulating link failures and recoveries.
 * Shows a dropdown of links and action buttons.
 */
export default function FailureControls() {
  const topology = useSimulationStore((s) => s.topology);
  const linkStatuses = useSimulationStore((s) => s.linkStatuses);
  const { failLink, recoverLink } = useSimulation();
  const [selectedLink, setSelectedLink] = useState('');

  const links = topology?.links || [];

  const currentStatus =
    selectedLink && (linkStatuses[selectedLink] || links.find((l) => l.id === selectedLink)?.status);

  return (
    <div className="space-y-2">
      {/* Link selector */}
      <select
        value={selectedLink}
        onChange={(e) => setSelectedLink(e.target.value)}
        className="w-full bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
      >
        <option value="">Select a link…</option>
        {links.map((l) => {
          const st = linkStatuses[l.id] || l.status;
          return (
            <option key={l.id} value={l.id}>
              {l.source} — {l.target} ({st})
            </option>
          );
        })}
      </select>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          disabled={!selectedLink || currentStatus === 'down'}
          onClick={() => selectedLink && failLink(selectedLink)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium bg-accent-warning/10 text-accent-warning hover:bg-accent-warning/20 transition border border-accent-warning/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Unlink size={12} />
          Fail
        </button>
        <button
          disabled={!selectedLink || currentStatus !== 'down'}
          onClick={() => selectedLink && recoverLink(selectedLink)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium bg-accent-success/10 text-accent-success hover:bg-accent-success/20 transition border border-accent-success/20 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Link2 size={12} />
          Restore
        </button>
      </div>
    </div>
  );
}
