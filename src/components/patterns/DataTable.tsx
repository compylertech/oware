import type {
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { FONTS, tokens } from "@/lib/tokens";

type Align = "left" | "center" | "right";

export type TablePaginationProps = {
  page: number;
  totalPages: number;
  totalItems: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
};

export type TableToolbarProps = {
  title?: ReactNode;
  description?: ReactNode;
  filters?: ReactNode;
  resultLabel?: ReactNode;
  actions?: ReactNode;
};

export function TableCard({
  title,
  description,
  filters,
  resultLabel,
  actions,
  pagination,
  children,
  style,
}: TableToolbarProps & {
  pagination?: TablePaginationProps;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const hasToolbar =
    title != null ||
    description != null ||
    filters != null ||
    resultLabel != null ||
    actions != null;

  return (
    <div
      style={{
        background: tokens.surface,
        border: `1px solid ${tokens.border}`,
        borderRadius: 14,
        overflow: "hidden",
        ...style,
      }}
    >
      {hasToolbar && (
        <TableToolbar
          title={title}
          description={description}
          filters={filters}
          resultLabel={resultLabel}
          actions={actions}
        />
      )}
      {children}
      {pagination && pagination.totalItems > 0 && <TablePagination {...pagination} />}
    </div>
  );
}

export function TableToolbar({
  title,
  description,
  filters,
  resultLabel,
  actions,
}: TableToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3"
      style={{
        minHeight: 58,
        padding: "14px 22px",
        borderBottom: `1px solid ${tokens.border}`,
      }}
    >
      <div className="flex min-w-0 items-center gap-3">
        {title != null && (
          <div
            aria-hidden="true"
            style={{ width: 3, height: 18, borderRadius: 999, background: tokens.navy }}
          />
        )}
        <div className="min-w-0">
          {title != null && (
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 13,
                fontWeight: 100,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: tokens.text,
              }}
            >
              {title}
            </div>
          )}
          {description != null && (
            <div style={{ marginTop: 3, fontSize: 12, color: tokens.textMuted }}>{description}</div>
          )}
        </div>
      </div>
      {(filters != null || resultLabel != null || actions != null) && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {filters}
          {resultLabel != null && (
            <span style={{ color: tokens.textMuted, fontSize: 12 }}>{resultLabel}</span>
          )}
          {actions}
        </div>
      )}
    </div>
  );
}

export function Table({
  children,
  style,
  wrapperStyle,
}: {
  children: ReactNode;
  style?: CSSProperties;
  wrapperStyle?: CSSProperties;
}) {
  return (
    <div className="overflow-x-auto" style={wrapperStyle}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: FONTS.body,
          ...style,
        }}
      >
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr style={{ background: "#F5F8FE" }}>{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  align = "left",
  style,
  ...props
}: Omit<ThHTMLAttributes<HTMLTableCellElement>, "align"> & {
  align?: Align;
}) {
  return (
    <th
      {...props}
      style={{
        textAlign: align,
        fontSize: 10,
        fontWeight: 100,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: tokens.textMuted,
        padding: "10px 18px",
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function Tr({
  children,
  hover = false,
  style,
  className,
  ...props
}: {
  hover?: boolean;
} & HTMLAttributes<HTMLTableRowElement>) {
  const rowClassName = [hover ? "hover:bg-[#FAFBFF]" : undefined, className]
    .filter(Boolean)
    .join(" ");

  return (
    <tr
      {...props}
      className={rowClassName || undefined}
      style={{ borderTop: `1px solid ${tokens.border}`, ...style }}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  align = "left",
  muted = false,
  numeric = false,
  style,
  ...props
}: Omit<TdHTMLAttributes<HTMLTableCellElement>, "align"> & {
  align?: Align;
  muted?: boolean;
  numeric?: boolean;
}) {
  return (
    <td
      {...props}
      style={{
        fontSize: 13,
        color: muted ? tokens.textSub : tokens.text,
        padding: "12px 18px",
        textAlign: align,
        fontVariantNumeric: numeric ? "tabular-nums" : undefined,
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <Tr>
      <Td colSpan={colSpan} style={{ padding: 36, textAlign: "center", color: tokens.textMuted }}>
        {children}
      </Td>
    </Tr>
  );
}

export function TablePagination({
  page,
  totalPages,
  totalItems,
  itemLabel,
  onPageChange,
}: TablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const pages = Array.from({ length: safeTotalPages }, (_, i) => i + 1);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3"
      style={{ padding: "14px 22px", borderTop: `1px solid ${tokens.border}` }}
    >
      <div style={{ fontSize: 12, color: tokens.textMuted }}>
        Page {safePage} of {safeTotalPages} · {totalItems} {itemLabel}
      </div>
      <div className="flex items-center gap-1">
        <PageButton onClick={() => onPageChange(1)} disabled={safePage === 1}>
          <ChevronsLeft size={14} />
        </PageButton>
        <PageButton onClick={() => onPageChange(safePage - 1)} disabled={safePage === 1}>
          <ChevronLeft size={14} />
        </PageButton>
        {pages.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="cursor-pointer"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 300,
              background: p === safePage ? tokens.navy : "#fff",
              color: p === safePage ? "#fff" : tokens.textSub,
              border: `1px solid ${p === safePage ? tokens.navy : tokens.border}`,
            }}
          >
            {p}
          </button>
        ))}
        <PageButton
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage === safeTotalPages}
        >
          <ChevronRight size={14} />
        </PageButton>
        <PageButton
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safePage === safeTotalPages}
        >
          <ChevronsRight size={14} />
        </PageButton>
      </div>
    </div>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: `1px solid ${tokens.border}`,
        background: "#fff",
        color: tokens.textSub,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

export type Column<T> = {
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: Align;
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
  toolbar,
  pagination,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  toolbar?: TableToolbarProps;
  pagination?: TablePaginationProps;
}) {
  return (
    <TableCard {...toolbar} pagination={pagination}>
      <Table>
        <THead>
          {columns.map((c, i) => (
            <Th key={i} align={c.align} style={c.thStyle}>
              {c.header}
            </Th>
          ))}
        </THead>
        <tbody>
          {rows.length === 0 && empty != null ? (
            <EmptyRow colSpan={columns.length}>{empty}</EmptyRow>
          ) : (
            rows.map((row, ri) => (
              <Tr key={rowKey(row, ri)} hover>
                {columns.map((c, ci) => (
                  <Td key={ci} align={c.align} style={c.tdStyle}>
                    {c.cell(row)}
                  </Td>
                ))}
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </TableCard>
  );
}

export default DataTable;
