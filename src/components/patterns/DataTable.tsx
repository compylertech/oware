import type { CSSProperties, ReactNode } from "react";
import { tokens } from "@/lib/tokens";

export function Table({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <table style={{ width: "100%", borderCollapse: "collapse", ...style }}>{children}</table>;
}

export function Th({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <th
      style={{
        textAlign: "left",
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: tokens.textMuted,
        background: "#F8FAFD",
        padding: "10px 14px",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function Td({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <td
      style={{
        fontSize: 13,
        color: tokens.text,
        padding: "12px 14px",
        borderTop: `1px solid ${tokens.border}`,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export type Column<T> = {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  thStyle?: CSSProperties;
  tdStyle?: CSSProperties;
};

/**
 * Declarative table for simple list views. Renders a consistent header row and
 * divider styling. For bespoke layouts, compose {@link Table}/{@link Th}/{@link Td}
 * directly.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
}) {
  if (rows.length === 0 && empty != null) {
    return <div style={{ padding: 24, textAlign: "center", color: tokens.textMuted }}>{empty}</div>;
  }
  return (
    <Table>
      <thead>
        <tr>
          {columns.map((c, i) => (
            <Th key={i} style={c.thStyle}>
              {c.header}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, ri) => (
          <tr key={rowKey(row, ri)}>
            {columns.map((c, ci) => (
              <Td key={ci} style={c.tdStyle}>
                {c.cell(row)}
              </Td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default DataTable;
