import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Reusable DataTable component with dark-themed styling and header-based sorting.
 */
export default function DataTable({ columns, rows = [], emptyMessage = 'No records found' }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key, sortable) => {
    if (!sortable) return;
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return rows;

    return [...rows].sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];

      // Handle undefined/null
      if (valA == null) return sortConfig.direction === 'asc' ? 1 : -1;
      if (valB == null) return sortConfig.direction === 'asc' ? -1 : 1;

      // Handle numbers
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }

      // Handle strings
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();

      if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

  return (
    <div className="w-full overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-300">
          <thead className="bg-neutral-950 text-xs font-semibold uppercase tracking-wider text-neutral-400 border-b border-neutral-800">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.accessor, col.sortable !== false)}
                  className={`px-6 py-4 select-none ${col.sortable !== false ? 'cursor-pointer hover:bg-neutral-900/60 transition-colors' : ''}`}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {col.sortable !== false && (
                      <span className="text-neutral-500">
                        {sortConfig.key === col.accessor ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ChevronsUpDown size={14} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {sortedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-10 text-center text-neutral-500 font-medium bg-neutral-900">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-neutral-950/30 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="whitespace-nowrap px-6 py-4 text-neutral-300">
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
